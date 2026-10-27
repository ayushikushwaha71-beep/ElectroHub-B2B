'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  PackageSearch,
  ShoppingCart,
  Heart,
  Search,
  Inbox,
  WifiOff,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

// ─── Types ─────────────────────────────────────────────────────────────────────
export type EmptyStatePreset =
  | 'no-results'
  | 'empty-cart'
  | 'empty-wishlist'
  | 'no-orders'
  | 'no-notifications'
  | 'offline'
  | 'error'
  | 'custom';

export interface EmptyStateAction {
  label:    string;
  onClick?: () => void;
  href?:    string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export interface EmptyStateProps {
  preset?:      EmptyStatePreset;
  icon?:        LucideIcon;
  illustration?: React.ReactNode;
  title?:       string;
  description?: string;
  actions?:     EmptyStateAction[];
  className?:   string;
  size?:        'sm' | 'md' | 'lg';
  /** Animate entrance */
  animate?:     boolean;
}

// ─── Preset Config ─────────────────────────────────────────────────────────────
const presets: Record<
  Exclude<EmptyStatePreset, 'custom'>,
  { icon: LucideIcon; title: string; description: string; iconClass: string }
> = {
  'no-results': {
    icon:        PackageSearch,
    iconClass:   'text-blue-400',
    title:       'No products found',
    description: 'Try adjusting your search or filters to find what you\'re looking for.',
  },
  'empty-cart': {
    icon:        ShoppingCart,
    iconClass:   'text-amber-400',
    title:       'Your cart is empty',
    description: 'Looks like you haven\'t added anything yet. Start exploring our electronics collection!',
  },
  'empty-wishlist': {
    icon:        Heart,
    iconClass:   'text-pink-400',
    title:       'Your wishlist is empty',
    description: 'Save your favorite products here by clicking the heart icon on any product.',
  },
  'no-orders': {
    icon:        Inbox,
    iconClass:   'text-violet-400',
    title:       'No orders yet',
    description: 'You haven\'t placed any orders. Start shopping to see your orders here.',
  },
  'no-notifications': {
    icon:        Inbox,
    iconClass:   'text-slate-400',
    title:       'No notifications',
    description: 'You\'re all caught up! We\'ll notify you when something important happens.',
  },
  offline: {
    icon:        WifiOff,
    iconClass:   'text-slate-400',
    title:       'You\'re offline',
    description: 'Please check your internet connection and try again.',
  },
  error: {
    icon:        AlertTriangle,
    iconClass:   'text-red-400',
    title:       'Something went wrong',
    description: 'We\'re having trouble loading this content. Please try again.',
  },
};

// ─── Animated Circuit Background ──────────────────────────────────────────────
function CircuitDots({ className }: { className?: string }) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden opacity-5 pointer-events-none', className)}>
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-current"
          style={{
            width:  `${40 + i * 20}px`,
            height: `${40 + i * 20}px`,
            left:   '50%',
            top:    '50%',
            x:      `-${(40 + i * 20) / 2}px`,
            y:      `-${(40 + i * 20) / 2}px`,
          }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360, opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function EmptyState({
  preset    = 'no-results',
  icon,
  illustration,
  title,
  description,
  actions   = [],
  className,
  size      = 'md',
  animate   = true,
}: EmptyStateProps) {
  const config = preset !== 'custom' ? presets[preset] : null;

  const IconComp = icon ?? config?.icon ?? Search;
  const displayTitle = title ?? config?.title ?? 'Nothing here';
  const displayDesc  = description ?? config?.description ?? '';
  const iconClass    = config?.iconClass ?? 'text-[var(--text-subtle)]';

  const sizeConfig = {
    sm: { wrap: 'py-8',   iconBox: 'w-14 h-14', iconSize: 28, textGap: 'gap-1', actionsGap: 'gap-2' },
    md: { wrap: 'py-16',  iconBox: 'w-20 h-20', iconSize: 36, textGap: 'gap-2', actionsGap: 'gap-3' },
    lg: { wrap: 'py-24',  iconBox: 'w-28 h-28', iconSize: 48, textGap: 'gap-3', actionsGap: 'gap-3' },
  }[size];

  const content = (
    <div className={cn('flex flex-col items-center text-center', sizeConfig.wrap, className)}>
      {/* Icon / Illustration */}
      {illustration ?? (
        <div className={cn(
          'relative flex items-center justify-center rounded-2xl mb-6',
          'bg-[var(--background-alt)]',
          sizeConfig.iconBox,
        )}>
          <CircuitDots />
          <motion.div
            animate={animate ? { y: [0, -4, 0] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <IconComp size={sizeConfig.iconSize} className={iconClass} />
          </motion.div>
        </div>
      )}

      {/* Text */}
      <div className={cn('flex flex-col items-center', sizeConfig.textGap)}>
        <h3 className={cn(
          'font-semibold text-[var(--text)]',
          size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl'
        )}>
          {displayTitle}
        </h3>
        {displayDesc && (
          <p className={cn(
            'text-[var(--text-muted)] max-w-sm',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}>
            {displayDesc}
          </p>
        )}
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className={cn('flex flex-wrap items-center justify-center mt-6', sizeConfig.actionsGap)}>
          {actions.map((action, i) => (
            <Button
              key={i}
              variant={action.variant ?? (i === 0 ? 'primary' : 'secondary')}
              size="md"
              onClick={action.onClick}
              asChild={!!action.href}
            >
              {action.href ? <a href={action.href}>{action.label}</a> : action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
    >
      {content}
    </motion.div>
  );
}
