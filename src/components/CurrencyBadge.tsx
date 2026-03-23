import { CURRENCIES, formatMoney } from '../lib/currency';
import { cn } from '../lib/utils';

interface CurrencyBadgeProps {
  amount: number;
  currency: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showCode?: boolean;
}

export const CurrencyBadge = ({ 
  amount, 
  currency, 
  className, 
  size = 'md',
  showCode = false 
}: CurrencyBadgeProps) => {
  const info = CURRENCIES[currency];
  
  const sizes = {
    sm: 'text-[10px] gap-1 px-2 py-0.5',
    md: 'text-xs gap-1.5 px-3 py-1',
    lg: 'text-lg gap-2 px-4 py-2',
  };

  return (
    <div className={cn(
      "inline-flex items-center glass rounded-full font-black tracking-tight border-white/20",
      sizes[size],
      className
    )}>
      {info?.flag && <span className="opacity-80 grayscale-[0.5] group-hover:grayscale-0 transition-all">{info.flag}</span>}
      <span className={cn(size === 'lg' ? "text-foreground" : "text-foreground/80")}>
        {formatMoney(amount, currency, { showCode })}
      </span>
    </div>
  );
};
