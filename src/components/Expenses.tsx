import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, ArrowUpRight, ArrowDownLeft, PieChart, Utensils, Car, Lock, Landmark, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/Button';
import { useState } from 'react';
import { AddExpenseModal } from './AddExpenseModal';
import { useExpenseStore } from '../store/useExpenseStore';
import { useTripStore } from '../store/useTripStore';
import { CurrencyBadge } from './CurrencyBadge';
import { hapticFeedback } from '../lib/haptics';

const CategoryIcon = ({ category, className }: { category: string; className?: string }) => {
  switch (category) {
    case 'food': return <Utensils className={className} />;
    case 'accommodation': return <Landmark className={className} />;
    case 'attraction': return <Landmark className={className} />;
    case 'flight': return <Car className={className} />; // Plane icon would be better but keeping simple for now
    default: return <Landmark className={className} />;
  }
};

export const Expenses = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { expenses, getTotalSpent, removeExpense } = useExpenseStore();
  const { activeTripId } = useTripStore();
  
  const totalSpent = getTotalSpent(activeTripId || '1', 'EUR');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto py-10 px-6 h-full overflow-y-auto no-scrollbar"
    >
      <header className="mb-10">
        <h2 className="text-5xl font-black text-foreground tracking-tighter italic">Ledger</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mt-2">Shared trip expenses</p>
      </header>

      {/* Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="md:col-span-2 premium-card p-10 bg-primary shadow-2xl shadow-primary/20 border-none group overflow-hidden">
           <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
           <div className="relative z-10 space-y-6">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-foreground/60">Total Budget Spent</span>
              <div className="flex items-baseline gap-3 text-primary-foreground">
                 <span className="text-6xl font-black tracking-tighter italic">€{totalSpent.toFixed(2)}</span>
                 <span className="text-xl font-bold opacity-40">/ €2,500</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                   <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                     <ArrowDownLeft size={18} className="text-white" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60">You Owe</span>
                      <span className="text-sm font-black text-white">€120.50</span>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                     <ArrowUpRight size={18} className="text-white" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Owed to You</span>
                      <span className="text-sm font-black text-white">€45.00</span>
                   </div>
                </div>
              </div>
           </div>
        </div>

        <div className="premium-card p-8 flex flex-col items-center justify-center space-y-4 text-center">
           <div className="w-20 h-20 rounded-[2rem] bg-amber-500/10 flex items-center justify-center text-amber-500 mb-2">
              <PieChart size={32} />
           </div>
           <Button variant="glass" className="w-full rounded-2xl font-black text-xs uppercase tracking-widest">Analytics</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
        <div className="flex gap-2 p-1.5 glass rounded-2xl border-white/10 w-full sm:w-auto">
           <Button variant="primary" size="sm" className="rounded-xl text-[10px] font-black tracking-widest uppercase px-8 h-10">All Trips</Button>
           <Button variant="ghost" size="sm" className="rounded-xl text-[10px] font-black tracking-widest uppercase px-8 h-10 text-muted-foreground hover:bg-white/10">Private</Button>
        </div>
        <Button 
          size="lg" 
          onClick={() => { setIsModalOpen(true); hapticFeedback('medium'); }}
          className="rounded-3xl px-10 h-16 shadow-2xl hover:scale-105 active:scale-95 transition-all w-full sm:w-auto font-black text-lg"
        >
           <Plus size={24} className="mr-3" />
           New Expense
        </Button>
      </div>

      <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} tripId={activeTripId || '1'} />

      {/* Expense List */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {expenses.map((expense, idx) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              className="premium-card p-6 flex items-center justify-between group hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-500 relative border border-border">
                   <CategoryIcon category={expense.category} className="w-6 h-6" />
                   {expense.is_private && (
                     <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full border-2 border-background flex items-center justify-center text-white">
                        <Lock size={10} />
                     </div>
                   )}
                </div>
                <div className="space-y-1">
                   <h4 className="text-xl font-black text-foreground tracking-tight">{expense.description}</h4>
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{expense.date}</span>
                      <div className="flex items-center gap-1.5">
                         <Users size={12} className="text-primary/40" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">{expense.participants.length} Split</span>
                      </div>
                   </div>
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                 <div className="text-right">
                    <CurrencyBadge amount={expense.amount} currency={expense.currency} size="lg" />
                    <p className="text-[9px] font-black text-muted-foreground uppercase mt-1">Paid by {expense.paid_by}</p>
                 </div>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={() => { removeExpense(expense.id); hapticFeedback('warning'); }}
                   className="w-10 h-10 p-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                    <MoreHorizontal size={20} />
                 </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
