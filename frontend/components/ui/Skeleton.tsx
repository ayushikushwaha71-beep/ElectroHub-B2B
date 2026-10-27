'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface SkeletonBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Override width (Tailwind class or CSS value) */
  width?:    string;
  /** Override height (Tailwind class or CSS value) */
  height?:   string;
  /** Border radius variant */
  rounded?:  'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Pulse or wave shimmer animation */
  animation?: 'shimmer' | 'pulse' | 'none';
}

// ─── Base Skeleton ────────────────────────────────────────────────────────────
const Skeleton = React.forwardRef<HTMLDivElement, SkeletonBaseProps>(
  (
    {
      className,
      width,
      height,
      rounded = 'lg',
      animation = 'shimmer',
      style,
      ...props
    },
    ref
  ) => {
    const roundedMap: Record<string, string> = {
      none: 'rounded-none',
      sm:   'rounded-sm',
      md:   'rounded-md',
      lg:   'rounded-lg',
      xl:   'rounded-xl',
      '2xl':'rounded-2xl',
      full: 'rounded-full',
    };

    const animMap: Record<string, string> = {
      shimmer: 'skeleton',
      pulse:   'bg-[var(--skeleton)] animate-pulse-soft',
      none:    'bg-[var(--skeleton)]',
    };

    return (
      <div
        ref={ref}
        className={cn(roundedMap[rounded], animMap[animation], className)}
        style={{ width, height, ...style }}
        aria-hidden="true"
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

// ─── Skeleton Text ─────────────────────────────────────────────────────────────
interface SkeletonTextProps extends SkeletonBaseProps {
  lines?: number;
  /** Last line shorter? */
  lastLineFraction?: number;
}

function SkeletonText({
  lines = 3,
  lastLineFraction = 0.65,
  className,
  ...props
}: SkeletonTextProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="16px"
          className={i === lines - 1 ? undefined : 'w-full'}
          style={i === lines - 1 ? { width: `${lastLineFraction * 100}%` } : undefined}
          {...props}
        />
      ))}
    </div>
  );
}

// ─── Skeleton Avatar ───────────────────────────────────────────────────────────
interface SkeletonAvatarProps extends SkeletonBaseProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

function SkeletonAvatar({ size = 'md', ...props }: SkeletonAvatarProps) {
  const sizeMap = { sm: '32px', md: '40px', lg: '48px', xl: '64px' };
  const s = sizeMap[size];
  return <Skeleton width={s} height={s} rounded="full" {...props} />;
}

// ─── Product Card Skeleton ─────────────────────────────────────────────────────
function SkeletonProductCard({ className }: { className?: string }) {
  return (
    <div className={cn(
      'rounded-xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden',
      className
    )}>
      {/* Image */}
      <Skeleton height="240px" rounded="none" />
      {/* Body */}
      <div className="p-4 flex flex-col gap-3">
        {/* Brand */}
        <Skeleton height="12px" width="60px" rounded="full" />
        {/* Name */}
        <SkeletonText lines={2} />
        {/* Rating */}
        <div className="flex items-center gap-2">
          <Skeleton height="16px" width="80px" rounded="md" />
          <Skeleton height="12px" width="48px" rounded="full" />
        </div>
        {/* Price row */}
        <div className="flex items-center gap-2">
          <Skeleton height="24px" width="80px" rounded="md" />
          <Skeleton height="16px" width="60px" rounded="md" />
          <Skeleton height="20px" width="48px" rounded="full" />
        </div>
        {/* Button */}
        <Skeleton height="36px" rounded="lg" />
      </div>
    </div>
  );
}

// ─── Category Card Skeleton ────────────────────────────────────────────────────
function SkeletonCategoryCard({ className }: { className?: string }) {
  return (
    <div className={cn(
      'rounded-xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden',
      className
    )}>
      <Skeleton height="160px" rounded="none" />
      <div className="p-3 flex flex-col gap-2">
        <Skeleton height="16px" width="70%" rounded="md" />
        <Skeleton height="12px" width="40%" rounded="md" />
      </div>
    </div>
  );
}

// ─── Review Card Skeleton ──────────────────────────────────────────────────────
function SkeletonReviewCard({ className }: { className?: string }) {
  return (
    <div className={cn(
      'rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4 flex flex-col gap-3',
      className
    )}>
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="md" />
        <div className="flex flex-col gap-1.5 flex-1">
          <Skeleton height="14px" width="120px" rounded="md" />
          <Skeleton height="12px" width="80px" rounded="md" />
        </div>
      </div>
      <Skeleton height="14px" width="100px" rounded="md" />
      <SkeletonText lines={3} />
    </div>
  );
}

// ─── Page Skeleton ─────────────────────────────────────────────────────────────
function SkeletonPage({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-8 p-6', className)}>
      <Skeleton height="48px" width="60%" rounded="xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonProductCard key={i} />
        ))}
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonProductCard,
  SkeletonCategoryCard,
  SkeletonReviewCard,
  SkeletonPage,
};
