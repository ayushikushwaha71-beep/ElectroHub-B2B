'use client';

import * as React from 'react';
import { Loader2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

// ─── Spinner ───────────────────────────────────────────────────────────────────
interface SpinnerProps {
  size?:      'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?:     string;
}

const sizeMap = { xs: 14, sm: 18, md: 24, lg: 32, xl: 48 };

export function Spinner({ size = 'md', className, label = 'Loading...' }: SpinnerProps) {
  return (
    <span className={cn('inline-flex items-center justify-center', className)} aria-label={label}>
      <Loader2
        size={sizeMap[size]}
        className="animate-spin text-[var(--primary)]"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

// ─── Dots Loader ───────────────────────────────────────────────────────────────
interface DotsProps {
  size?:      'sm' | 'md' | 'lg';
  className?: string;
  label?:     string;
}

export function DotsLoader({ size = 'md', className, label = 'Loading...' }: DotsProps) {
  const dotSize = { sm: 'w-1.5 h-1.5', md: 'w-2 h-2', lg: 'w-3 h-3' }[size];

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      role="status"
      aria-label={label}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={cn(dotSize, 'rounded-full bg-[var(--primary)]')}
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 0.6,
            delay: i * 0.12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">{label}</span>
    </span>
  );
}

// ─── Pulse Ring ────────────────────────────────────────────────────────────────
export function PulseRing({ className }: { className?: string }) {
  return (
    <span className={cn('relative flex h-3 w-3', className)}>
      <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75 animate-ping" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--primary)]" />
    </span>
  );
}

// ─── Full-Page Loading ─────────────────────────────────────────────────────────
interface FullPageLoadingProps {
  message?: string;
  showLogo?: boolean;
}

export function FullPageLoading({ message = 'Loading...', showLogo = true }: FullPageLoadingProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--background)]"
      role="status"
      aria-label={message}
    >
      {showLogo && (
        <motion.div
          className="mb-8 flex items-center gap-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold font-display text-gradient-primary">
            ElectroHub
          </span>
        </motion.div>
      )}

      <div className="flex flex-col items-center gap-4">
        {/* Loading bar */}
        <div className="w-48 h-1 bg-[var(--skeleton)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <p className="text-sm text-[var(--text-muted)]">{message}</p>
      </div>

      <span className="sr-only">{message}</span>
    </div>
  );
}

// ─── Inline Loading State ──────────────────────────────────────────────────────
interface InlineLoadingProps {
  message?: string;
  size?:    'sm' | 'md' | 'lg';
  className?: string;
}

export function InlineLoading({ message = 'Loading...', size = 'md', className }: InlineLoadingProps) {
  return (
    <div
      className={cn('flex items-center justify-center gap-3 py-12', className)}
      role="status"
    >
      <DotsLoader size={size} />
      <span className={cn(
        'text-[var(--text-muted)]',
        size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
      )}>
        {message}
      </span>
    </div>
  );
}

// ─── Button Spinner (for use inside buttons) ───────────────────────────────────
export function ButtonSpinner({ size = 16, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={cn('animate-spin shrink-0', className)} aria-hidden="true" />;
}
