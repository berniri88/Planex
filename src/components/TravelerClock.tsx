import { useEffect, useState } from 'react';
import { Clock, Globe, Zap, ArrowRight, Home } from 'lucide-react';
import { getTravelerClockInfo, type TimezoneInfo } from '../lib/timezone';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface TravelerClockProps {
  dateString: string;
  timezone: string;
  variant?: 'compact' | 'detailed';
}

export const TravelerClock = ({ dateString, timezone, variant = 'detailed' }: TravelerClockProps) => {
  const [info, setInfo] = useState<TimezoneInfo | null>(null);

  useEffect(() => {
    const update = () => {
      setInfo(getTravelerClockInfo(dateString, timezone));
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [dateString, timezone]);

  if (!info) return null;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        <Clock size={12} className="text-primary" />
        <span>{info.localTime} • {info.delta}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Main Badge: Destination Time */}
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-xl border border-primary/20">
          <Globe size={14} className="animate-pulse" />
          <span className="text-xs font-black tracking-tight">{info.localTime}</span>
          <span className="text-[10px] opacity-60 font-bold">{info.abbreviation}</span>
        </div>

        {/* Delta: How long until event */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-colors duration-500",
          info.isNow ? "bg-green-500/10 text-green-600 border border-green-500/20" :
          info.isPast ? "bg-gray-100 text-gray-500" :
          "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20"
        )}>
          {info.isNow && <Zap size={14} className="fill-green-600" />}
          {info.delta}
        </div>
      </div>

      {/* Comparison: Relative to Home Time */}
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2 text-muted-foreground/60 text-[11px] font-bold group"
      >
        <div className="w-5 h-5 flex items-center justify-center bg-white/5 rounded-full border border-white/10 group-hover:text-primary transition-colors">
          <Home size={10} />
        </div>
        <span>{info.homeTime} Home Time</span>
        <div className="flex items-center gap-1 opacity-40">
          <ArrowRight size={10} />
          <span>{info.offsetDiffHours > 0 ? `+${info.offsetDiffHours}` : info.offsetDiffHours}h shift</span>
        </div>
      </motion.div>
    </div>
  );
};
