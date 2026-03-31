import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Expense } from '../lib/types';
import { convertCurrency } from '../lib/currency';
import { hapticFeedback } from '../lib/haptics';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  
  // Actions
  fetchExpenses: (tripId: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  
  // Computed
  getTotalSpent: (tripId: string, mainCurrency: string) => number;
  getTripBalances: (tripId: string) => {
    totalDebt: number;
    settledCount: number;
    totalCount: number;
    userBalances: Record<string, number>;
  };
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],
      isLoading: false,

      fetchExpenses: async (tripId) => {
        set({ isLoading: true });
        const { data: expenses, error } = await supabase.from('expenses').select('*, expense_participants(*)').eq('trip_id', tripId);
        if (error) console.error("Error fetching expenses:", error);
        if (expenses) {
          const mapped = expenses.map((e: any) => ({
            ...e,
            tripId: e.trip_id,
            paid_by: e.paid_by_user_id,
            participants: e.expense_participants.map((p: any) => p.user_id),
            travel_item_id: e.travel_item_id
          }));
          set({ expenses: mapped as any });
        }
        set({ isLoading: false });
      },

      addExpense: async (expense) => {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        const payload = {
          trip_id: expense.tripId,
          description: expense.description,
          amount: expense.amount,
          currency: expense.currency || 'USD',
          paid_by_user_id: expense.paid_by === 'me' || expense.paid_by === 'You' ? userId : expense.paid_by,
          category: expense.category,
          is_private: expense.is_private,
          date: expense.date,
          travel_item_id: expense.travel_item_id
        };

        const { data: newExp, error } = await supabase.from('expenses').insert([payload]).select().single();
        if (error) {
          console.error("Error adding expense:", error);
          return;
        }

        // Add participants
        if (expense.participants && expense.participants.length > 0) {
          const participantPayloads = expense.participants.map(pId => ({
            expense_id: newExp.id,
            user_id: pId === 'me' || pId === 'You' ? userId : pId,
            share: expense.amount / expense.participants.length
          }));
          await supabase.from('expense_participants').insert(participantPayloads);
        }

        // Refresh to get full object with participants
        get().fetchExpenses(expense.tripId);
        hapticFeedback('success');
      },

      removeExpense: async (id) => {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) {
          console.error("Error removing expense:", error);
          return;
        }

        set(state => ({
          expenses: state.expenses.filter(e => e.id !== id)
        }));
        hapticFeedback('warning');
      },

      updateExpense: async (id, updates) => {
        const { error } = await supabase.from('expenses').update(updates).eq('id', id);
        if (error) {
          console.error("Error updating expense:", error);
          return;
        }

        set(state => ({
          expenses: state.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
        }));
      },

      getTotalSpent: (tripId, mainCurrency) => {
        return get().expenses
          .filter(e => (e as any).trip_id === tripId || e.tripId === tripId)
          .reduce((total, e) => {
            const converted = convertCurrency(e.amount, e.currency, mainCurrency, e.exchangeRate);
            return total + converted;
          }, 0);
      },

      getTripBalances: (tripId: string) => {
        const currentUserId = (useAuthStore.getState() as any).user?.id;
        const tripExpenses = get().expenses.filter(e => (e as any).trip_id === tripId || e.tripId === tripId);
        
        const balances: Record<string, number> = {};
        const participants = new Set<string>();

        tripExpenses.forEach(exp => {
          if (exp.is_private && exp.paid_by !== currentUserId) return;
          
          const numParticipants = exp.participants?.length || 1;
          const share = exp.amount / numParticipants;
          
          // Use 'me' for current user consistency
          const payorKey = exp.paid_by === currentUserId ? 'me' : exp.paid_by;
          
          // Creditor logic
          balances[payorKey] = (balances[payorKey] || 0) + exp.amount;
          participants.add(payorKey);
          
          // Debtor logic
          exp.participants?.forEach(p => {
             const pKey = p === currentUserId ? 'me' : p;
             balances[pKey] = (balances[pKey] || 0) - share;
             participants.add(pKey);
          });
        });

        return {
          totalDebt: balances['me'] && balances['me'] < 0 ? Math.abs(balances['me']) : 0,
          settledCount: Object.values(balances).filter(b => Math.abs(b) < 0.1).length,
          totalCount: participants.size,
          userBalances: balances
        };
      }
    }),
    {
      name: 'planex-expense-storage',
    }
  )
);
