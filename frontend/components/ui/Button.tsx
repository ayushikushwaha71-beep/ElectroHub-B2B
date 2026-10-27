'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

// ─── CVA Variants ─────────────────────────────────────────────────────────────
const buttonVariants = cva(
  // Base
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium whitespace-nowrap select-none',
    'rounded-lg border border-transparent',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'relative overflow-hidden',
  ],
  {
    variants: {
      variant: {
        // Primary — Electric blue
        primary: [
          'bg-[var(--primary)] text-[var(--primary-fore)]',
          'hover:bg-[var(--primary-hover)]',
          'focus-visible:ring-[var(--ring)]',
          'active:scale-[0.98]',
          'shadow-sm hover:shadow-md',
        ],
        // Secondary — Neutral surface
        secondary: [
          'bg-[var(--surface)] text-[var(--text)]',
          'border-[var(--border)]',
          'hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]',
          'focus-visible:ring-[var(--ring)]',
          'active:scale-[0.98]',
        ],
        // Outline — Transparent with border
        outline: [
          'bg-transparent text-[var(--primary)]',
          'border-[var(--primary)]',
          'hover:bg-[var(--primary)] hover:text-[var(--primary-fore)]',
          'focus-visible:ring-[var(--ring)]',
          'active:scale-[0.98]',
        ],
        // Ghost — Transparent, minimal
        ghost: [
          'bg-transparent text-[var(--text)]',
          'hover:bg-[var(--surface-hover)]',
          'focus-visible:ring-[var(--ring)]',
          'active:scale-[0.98]',
        ],
        // Destructive — Danger red
        destructive: [
          'bg-[var(--danger)] text-white',
          'hover:opacity-90',
          'focus-visible:ring-[var(--danger)]',
          'active:scale-[0.98]',
          'shadow-sm',
        ],
        // Gradient — Primary → Violet
        gradient: [
          'bg-gradient-to-r from-blue-600 to-violet-600',
          'text-white shadow-md',
          'hover:from-blue-500 hover:to-violet-500',
          'hover:shadow-lg hover:shadow-blue-500/25',
          'focus-visible:ring-blue-500',
          'active:scale-[0.98]',
        ],
        // Accent — Amber/Orange
        accent: [
          'bg-[var(--accent)] text-[var(--accent-fore)]',
          'hover:bg-[var(--accent-hover)]',
          'focus-visible:ring-[var(--accent)]',
          'active:scale-[0.98]',
          'shadow-sm hover:shadow-md',
        ],
        // Link style
        link: [
          'bg-transparent text-[var(--primary)]',
          'underline-offset-4 hover:underline',
          'focus-visible:ring-[var(--ring)]',
          'h-auto px-0 py-0',
        ],
      },
      size: {
        xs:   'h-7  px-2.5 text-xs    rounded-md gap-1',
        sm:   'h-8  px-3   text-sm    rounded-md gap-1.5',
        md:   'h-9  px-4   text-sm    rounded-lg',
        lg:   'h-11 px-6   text-base  rounded-lg gap-2.5',
        xl:   'h-13 px-8   text-lg    rounded-xl gap-3',
        icon: 'h-9  w-9    text-sm    rounded-lg p-0',
        'icon-sm': 'h-8 w-8 text-xs  rounded-md p-0',
        'icon-lg': 'h-11 w-11 text-base rounded-lg p-0',
      },
      pill: {
        true:  'rounded-full',
        false: '',
      },
      fullWidth: {
        true:  'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant:   'primary',
      size:      'md',
      pill:      false,
      fullWidth: false,
    },
  }
);

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?:    boolean;
  isLoading?:  boolean;
  loadingText?: string;
  leftIcon?:   React.ReactNode;
  rightIcon?:  React.ReactNode;
  /** Add ripple animation on click */
  ripple?:     boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      pill,
      fullWidth,
      asChild     = false,
      isLoading   = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      onClick,
      ripple = true,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const [ripples, setRipples] = React.useState<{ id: number; x: number; y: number; size: number }[]>([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !disabled && !isLoading) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const size = Math.max(rect.width, rect.height) * 2;
        const id = Date.now();
        setRipples((prev) => [...prev, { id, x, y, size }]);
        setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
      }
      onClick?.(e);
    };

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, pill, fullWidth }), className)}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effects */}
        {ripples.map(({ id, x, y, size }) => (
          <span
            key={id}
            className="absolute rounded-full bg-white/20 pointer-events-none animate-ping"
            style={{
              left:   x - size / 2,
              top:    y - size / 2,
              width:  size,
              height: size,
              animationDuration: '600ms',
              animationIterationCount: 1,
            }}
          />
        ))}

        {/* Loading spinner */}
        {isLoading ? (
          <>
            <Loader2 className="animate-spin shrink-0" size={size === 'xs' || size === 'sm' ? 14 : 16} />
            {loadingText ?? children}
          </>
        ) : (
          <>
            {leftIcon  && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

// ─── Motion Button ────────────────────────────────────────────────────────────
const MotionButton = motion.create(Button);

export { Button, MotionButton, buttonVariants };
