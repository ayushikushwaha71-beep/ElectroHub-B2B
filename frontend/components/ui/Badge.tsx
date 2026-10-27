'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

// ─── CVA Variants ─────────────────────────────────────────────────────────────
const badgeVariants = cva(
  [
    'inline-flex items-center gap-1 font-medium',
    'border transition-colors',
    'select-none',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--surface)] text-[var(--text-muted)]',
          'border-[var(--border)]',
        ],
        primary: [
          'bg-blue-500/10 text-blue-600 dark:text-blue-400',
          'border-blue-500/20',
        ],
        success: [
          'bg-[var(--success-bg)] text-[var(--success)]',
          'border-[var(--success)]/20',
        ],
        warning: [
          'bg-[var(--warning-bg)] text-[var(--warning)]',
          'border-[var(--warning)]/20',
        ],
        danger: [
          'bg-[var(--danger-bg)] text-[var(--danger)]',
          'border-[var(--danger)]/20',
        ],
        info: [
          'bg-sky-500/10 text-sky-600 dark:text-sky-400',
          'border-sky-500/20',
        ],
        outline: [
          'bg-transparent text-[var(--text)]',
          'border-[var(--border-strong)]',
        ],
        // Special product badges
        premium: [
          'bg-gradient-to-r from-yellow-400/20 to-orange-500/20',
          'text-yellow-600 dark:text-yellow-400',
          'border-yellow-500/30',
        ],
        new: [
          'bg-gradient-to-r from-blue-500 to-violet-500',
          'text-white',
          'border-transparent',
        ],
        sale: [
          'bg-gradient-to-r from-red-500 to-pink-500',
          'text-white',
          'border-transparent',
        ],
        bestseller: [
          'bg-gradient-to-r from-orange-400 to-amber-400',
          'text-white',
          'border-transparent',
        ],
        electric: [
          'bg-gradient-to-r from-cyan-400 to-blue-500',
          'text-white',
          'border-transparent',
        ],
      },
      size: {
        xs:  'px-1.5 py-0.5 text-[10px] rounded-sm',
        sm:  'px-2   py-0.5 text-xs    rounded-md',
        md:  'px-2.5 py-1   text-xs    rounded-md',
        lg:  'px-3   py-1   text-sm    rounded-lg',
      },
      pill: {
        true:  'rounded-full',
        false: '',
      },
      dot: {
        true:  '',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'md',
      pill:    true,
      dot:     false,
    },
  }
);

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?:         React.ReactNode;
  removable?:    boolean;
  onRemove?:     () => void;
  pulse?:        boolean;  // Animated dot
}

// ─── Component ────────────────────────────────────────────────────────────────
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      pill,
      dot,
      icon,
      removable,
      onRemove,
      pulse,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, pill, dot }), className)}
        {...props}
      >
        {/* Pulse dot */}
        {(dot || pulse) && (
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            {pulse && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-75 animate-ping" />
            )}
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
          </span>
        )}

        {/* Icon */}
        {icon && <span className="shrink-0">{icon}</span>}

        {/* Content */}
        {children}

        {/* Remove button */}
        {removable && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
            className="shrink-0 ml-0.5 -mr-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5 transition-colors"
            aria-label="Remove"
          >
            <X size={10} />
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
