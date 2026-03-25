import { useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { TravelItem } from '../lib/types';
import { cn } from '../lib/utils';
import { Plane, Hotel, Map, Utensils, Box, Calendar, Bus as BusIcon, Train, Car, Navigation, Paperclip } from 'lucide-react';
import { ICON_LIST } from './ui/IconPickerModal';

const CATEGORY_ICONS: Record<string, any> = {
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

const TRACK_ICONS: Record<string, any> = {
  alojamiento: Hotel,
  transporte: Plane,
  actividad: Map,
};

const TRACKS = [
  { id: 'alojamiento', title: 'Alojamiento', categories: ['alojamiento'], color: 'purple' },
  { id: 'transporte', title: 'Transporte', categories: ['vuelo', 'tren', 'bus', 'taxi', 'otro_transporte'], color: 'blue' },
  { id: 'actividad', title: 'Actividades', categories: ['actividad', 'restaurante', 'otros'], color: 'rose' },
];

const THEME_COLORS: Record<string, { bg: string, border: string, text: string, faint: string, solid: string }> = {
  purple: { 
    bg: 'bg-purple-500', 
    border: 'border-purple-500', 
    text: 'text-purple-600 dark:text-purple-400', 
    faint: 'bg-purple-500/10 dark:bg-purple-400/10',
    solid: 'bg-purple-500/20 dark:bg-purple-400/30'
  },
  blue: { 
    bg: 'bg-blue-500', 
    border: 'border-blue-500', 
    text: 'text-blue-600 dark:text-blue-400', 
    faint: 'bg-blue-500/10 dark:bg-blue-400/10',
    solid: 'bg-blue-500/20 dark:bg-blue-400/30'
  },
  rose: { 
    bg: 'bg-rose-500', 
    border: 'border-rose-500', 
    text: 'text-rose-600 dark:text-rose-400', 
    faint: 'bg-rose-500/10 dark:bg-rose-400/10',
    solid: 'bg-rose-500/20 dark:bg-rose-400/30'
  },
};

interface CompactItineraryViewProps {
  items: TravelItem[];
  onEdit: (item: TravelItem, mode: 'edit' | 'duplicate') => void;
}

export const CompactItineraryView = ({ items, onEdit }: CompactItineraryViewProps) => {
  const PIXELS_PER_MINUTE = 1.0;
  const HOUR_HEIGHT = 60 * PIXELS_PER_MINUTE;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
        const updateWidth = () => {
            if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        const observer = new ResizeObserver(updateWidth);
        observer.observe(containerRef.current);
        return () => {
            window.removeEventListener('resize', updateWidth);
            observer.disconnect();
        };
    }
  }, []);

  const timelineData = useMemo(() => {
    if (items.length === 0) return { days: [], totalHeight: 0, startTs: 0, conflicts: [], processedItems: [] };
    
    let minTime = new Date(items[0].start_time).getTime();
    let maxTime = minTime;

    items.forEach(item => {
      const st = new Date(item.start_time).getTime();
      const et = item.end_time ? new Date(item.end_time).getTime() : st + (60 * 60 * 1000);
      if (st < minTime) minTime = st;
      if (et > maxTime) maxTime = et;
    });

    const startDate = new Date(minTime);
    startDate.setHours(0, 0, 0, 0);
    const startTs = startDate.getTime();

    const endDate = new Date(maxTime);
    endDate.setHours(23, 59, 59, 999);
    const endTs = endDate.getTime();

    const totalDays = Math.ceil((endTs - startTs) / (24 * 60 * 60 * 1000));
    const totalHeight = totalDays * 24 * HOUR_HEIGHT;

    const days = [];
    for (let i = 0; i < totalDays; i++) {
        const dayDate = new Date(startTs + i * 24 * 60 * 60 * 1000);
        days.push({ date: dayDate, top: i * 24 * HOUR_HEIGHT });
    }

    const conflicts: any[] = [];
    const processedItems: any[] = [];

    TRACKS.forEach((track, trackIdx) => {
        const trackItems = items
          .filter(it => track.categories.includes(it.type))
          .map(it => ({
             ...it,
             start: new Date(it.start_time).getTime(),
             end: it.end_time ? new Date(it.end_time).getTime() : new Date(it.start_time).getTime() + 3600000
          }))
          .sort((a, b) => a.start - b.start);

        trackItems.forEach((item, idx) => {
            const overlaps = trackItems.slice(0, idx).filter(prev => prev.end > item.start);
            if (overlaps.length > 0) {
                const masterEnd = Math.max(...overlaps.map(o => o.end));
                processedItems.push({
                    ...item,
                    isBranch: true,
                    masterEnd: masterEnd < item.end ? masterEnd : null,
                    itemStart: item.start,
                    itemEnd: item.end
                });
                overlaps.forEach(prev => {
                    conflicts.push({
                        trackIdx,
                        start: Math.max(item.start, prev.start),
                        end: Math.min(item.end, prev.end),
                        color: track.color
                    });
                });
            } else {
                processedItems.push({ ...item, isBranch: false, masterEnd: null, itemStart: item.start, itemEnd: item.end });
            }
        });
    });

    return { days, totalHeight, startTs, conflicts, processedItems };
  }, [items]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 text-muted-foreground/40">
        <Calendar size={36} />
        <p className="text-[11px] font-medium">No items configured.</p>
      </div>
    );
  }

  return (
    <div className="relative pb-32 w-full max-w-[100vw]">
        <div className="sticky top-0 z-[100] bg-background/95 dark:bg-[#020617]/95 backdrop-blur-xl border-b border-border/40 py-4 mb-8 -mx-6 px-6">
            <div className="grid grid-cols-3 w-full max-w-lg mx-auto pl-16">
                {TRACKS.map((track) => {
                    const Icon = TRACK_ICONS[track.id];
                    const theme = THEME_COLORS[track.color];
                    return (
                        <div key={`header-${track.id}`} className="flex flex-col items-center gap-1.5 z-10 w-full justify-center">
                            <div className={cn("w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center shadow-md border-2 border-white dark:border-white/10 bg-white dark:bg-slate-900", theme.border)}>
                                <Icon size={18} className={theme.text} strokeWidth={2.5} />
                            </div>
                            <span className={cn("text-[9px] font-black uppercase tracking-widest", theme.text)}>
                                {track.title}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>

        <div 
            ref={containerRef}
            className="relative bg-white dark:bg-slate-950 rounded-[var(--radius-3xl)] shadow-2xl border border-border/40 overflow-hidden mx-auto max-w-lg" 
            style={{ height: `${timelineData.totalHeight}px` }}
        >
            <div className="absolute inset-0 pointer-events-none opacity-20">
                {Array.from({ length: Math.ceil(timelineData.totalHeight / HOUR_HEIGHT) }).map((_, i) => (
                    <div key={i} className="absolute w-full border-t border-border/10" style={{ top: `${i * HOUR_HEIGHT}px` }} />
                ))}
            </div>

            <div className="absolute inset-0 grid grid-cols-3 pl-16 z-10 w-full h-full">
                {TRACKS.map((track, trackIdx) => {
                    const theme = THEME_COLORS[track.color];
                    const trackConflicts = timelineData.conflicts.filter(c => c.trackIdx === trackIdx);
                    const trackItems = timelineData.processedItems.filter(it => track.categories.includes(it.type));
                    const colWidth = (containerWidth - 64) / 3;
                    const centerX = colWidth / 2;
                    const offsetX = 24;

                    return (
                        <div key={`track-col-${track.id}`} className="relative w-full h-full">
                            <div className={cn("absolute w-2 opacity-10 dark:opacity-20 rounded-full bg-current h-full top-0 left-1/2 -translate-x-1/2", theme.text)} />
                            
                            {trackConflicts.map((conf, ci) => {
                                const cTop = ((conf.start - timelineData.startTs) / 60000) * PIXELS_PER_MINUTE - 15;
                                const cH = ((conf.end - conf.start) / 60000) * PIXELS_PER_MINUTE + 30;
                                return (
                                    <div 
                                        key={`conf-${track.id}-${ci}`}
                                        className={cn("absolute w-[5.5rem] rounded-[var(--radius-xl)] z-0 pointer-events-none left-1/2 -translate-x-1/2", theme.solid)}
                                        style={{ top: `${cTop}px`, height: `${cH}px` }}
                                    />
                                );
                            })}

                            {trackItems.map((item, i) => {
                                const Icon = (item.type === 'otros' && item.custom_icon && ICON_LIST[item.custom_icon])
                                  ? ICON_LIST[item.custom_icon]
                                  : CATEGORY_ICONS[item.type] || Box;
                                const itemTop = ((item.itemStart - timelineData.startTs) / 60000) * PIXELS_PER_MINUTE;
                                const itemHeight = ((item.itemEnd - item.itemStart) / 60000) * PIXELS_PER_MINUTE;
                                const xBase = centerX;
                                const xOffset = centerX + offsetX;

                                return (
                                    <motion.div
                                        key={`item-group-${item.id}`}
                                        className="absolute w-full pointer-events-none"
                                        style={{ top: `${itemTop}px`, height: `${itemHeight}px`, zIndex: 40 + i }}
                                        whileHover="hover"
                                        initial="initial"
                                    >
                                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
                                            <motion.path 
                                                variants={{ 
                                                  initial: { strokeWidth: 8 },
                                                  hover: { strokeWidth: 12 } 
                                                }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                d={item.isBranch ? (
                                                    item.masterEnd && item.masterEnd < item.itemEnd ? (
                                                        `M ${xOffset} 0 L ${xOffset} ${((item.masterEnd - item.itemStart) / 60000) * PIXELS_PER_MINUTE - 4} Q ${xOffset} ${((item.masterEnd - item.itemStart) / 60000) * PIXELS_PER_MINUTE + 12}, ${xBase} ${((item.masterEnd - item.itemStart) / 60000) * PIXELS_PER_MINUTE + 12} L ${xBase} ${itemHeight}`
                                                    ) : (
                                                        `M ${xOffset} 0 L ${xOffset} ${itemHeight}`
                                                    )
                                                ) : (
                                                    `M ${xBase} 0 L ${xBase} ${itemHeight}`
                                                )}
                                                fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" 
                                                className={cn(theme.text.split(' ')[0], "pointer-events-auto cursor-pointer")}
                                                onClick={() => onEdit(item, 'edit')}
                                            />
                                        </svg>

                                        <motion.div 
                                            onClick={() => onEdit(item, 'edit')}
                                            variants={{ initial: { scale: 1 }, hover: { scale: 1.25 } }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className={cn(
                                                "absolute top-0 w-7 h-7 rounded-full border-[2.5px] border-white dark:border-slate-900 shadow-xl flex items-center justify-center bg-white dark:bg-slate-800 z-50 pointer-events-auto cursor-pointer",
                                                theme.border,
                                                item.isBranch ? "left-1/2 translate-x-[11px]" : "left-1/2 -translate-x-[14px]"
                                            )}
                                        >
                                            <Icon size={12} className={theme.text} strokeWidth={3} />
                                            <div className={cn("absolute w-[180px] bg-white dark:bg-slate-900 px-3 py-2 rounded-[var(--radius-md)] border border-border dark:border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none translate-y-2 group-hover:translate-y-0", trackIdx === 2 ? "right-10" : "left-10")}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={cn("text-[8px] font-black uppercase tracking-widest px-1.5 py-[1px] rounded-[var(--radius-sm)]", theme.faint, theme.text)}>{formatTime(new Date(item.itemStart))}</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <h4 className="text-[10px] font-black leading-tight text-foreground line-clamp-2 flex-1">{item.name}</h4>
                                                    {item.attachments && item.attachments.length > 0 && <Paperclip size={10} className="text-primary mt-0.5" strokeWidth={3} />}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};
