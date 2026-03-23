import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockTrips, mockBranches, mockItinerary, type Trip, type PlanBranch, type TravelItem } from '../lib/mockData';
import { hapticFeedback, hapticSelection } from '../lib/haptics';
import { supabase } from '../lib/supabase';

interface TripState {
  trips: Trip[];
  activeTripId: string | null;
  branches: PlanBranch[];
  activeBranchId: string;
  itineraryItems: TravelItem[];
  isLoading: boolean;
  
  // Actions
  fetchTrips: () => Promise<void>;
  createTrip: (trip: Omit<Trip, 'id' | 'status'>) => Promise<void>;
  setActiveTrip: (id: string) => void;
  setActiveBranch: (branchId: string) => void;
  createBranch: (name: string, description: string, color: string) => Promise<void>;
  mergeBranch: (sourceBranchId: string, targetBranchId: string) => Promise<void>;
  addItineraryItem: (item: Omit<TravelItem, 'id'>) => Promise<void>;
  updateItineraryItem: (id: string, updates: Partial<TravelItem>) => Promise<void>;
  removeItineraryItem: (id: string) => Promise<void>;
  
  // Computed
  getActiveTrip: () => Trip | undefined;
  getVisibleItems: () => TravelItem[];
}

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      trips: mockTrips,
      activeTripId: null,
      branches: mockBranches,
      activeBranchId: '',
      itineraryItems: mockItinerary,
      isLoading: false,

      fetchTrips: async () => {
        // Only show full loader if we have NO trips yet (first load)
        const isFirstLoad = get().trips.length === 0;
        if (isFirstLoad) set({ isLoading: true });
        
        try {
          // 1. Fetch Trips
          const { data: trips, error: tripsError } = await supabase.from('trips').select('*');
          if (tripsError) throw tripsError;
          
          if (trips && trips.length > 0) {
            // Update local trips from Supabase
            const mappedTrips = trips.map(t => ({
              ...t,
              mainCurrency: t.main_currency,
              destinationTimezone: t.destination_timezone,
              startDate: t.start_date,
              endDate: t.end_date
            }));
            
            const isUUID = (str: string | null) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
            let currentTripId = get().activeTripId;
            
            if (!isUUID(currentTripId) || !mappedTrips.some(t => t.id === currentTripId)) {
               currentTripId = mappedTrips[0].id;
            }

            set({ trips: mappedTrips as any, activeTripId: currentTripId });
            
            // 2. Fetch Branches for current active trip
            const { data: branches, error: branchError } = await supabase
              .from('plan_branches')
              .select('*')
              .eq('trip_id', currentTripId);
            if (branchError) throw branchError;
            
            if (branches && branches.length > 0) {
              set({ branches: branches as any });
              
              const activeBranchIdFromDB = branches.find(b => b.is_active)?.id || branches[0].id;
              
              if (!get().activeBranchId || !branches.some(b => b.id === get().activeBranchId)) {
                set({ activeBranchId: activeBranchIdFromDB });
              }
            }

            // 3. Fetch ALL Itinerary Items
            const branchIds = branches?.map(b => b.id) || [];
            if (branchIds.length > 0) {
              const { data: items, error: itemsError } = await supabase
                 .from('travel_items')
                 .select('*')
                 .in('branch_id', branchIds);
                 
              if (itemsError) throw itemsError;
              if (items) {
                 const mappedItems = items.map(item => ({
                   ...item,
                   branchId: item.branch_id
                 }));
                 set({ itineraryItems: mappedItems as any });
              }
            }
          }
        } catch (err) {
          console.error("Fetch Data Error:", err);
        } finally {
          set({ isLoading: false });
        }
      },

      createTrip: async (newTrip) => {
        hapticFeedback('medium');
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;

        // 1. Insert Trip
        const { data: trip, error } = await supabase.from('trips').insert([{
          name: newTrip.name,
          dates: newTrip.dates,
          start_date: newTrip.startDate,
          end_date: newTrip.endDate,
          destination: newTrip.destination,
          icon: newTrip.icon || 'Globe',
          color: newTrip.color || 'bg-primary/5',
          main_currency: newTrip.mainCurrency || 'USD',
          destination_timezone: newTrip.destinationTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          user_id: user.id
        }]).select().single();

        if (error) throw error;

        // 2. Automatically create the first 'Main' branch
        await supabase.from('plan_branches').insert([{
          trip_id: trip.id,
          name: 'Main Plan',
          description: 'The primary version of your journey',
          color: '#3B82F6',
          is_active: true
        }]);

        // 3. Refresh
        await get().fetchTrips();
        set({ activeTripId: trip.id });
        hapticFeedback('success');
      },

      setActiveTrip: (id) => {
        hapticSelection();
        set({ activeTripId: id });
        get().fetchTrips(); // Refresh data for trip
      },

      setActiveBranch: (branchId) => {
        hapticFeedback('light');
        set({ activeBranchId: branchId });
      },

      createBranch: async (name, description, color) => {
        const { activeTripId, activeBranchId } = get();
        if (!activeTripId) return;

        const { data: newBranch, error: branchErr } = await supabase.from('plan_branches').insert([{
          trip_id: activeTripId,
          name,
          description,
          color,
          parent_id: activeBranchId === 'main' ? null : activeBranchId,
          is_active: false
        }]).select().single();

        if (branchErr) throw branchErr;

        // Clone items from parent branch to new branch in DB
        const parentItems = get().itineraryItems.filter(item => item.branchId === activeBranchId);
        if (parentItems.length > 0) {
          const itemsToClone = parentItems.map(item => {
            const { id, ...rest } = item;
            return {
              ...rest,
              branch_id: newBranch.id
            };
          });
          const { error: cloneErr } = await supabase.from('travel_items').insert(itemsToClone);
          if (cloneErr) console.error("Cloning items error:", cloneErr);
        }

        // Refresh local state
        await get().fetchTrips();
        set({ activeBranchId: newBranch.id });
        hapticFeedback('success');
      },

      addItineraryItem: async (item) => {
        const payload = {
          ...item,
          branch_id: get().activeBranchId,
        };
        
        const { data: newItem, error } = await supabase.from('travel_items').insert([payload]).select().single();
        
        if (error) {
          console.error("Error adding item:", error);
          return;
        }

        const mappedItem = {
          ...newItem,
          branchId: newItem.branch_id
        };

        set(state => ({
          itineraryItems: [...state.itineraryItems, mappedItem as any]
        }));
        hapticFeedback('medium');
      },

      updateItineraryItem: async (id, updates: any) => {
        // Prepare updates for DB (map camelCase to snake_case if any)
        const dbUpdates = { ...updates };
        if (updates.branchId) {
          dbUpdates.branch_id = updates.branchId;
          delete dbUpdates.branchId;
        }

        const { error } = await supabase.from('travel_items').update(dbUpdates).eq('id', id);
        if (error) {
          console.error("Error updating item:", error);
          return;
        }

        // Update local state with same mapping
        set(state => ({
          itineraryItems: state.itineraryItems.map(item => 
            item.id === id ? { ...item, ...updates, branchId: updates.branchId || item.branchId } : item
          )
        }));
        hapticFeedback('success');
      },

      removeItineraryItem: async (id) => {
        const { error } = await supabase.from('travel_items').delete().eq('id', id);
        if (error) {
          console.error("Error removing item:", error);
          return;
        }

        set(state => ({
          itineraryItems: state.itineraryItems.filter(item => item.id !== id)
        }));
        hapticFeedback('warning');
      },

      mergeBranch: async (sourceBranchId, targetBranchId) => {
        // 1. Get source items
        const { data: sourceItems, error: getErr } = await supabase.from('travel_items').select('*').eq('branch_id', sourceBranchId);
        if (getErr) throw getErr;

        // 2. Clear target items (optional based on strategy, here we overwrite)
        await supabase.from('travel_items').delete().eq('branch_id', targetBranchId);

        // 3. Move/Clone source items to target
        if (sourceItems && sourceItems.length > 0) {
          const mergedItems = sourceItems.map(item => {
            const { id, ...rest } = item;
            return {
              ...rest,
              branch_id: targetBranchId
            };
          });
          await supabase.from('travel_items').insert(mergedItems);
        }
        
        // 4. Delete source branch
        await supabase.from('plan_branches').delete().eq('id', sourceBranchId);

        // 5. Cleanup local state and refresh
        await get().fetchTrips();
        set({ activeBranchId: targetBranchId });
        hapticFeedback('success');
      },

      getActiveTrip: () => {
        const { trips, activeTripId } = get();
        return trips.find(t => t.id === activeTripId);
      },

      getVisibleItems: () => {
        const { itineraryItems, activeBranchId } = get();
        return itineraryItems
           .filter(item => item.branchId === activeBranchId)
           .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      }
    }),
    {
      name: 'planex-trip-storage',
    }
  )
);
