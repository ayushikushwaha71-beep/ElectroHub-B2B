'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Category } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface CategoryCardProps {
  category:    Category;
  variant?:    'default' | 'compact' | 'icon' | 'featured';
  onClick?:    (category: Category) => void;
  className?:  string;
  showCount?:  boolean;
  showArrow?:  boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function CategoryCard({
  category,
  variant   = 'default',
  onClick,
  className,
  showCount = true,
  showArrow = true,
}: CategoryCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  // ── Icon variant (small chip-like card) ─────────────────────────────────────
  if (variant === 'icon') {
    return (
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onClick?.(category)}
        className={cn(
          'flex flex-col items-center gap-2 p-4 rounded-2xl',
          'bg-[var(--background-card)] border border-[var(--border)]',
          'hover:border-[var(--primary)] hover:shadow-[var(--shadow-card-hov)]',
          'transition-all duration-200 cursor-pointer text-center',
          className
        )}
        style={category.featuredColor ? { '--card-color': category.featuredColor } as React.CSSProperties : undefined}
      >
        {/* Icon or Image */}
        <div className={cn(
          'w-14 h-14 rounded-xl flex items-center justify-center',
          'bg-[var(--background-alt)]',
          isHovered && 'scale-110',
          'transition-transform duration-200',
        )}
          style={category.featuredColor ? { backgroundColor: `${category.featuredColor}20` } : undefined}
        >
          {category.imageUrl ? (
            <img
              src={category.imageUrl}
              alt={category.name}
              className="w-8 h-8 object-contain"
              loading="lazy"
            />
          ) : (
            <Zap size={24} style={category.featuredColor ? { color: category.featuredColor } : undefined} className="text-[var(--primary)]" />
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--text)] leading-snug">{category.name}</p>
          {showCount && (
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{category.productCount} items</p>
          )}
        </div>
      </motion.button>
    );
  }

  // ── Compact variant ──────────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <motion.button
        whileHover={{ x: 4 }}
        onClick={() => onClick?.(category)}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl w-full text-left',
          'bg-[var(--background-card)] border border-[var(--border)]',
          'hover:border-[var(--primary)] hover:bg-[var(--surface-hover)]',
          'transition-all duration-150 cursor-pointer group',
          className
        )}
      >
        {/* Thumbnail */}
        <div className={cn(
          'w-10 h-10 rounded-lg overflow-hidden shrink-0',
          'bg-[var(--background-alt)]',
        )}>
          {category.imageUrl ? (
            <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Zap size={18} className="text-[var(--primary)]" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text)] truncate">{category.name}</p>
          {showCount && (
            <p className="text-xs text-[var(--text-muted)]">{category.productCount} products</p>
          )}
        </div>

        {showArrow && (
          <ArrowRight
            size={15}
            className="shrink-0 text-[var(--text-subtle)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all"
          />
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
        onClick={() => onClick?.(category)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'group relative overflow-hidden rounded-2xl cursor-pointer',
          'aspect-[4/3] w-full',
          'border border-[var(--border)]',
          'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hov)]',
          className
        )}
      >
        {/* Background image */}
        {category.imageUrl && (
          <img
            src={category.imageUrl}
            alt={category.name}
            className={cn(
              'absolute inset-0 w-full h-full object-cover',
              'transition-transform duration-500',
              isHovered && 'scale-110',
            )}
            loading="lazy"
          />
        )}

        {/* Gradient overlay */}
        <div className={cn(
          'absolute inset-0',
          'bg-gradient-to-t from-black/80 via-black/30 to-transparent',
        )} />

        {/* Color tint overlay */}
        {category.featuredColor && (
          <div
            className="absolute inset-0 opacity-20"
            style={{ backgroundColor: category.featuredColor }}
          />
        )}

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {category.name}
              </h3>
              {showCount && (
                <p className="text-xs text-white/70 mt-0.5">
                  {category.productCount} products
                </p>
              )}
            </div>
            <motion.div
              animate={{ x: isHovered ? 0 : 8, opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                'bg-white/20 backdrop-blur-sm',
                'text-white',
              )}
            >
              <ArrowRight size={15} />
            </motion.div>
          </div>
        </div>

        {/* Color accent stripe */}
        {category.featuredColor && (
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ backgroundColor: category.featuredColor }}
          />
        )}
      </motion.button>
    );
  }

  // ── Default variant ───────────────────────────────────────────────────────────
  return (
    <motion.button
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      onClick={() => onClick?.(category)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl cursor-pointer w-full',
        'bg-[var(--background-card)] border border-[var(--border)]',
        'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hov)]',
        'hover:border-[var(--primary)]/40',
        'transition-all duration-200',
        className
      )}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-[var(--background-alt)] aspect-[4/3]">
        {category.imageUrl ? (
          <img
            src={category.imageUrl}
            alt={category.name}
            className={cn(
              'w-full h-full object-cover transition-transform duration-500',
              isHovered && 'scale-110',
            )}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={category.featuredColor ? { backgroundColor: `${category.featuredColor}15` } : undefined}
          >
            <Zap size={40}
              style={category.featuredColor ? { color: category.featuredColor } : undefined}
              className="text-[var(--primary)] opacity-60"
            />
          </div>
        )}

        {/* Color accent */}
        {category.featuredColor && (
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundColor: category.featuredColor }}
          />
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--text)] truncate">{category.name}</h3>
          {showCount && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {category.productCount.toLocaleString('en-IN')} products
            </p>
          )}
        </div>
        <motion.div
          animate={{ x: isHovered ? 2 : 0 }}
          className="shrink-0 text-[var(--text-subtle)] group-hover:text-[var(--primary)] transition-colors"
        >
          <ArrowRight size={16} />
        </motion.div>
      </div>

      {/* Bottom color stripe */}
      {category.featuredColor && (
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60"
          style={{ backgroundColor: category.featuredColor }}
        />
      )}
    </motion.button>
  );
}
