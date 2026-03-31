import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Lock, Unlock, Users, Link as LinkIcon, Check, Plus } from 'lucide-react';
import { Button } from './ui/Button';
import { useExpenseStore } from '../store/useExpenseStore';
import { useTripStore } from '../store/useTripStore';
import { useAuthStore } from '../store/useAuthStore';
import { hapticFeedback } from '../lib/haptics';
import { cn } from '../lib/utils';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  initialData?: {
    description?: string;
    amount?: number;
    currency?: string;
    travel_item_id?: string;
    category?: any;
  };
}

export const AddExpenseModal = ({ isOpen, onClose, tripId, initialData }: AddExpenseModalProps) => {
  const { trips, itineraryItems } = useTripStore();
  const { user } = useAuthStore();
  const addExpense = useExpenseStore((state) => state.addExpense);

  const trip = useMemo(() => trips.find(t => t.id === tripId), [trips, tripId]);
  const activeTripParticipants = trip?.participants || [];
  
  // States
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [isPrivate, setIsPrivate] = useState(false);
  const [category, setCategory] = useState<any>('Other');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);
  const [itemSearch, setItemSearch] = useState('');
  const [participantSearch, setParticipantSearch] = useState('');
  const [showItemResults, setShowItemResults] = useState(false);

  // Sync with initialData
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDescription(initialData.description || '');
        setAmount(initialData.amount?.toString() || '');
        setCurrency(initialData.currency || trip?.mainCurrency || 'USD');
        setCategory(initialData.category || 'Other');
        setSelectedItemId(initialData.travel_item_id);
      } else {
        setDescription('');
        setAmount('');
        setCurrency(trip?.mainCurrency || 'USD');
        setCategory('Other');
        setSelectedItemId(undefined);
      }
      
      // Default participants: just me
      if (user?.id) {
        setSelectedParticipants([user.id]);
      }
      setItemSearch('');
      setIsPrivate(false);
    }
  }, [isOpen, initialData, trip, user]);

  const filteredItems = useMemo(() => {
    if (!itemSearch) return itineraryItems;
    return itineraryItems.filter(item => 
      item.name.toLowerCase().includes(itemSearch.toLowerCase())
    );
  }, [itineraryItems, itemSearch]);

  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
    hapticFeedback('light');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
      tripId,
      description,
      amount: parseFloat(amount),
      currency,
      category,
      is_private: isPrivate,
      date: new Date().toISOString().split('T')[0],
      paid_by: 'You',
      participants: selectedParticipants,
      travel_item_id: selectedItemId
    });
    hapticFeedback('success');
    onClose();
  };

  const currencies = [
    { code: 'USD', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', symbol: '£', flag: '🇬🇧' },
    { code: 'ARS', symbol: '$', flag: '🇦🇷' },
    { code: 'BRL', symbol: 'R$', flag: '🇧🇷' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
          />
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[201] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-popover rounded-[var(--radius-3xl)] shadow-2xl w-full max-w-xl p-8 relative flex flex-col pointer-events-auto max-h-[90vh] overflow-y-auto no-scrollbar border border-border"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                   <h2 className="text-3xl font-black tracking-tighter italic">Ledger Expense</h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">Track shared costs</p>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="w-10 h-10 p-0 rounded-xl bg-secondary border border-border">
                   <X size={20} />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                   {/* Currency & Amount */}
                   <div className="flex flex-col gap-4">
                      <div className="flex gap-2 p-1 bg-secondary border border-border rounded-2xl overflow-x-auto no-scrollbar">
                         {currencies.map(c => (
                           <button
                             key={c.code}
                             type="button"
                             onClick={() => { setCurrency(c.code); hapticFeedback('light'); }}
                             className={cn(
                               "flex-1 min-w-[70px] py-2.5 px-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest whitespace-nowrap",
                               currency === c.code 
                                 ? "bg-background text-primary shadow-sm scale-[1.02]" 
                                 : "text-muted-foreground hover:text-foreground"
                             )}
                           >
                             <span className="mr-1.5">{c.flag}</span>
                             {c.code}
                           </button>
                         ))}
                      </div>

                      <div className="relative group">
                         <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors text-xl font-black">
                            {currencies.find(c => c.code === currency)?.symbol || '$'}
                         </div>
                         <input 
                            required
                            type="number"
                            step="0.01"
                            className="w-full pl-12 pr-6 py-8 bg-secondary rounded-3xl border-2 border-border focus:border-primary/20 outline-none text-5xl font-black tracking-tighter placeholder:text-muted-foreground/10 h-28" 
                            placeholder="0.00" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                         />
                      </div>
                   </div>

                   {/* Description */}
                   <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors">
                         <CreditCard size={20} />
                      </div>
                      <input 
                         required
                         className="w-full pl-16 pr-6 py-5 bg-secondary rounded-[var(--radius-xl)] border-2 border-border focus:border-primary/20 outline-none text-sm font-bold placeholder:text-muted-foreground/20" 
                         placeholder="What was it for?" 
                         value={description}
                         onChange={(e) => setDescription(e.target.value)}
                      />
                   </div>

                   {/* Itinerary Link */}
                   <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/30">
                         <LinkIcon size={18} />
                      </div>
                      <input 
                         className="w-full pl-16 pr-6 py-5 bg-secondary rounded-[var(--radius-xl)] border-2 border-border focus:border-primary/20 outline-none text-sm font-bold placeholder:text-muted-foreground/20" 
                         placeholder="Link to Trip Plan item..." 
                         value={selectedItemId ? itineraryItems.find(i => i.id === selectedItemId)?.name : itemSearch}
                         onChange={(e) => {
                           setItemSearch(e.target.value);
                           if (selectedItemId) setSelectedItemId(undefined);
                           setShowItemResults(true);
                         }}
                         onFocus={() => setShowItemResults(true)}
                      />
                      {showItemResults && itemSearch && !selectedItemId && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-popover border border-border rounded-2xl shadow-2xl max-h-64 overflow-y-auto no-scrollbar p-2 space-y-1">
                           {filteredItems.map(item => (
                             <button
                               key={item.id}
                               type="button"
                               onClick={() => {
                                 setSelectedItemId(item.id);
                                 setShowItemResults(false);
                                 setItemSearch('');
                               }}
                               className="w-full p-4 text-left hover:bg-secondary/50 rounded-xl transition-all border border-transparent hover:border-primary/20 flex flex-col gap-2 group"
                             >
                                <div className="flex items-center justify-between gap-2">
                                   <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                         <LinkIcon size={14} />
                                      </div>
                                      <span className="font-black text-sm truncate italic">{item.name}</span>
                                   </div>
                                   <div className="text-right shrink-0">
                                      <div className="text-xs font-black italic">
                                         <span className="text-primary mr-0.5">$</span>
                                         {(item.real_cost || item.estimated_cost || 0).toLocaleString()}
                                      </div>
                                      <div className="text-[8px] font-bold text-muted-foreground uppercase">{item.currency || 'USD'}</div>
                                   </div>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                                      {new Date(item.start_time).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                   </span>
                                   <span className="text-[8px] font-black uppercase text-muted-foreground opacity-40">{item.type}</span>
                                </div>
                             </button>
                           ))}
                           {filteredItems.length === 0 && (
                             <div className="p-8 text-center text-xs text-muted-foreground italic bg-secondary/20 rounded-xl">
                                No travel items found matching search
                             </div>
                           )}
                        </div>
                      )}
                      {selectedItemId && (
                        <button 
                          type="button"
                          onClick={() => setSelectedItemId(undefined)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
                        >
                          <X size={16} />
                        </button>
                      )}
                   </div>
                </div>

                {/* Split With */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between px-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                          <Users size={12} />
                          Split with
                        </span>
                        <span className="text-[10px] font-black text-primary uppercase ml-5 leading-none">{selectedParticipants.length} Selected</span>
                      </div>
                      
                      {/* Participant Search Field */}
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Search people..."
                          className="w-32 sm:w-48 bg-secondary h-8 rounded-lg pl-8 pr-2 text-[10px] font-bold border-none outline-none focus:ring-1 focus:ring-primary/20"
                          value={participantSearch} 
                          onChange={(e) => setParticipantSearch(e.target.value)} 
                        />
                        <Plus size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rotate-45" />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                      {activeTripParticipants
                        .filter(p => !participantSearch || p.name?.toLowerCase().includes(participantSearch.toLowerCase()))
                        .map(participant => {
                        const isMe = participant.user_id === user?.id;
                        const isSelected = selectedParticipants.includes(participant.user_id || participant.id);
                        return (
                          <button
                            key={participant.id}
                            type="button"
                            onClick={() => toggleParticipant(participant.user_id || participant.id)}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                              isSelected 
                                ? "bg-primary/5 border-primary text-primary" 
                                : "bg-background border-border text-foreground/60 hover:border-primary/30"
                            )}
                          >
                             <div className={cn(
                               "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black uppercase border",
                               isSelected ? "bg-primary text-white border-none" : "bg-secondary text-muted-foreground border-border"
                             )}>
                                {isSelected ? <Check size={14} /> : (participant.name?.charAt(0) || '?')}
                             </div>
                             <div className="flex flex-col min-w-0">
                                <span className="text-xs font-black truncate">{isMe ? 'You' : (participant.name || 'Anonymous')}</span>
                                <span className="text-[9px] font-bold opacity-50 uppercase tracking-tighter truncate">
                                  {participant.is_companion ? 'Companion' : 'Guest'}
                                </span>
                             </div>
                          </button>
                        );
                      })}
                   </div>
                </div>

                {/* Privacy & Actions */}
                <div className="flex flex-col gap-6">
                   <div className="flex items-center justify-between p-6 rounded-3xl bg-secondary border border-border transition-all">
                      <div className="flex items-center gap-4">
                         <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm", isPrivate ? "bg-amber-500 text-white" : "bg-primary text-white")}>
                            {isPrivate ? <Lock size={20} /> : <Unlock size={20} />}
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Privacy Mode</span>
                            <span className="text-sm font-black italic">{isPrivate ? 'Private (Only you)' : 'Shared (Entire group)'}</span>
                         </div>
                      </div>
                      <button
                         type="button"
                         onClick={() => { setIsPrivate(!isPrivate); hapticFeedback('medium'); }}
                         className={cn("w-14 h-8 rounded-full transition-all relative p-1", isPrivate ? "bg-amber-500" : "bg-primary")}
                      >
                         <motion.div 
                            animate={{ x: isPrivate ? 24 : 0 }}
                            className="w-6 h-6 bg-white rounded-full shadow-md" 
                         />
                      </button>
                   </div>

                   <Button type="submit" className="w-full h-16 text-xl font-black tracking-widest uppercase rounded-3xl shadow-xl shadow-primary/20 group">
                      Add to Ledger
                      <Plus size={24} className="ml-3 group-hover:rotate-90 transition-transform" />
                   </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
