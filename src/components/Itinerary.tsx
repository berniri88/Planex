import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Hotel, Trash2, Edit3, Utensils, Map, Wind, GitCompare } from 'lucide-react';
import { type TravelItem } from '../lib/mockData';
import { cn } from '../lib/utils';
import { ItemFormModal } from './ItemFormModal';
import { Button } from './ui/Button';
import { useTripStore } from '../store/useTripStore';
import { TravelerClock } from './TravelerClock';
import { BranchManager } from './BranchManager';
import { hapticFeedback } from '../lib/haptics';
import { BranchCompare } from './BranchCompare';

const StatusBadge = ({ status }: { status: TravelItem['status'] }) => {
  const styles = {
    idea: 'bg-muted text-muted-foreground border-transparent',
    tentativo: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    confirmado: 'bg-primary/10 text-primary border-primary/20',
  };

  return (
    <div className={cn('text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-[0.15em] backdrop-blur-sm', styles[status])}>
      {status}
    </div>
  );
};

export const Itinerary = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedItem, setSelectedItem] = useState<TravelItem | undefined>();
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const { getVisibleItems, getActiveTrip, removeItineraryItem, activeBranchId } = useTripStore();
  
  const items = getVisibleItems();
  const trip = getActiveTrip();

  if (!trip) return null;

  return (
    <motion.div 
      key={activeBranchId} 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto py-10 px-6 h-full overflow-y-auto no-scrollbar"
    >
      <header className="mb-10">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BranchManager />
            <Button 
                onClick={() => setIsCompareOpen(true)}
                className="flex items-center gap-2 px-5 h-11 rounded-2xl border-border shadow-none group hover:bg-primary/5 transition-all text-primary bg-secondary border"
            >
              <GitCompare size={16} className="group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest">Compare</span>
            </Button>
          </div>
          
          <Button 
            onClick={() => { setSelectedItem(undefined); setModalMode('create'); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 h-11 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:brightness-110 shadow-lg shadow-primary/20 transition-all"
          >
             <span className="text-xl font-light leading-none">+</span>
             Add Item
          </Button>
        </div>
      </header>

      <div className="space-y-10 relative">
        {/* Connection Line */}
        <div className="absolute left-8 top-12 bottom-12 w-1 bg-gradient-to-b from-primary/30 via-primary/5 to-transparent rounded-full" />

        <AnimatePresence mode="popLayout">
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -50 }}
              transition={{ delay: idx * 0.05, type: "spring", stiffness: 200, damping: 25 }}
              className="relative pl-20 group"
              onClick={() => { setSelectedItem(item); setModalMode('edit'); setIsModalOpen(true); }}
            >
              {/* Timeline Dot */}
              <div className={cn(
                "absolute left-[26px] top-8 w-4 h-4 rounded-full border-4 bg-background z-10 transition-all duration-500 group-hover:scale-150",
                item.status === 'confirmado' ? "border-primary shadow-[0_0_20px_rgba(var(--primary),0.5)]" : "border-muted"
              )} />

              <div className="premium-card p-8 group relative overflow-hidden bg-card border-border cursor-pointer">
                 {/* Type Icon Overlay */}
                 <div className="absolute right-[-20px] top-[-20px] opacity-[0.03] rotate-[15deg] group-hover:rotate-[25deg] transition-transform duration-700 pointer-events-none">
                    {item.type === 'vuelo' && <Plane size={180} />}
                    {item.type === 'alojamiento' && <Hotel size={180} />}
                    {item.type === 'restaurante' && <Utensils size={180} />}
                    {item.type === 'actividad' && <Map size={180} />}
                 </div>
                 
                 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                    <div className="space-y-5">
                      <div className="flex items-center gap-4">
                         <StatusBadge status={item.status} />
                         <h3 className="text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors duration-300">
                          {item.name}
                         </h3>
                      </div>
                      
                      <p className="text-base text-muted-foreground font-medium leading-relaxed max-w-lg">
                        {item.description}
                      </p>

                      <TravelerClock dateString={item.start_time} timezone={item.timezone} />
                    </div>

                    <div className="flex items-center gap-3 lg:flex-col lg:items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button 
                          variant="glass" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setModalMode('edit'); setIsModalOpen(true); }}
                          className="w-12 h-12 rounded-2xl p-0 hover:text-primary backdrop-blur-md bg-white/20"
                        >
                          <Edit3 size={20} />
                       </Button>
                       <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); removeItineraryItem(item.id); hapticFeedback('warning'); }}
                          className="w-12 h-12 rounded-2xl p-0 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 size={20} />
                       </Button>
                    </div>
                 </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-6"
          >
            <div className="w-24 h-24 rounded-[2.5rem] bg-muted flex items-center justify-center text-muted-foreground relative">
               <Wind size={40} className="animate-pulse" />
            </div>
            <div className="space-y-2">
              <h4 className="text-2xl font-black tracking-tight">Empty Branch</h4>
              <p className="text-muted-foreground font-bold text-sm max-w-xs mx-auto">
                No items in this plan branch yet. Add your first stop below.
              </p>
            </div>
          </motion.div>
        )}
        

      </div>

      <ItemFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedItem(undefined); }} mode={modalMode} initialData={selectedItem} />
      <BranchCompare isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} />
    </motion.div>
  );
};
