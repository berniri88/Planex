import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, Hotel, Trash2, Utensils, Map, Wind, Calendar,
  Bus as BusIcon, Train, Car, Navigation, Box, Paperclip, MapPin, Banknote, CheckCircle2, AlertCircle, HelpCircle, Clock,
  MoreHorizontal, Copy, Download, Share2
} from 'lucide-react';
import { downloadItemInfo } from '../lib/utils';
import { type TravelItem, type TravelItemCategory } from '../lib/mockData';
import { cn } from '../lib/utils';
import { ItemFormModal } from './ItemFormModal';
import { Button } from './ui/Button';
import { useTripStore } from '../store/useTripStore';
import { BranchManager } from './BranchManager';
import { hapticFeedback } from '../lib/haptics';
import { BranchCompare } from './BranchCompare';
import { DeleteConfirmModal } from './ui/DeleteConfirmModal';

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
    "flex items-center gap-3 px-3 py-2 rounded-xl border transition-all group/badge",
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
  onEdit, 
  onRemove 
}: { 
  item: TravelItem; 
  onEdit: (mode: 'edit' | 'duplicate') => void; 
  onRemove: (id: string) => void 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const Icon = CATEGORY_ICONS[item.type] || Box;
  
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
        "hover:bg-white dark:hover:bg-zinc-900/50",
        showMenu && "z-[100] shadow-2xl"
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
                      <Paperclip size={10} className="text-primary/60 ml-0.5 sm:ml-1 shrink-0" />
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2 shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-border/40 pt-3 sm:pt-0 -mt-1 sm:-mt-0.5">
              <div className="relative flex items-center justify-end group/actions">
                <StatusBadge status={item.status} />
                
                {/* Action Menu Button Overlay */}
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 hidden sm:block">
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                      className={cn(
                        "w-9 h-9 rounded-full p-0 bg-white border border-border shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:bg-primary hover:text-white transition-all z-30",
                        !showMenu && "opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <MoreHorizontal size={16} />
                    </Button>

                  <AnimatePresence>
                    {showMenu && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          onMouseLeave={() => setShowMenu(false)}
                          className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden z-[110] p-1.5"
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); onEdit('duplicate'); setShowMenu(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all group/item"
                          >
                            <Copy size={14} className="text-primary group-hover/item:scale-110 transition-transform" />
                            Duplicar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); downloadItemInfo(item); setShowMenu(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-foreground hover:bg-blue-500/10 hover:text-blue-500 rounded-lg transition-all group/item"
                          >
                            <Download size={14} className="text-blue-500 group-hover/item:scale-110 transition-transform" />
                            Descargar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); alert("Compartir próximamente..."); setShowMenu(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-foreground hover:bg-purple-500/10 hover:text-purple-500 rounded-lg transition-all group/item"
                          >
                            <Share2 size={14} className="text-purple-500 group-hover/item:scale-110 transition-transform" />
                            Compartir
                          </button>
                          <div className="h-px bg-border my-1.5 mx-1" />
                          <button
                            onClick={(e) => { e.stopPropagation(); onRemove(item.id); setShowMenu(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all group/item"
                          >
                            <Trash2 size={14} className="group-hover/item:scale-110 transition-transform" />
                            Eliminar
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {(cost || item.reservation_ref) && (
                <div className="flex flex-col items-end gap-1">
                  {cost && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary/30 rounded-md border border-border/40">
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

  return (
    <motion.div 
      key={activeBranchId} 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto py-10 px-6 h-full overflow-y-auto no-scrollbar pb-32"
    >
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
        {/* Connection Line */}
        <div className="absolute left-4 md:left-8 top-12 bottom-12 w-1 bg-gradient-to-b from-primary/30 via-primary/5 to-transparent rounded-full shadow-[0_0_15px_rgba(var(--primary),0.1)]" />

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
              <div className={cn(
                "absolute left-[10px] md:left-[24px] top-10 w-4 h-4 md:w-6 md:h-6 rounded-full border-[3px] md:border-4 bg-white z-10 transition-all duration-500 group-hover:scale-125",
                item.status === 'confirmado' ? "border-primary shadow-[0_0_20px_rgba(var(--primary),0.5)]" : "border-border shadow-inner"
              )} />

              <div className="absolute left-[17px] md:left-[34px] top-10 w-0.5 h-full bg-border/30 -z-0" />

              <ItineraryItemCard 
                item={item} 
                onEdit={(mode) => { setSelectedItem(item); setModalMode(mode); setIsModalOpen(true); }}
                onRemove={(id) => setItemToDelete(id)}
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
            <div className="w-20 h-20 rounded-[2.5rem] bg-muted/50 flex items-center justify-center text-muted-foreground/40 relative">
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
    </motion.div>
  );
};
