import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  TrendingUp as TrendUp, 
  Wallet, 
  Clock, 
  Plus, 
  ExternalLink,
  MoreHorizontal,
  Link as LinkIcon,
  Lock,
  Box
} from 'lucide-react';
import type { TravelItem } from '../lib/types';
import { useTripStore } from '../store/useTripStore';
import { useExpenseStore } from '../store/useExpenseStore';
import { Button } from './ui/Button';
import { AddExpenseModal } from './AddExpenseModal';
import { ItemFormModal } from './ItemFormModal';
import { PaymentCalendar } from './PaymentCalendar';
import { CATEGORIES } from './ItemFormModal';
import { cn } from '../lib/utils';
import { hapticFeedback } from '../lib/haptics';

export const Expenses = () => {
  const { activeTripId, itineraryItems } = useTripStore((state: any) => ({
    activeTripId: state.activeTripId,
    itineraryItems: state.itineraryItems
  }));

  const { expenses, getTripBalances, removeExpense } = useExpenseStore();
  
  const [activeView, setActiveView] = useState<'shared' | 'itinerary' | 'balances'>('shared');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState<any>(null);
  const [itemModalMode, setItemModalMode] = useState<'view' | 'edit'>('view');
  const [conversionData, setConversionData] = useState<any>(null);

  const balances = useMemo(() => getTripBalances(activeTripId || ''), [expenses, activeTripId, getTripBalances]);

  const itinaryExpenses = useMemo(() => {
    return itineraryItems
      .filter((item: TravelItem) => item.estimated_cost || item.real_cost)
      .map((item: TravelItem) => ({
        ...item,
        amount: item.real_cost || item.estimated_cost || 0,
        paid: item.amount_paid || 0,
        isFullyPaid: item.payment_status === 'paid' || (item.amount_paid || 0) >= (item.real_cost || item.estimated_cost || 0),
        linkedExpenseId: expenses.find(e => e.travel_item_id === item.id)?.id
      }));
  }, [itineraryItems, expenses]);

  const totals = useMemo(() => {
    return itinaryExpenses.reduce((acc: any, curr: any) => ({
      budget: acc.budget + curr.amount,
      paid: acc.paid + curr.paid
    }), { budget: 0, paid: 0 });
  }, [itinaryExpenses]);

  const handleOpenItem = (item: any) => {
    setSelectedItemForModal(item);
    setItemModalMode('view');
    hapticFeedback('light');
  };

  const handleConvertToShared = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setConversionData({
      description: item.name,
      amount: item.amount,
      currency: item.currency || 'USD',
      category: item.type,
      travel_item_id: item.id
    });
    setIsModalOpen(true);
    hapticFeedback('medium');
  };

  const tabs = [
    { id: 'shared', label: 'Compartidos', icon: Users },
    { id: 'itinerary', label: 'Plan Costs', icon: TrendUp },
    { id: 'balances', label: 'Saldos', icon: Wallet },
  ];

  const CategoryIcon = ({ category, className }: { category: string; className?: string }) => {
    const cat = CATEGORIES.find(c => c.id === category) || CATEGORIES.find(c => c.id === 'otros');
    const Icon = cat?.icon || Box;
    return <Icon className={className} />;
  };

  const CurrencyBadge = ({ amount, currency, size = 'sm' }: { amount: number; currency: string; size?: 'sm' | 'md' | 'lg' }) => (
    <div className={cn(
      "font-black tracking-tighter flex items-baseline gap-0.5 italic",
      size === 'sm' ? "text-sm" : size === 'md' ? "text-xl" : "text-3xl"
    )}>
      <span className={cn("text-primary", size === 'sm' ? "text-[10px]" : "text-sm")}>$</span>
      <span>{amount.toLocaleString()}</span>
      <span className={cn("text-muted-foreground ml-1 font-bold not-italic", size === 'sm' ? "text-[8px]" : "text-[10px]")}>{currency}</span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
       {/* Dashboard Style Header */}
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-5 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20"
          >
             <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Presupuesto Total</p>
             <div className="flex items-end justify-between">
                <CurrencyBadge amount={totals.budget} currency="USD" size="lg" />
                <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                   <TrendUp size={12} strokeWidth={3} />
                   <span className="text-[10px] font-black">{((totals.paid / (totals.budget || 1)) * 100).toFixed(0)}%</span>
                </div>
             </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="premium-card p-5 bg-gradient-to-br from-indigo-500/10 via-background to-background border-indigo-500/20"
          >
             <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500/60 mb-2">Gastos Compartidos</p>
             <div className="flex items-end justify-between">
                <CurrencyBadge amount={expenses.reduce((sum, e) => sum + e.amount, 0)} currency="USD" size="lg" />
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                   <Users size={16} />
                </div>
             </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="premium-card p-5 bg-gradient-to-br from-amber-500/10 via-background to-background border-amber-500/20"
          >
             <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/60 mb-2">Deuda Pendiente</p>
             <div className="flex items-end justify-between">
                <CurrencyBadge amount={balances.totalDebt} currency="USD" size="lg" />
                <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                   <Clock size={12} strokeWidth={3} />
                   <span className="text-[10px] font-black">{balances.totalCount - balances.settledCount}</span>
                </div>
             </div>
          </motion.div>
       </div>

       {/* View Selector and Add Expense */}
       <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
         <div className="flex p-1.5 bg-secondary/50 rounded-2xl border border-border backdrop-blur-md">
            {tabs.map((tab) => (
              <Button 
               key={tab.id}
               variant={activeView === tab.id ? 'primary' : 'ghost'} 
               size="sm" 
               onClick={() => { setActiveView(tab.id as any); hapticFeedback('light'); }}
               className={cn(
                 "rounded-xl text-[9px] font-black tracking-widest uppercase px-5 h-9 transition-all",
                 activeView !== tab.id && "text-muted-foreground"
               )}
              >
                {tab.label}
              </Button>
            ))}
         </div>
         
         {activeView === 'shared' && (
           <Button 
             size="sm" 
             onClick={() => { setConversionData(null); setIsModalOpen(true); hapticFeedback('medium'); }}
             className="rounded-xl px-6 h-10 shadow-lg hover:scale-105 active:scale-95 transition-all font-black text-xs group"
           >
              <Plus size={16} className="mr-2 group-hover:rotate-90 transition-transform" />
              Shared Expense
           </Button>
         )}
       </div>

       {/* Payment Calendar Integration - Only for Itinerary/Plan Costs */}
       {activeView === 'itinerary' && (
          <div className="mb-10">
             <PaymentCalendar onItemClick={(id) => {
                const item = itineraryItems.find((i: any) => i.id === id);
                if (item) handleOpenItem(item);
             }} />
          </div>
       )}

       <AddExpenseModal 
         isOpen={isModalOpen} 
         onClose={() => { setIsModalOpen(false); setConversionData(null); }} 
         tripId={activeTripId || ''} 
         initialData={conversionData}
       />

       <ItemFormModal
         isOpen={!!selectedItemForModal}
         onClose={() => setSelectedItemForModal(null)}
         mode={itemModalMode}
         initialData={selectedItemForModal}
         initialTab={activeView === 'itinerary' ? 'costos' : 'info'}
       />

       {/* Views Container */}
       <div className="min-h-[400px]">
         <AnimatePresence mode="wait">
           {activeView === 'shared' && (
             <motion.div
               key="shared"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="space-y-4"
             >
               {expenses.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
                   <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"><Users size={24} /></div>
                   <h4 className="text-lg font-black italic">No shared expenses</h4>
                 </div>
               ) : (
                 expenses.map((expense) => (
                   <motion.div
                     key={expense.id}
                     className="premium-card p-5 flex items-center justify-between group hover:border-primary/30 transition-all duration-300"
                   >
                     <div className="flex items-center gap-5">
                       <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors border border-border overflow-hidden">
                          <CategoryIcon category={expense.category} className="w-5 h-5" />
                          {expense.is_private && <div className="absolute top-0 right-0 p-1 bg-amber-500 text-white rounded-bl-lg"><Lock size={6} /></div>}
                       </div>
                       <div className="space-y-0.5">
                          <h4 className="text-lg font-black text-foreground tracking-tight italic flex items-center gap-2">
                            {expense.description}
                            {expense.travel_item_id && <LinkIcon size={12} className="text-primary opacity-40" />}
                          </h4>
                          <div className="flex items-center gap-3">
                             <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</span>
                             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/5 rounded-md">
                                <Users size={10} className="text-primary/40" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">{expense.participants?.length || 1} Split</span>
                             </div>
                          </div>
                       </div>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="text-right">
                           <CurrencyBadge amount={expense.amount} currency={expense.currency} size="md" />
                           <p className="text-[8px] font-black text-muted-foreground uppercase opacity-40">Paid by {expense.paid_by}</p>
                        </div>
                        
                        {expense.travel_item_id && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              const item = itineraryItems.find((i: any) => i.id === expense.travel_item_id);
                              if (item) handleOpenItem(item);
                            }}
                            className="w-10 h-10 p-0 rounded-xl bg-primary/5 text-primary border border-primary/10"
                          >
                             <ExternalLink size={16} />
                          </Button>
                        )}

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
                 ))
               )}
             </motion.div>
           )}

           {activeView === 'itinerary' && (
             <motion.div
               key="itinerary"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="space-y-4"
             >
               {itinaryExpenses.map((exp: any) => (
                 <div 
                   key={exp.id} 
                   onClick={() => handleOpenItem(exp)}
                   className="premium-card p-5 flex items-center justify-between group hover:border-primary/30 transition-all cursor-pointer"
                 >
                   <div className="flex items-center gap-5">
                     <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary relative border border-primary/10">
                         <CategoryIcon category={exp.type} className="w-5 h-5" />
                         {exp.linkedExpenseId && <div className="absolute -top-1 -right-1 p-1 bg-primary text-white rounded-full border-2 border-background"><LinkIcon size={8} /></div>}
                     </div>
                     <div className="space-y-1">
                        <h4 className="text-lg font-black text-foreground tracking-tight italic">{exp.name}</h4>
                        <div className="flex items-center gap-3">
                           <div className={cn(
                             "px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-wider",
                             exp.isFullyPaid ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                           )}>
                              {exp.isFullyPaid ? 'Fully Paid' : 'Pending'}
                           </div>
                           {exp.next_payment_date && (
                             <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock size={10} className="opacity-40" />
                                <span className="text-[8px] font-bold uppercase opacity-60">Due: {new Date(exp.next_payment_date).toLocaleDateString()}</span>
                             </div>
                           )}
                        </div>
                     </div>
                   </div>
                   <div className="flex items-center gap-8">
                     <div className="text-right space-y-0.5">
                        <CurrencyBadge amount={exp.amount} currency={exp.currency || 'USD'} size="md" />
                        <p className="text-[8px] font-black text-muted-foreground uppercase opacity-40">Paid: ${exp.paid.toFixed(0)}</p>
                     </div>

                     <div className="flex items-center gap-2">
                        {!exp.linkedExpenseId ? (
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={(e) => handleConvertToShared(e, exp)}
                            className="h-9 px-4 rounded-xl text-[8px] font-black uppercase tracking-widest bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white"
                          >
                            Share Cost
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); setActiveView('shared'); }}
                            className="w-10 h-10 p-0 rounded-xl bg-emerald-500/5 text-emerald-500 border border-emerald-500/20"
                            title="Go to shared expense"
                          >
                             <ExternalLink size={16} />
                          </Button>
                        )}
                     </div>
                   </div>
                 </div>
               ))}
             </motion.div>
           )}

           {activeView === 'balances' && (
             <motion.div
               key="balances"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="space-y-6"
             >
               {expenses.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
                   <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"><Wallet size={24} /></div>
                   <h4 className="text-lg font-black italic">No settlements yet</h4>
                   <p className="text-xs text-muted-foreground font-medium">Add shared expenses to see how to split costs.</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                    {Object.entries(balances.userBalances).map(([userId, balance]: [string, any]) => (
                      <div key={userId} className="premium-card p-5 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-black text-xs">
                               {userId.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                               <p className="text-sm font-black">{userId === 'me' ? 'Tú' : userId}</p>
                               <p className={cn(
                                 "text-[10px] font-black uppercase tracking-widest",
                                 balance >= 0 ? "text-emerald-500" : "text-rose-500"
                               )}>
                                  {balance >= 0 ? 'Te deben' : 'Debes'}
                               </p>
                            </div>
                         </div>
                         <CurrencyBadge amount={Math.abs(balance)} currency="USD" size="md" />
                      </div>
                    ))}
                 </div>
               )}
             </motion.div>
           )}
         </AnimatePresence>
       </div>
    </div>
  );
};
