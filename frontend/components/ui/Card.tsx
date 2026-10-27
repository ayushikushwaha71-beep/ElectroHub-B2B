'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

// ─── CVA Variants ─────────────────────────────────────────────────────────────
const cardVariants = cva(
  [
    'relative rounded-xl',
    'transition-all duration-200 ease-out',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--background-card)] border border-[var(--border)]',
          'shadow-[var(--shadow-card)]',
        ],
        elevated: [
          'bg-[var(--background-card)]',
          'shadow-[var(--shadow-md)]',
          'hover:shadow-[var(--shadow-card-hov)]',
        ],
        bordered: [
          'bg-[var(--background-card)]',
          'border-2 border-[var(--border)]',
          'hover:border-[var(--primary)]',
        ],
        glass: [
          'glass',
          'border border-[var(--glass-border)]',
        ],
        gradient: [
          'bg-gradient-to-br from-[var(--surface)] to-[var(--background-alt)]',
          'border border-[var(--border)]',
        ],
        ghost: [
          'bg-transparent border border-transparent',
          'hover:bg-[var(--surface-hover)] hover:border-[var(--border)]',
        ],
        flat: [
          'bg-[var(--background-alt)] border border-transparent',
        ],
      },
      padding: {
        none: '',
        sm:   'p-4',
        md:   'p-6',
        lg:   'p-8',
        xl:   'p-10',
      },
      rounded: {
        md:   'rounded-md',
        lg:   'rounded-lg',
        xl:   'rounded-xl',
        '2xl':'rounded-2xl',
        '3xl':'rounded-3xl',
      },
      interactive: {
        true: [
          'cursor-pointer',
          'hover:shadow-[var(--shadow-card-hov)]',
          'hover:-translate-y-0.5',
          'active:translate-y-0 active:shadow-[var(--shadow-card)]',
        ],
        false: '',
      },
    },
    defaultVariants: {
      variant:     'default',
      padding:     'md',
      rounded:     'xl',
      interactive: false,
    },
  }
);

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, rounded, interactive, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, rounded, interactive }), className)}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = 'Card';

// ─── Card Header ──────────────────────────────────────────────────────────────
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1.5 pb-4', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

// ─── Card Title ───────────────────────────────────────────────────────────────
const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-[var(--text)] leading-tight', className)}
      {...props}
    >
      {children}
    </h3>
  )
);
CardTitle.displayName = 'CardTitle';

// ─── Card Description ─────────────────────────────────────────────────────────
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-[var(--text-muted)]', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

// ─── Card Body ────────────────────────────────────────────────────────────────
const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex-1', className)} {...props} />
  )
);
CardBody.displayName = 'CardBody';

// ─── Card Footer ──────────────────────────────────────────────────────────────
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4 border-t border-[var(--border)]', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

// ─── Card Image ───────────────────────────────────────────────────────────────
interface CardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
  objectFit?:   'cover' | 'contain' | 'fill';
}

function CardImage({
  className,
  alt = '',
  aspectRatio = 'landscape',
  objectFit   = 'cover',
  ...props
}: CardImageProps) {
  const aspectMap = {
    square:    'aspect-square',
    video:     'aspect-video',
    portrait:  'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  };

  const fitMap = { cover: 'object-cover', contain: 'object-contain', fill: 'object-fill' };

  return (
    <div className={cn('overflow-hidden', aspectMap[aspectRatio], className)}>
      <img
        alt={alt}
        className={cn('w-full h-full transition-transform duration-300 group-hover:scale-105', fitMap[objectFit])}
        {...props}
      />
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
export interface StatCardProps {
  label:      string;
  value:      string | number;
  change?:    number;       // Percentage
  trend?:     'up' | 'down' | 'neutral';
  icon?:      React.ReactNode;
  iconClass?: string;
  className?: string;
  prefix?:    string;
  suffix?:    string;
}

function StatCard({ label, value, change, trend = 'neutral', icon, iconClass, className, prefix, suffix }: StatCardProps) {
  const trendColor = trend === 'up' ? 'text-[var(--success)]' : trend === 'down' ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]';
  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <Card className={cn('group', className)}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
          <p className="text-2xl font-bold font-display text-[var(--text)]">
            {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}{suffix}
          </p>
          {change !== undefined && (
            <p className={cn('text-xs font-medium flex items-center gap-1', trendColor)}>
              <span>{trendArrow}</span>
              <span>{Math.abs(change)}% vs last period</span>
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl',
            'bg-[var(--background-alt)] group-hover:scale-110 transition-transform',
            iconClass
          )}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardFooter,
  CardImage,
  StatCard,
  cardVariants,
};
