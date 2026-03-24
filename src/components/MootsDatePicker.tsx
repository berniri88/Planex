import { useState } from 'react';
import { ChevronLeft, ChevronRight, Keyboard } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface MootsTimePickerProps {
  startDate: string;
  endDate: string;
  onSave: (start: string, end: string) => void;
  onCancel: () => void;
}

const CircularClock = ({ value, mode, onChange, onInteractionEnd }: { value: number, mode: 'hours' | 'minutes', onChange: (val: number) => void, onInteractionEnd?: () => void }) => {
  const isHours = mode === 'hours';
  const [isDragging, setIsDragging] = useState(false);
  
  const hoursInner = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const hoursOuter = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const getPos = (val: number, isInner: boolean) => {
    let index = 0;
    if (isHours) {
        index = isInner ? hoursInner.indexOf(val) : hoursOuter.indexOf(val);
    } else {
        index = val / 5;
    }
    const angle = (index * 30 - 90) * (Math.PI / 180);
    const radius = isInner ? 28 : 42;
    return {
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
      angle: isHours 
        ? (isInner ? hoursInner.indexOf(val) : hoursOuter.indexOf(val)) * 30
        : val * 6
    };
  };

  const handleInteraction = (clientX: number, clientY: number, container: HTMLElement) => {
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    
    const dist = Math.sqrt(x*x + y*y);
    const isInner = isHours && dist < rect.width * 0.35;

    if (isHours) {
        let step = Math.round(angle / 30) % 12;
        onChange(isInner ? hoursInner[step] : hoursOuter[step]);
    } else {
        onChange(Math.round(angle / 6) % 60);
    }
  };

  const isSelectedInner = isHours && hoursInner.includes(value);
  const currentPos = getPos(value, isSelectedInner);

  return (
    <div 
        className="relative w-80 h-80 bg-secondary/30 rounded-full mx-auto mt-8 touch-none select-none border border-white/5"
        onMouseDown={(e) => {
            setIsDragging(true);
            handleInteraction(e.clientX, e.clientY, e.currentTarget);
        }}
        onMouseMove={(e) => {
            if (isDragging) handleInteraction(e.clientX, e.clientY, e.currentTarget);
        }}
        onMouseUp={() => {
            setIsDragging(false);
            onInteractionEnd?.();
        }}
        onMouseLeave={() => {
            if (isDragging) {
                setIsDragging(false);
                onInteractionEnd?.();
            }
        }}
        onTouchStart={(e) => {
            setIsDragging(true);
            handleInteraction(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
        }}
        onTouchMove={(e) => {
            if (isDragging) handleInteraction(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
        }}
        onTouchEnd={() => {
            setIsDragging(false);
            onInteractionEnd?.();
        }}
    >
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 z-20" />

        {/* Selection Hand */}
        <div 
            className="absolute left-1/2 bg-primary z-10 transition-all duration-300 pointer-events-none"
            style={{ 
                height: `${isSelectedInner ? 28 : 42}%`, 
                width: '1px',
                bottom: '50%',
                transformOrigin: 'bottom center',
                transform: `translateX(-50%) rotate(${currentPos.angle}deg)`
            }}
        >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-full shadow-2xl ring-4 ring-primary/20 scale-100 transition-transform hover:scale-110">
            </div>
        </div>

        {/* Hour Numbers */}
        {isHours ? (
            <>
                {hoursOuter.map((n) => {
                    const pos = getPos(n, false);
                    return (
                        <div key={`out-${n}`} className={cn("absolute -translate-x-1/2 -translate-y-1/2 text-sm font-bold transition-all z-20 pointer-events-none", value === n ? "text-white scale-125" : "text-muted-foreground/60")} style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                            {n.toString().padStart(2, '0')}
                        </div>
                    );
                })}
                {hoursInner.map((n) => {
                    const pos = getPos(n, true);
                    return (
                        <div key={`in-${n}`} className={cn("absolute -translate-x-1/2 -translate-y-1/2 text-[11px] font-medium transition-all z-20 pointer-events-none", value === n ? "text-white scale-125" : "text-muted-foreground/30")} style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                            {n.toString().padStart(2, '0')}
                        </div>
                    );
                })}
            </>
        ) : (
            minutes.map((n) => {
                const pos = getPos(n, false);
                return (
                    <div key={n} className={cn("absolute -translate-x-1/2 -translate-y-1/2 text-sm font-bold transition-all z-20 pointer-events-none", value === n ? "text-white scale-125" : "text-muted-foreground/60")} style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                        {n.toString().padStart(2, '0')}
                    </div>
                );
            })
        )}
    </div>
  );
};

export const MootsTimePicker = ({ startDate, endDate, onSave, onCancel }: MootsTimePickerProps) => {
  const [internalStart, setInternalStart] = useState(() => {
    const d = startDate ? new Date(startDate) : new Date();
    if (!startDate) { d.setHours(0, 0, 0, 0); }
    return d.toISOString();
  });

  const [internalEnd, setInternalEnd] = useState(() => {
    const d = endDate ? new Date(endDate) : new Date();
    if (!endDate) { d.setHours(0, 0, 0, 0); }
    return d.toISOString();
  });

  const [activeTab, setActiveTab] = useState<'start' | 'end'>('start');
  const [viewMode, setViewMode] = useState<'calendar' | 'clock'>('calendar');
  const [clockPart, setClockPart] = useState<'hours' | 'minutes'>('hours');
  
  const [baseMonth, setBaseMonth] = useState(() => new Date(internalStart));

  const getMonthDays = (base: Date, offset: number) => {
    const date = new Date(base.getFullYear(), base.getMonth() + offset, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
    return { days, year, month, label: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase() };
  };

  const months = [getMonthDays(baseMonth, 0), getMonthDays(baseMonth, 1)];

  const handleDateClick = (date: Date) => {
    if (activeTab === 'start') {
        const current = new Date(internalStart);
        date.setHours(current.getHours(), current.getMinutes());
        setInternalStart(date.toISOString());
        setActiveTab('end');
    } else {
        const current = new Date(internalEnd);
        date.setHours(current.getHours(), current.getMinutes());
        setInternalEnd(date.toISOString());
    }
  };

  const handleTimeUpdate = (val: number) => {
      const target = activeTab === 'start' ? internalStart : internalEnd;
      const d = new Date(target);
      if (clockPart === 'hours') {
          d.setHours(val);
      } else {
          d.setMinutes(val);
      }
      
      if (activeTab === 'start') setInternalStart(d.toISOString());
      else setInternalEnd(d.toISOString());
  };

  const isSelected = (date: Date | null) => {
      if (!date) return false;
      return date.toDateString() === new Date(internalStart).toDateString() || 
             date.toDateString() === new Date(internalEnd).toDateString();
  };

  const isRange = (date: Date | null) => {
      if (!date) return false;
      const d = date.getTime();
      const s = new Date(internalStart).setHours(0,0,0,0);
      const e = new Date(internalEnd).setHours(0,0,0,0);
      return d > s && d < e;
  };

  const currentTimes = {
      start: new Date(internalStart),
      end: new Date(internalEnd)
  };

  return (
    <div className="flex flex-col h-full bg-background max-h-[90vh]">
      {/* Cards Header */}
      <div className="flex bg-primary/5 p-4 gap-4 border-b border-border">
          <button 
            type="button"
            onClick={() => { setActiveTab('start'); setViewMode('calendar'); }}
            className={cn(
                "flex-1 p-6 rounded-[2rem] border-2 transition-all text-left",
                activeTab === 'start' ? "bg-background border-primary shadow-xl" : "bg-transparent border-transparent opacity-60"
            )}
          >
              <h4 className="text-xl font-black italic tracking-tighter mb-4">Inicio</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                {currentTimes.start.toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setViewMode('clock'); setClockPart('hours'); setActiveTab('start'); }}
                className="text-4xl font-black tracking-tighter hover:text-primary transition-colors mt-2"
              >
                {currentTimes.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </button>
          </button>

          <button 
            type="button"
            onClick={() => { setActiveTab('end'); setViewMode('calendar'); }}
            className={cn(
                "flex-1 p-6 rounded-[2rem] border-2 transition-all text-left",
                activeTab === 'end' ? "bg-background border-primary shadow-xl" : "bg-transparent border-transparent opacity-60"
            )}
          >
              <h4 className="text-xl font-black italic tracking-tighter mb-4">Fin</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                {currentTimes.end.toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setViewMode('clock'); setClockPart('hours'); setActiveTab('end'); }}
                className="text-4xl font-black tracking-tighter hover:text-primary transition-colors mt-2"
              >
                {currentTimes.end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </button>
          </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 bg-card">
        <AnimatePresence mode="wait">
            {viewMode === 'calendar' ? (
                <motion.div 
                    key="calendar"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-12"
                >
                    <div className="flex items-center justify-between px-4">
                        <Button type="button" variant="ghost" onClick={() => setBaseMonth(new Date(baseMonth.getFullYear(), baseMonth.getMonth() - 1))} className="w-10 h-10 p-0 rounded-2xl bg-secondary">
                            <ChevronLeft size={20} />
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setBaseMonth(new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1))} className="w-10 h-10 p-0 rounded-2xl bg-secondary">
                            <ChevronRight size={20} />
                        </Button>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-16 px-4">
                        {months.map((m, mi) => (
                            <div key={mi} className="flex-1 space-y-8">
                                <h3 className="text-lg font-black tracking-widest text-center">{m.label}</h3>
                                <div className="grid grid-cols-7 gap-y-1">
                                    {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(d => ( // Spanish weekdays
                                        <div key={d} className="text-[10px] font-black uppercase text-muted-foreground/40 text-center py-2">{d}</div>
                                    ))}
                                    {m.days.map((date, di) => (
                                        <div key={di} className="relative aspect-square flex items-center justify-center">
                                            {date && isRange(date) && (
                                                <div className="absolute inset-x-0 h-10 bg-primary/10" />
                                            )}
                                            {date && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDateClick(date)}
                                                    className={cn(
                                                        "relative z-10 w-10 h-10 rounded-xl text-sm font-black transition-all",
                                                        isSelected(date) ? "bg-primary text-white shadow-lg scale-110" : "hover:bg-secondary",
                                                        date.toDateString() === new Date().toDateString() && !isSelected(date) && "text-primary border border-primary/20"
                                                    )}
                                                >
                                                    {date.getDate()}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            ) : (
                <motion.div 
                    key="clock"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center justify-center h-full max-w-sm mx-auto"
                >
                    <div className="bg-secondary/40 p-12 rounded-[3.5rem] w-full border border-border/50">
                        <div className="flex items-center justify-center gap-4 mb-4">
                             <button type="button" onClick={() => setClockPart('hours')} className={cn("text-6xl font-black transition-all", clockPart === 'hours' ? "text-primary" : "opacity-20 text-foreground")}>
                                {currentTimes[activeTab].getHours().toString().padStart(2, '0')}
                             </button>
                             <span className="text-6xl font-black opacity-10">:</span>
                             <button type="button" onClick={() => setClockPart('minutes')} className={cn("text-6xl font-black transition-all", clockPart === 'minutes' ? "text-primary" : "opacity-20 text-foreground")}>
                                {currentTimes[activeTab].getMinutes().toString().padStart(2, '0')}
                             </button>
                        </div>
                        
                        <CircularClock 
                            mode={clockPart} 
                            value={clockPart === 'hours' ? currentTimes[activeTab].getHours() : currentTimes[activeTab].getMinutes()} 
                            onChange={handleTimeUpdate} 
                            onInteractionEnd={() => {
                                if (clockPart === 'hours') setClockPart('minutes');
                            }}
                        />

                        <div className="mt-12 flex justify-between items-center text-muted-foreground">
                             <Button type="button" variant="ghost" size="sm" className="rounded-xl"><Keyboard size={20} /></Button>
                             <div className="flex gap-4">
                                <button type="button" onClick={() => setViewMode('calendar')} className="text-sm font-black uppercase tracking-widest hover:text-primary">CANCELAR</button>
                                <button type="button" onClick={() => setViewMode('calendar')} className="text-sm font-black uppercase tracking-widest text-primary">OK</button>
                             </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-border flex items-center justify-between bg-card">
          <Button type="button" variant="ghost" onClick={onCancel} className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-muted-foreground">
            CANCELAR
          </Button>
          <Button type="button" onClick={() => onSave(internalStart, internalEnd)} className="h-14 px-12 rounded-2xl font-black uppercase tracking-widest shadow-xl">
            LISTO
          </Button>
      </div>
    </div>
  );
};
