'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill';
  size?:    'sm' | 'md' | 'lg';
  className?: string;
}

export function ThemeToggle({ variant = 'icon', size = 'md', className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          'rounded-lg bg-[var(--surface)] border border-[var(--border)] animate-pulse-soft',
          size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9',
          className
        )}
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === 'dark';

  // ── Pill variant (system / light / dark cycle) ──────────────────────────────
  if (variant === 'pill') {
    const options = [
      { value: 'light',  icon: Sun,     label: 'Light'  },
      { value: 'system', icon: Monitor, label: 'System' },
      { value: 'dark',   icon: Moon,    label: 'Dark'   },
    ] as const;

    return (
      <div
        className={cn(
          'flex items-center gap-0.5 p-0.5 rounded-xl',
          'bg-[var(--background-alt)] border border-[var(--border)]',
          className
        )}
        role="radiogroup"
        aria-label="Theme selection"
      >
        {options.map(({ value, icon: Icon, label }) => {
          const isActive = theme === value;
          return (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                'relative flex items-center justify-center rounded-lg transition-all duration-200',
                size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-9 w-9' : 'h-7 w-7',
                isActive
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]',
              )}
              aria-label={`Set ${label} theme`}
              aria-pressed={isActive}
              role="radio"
              aria-checked={isActive}
            >
              {isActive && (
                <motion.div
                  layoutId="theme-pill-active"
                  className="absolute inset-0 rounded-lg bg-[var(--background-card)] shadow-sm border border-[var(--border)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14}
                className="relative z-10"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    );
  }

  // ── Icon variant (simple toggle) ─────────────────────────────────────────────
  const sizeMap = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-11 w-11' };
  const iconSize = { sm: 15, md: 17, lg: 20 }[size];

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'relative flex items-center justify-center rounded-lg overflow-hidden',
        'bg-[var(--surface)] border border-[var(--border)]',
        'text-[var(--text-muted)] hover:text-[var(--text)]',
        'hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        sizeMap[size],
        className
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
          >
            <Sun size={iconSize} className="text-amber-400" aria-hidden="true" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
          >
            <Moon size={iconSize} className="text-blue-400" aria-hidden="true" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
