import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, Hotel, Utensils, Map as MapIcon, Wind, Calendar,
  Bus as BusIcon, Train, Car, Navigation, Box, MapPin, Banknote, CheckCircle2, AlertCircle, HelpCircle, Clock, Check
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
  actividad: MapIcon,
  restaurante: Utensils,
  otros: Box,
};

const LANE_COLORS = {
  0: { border: 'border-violet-500/40', bg: 'bg-violet-500', text: 'text-violet-500', hover: 'group-hover:text-violet-500', bgLight: 'bg-violet-500/10' },
  1: { border: 'border-red-500/40', bg: 'bg-red-500', text: 'text-red-500', hover: 'group-hover:text-red-500', bgLight: 'bg-red-500/10' },
  2: { border: 'border-green-500/40', bg: 'bg-green-500', text: 'text-green-500', hover: 'group-hover:text-green-500', bgLight: 'bg-green-500/10' }
};

const StatusBadge = ({ status }: { status: TravelItem['status'] }) => {
  const styles = {
    idea: 'bg-muted/50 text-muted-foreground border-transparent',
    tentativo: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    confirmado: 'bg-primary/10 text-primary border-primary/20',
  };
  const icons = { idea: HelpCircle, tentativo: AlertCircle, confirmado: CheckCircle2 };
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
    color === "primary" ? "bg-primary/5 border-primary/10 hover:border-primary/25" : "bg-secondary/30 border-border hover:border-muted-foreground/10"
  )}>
    {Icon && <Icon size={14} className={cn(color === "primary" ? "text-primary" : "text-muted-foreground/70")} />}
    <div className="flex flex-col min-w-0 leading-tight">
      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 leading-none mb-0.5">{label}</span>
      <span className="text-xs font-bold text-foreground truncate">{value}</span>
    </div>
  </div>
);

const ItineraryItemCard = ({ item, isConflicted, laneColor, isHovered, onEdit }: { item: TravelItem; isConflicted?: boolean; laneColor: any; isHovered?: boolean; onEdit: (mode: 'edit' | 'duplicate') => void; }) => {
  const Icon = (item.type === 'otros' && item.custom_icon && ICON_LIST[item.custom_icon]) ? ICON_LIST[item.custom_icon] : CATEGORY_ICONS[item.type] || Box;
  const formatDateFull = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + " " + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  const cost = item.real_cost || item.estimated_cost;
  const iconVariants = { hover: { scale: 1.25, transition: { type: "spring", stiffness: 400, damping: 12 } }, tap: { scale: 0.9 } };

  return (
    <motion.div 
      whileHover="hover" 
      whileTap="tap" 
      className={cn(
        "premium-card p-5 group relative bg-card cursor-pointer transition-all active:scale-[0.99] border-2 shadow-sm duration-300", 
        "hover:bg-white dark:hover:bg-zinc-900/50",
        isHovered ? laneColor.border.replace('/40', '') : "border-border/40"
      )} 
      style={{
        boxShadow: isHovered ? `0 10px 40px -10px ${laneColor.bg.includes('violet') ? 'rgba(139, 92, 246, 0.2)' : laneColor.bg.includes('red') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}` : undefined
      }}
      onClick={() => onEdit('edit')}
    >
       <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
         <div className="absolute right-[-20px] top-[-20px] opacity-[0.03] rotate-[15deg] group-hover:rotate-[25deg] transition-all duration-1000 group-hover:scale-110"><Icon size={180} /></div>
       </div>
       <div className="relative z-20 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto flex-1 min-w-0">
              <motion.div variants={iconVariants} className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border shrink-0 shadow-sm mt-1 sm:mt-0", laneColor.bgLight, laneColor.text, laneColor.border)}>
                <Icon size={20} className="sm:w-[22px] sm:h-[22px]" />
              </motion.div>
              <div className="flex flex-col min-w-0 flex-1">
                <h3 className={cn("text-lg sm:text-xl font-black text-foreground tracking-tight transition-colors duration-300 truncate leading-tight", laneColor.hover)}>{item.name}</h3>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 sm:mt-0.5">
                  <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground/60 tracking-[0.05em] uppercase flex items-center gap-1 sm:gap-1.5 flex-wrap">
                    <Calendar size={11} strokeWidth={3} className="text-primary/40 shrink-0" />
                    <span>{formatDateFull(item.start_time)}</span>
                    {item.end_time && (
                      <span className="flex items-center"><span className="opacity-30 mx-0.5 sm:mx-1">/</span><span>{formatDateFull(item.end_time)}</span></span>
                    )}
                    {isConflicted && (
                      <div className="flex items-center gap-0.5 ml-1 sm:ml-2 bg-red-500/10 px-1.5 py-0.5 rounded-[var(--radius-sm)] border border-red-500/20 text-red-500 group/conflict relative cursor-help">
                        <AlertCircle size={10} strokeWidth={3} /><span className="text-[9px] font-bold">Conflicto</span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[200px] px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded opacity-0 group-hover/conflict:opacity-100 transition-opacity shadow-lg z-50 pointer-events-none text-center whitespace-normal leading-tight">Solapamiento de horarios en el mismo carril</div>
                      </div>
                    )}
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-muted/40 rounded-full border border-border/20 text-[8px] font-black text-muted-foreground/70 uppercase tracking-tighter ml-1.5 shrink-0 group-hover:bg-muted group-hover:text-muted-foreground transition-colors">
                      <Clock size={9} strokeWidth={3} />
                      {(() => {
                        const s_ts = new Date(item.start_time).getTime();
                        const e_ts = item.end_time ? new Date(item.end_time).getTime() : s_ts + 3600000;
                        const durationMs = e_ts - s_ts;
                        const totalHours = Math.floor(durationMs / 3600000);
                        const days = Math.floor(totalHours / 24);
                        const hours = totalHours % 24;
                        const minutes = Math.round((durationMs % 3600000) / 60000);
                        
                        if (days > 0) return `${days}d${hours > 0 ? ` ${hours}h` : ''}${minutes > 0 ? ` ${minutes}m` : ''}`;
                        if (hours > 0) return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
                        return `${minutes}m`;
                      })()}
                    </div>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2 shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-border/40 pt-3 sm:pt-0 -mt-1 sm:-mt-0.5">
              <StatusBadge status={item.status} />
              {(cost || item.reservation_ref) && (
                <div className="flex flex-col items-end gap-1">
                  {cost && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary/30 rounded-[var(--radius-sm)] border border-border/40">
                      <Banknote size={10} className="text-muted-foreground/70" /><span className="text-[10px] font-black text-foreground">{item.currency} {cost}</span>
                      {item.payment_status === 'paid' ? <CheckCircle2 size={10} className="text-primary" /> : null}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {item.description && <p className={cn("text-xs text-muted-foreground font-medium leading-relaxed max-w-2xl border-l-2 pl-3 py-0.5 transition-colors duration-300", isHovered ? laneColor.border.replace('/40', '') : "border-primary/5")}>{item.description}</p>}
          <div className="flex flex-col gap-3">
             {(item.origin?.address || item.location?.address || item.destination?.address) && (
               <div className={cn("grid gap-3", (item.destination?.address && (item.origin?.address || item.location?.address)) ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
                  {(item.origin?.address || item.location?.address) && (
                    <TwoLineBadge label={item.origin?.address ? "Origen" : "Ubicación"} value={item.origin?.address || item.location?.address || ''} icon={MapPin} />
                  )}
                  {item.destination?.address && (
                    <TwoLineBadge label="Destino" value={item.destination?.address} icon={Navigation} color={item.end_time ? "primary" : "default"} />
                  )}
               </div>
             )}
          </div>
       </div>
    </motion.div>
  );
};

export const Itinerary = () => {
  const [viewMode, setViewMode] = useState<'timeline' | 'gantt'>('timeline');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | 'duplicate'>('create');
  const [selectedItem, setSelectedItem] = useState<TravelItem | undefined>();
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const { getVisibleItems, getActiveTrip, removeItineraryItem, activeBranchId } = useTripStore();

  const items = getVisibleItems();
  const trip = getActiveTrip();
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  if (!trip) return null;

  const getLaneIndex = (type: string) => {
    if (['vuelo', 'bus', 'tren', 'taxi', 'otro_transporte'].includes(type)) return 0;
    if (['alojamiento'].includes(type)) return 1;
    return 2;
  };

  const getElasticHeight = (hours: number) => {
    const h = Math.max(0, hours);
    if (h <= 4) return h * 40;
    if (h <= 24) return 160 + (h - 4) * 10;
    return 360 + (h - 24) * 2;
  };

  const hasConflict = (item: TravelItem) => {
    return items.some(other => {
      if (other.id === item.id) return false;
      if (getLaneIndex(other.type) !== getLaneIndex(item.type)) return false;
      const s1 = new Date(item.start_time).getTime();
      const e1 = item.end_time ? new Date(item.end_time).getTime() : s1 + 3600000;
      const s2 = new Date(other.start_time).getTime();
      const e2 = other.end_time ? new Date(other.end_time).getTime() : s2 + 3600000;
      return Math.max(s1, s2) < Math.min(e1, e2);
    });
  };

  const timelineData = useMemo(() => {
    if (items.length === 0) return [];
    const timePointsSet = new Set<number>();
    items.forEach(item => {
      timePointsSet.add(new Date(item.start_time).getTime());
      timePointsSet.add(item.end_time ? new Date(item.end_time).getTime() : new Date(item.start_time).getTime() + 3600000);
    });
    const sortedPoints = Array.from(timePointsSet).sort((a, b) => a - b);
    
    const intervals: { start: number; end: number; startingItems: TravelItem[]; activeItems: TravelItem[] }[] = [];
    for (let i = 0; i < sortedPoints.length - 1; i++) {
       const start = sortedPoints[i];
       const end = sortedPoints[i + 1];
       const startingItems = items.filter(it => new Date(it.start_time).getTime() === start);
       const activeItems = items.filter(it => {
          const s = new Date(it.start_time).getTime();
          const e = it.end_time ? new Date(it.end_time).getTime() : s + 3600000;
          return s <= start && e >= end;
       });
       intervals.push({ start, end, startingItems, activeItems });
    }
    return intervals;
  }, [items]);

  const { timelineHeight, timeOffsets, dayDividers } = useMemo(() => {
    let currentY = 0;
    const offsets = new Map<number, number>();
    const dividers: { y: number, date: Date }[] = [];
    
    timelineData.forEach((interval, idx) => {
      const prevInterval = idx > 0 ? timelineData[idx - 1] : null;
      const startTimeDate = new Date(interval.start);
      const isNewDay = !prevInterval || startTimeDate.toDateString() !== new Date(prevInterval.start).toDateString();
      
      if (isNewDay) {
        currentY += 64; // Day divider
        dividers.push({ y: currentY - 12, date: startTimeDate });
      }
      
      offsets.set(interval.start, currentY);

      // --- Anti-Overlap Logic ---
      // Calculate how much space the cards starting at this point need.
      let cardHeightNeeded = 0;
      if (interval.startingItems.length > 0) {
        const cardEstHeight = 220; // Safe estimate for card height plus gaps
        // On desktop (lg), cards are grid-2-cols
        const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
        const rowCount = isDesktop ? Math.ceil(interval.startingItems.length / 2) : interval.startingItems.length;
        cardHeightNeeded = rowCount * (cardEstHeight + 16);
      }

      const intervalHours = (interval.end - interval.start) / 3600000;
      const timeSpace = Math.max(20, getElasticHeight(intervalHours));
      
      // Ensure the interval is tall enough for the cards that start here
      const intervalHeight = Math.max(timeSpace, cardHeightNeeded);
      currentY += intervalHeight;
      
      if (idx === timelineData.length - 1) {
        offsets.set(interval.end, currentY);
      }
    });
    
    return { timelineHeight: currentY, timeOffsets: offsets, dayDividers: dividers };
  }, [timelineData]);

  const LANE_CLASSES = ['left-[84px] md:left-[96px]', 'left-[108px] md:left-[124px]', 'left-[132px] md:left-[152px]'];
  const formatTime = (date: Date) => date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formatDate = (date: Date) => date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase();

  return (
    <motion.div key={activeBranchId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn("mx-auto h-full flex flex-col transition-all duration-500", viewMode === 'timeline' ? "max-w-4xl" : "max-w-[98vw] w-full px-4 sm:px-8")}>
      <div className="flex-1 pb-32">
        <div className="px-6 pt-10">
          <header className="mb-12">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <BranchManager onCompareClick={() => setIsCompareOpen(true)} />
                <div className="hidden sm:flex items-center p-1 bg-secondary/50 rounded-xl border border-white/10 backdrop-blur-md shadow-inner">
                  {[
                    { id: 'timeline', label: 'Timeline', icon: Clock },
                    { id: 'gantt', label: 'Gantt', icon: Box }
                  ].map((tab) => (
                    <button 
                      key={tab.id}
                    onClick={() => { setViewMode(tab.id as 'timeline' | 'gantt'); hapticFeedback('light'); }} 
                      className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                        viewMode === tab.id 
                          ? "bg-background text-foreground shadow-lg shadow-black/5 ring-1 ring-white/20" 
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}
                    >
                      <tab.icon size={12} className={cn(viewMode === tab.id ? "text-primary" : "text-muted-foreground")} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => { setSelectedItem(undefined); setModalMode('create'); setIsModalOpen(true); }} className="flex sm:hidden fixed bottom-6 right-6 z-50 items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground font-black shadow-2xl shadow-primary/40"><span className="text-3xl font-light mb-1">+</span></Button>
                <Button onClick={() => { setSelectedItem(undefined); setModalMode('create'); setIsModalOpen(true); }} className="hidden sm:flex items-center gap-3 px-6 h-12 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-primary/20"><span className="text-2xl font-light">+</span>Add Item</Button>
              </div>
            </div>
          </header>
          <div className="relative">
            <AnimatePresence mode="wait">
              {viewMode === 'timeline' ? (
                <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <div className="relative pb-20" style={{ minHeight: `${timelineHeight}px` }}>
                    {/* 1. Consistent background lane tracks */}
                    {[0, 1, 2].map(lane => (
                      <div key={`track-${lane}`} className={cn("absolute top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 opacity-20 z-0", LANE_CLASSES[lane])} />
                    ))}

                    {/* 2. Activity Bars */}
                    {items.map(it => {
                      const lane = getLaneIndex(it.type);
                      const laneCol = LANE_COLORS[lane as keyof typeof LANE_COLORS];
                      const sTime = new Date(it.start_time).getTime();
                      const eTime = it.end_time ? new Date(it.end_time).getTime() : sTime + 3600000;
                      const yStart = timeOffsets.get(sTime) ?? 0;
                      const yEnd = timeOffsets.get(eTime) ?? yStart + 40;
                      const isMainConflict = hasConflict(it);
                      const currentStatus = new Date() > new Date(it.start_time) ? 'passed' : 'upcoming';
                      const isHovered = hoveredItemId === it.id;

                      return (
                        <div 
                          key={`bar-${it.id}`} 
                          className={cn(
                            "absolute -translate-x-1/2 w-1 z-10 transition-all duration-300", 
                            LANE_CLASSES[lane], 
                            laneCol.bg,
                            isHovered && "w-2 z-40 shadow-[0_0_15px_rgba(var(--primary),0.5)] md:scale-y-[1.05]",
                            isHovered && laneCol.bg.replace('bg-', 'shadow-') // Subtle hack, better to use inline style for dynamic shadow
                          )} 
                          style={{ 
                            top: `${yStart}px`, 
                            height: `${yEnd - yStart}px`,
                            boxShadow: isHovered ? `0 0 20px ${laneCol.bg.includes('violet') ? '#8b5cf6' : laneCol.bg.includes('red') ? '#ef4444' : '#22c55e'}` : 'none'
                          }}
                          onMouseEnter={() => setHoveredItemId(it.id)}
                          onMouseLeave={() => setHoveredItemId(null)}
                        >
                          {isMainConflict && (
                              <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(255,255,255,0.7) 4px, rgba(255,255,255,0.7) 8px)' }} />
                          )}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[120%] pointer-events-none z-20">
                              <span className={cn("text-[9px] font-black transition-colors", isHovered ? laneCol.text : "text-muted-foreground/80")}>{formatTime(new Date(it.start_time))}</span>
                          </div>
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[120%] pointer-events-none z-20">
                              <span className={cn("text-[9px] font-black transition-colors whitespace-nowrap", isHovered ? laneCol.text : "text-muted-foreground/40")}>{formatTime(new Date(eTime))}</span>
                          </div>
                          <div className={cn("absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center shadow-sm z-30 transition-all duration-300", 
                            isHovered && "scale-125 z-50",
                            currentStatus === 'passed' ? laneCol.bg : (it.status === 'confirmado' ? laneCol.border.replace('/40','') : 'border-border'))
                          }>
                              {currentStatus === 'passed' && <Check size={12} className="text-white" strokeWidth={4} />}
                              {isMainConflict && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />}
                          </div>
                        </div>
                      );
                    })}

                    {/* 3. Day Dividers */}
                    {dayDividers.map(div => (
                      <div key={`day-${div.y}`} className="absolute left-0 right-0 h-px z-30 pointer-events-none" style={{ top: `${div.y}px` }}>
                        <div className="absolute left-2 -translate-y-1/2">
                          <span className="text-[9px] font-black tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 backdrop-blur-sm whitespace-nowrap shadow-sm">
                            {formatDate(div.date)}
                          </span>
                        </div>
                        <div className="absolute left-20 right-0 h-px bg-gradient-to-r from-primary/30 via-primary/5 to-transparent" />
                      </div>
                    ))}

                    {/* 4. Content Intervals */}
                    <AnimatePresence mode="popLayout">
                      {timelineData.map((interval, idx) => {
                        const sTime = interval.start;
                        const yPos = timeOffsets.get(sTime) ?? 0;

                        return (
                          <div key={`${interval.start}-${idx}`} className="absolute left-0 right-0" style={{ top: `${yPos}px` }}>
                            {interval.startingItems.length > 0 && (
                              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={cn("grid gap-4 mb-4 pl-[160px] md:pl-[180px] relative z-20", interval.startingItems.length > 1 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
                                {interval.startingItems.sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()).map(it => {
                                  const laneCol = LANE_COLORS[getLaneIndex(it.type) as keyof typeof LANE_COLORS];
                                  const isHovered = hoveredItemId === it.id;
                                  
                                  return (
                                    <div 
                                      key={it.id}
                                      onMouseEnter={() => setHoveredItemId(it.id)}
                                      onMouseLeave={() => setHoveredItemId(null)}
                                      className="transition-all duration-300 rounded-[var(--radius-2xl)]"
                                    >
                                      <ItineraryItemCard 
                                        item={it} 
                                        isConflicted={hasConflict(it)} 
                                        laneColor={laneCol} 
                                        isHovered={isHovered}
                                        onEdit={(mode) => { setSelectedItem(it); setModalMode(mode); setIsModalOpen(true); }} 
                                      />
                                    </div>
                                  );
                                })}
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </AnimatePresence>

                    {items.length === 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                        <div className="w-20 h-20 rounded-[var(--radius-3xl)] bg-muted/50 flex items-center justify-center text-muted-foreground/40 relative"><Wind size={36} className="animate-pulse" /></div>
                        <div className="space-y-1"><h4 className="text-xl font-black tracking-tight opacity-50">Empty Branch</h4><p className="text-muted-foreground/60 font-medium text-[11px] max-w-sm mx-auto">No items in this plan branch yet.</p></div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <GanttView items={items} onEdit={(it) => { setSelectedItem(it); setModalMode('edit'); setIsModalOpen(true); }} />
              )}
            </AnimatePresence>
          </div>
          <ItemFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedItem(undefined); }} mode={modalMode} initialData={selectedItem} />
          <BranchCompare isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} />
        </div>
        <DeleteConfirmModal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={() => { if (itemToDelete) { removeItineraryItem(itemToDelete); hapticFeedback('warning'); setItemToDelete(null); } }} />
      </div>
    </motion.div>
  );
};

const GanttView = ({ items, onEdit }: { items: TravelItem[], onEdit: (it: TravelItem) => void }) => {
  const getLaneIndex = (type: string) => {
    if (['vuelo', 'bus', 'tren', 'taxi', 'otro_transporte'].includes(type)) return 0;
    if (['alojamiento'].includes(type)) return 1;
    return 2;
  };

  const startTimePoints = items.map(it => new Date(it.start_time).getTime());
  const endTimePoints = items.map(it => it.end_time ? new Date(it.end_time).getTime() : new Date(it.start_time).getTime() + 3600000);
  
  const earliestDate = items.length > 0 ? new Date(Math.min(...startTimePoints)) : new Date();
  earliestDate.setHours(0, 0, 0, 0);
  const minTime = earliestDate.getTime();
  
  const latestDate = items.length > 0 ? new Date(Math.max(...endTimePoints)) : new Date();
  latestDate.setHours(23, 59, 59, 999);
  const maxTime = latestDate.getTime();
  
  const totalDuration = Math.max(maxTime - minTime, 86400000);
  
  // Grid config
  const pxPerHour = 60;
  const headerHeight = 60;
  const ITEM_HEIGHT = 48;
  const ITEM_GAP = 8;
  const LANE_PADDING = 32;

  // 1. Group items by lane and assign rows to avoid overlap
  const laneData = useMemo(() => {
    return [0, 1, 2].map(laneId => {
      const laneItems = items
        .filter(it => getLaneIndex(it.type) === laneId)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

      const rows: TravelItem[][] = [];
      const itemsWithRow = laneItems.map(item => {
        const s = new Date(item.start_time).getTime();
        const e = item.end_time ? new Date(item.end_time).getTime() : s + 3600000;

        let rowIndex = 0;
        while (true) {
          if (!rows[rowIndex]) {
            rows[rowIndex] = [item];
            return { item, rowIndex };
          }
          const overlaps = rows[rowIndex].some(other => {
            const os = new Date(other.start_time).getTime();
            const oe = other.end_time ? new Date(other.end_time).getTime() : os + 3600000;
            // Add a small buffer (1 minute) to avoid pixel-perfect touch overlaps
            return Math.max(s, os) < Math.min(e, oe);
          });
          if (!overlaps) {
            rows[rowIndex].push(item);
            return { item, rowIndex };
          }
          rowIndex++;
        }
      });

      const rowCount = Math.max(1, rows.length);
      const height = Math.max(100, rowCount * ITEM_HEIGHT + (rowCount - 1) * ITEM_GAP + LANE_PADDING);
      
      return { laneId, items: itemsWithRow, rowCount, height };
    });
  }, [items]);

  // 2. Calculate offsets
  const laneMetrics = useMemo(() => {
    let currentY = 0;
    return laneData.map(lane => {
      const y = currentY;
      currentY += lane.height;
      return { ...lane, y };
    });
  }, [laneData]);

  const totalGanttHeight = laneMetrics.reduce((sum, l) => sum + l.height, 0);

  const lanes = [
     { id: 0, label: 'Viaje', color: LANE_COLORS[0] },
     { id: 1, label: 'Hospedaje', color: LANE_COLORS[1] },
     { id: 2, label: 'Otros', color: LANE_COLORS[2] }
  ];

  const daysCount = Math.ceil(totalDuration / (24 * 3600000)) + 1;
  const gridWidth = (totalDuration / 3600000) * pxPerHour + 400; // Buffer

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border shadow-2xl relative">
       <div className="flex flex-col">
          <div className="overflow-x-auto custom-scrollbar pb-4">
             <div className="relative" style={{ width: `${gridWidth}px`, height: `${totalGanttHeight + headerHeight}px` }}>
                {/* Header (Time axis) - STICKY TOP */}
                <div className="sticky top-0 left-0 flex border-b border-border bg-card/95 backdrop-blur-md z-[70]" style={{ height: `${headerHeight}px`, width: `${gridWidth}px` }}>
                   <div className="sticky left-0 flex-none bg-card z-[80] border-r border-border" style={{ width: '80px', height: `${headerHeight}px` }} />
                   
                    <div className="flex">
                      {Array.from({ length: daysCount }).map((_, i) => {
                         const dayDate = new Date(minTime + i * 24 * 3600000);
                         return (
                            <div key={i} className="flex-none border-r border-border/50 py-2 relative" style={{ width: `${24 * pxPerHour}px` }}>
                               <div className="sticky left-[84px] w-max pointer-events-none z-50 py-0.5 px-4">
                                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 backdrop-blur-sm whitespace-nowrap shadow-sm">
                                     {dayDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}
                                  </motion.span>
                               </div>
                               <div className="relative mt-1 h-3 w-full opacity-40 text-[8px] font-bold">
                                  {[0, 3, 6, 9, 12, 15, 18, 21].map(h => (
                                    <span key={h} className="absolute -translate-x-1/2" style={{ left: `${h * pxPerHour}px` }}>
                                      {h}:00
                                    </span>
                                  ))}
                               </div>
                            </div>
                         );
                      })}
                    </div>
                </div>

                {/* Grid Content with Sticky Icon Sidebar */}
                <div className="absolute top-[60px] left-0 bottom-0 pointer-events-none" style={{ width: `${gridWidth}px` }}>
                   {laneMetrics.map(lane => {
                      const baseLane = lanes.find(l => l.id === lane.laneId)!;
                      const Icon = lane.laneId === 0 ? Plane : (lane.laneId === 1 ? Hotel : Box);
                      return (
                        <div key={lane.laneId} className="relative flex items-center border-b border-border/10 transition-all duration-500" style={{ height: `${lane.height}px`, width: `${gridWidth}px` }}>
                           <div className="sticky left-0 w-20 h-full flex flex-col items-center justify-center gap-1.5 bg-card z-[60] border-r border-border/40 pointer-events-auto shadow-[2px_0_10px_-4px_rgba(0,0,0,0.1)]">
                              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border bg-white dark:bg-zinc-800 shadow-sm transition-all duration-300", baseLane.color.text, baseLane.color.border)}>
                                 <Icon size={18} strokeWidth={2.5} />
                              </div>
                              <span className={cn("text-[8px] font-black uppercase tracking-tighter opacity-60 px-1 text-center", baseLane.color.text)}>
                                 {baseLane.label}
                              </span>
                           </div>
                           <div className="flex-1 h-full" />
                        </div>
                      );
                   })}
                </div>

                {/* Grid Lines Context (Offset by Sidebar) */}
                <div className="absolute top-[60px] left-20 right-0 bottom-0 pointer-events-none">
                   {Array.from({ length: Math.ceil(totalDuration / 3600000) }).map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "absolute top-0 bottom-0 border-l border-foreground transition-opacity",
                          i % 3 === 0 ? "opacity-10" : "opacity-[0.02]"
                        )} 
                        style={{ left: `${i * pxPerHour}px` }} 
                      />
                   ))}
                </div>

                {/* Items Context (Offset by Sidebar) */}
                <div className="absolute top-[60px] left-20 right-0 bottom-0">
                   {laneMetrics.map(lane => (
                     lane.items.map(({ item, rowIndex }) => {
                        const baseLane = lanes.find(l => l.id === lane.laneId)!;
                        const laneCol = baseLane.color;
                        const s = new Date(item.start_time).getTime();
                        const e = item.end_time ? new Date(item.end_time).getTime() : s + 3600000;
                        const left = ((s - minTime) / 3600000) * pxPerHour;
                        const width = Math.max(20, ((e - s) / 3600000) * pxPerHour);
                        const Icon = CATEGORY_ICONS[item.type as keyof typeof CATEGORY_ICONS] || Box;

                        // Calculate vertical position within the lane
                        const stackTotalHeight = lane.rowCount * ITEM_HEIGHT + (lane.rowCount - 1) * ITEM_GAP;
                        const verticalOffset = (lane.height - stackTotalHeight) / 2;
                        const top = lane.y + verticalOffset + rowIndex * (ITEM_HEIGHT + ITEM_GAP);

                        const sTime = new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const eTime = new Date(e).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const diffMs = e - s;
                        const totalHours = Math.floor(diffMs / 3600000);
                        const d_diff = Math.floor(totalHours / 24);
                        const h_diff = totalHours % 24;
                        const m_diff = Math.round((diffMs % 3600000) / 60000);
                        
                        let durationStr = "";
                        if (d_diff > 0) {
                          durationStr = `${d_diff}d${h_diff > 0 ? ` ${h_diff}h` : ''}${m_diff > 0 ? ` ${m_diff}m` : ''}`;
                        } else if (h_diff > 0) {
                          durationStr = `${h_diff}h${m_diff > 0 ? ` ${m_diff}m` : ''}`;
                        } else {
                          durationStr = `${m_diff}m`;
                        }

                         return (
                            <motion.div 
                              key={item.id} 
                              whileHover={{ 
                                borderWidth: '2px',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
                              }}
                              onClick={() => onEdit(item)}
                              className={cn(
                                "absolute rounded-xl border p-2 cursor-pointer transition-all z-20 group/item", 
                                laneCol.bgLight, 
                                laneCol.border.replace('/40', '/60'),
                                "shadow-sm hover:z-30"
                              )} 
                              style={{ left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${ITEM_HEIGHT}px` }}
                            >
                               <div className="sticky left-2 flex items-center gap-2 w-max pointer-events-none">
                                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 bg-white dark:bg-zinc-900 shadow-sm transition-transform group-hover/item:scale-110", laneCol.text, laneCol.border.replace('/40', '/20'))}>
                                     <Icon size={14} />
                                  </div>
                                  <div className="flex flex-col min-w-0 pr-2">
                                     <span className="text-[10px] font-bold text-foreground leading-tight whitespace-nowrap">{item.name}</span>
                                     <span className="text-[8px] font-black text-muted-foreground opacity-60 uppercase tracking-tighter whitespace-nowrap">
                                        {sTime} - {eTime} ({durationStr})
                                     </span>
                                  </div>
                               </div>
                            </motion.div>
                         );
                      })
                   ))}
                </div>
             </div>
          </div>
       </div>
    </motion.div>
  );
};
