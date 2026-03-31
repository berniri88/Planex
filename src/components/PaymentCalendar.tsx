import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, CreditCard, CheckCircle2 } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { hapticFeedback } from '../lib/haptics';

interface PaymentDetail {
  id: string;
  name: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
}

interface PaymentCalendarProps {
  onItemClick?: (itemId: string) => void;
}

export const PaymentCalendar = ({ onItemClick }: PaymentCalendarProps) => {
  const { itineraryItems } = useTripStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const paymentsByDate = useMemo(() => {
    const map: Record<string, PaymentDetail[]> = {};
    itineraryItems.forEach(item => {
      if (item.next_payment_date) {
        const dateStr = item.next_payment_date.split('T')[0];
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push({
          id: item.id,
          name: item.name,
          amount: item.next_payment_amount || 0,
          currency: item.currency || 'USD',
          status: item.payment_status || 'reference',
          type: item.type
        });
      }
    });
    return map;
  }, [itineraryItems]);

  const nextPaymentDate = useMemo(() => {
    const dates = Object.keys(paymentsByDate).sort();
    const today = new Date().toISOString().split('T')[0];
    return dates.find(d => d >= today) || dates[0] || null;
  }, [paymentsByDate]);

  React.useEffect(() => {
    if (nextPaymentDate && !selectedDate) {
      setSelectedDate(nextPaymentDate);
    }
  }, [nextPaymentDate, selectedDate]);

  const renderMonth = (monthOffset: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1);
    const monthName = date.toLocaleDateString('es-ES', { month: 'long' });
    const year = date.getFullYear();
    
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="flex-1 p-4 bg-background/40 rounded-2xl border border-border/50">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-center text-muted-foreground">
          {monthName} {year}
        </h4>
        <div className="grid grid-cols-7 gap-1">
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
            <div key={d} className="text-[8px] font-black text-center opacity-30 h-6 flex items-center justify-center">{d}</div>
          ))}
          {days.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="h-7 w-7" />;
            
            const dateStr = new Date(date.getFullYear(), date.getMonth(), day).toISOString().split('T')[0];
            const hasPayment = paymentsByDate[dateStr];
            const isSelected = selectedDate === dateStr;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            return (
              <button
                key={day}
                onClick={() => { setSelectedDate(dateStr); hapticFeedback('light'); }}
                className={cn(
                  "h-7 w-7 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center transition-all relative group",
                  isSelected ? "bg-primary text-white scale-110 z-10 shadow-lg shadow-primary/20" : 
                  isToday ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-secondary text-foreground/70",
                  hasPayment && !isSelected && "ring-1 ring-primary/30 ring-offset-1 ring-offset-background"
                )}
              >
                {day}
                {hasPayment && !isSelected && (
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const selectedPayments = selectedDate ? paymentsByDate[selectedDate] : [];

  return (
    <div className="premium-card p-6 flex flex-col sm:flex-row gap-6 bg-card border-border overflow-hidden">
      {/* Left: Two Month Calendars */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                 <Clock size={16} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Payment Schedule</span>
           </div>
           <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                 <ChevronLeft size={16} />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
                 <ChevronRight size={16} />
              </Button>
           </div>
        </div>

        <div className="flex gap-4">
           {renderMonth(0)}
           <div className="hidden lg:block flex-1">
              {renderMonth(1)}
           </div>
        </div>
      </div>

      {/* Right: Selected Date Details */}
      <div className="w-full sm:w-64 flex flex-col border-l border-border/50 pl-0 sm:pl-6 pt-6 sm:pt-0">
         <AnimatePresence mode="wait">
            <motion.div
              key={selectedDate}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 flex flex-col"
            >
               <div className="mb-4">
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
                    {selectedDate ? new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }) : 'No date selected'}
                  </span>
                  <h5 className="text-sm font-black italic">Agenda Detail</h5>
               </div>

               <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar max-h-48">
                  {selectedPayments?.length > 0 ? (
                    selectedPayments.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => onItemClick?.(p.id)}
                        className="p-3 bg-secondary/50 rounded-xl border border-border/50 group hover:border-primary/30 transition-all cursor-pointer"
                      >
                         <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                               <CreditCard size={10} />
                            </div>
                            <span className="text-[9px] font-black truncate flex-1">{p.name}</span>
                         </div>
                         <div className="flex items-center justify-between">
                            <span className="text-xs font-black italic">${p.amount.toFixed(0)} <span className="text-[8px] not-italic opacity-40">{p.currency}</span></span>
                            <div className={cn(
                              "px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase",
                              p.status === 'paid' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                            )}>
                               {p.status}
                            </div>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center opacity-20">
                       <CheckCircle2 size={24} className="mb-2" />
                       <p className="text-[9px] font-black uppercase tracking-widest">No payments</p>
                    </div>
                  )}
               </div>

               {selectedPayments?.length > 0 && (
                 <Button variant="glass" className="w-full h-8 mt-4 rounded-lg text-[8px] font-black uppercase tracking-widest">
                   Pay items now
                 </Button>
               )}
            </motion.div>
         </AnimatePresence>
      </div>
    </div>
  );
};

