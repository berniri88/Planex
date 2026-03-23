import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

type MotionConflicts = 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'style';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, MotionConflicts> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', onClick, type = 'button', ...props }, ref) => {
    
    // Mock Haptic implementation for Capacitor/Native feel
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      onClick?.(e);
    };

    const variants = {
      primary: 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 active:brightness-90',
      secondary: 'bg-secondary text-foreground border border-border hover:brightness-95 active:brightness-90 transition-colors',
      ghost: 'hover:bg-secondary text-muted-foreground hover:text-foreground',
      destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20',
      glass: 'bg-background/80 backdrop-blur-2xl border border-border text-foreground hover:bg-secondary transition-all shadow-none',
    };

    const sizes = {
      sm: 'h-9 px-4 text-xs tracking-tight',
      md: 'h-12 px-6 text-sm font-semibold',
      lg: 'h-14 px-10 text-base font-bold',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        onClick={handleClick}
        type={type}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
