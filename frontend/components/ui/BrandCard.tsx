'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Brand } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface BrandCardProps {
  brand:       Brand;
  variant?:    'default' | 'compact' | 'logo-only' | 'featured';
  onClick?:    (brand: Brand) => void;
  className?:  string;
  showCount?:  boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function BrandCard({
  brand,
  variant   = 'default',
  onClick,
  className,
  showCount = true,
}: BrandCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  // ── Logo-only (minimal, for logo strips) ────────────────────────────────────
  if (variant === 'logo-only') {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onClick?.(brand)}
        className={cn(
          'flex items-center justify-center p-4 rounded-xl',
          'bg-[var(--background-card)] border border-[var(--border)]',
          'hover:border-[var(--primary)]/40 hover:shadow-[var(--shadow-card-hov)]',
          'transition-all duration-200 cursor-pointer',
          'grayscale-[40%] hover:grayscale-0',
          className
        )}
      >
        {brand.logoUrl ? (
          <img
            src={brand.logoUrl}
            alt={brand.name}
            className="h-8 w-auto max-w-[120px] object-contain"
            loading="lazy"
          />
        ) : (
          <span className="text-sm font-bold text-[var(--text-muted)] group-hover:text-[var(--text)]">
            {brand.name}
          </span>
        )}
      </motion.button>
    );
  }

  // ── Compact variant ──────────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <motion.button
        whileHover={{ x: 3 }}
        onClick={() => onClick?.(brand)}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl w-full text-left',
          'bg-[var(--background-card)] border border-[var(--border)]',
          'hover:border-[var(--primary)]/40 hover:shadow-sm',
          'transition-all duration-150 cursor-pointer group',
          className
        )}
      >
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[var(--background-alt)] flex items-center justify-center p-1.5">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain" loading="lazy" />
          ) : (
            <span className="text-xs font-bold text-[var(--text-muted)]">{brand.name.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text)] truncate">{brand.name}</p>
          {showCount && (
            <p className="text-xs text-[var(--text-muted)]">{brand.productCount} products</p>
          )}
        </div>
        {brand.country && (
          <span className="shrink-0 text-xs text-[var(--text-subtle)]">{brand.country}</span>
        )}
      </motion.button>
    );
  }

  // ── Featured variant ─────────────────────────────────────────────────────────
  if (variant === 'featured') {
    return (
      <motion.button
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        onClick={() => onClick?.(brand)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'group relative overflow-hidden rounded-2xl cursor-pointer w-full',
          'bg-[var(--background-card)] border border-[var(--border)]',
          'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hov)]',
          'hover:border-[var(--primary)]/40',
          'transition-all duration-200',
          className
        )}
      >
        {/* Cover image */}
        <div className="relative h-32 bg-[var(--background-alt)] overflow-hidden">
          {brand.coverUrl ? (
            <img
              src={brand.coverUrl}
              alt=""
              className={cn(
                'w-full h-full object-cover transition-transform duration-500',
                isHovered && 'scale-110',
              )}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500/10 to-violet-500/10" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--background-card)] via-transparent to-transparent" />
        </div>

        {/* Logo circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className={cn(
            'w-16 h-16 rounded-2xl',
            'bg-[var(--background-card)] border-2 border-[var(--border)]',
            'flex items-center justify-center p-2',
            'shadow-md transition-transform duration-300',
            isHovered && 'scale-110',
          )}>
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain" loading="lazy" />
            ) : (
              <span className="text-xl font-black text-[var(--text)]">{brand.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="pt-12 pb-5 px-4 text-center">
          <h3 className="text-sm font-bold text-[var(--text)]">{brand.name}</h3>
          {showCount && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{brand.productCount} products</p>
          )}
          {brand.description && (
            <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2">{brand.description}</p>
          )}
          {brand.website && (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 mt-2 text-xs text-[var(--primary)] hover:underline"
            >
              <ExternalLink size={10} /> Website
            </a>
          )}
        </div>
      </motion.button>
    );
  }

  // ── Default variant ───────────────────────────────────────────────────────────
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      onClick={() => onClick?.(brand)}
      className={cn(
        'group flex flex-col items-center gap-3 p-5 rounded-2xl cursor-pointer w-full',
        'bg-[var(--background-card)] border border-[var(--border)]',
        'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hov)]',
        'hover:border-[var(--primary)]/40',
        'transition-all duration-200',
        'grayscale-[30%] hover:grayscale-0',
        className
      )}
    >
      {/* Logo */}
      <div className={cn(
        'h-12 w-full flex items-center justify-center',
        'transition-transform duration-300 group-hover:scale-110',
      )}>
        {brand.logoUrl ? (
          <img
            src={brand.logoUrl}
            alt={brand.name}
            className="h-full max-w-[140px] object-contain"
            loading="lazy"
          />
        ) : (
          <span className="text-2xl font-black text-[var(--text)]">
            {brand.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="text-center">
        <p className="text-sm font-semibold text-[var(--text)]">{brand.name}</p>
        {showCount && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{brand.productCount} products</p>
        )}
      </div>
    </motion.button>
  );
}
