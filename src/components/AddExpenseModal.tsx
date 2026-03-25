import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Lock, Unlock } from 'lucide-react';
import { Button } from './ui/Button';
import { useExpenseStore } from '../store/useExpenseStore';
import { hapticFeedback } from '../lib/haptics';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
}

export const AddExpenseModal = ({ isOpen, onClose, tripId }: AddExpenseModalProps) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [isPrivate, setIsPrivate] = useState(false);
  const [category] = useState<'Food' | 'Transport' | 'Accommodation' | 'Attraction' | 'Shopping' | 'Other'>('Food');
  
  const addExpense = useExpenseStore((state) => state.addExpense);

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
      paid_by: 'You', // Simplified
      participants: ['You']
    });
    hapticFeedback('success');
    onClose();
    // Reset
    setDescription('');
    setAmount('');
    setCurrency('EUR');
    setIsPrivate(false);
  };

  const currencies = [
    { code: 'EUR', symbol: '€', flag: '🇪🇺' },
    { code: 'USD', symbol: '$', flag: '🇺🇸' },
    { code: 'GBP', symbol: '£', flag: '🇬🇧' },
    { code: 'JPY', symbol: '¥', flag: '🇯🇵' },
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[101] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-popover rounded-[var(--radius-3xl)] shadow-2xl w-full max-w-lg p-10 relative flex flex-col pointer-events-auto max-h-[90vh] overflow-y-auto no-scrollbar border border-border"
            >
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black tracking-tighter italic">Ledger Expense</h2>
                <Button variant="ghost" size="sm" onClick={onClose} className="w-10 h-10 p-0 rounded-[var(--radius-md)] bg-secondary border border-border">
                   <X size={20} />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="space-y-4">
                   <div className="flex gap-2 p-1 bg-secondary border border-border rounded-[var(--radius-lg)]">
                      {currencies.map(c => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => { setCurrency(c.code); hapticFeedback('light'); }}
                          className={cn(
                            "flex-1 py-3 px-3 rounded-[var(--radius-md)] transition-all font-black text-xs uppercase tracking-widest",
                            currency === c.code 
                              ? "bg-background text-primary shadow-sm scale-[1.05]" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span className="mr-2">{c.flag}</span>
                          {c.code}
                        </button>
                      ))}
                   </div>

                   <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors text-xl font-black">
                         {currencies.find(c => c.code === currency)?.symbol}
                      </div>
                      <input 
                         required
                         type="number"
                         step="0.01"
                         className="w-full pl-12 pr-6 py-6 bg-secondary rounded-[var(--radius-lg)] border-2 border-border focus:border-primary/20 outline-none text-4xl font-black tracking-tighter placeholder:text-muted-foreground/10 h-24" 
                         placeholder="0.00" 
                         value={amount}
                         onChange={(e) => setAmount(e.target.value)}
                      />
                   </div>

                   <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors">
                         <CreditCard size={20} />
                      </div>
                      <input 
                         required
                         className="w-full pl-16 pr-6 py-5 bg-secondary rounded-[var(--radius-lg)] border-2 border-border focus:border-primary/20 outline-none text-sm font-bold placeholder:text-muted-foreground/20" 
                         placeholder="What was it for?" 
                         value={description}
                         onChange={(e) => setDescription(e.target.value)}
                      />
                   </div>
                </div>

                <div className="flex items-center justify-between p-6 rounded-[var(--radius-lg)] bg-secondary border border-border transition-all">
                   <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center transition-colors shadow-sm", isPrivate ? "bg-amber-500 text-white" : "bg-primary text-white")}>
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

                <Button type="submit" className="w-full h-16 text-xl font-black tracking-widest uppercase rounded-[var(--radius-lg)] shadow-xl shadow-primary/20">
                   Add to Ledger
                </Button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
