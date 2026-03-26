import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, Hotel, Utensils, Map, Wind, Calendar,
  Bus as BusIcon, Train, Car, Navigation, Box, Paperclip, MapPin, Banknote, CheckCircle2, AlertCircle, HelpCircle, Clock, Check
} from 'lucide-react';
import { type TravelItem, type TravelItemCategory } from '../lib/types';
import { cn } from '../lib/utils';
import { ItemFormModal } from './ItemFormModal';
import { Button } from './ui/Button';
import { useTripStore } from '../store/useTripStore';
import { BranchManager } from './BranchManager';
import { hapticFeedback } from '../lib/haptics';
import { BranchCompare } from './BranchCompare';
import { DeleteConfirmModal } from './ui/DeleteConfirmModal';
import { ICON_LIST } from './ui/IconPickerModal';

const CATEGORY_ICONS: Record<TravelItemCategory, any> = {
  vuelo: Plane,
  bus: BusIcon,
  tren: Train,
  taxi: Car,
  otro_transporte: Navigation,
  alojamiento: Hotel,
  actividad: Map,
  restaurante: Utensils,
  otros: Box,
};

const StatusBadge = ({ status }: { status: TravelItem['status'] }) => {
  const styles = {
    idea: 'bg-muted/50 text-muted-foreground border-transparent',
    tentativo: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    confirmado: 'bg-primary/10 text-primary border-primary/20',
  };

  const icons = {
    idea: HelpCircle,
    tentativo: AlertCircle,
    confirmado: CheckCircle2,
  };

  const Icon = icons[status];

  return (
    <div className={cn('flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-[0.15em] backdrop-blur-sm', styles[status])}>
      <Icon size={12} strokeWidth={3} />
      {status}
    </div>
  );
};

const TwoLineBadge = ({ label, value, icon: Icon, color = "default" }: { label: string, value: string, icon?: any, color?: "default" | "primary" }) => (
  <div className={cn(
    "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] border transition-all group/badge",
    color === "primary" 
      ? "bg-primary/5 border-primary/10 hover:border-primary/25" 
      : "bg-secondary/30 border-border hover:border-muted-foreground/10"
  )}>
    {Icon && <Icon size={14} className={cn(color === "primary" ? "text-primary" : "text-muted-foreground/70")} />}
    <div className="flex flex-col min-w-0 leading-tight">
      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 leading-none mb-0.5">{label}</span>
      <span className="text-xs font-bold text-foreground truncate">{value}</span>
    </div>
  </div>
);

const ItineraryItemCard = ({ 
  item, 
  onEdit
}: { 
  item: TravelItem; 
  onEdit: (mode: 'edit' | 'duplicate') => void; 
}) => {
  const Icon = (item.type === 'otros' && item.custom_icon && ICON_LIST[item.custom_icon])
    ? ICON_LIST[item.custom_icon]
    : CATEGORY_ICONS[item.type] || Box;
  
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + " " + 
           d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const cost = item.real_cost || item.estimated_cost;

  const iconVariants = {
    hover: { scale: 1.25, transition: { type: "spring", stiffness: 400, damping: 12 } },
    tap: { scale: 0.9 }
  };

  return (
    <motion.div 
      whileHover="hover"
      whileTap="tap"
      className={cn(
        "premium-card p-5 group relative bg-card border-border cursor-pointer transition-all active:scale-[0.99] border",
        "hover:bg-white dark:hover:bg-zinc-900/50"
      )}
      onClick={() => onEdit('edit')}
    >
       {/* Type Icon Overlay (Background) with its own overflow management to avoid clipping the menu */}
       <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
         <div className="absolute right-[-20px] top-[-20px] opacity-[0.03] rotate-[15deg] group-hover:rotate-[25deg] transition-all duration-1000 group-hover:scale-110">
            <Icon size={180} />
         </div>
       </div>
       
       <div className="relative z-20 space-y-4">
          {/* Header Row: Icon, Title/Dates, Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto flex-1 min-w-0">
              <motion.div 
                variants={iconVariants}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary/80 border border-primary/10 shrink-0 shadow-sm mt-1 sm:mt-0"
              >
                <Icon size={20} className="sm:w-[22px] sm:h-[22px]" />
              </motion.div>
              <div className="flex flex-col min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors duration-300 truncate leading-tight">
                  {item.name}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 sm:mt-0.5">
                  <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground/60 tracking-[0.05em] uppercase flex items-center gap-1 sm:gap-1.5 flex-wrap">
                    <Calendar size={11} strokeWidth={3} className="text-primary/40 shrink-0" />
                    <span>{formatDate(item.start_time)}</span>
                    {item.end_time && (
                      <span className="flex items-center">
                        <span className="opacity-30 mx-0.5 sm:mx-1">/</span>
                        <span>{formatDate(item.end_time)}</span>
                      </span>
                    )}
                    {(item.attachments && item.attachments.length > 0) && (
                      <div className="flex items-center gap-0.5 ml-0.5 sm:ml-1 shrink-0 bg-primary/10 px-1.5 py-0.5 rounded-[var(--radius-sm)] border border-primary/20 scale-90 sm:scale-100 origin-left">
                        <Paperclip size={11} strokeWidth={3} className="text-primary" />
                        {item.attachments.length > 0 && <span className="text-[9px] font-black text-primary">{item.attachments.length}</span>}
                      </div>
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2 shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-border/40 pt-3 sm:pt-0 -mt-1 sm:-mt-0.5">
              <div className="relative flex items-center justify-end group/actions">
                <StatusBadge status={item.status} />
              </div>

            {(cost || item.reservation_ref) && (
                <div className="flex flex-col items-end gap-1">
                  {cost && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary/30 rounded-[var(--radius-sm)] border border-border/40">
                      <Banknote size={10} className="text-muted-foreground/70" />
                      <span className="text-[10px] font-black text-foreground">
                        {item.currency} {cost}
                      </span>
                      {item.payment_status === 'paid' ? (
                        <CheckCircle2 size={10} className="text-primary" />
                      ) : (item.payment_status === 'reserved' || item.next_payment_amount) ? (
                        <Clock size={10} className="text-amber-500" />
                      ) : null}
                    </div>
                  )}
                  {item.reservation_ref && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">
                      Ref: {item.reservation_ref}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description Snippet */}
          {item.description && (
             <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-2xl border-l-2 border-primary/5 pl-3 py-0.5">
               {item.description}
             </p>
          )}

          {/* Second Row: Badges and Relevant Info */}
          <div className="flex flex-col gap-3">

             {/* Locations Row */}
             {(item.origin?.address || item.location?.address || item.destination?.address) && (
               <div className={cn(
                 "grid gap-3",
                 (item.destination?.address && (item.origin?.address || item.location?.address)) ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
               )}>
                  {(item.origin?.address || item.location?.address) && (
                    <TwoLineBadge 
                       label={item.origin?.address ? "Origen" : "Ubicación"}
                       value={item.origin?.address || item.location?.address || ''} 
                       icon={MapPin} 
                    />
                  )}
                  {item.destination?.address && (
                    <TwoLineBadge 
                       label="Destino"
                       value={item.destination?.address} 
                       icon={Navigation}
                       color={item.end_time ? "primary" : "default"}
                    />
                  )}
               </div>
             )}
          </div>
       </div>
    </motion.div>
  );
};

export const Itinerary = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | 'duplicate'>('create');
  const [selectedItem, setSelectedItem] = useState<TravelItem | undefined>();
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const { getVisibleItems, getActiveTrip, removeItineraryItem, activeBranchId } = useTripStore();
  

  const items = getVisibleItems();
  const trip = getActiveTrip();
  if (!trip) return null;
  const now = new Date();

  // Helper to check if an item has passed
  const isPassed = (item: TravelItem) => {
    const end = item.end_time ? new Date(item.end_time) : new Date(item.start_time);
    return end < now;
  };

  // Helper to calculate progress between items for the line
  const getProgressInfo = () => {
    if (items.length === 0) return { lastPassedIdx: -1, nextItemProgress: 0 };
    
    let lastPassedIdx = -1;
    for (let i = items.length - 1; i >= 0; i--) {
      if (isPassed(items[i])) {
        lastPassedIdx = i;
        break;
      }
    }

    let nextItemProgress = 0;
    if (lastPassedIdx < items.length - 1) {
      const prevItem = lastPassedIdx === -1 ? null : items[lastPassedIdx];
      const nextItem = items[lastPassedIdx + 1];
      
      const startTime = prevItem ? new Date(prevItem.end_time || prevItem.start_time).getTime() : new Date(trip.dates.split(' - ')[0]).getTime(); 
      const endTime = new Date(nextItem.start_time).getTime();
      const current = now.getTime();

      if (current > startTime && current < endTime) {
        nextItemProgress = (current - startTime) / (endTime - startTime);
      } else if (current >= endTime) {
        nextItemProgress = 1;
      }
    }

    return { lastPassedIdx, nextItemProgress };
  };

  const { lastPassedIdx, nextItemProgress } = getProgressInfo();

  return (
    <motion.div 
      key={activeBranchId} 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto h-full flex flex-col"
    >
      <div className="flex-1 pb-32">
        <div className="px-6 pt-10">
      <header className="mb-12">
        <div className="flex items-center justify-between gap-4">
          <BranchManager onCompareClick={() => setIsCompareOpen(true)} />
          
          <Button 
            onClick={() => { setSelectedItem(undefined); setModalMode('create'); setIsModalOpen(true); }}
            className="flex sm:hidden fixed bottom-6 right-6 z-50 items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground font-black shadow-2xl shadow-primary/40 transition-all active:scale-95"
          >
             <span className="text-3xl font-light leading-none mb-1">+</span>
          </Button>

          <Button 
            onClick={() => { setSelectedItem(undefined); setModalMode('create'); setIsModalOpen(true); }}
            className="hidden sm:flex items-center gap-3 px-6 h-12 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest hover:brightness-110 shadow-xl shadow-primary/20 transition-all shrink-0"
          >
             <span className="text-2xl font-light leading-none">+</span>
             Add Item
          </Button>
        </div>
      </header>

      <div className="space-y-6 relative">
        {/* Background Connection Line */}
        <div className="absolute left-6 md:left-12 top-12 bottom-12 w-0.5 bg-border -translate-x-1/2" />

        <AnimatePresence mode="popLayout">
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: -50 }}
              transition={{ delay: idx * 0.05, type: "spring", stiffness: 200, damping: 25 }}
              className="relative pl-12 md:pl-24 group"
            >
              {/* Timeline Dot */}
              <div className="absolute left-6 md:left-12 top-10 z-10 -translate-x-1/2">
                {isPassed(item) ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 border-2 border-white dark:border-zinc-900 group-hover:scale-110 transition-transform">
                    <Check size={14} className="text-white w-4 h-4" strokeWidth={4} />
                  </div>
                ) : (
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 bg-white transition-all duration-500 group-hover:scale-125 flex items-center justify-center",
                    item.status === 'confirmado' ? "border-primary shadow-[0_0_20px_rgba(var(--primary),0.5)]" : "border-border shadow-inner"
                  )} />
                )}
              </div>

              {/* Connecting Line Segment */}
              {idx < items.length - 1 && (
                <div className="absolute left-6 md:left-12 top-10 w-0.5 h-[calc(100%+1.5rem)] bg-border -translate-x-1/2 -z-0">
                  {idx < lastPassedIdx && (
                    <div className="absolute inset-0 bg-emerald-500" />
                  )}
                  {idx === lastPassedIdx && (
                    <div 
                      className="absolute top-0 left-0 w-full bg-emerald-500" 
                      style={{ height: `${nextItemProgress * 100}%` }}
                    />
                  )}
                </div>
              )}

              <ItineraryItemCard 
                item={item} 
                onEdit={(mode) => { setSelectedItem(item); setModalMode(mode); setIsModalOpen(true); }}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center space-y-4"
          >
            <div className="w-20 h-20 rounded-[var(--radius-3xl)] bg-muted/50 flex items-center justify-center text-muted-foreground/40 relative">
               <Wind size={36} className="animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-black tracking-tight opacity-50">Empty Branch</h4>
              <p className="text-muted-foreground/60 font-medium text-[11px] max-w-sm mx-auto">
                No items in this plan branch yet. Add your first stop below.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <ItemFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedItem(undefined); }} mode={modalMode} initialData={selectedItem} />
      <BranchCompare isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} />
      
      </div>
      <DeleteConfirmModal 
        isOpen={!!itemToDelete} 
        onClose={() => setItemToDelete(null)} 
        onConfirm={() => {
          if (itemToDelete) {
            removeItineraryItem(itemToDelete);
            hapticFeedback('warning');
            setItemToDelete(null);
          }
        }} 
      />
      </div>
    </motion.div>
  );
};
