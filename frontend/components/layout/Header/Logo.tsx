'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface LogoProps {
  size?:      'sm' | 'md' | 'lg';
  showText?:  boolean;
  className?: string;
  href?:      string;
}

const sizeConfig = {
  sm: { icon: 16, box: 'w-7 h-7 rounded-lg',   text: 'text-lg'  },
  md: { icon: 20, box: 'w-9 h-9 rounded-xl',   text: 'text-xl'  },
  lg: { icon: 26, box: 'w-12 h-12 rounded-2xl', text: 'text-2xl' },
};

export function Logo({ size = 'md', showText = true, className, href = '/' }: LogoProps) {
  const cfg = sizeConfig[size];

  return (
    <Link
      href={href}
      className={cn('flex items-center gap-2.5 group select-none', className)}
      aria-label="ElectroHub — Home"
    >
      {/* Icon box */}
      <motion.div
        whileHover={{ scale: 1.08, rotate: -6 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={cn(
          cfg.box,
          'flex items-center justify-center shrink-0',
          'bg-gradient-to-br from-blue-600 via-blue-500 to-violet-600',
          'shadow-lg shadow-blue-500/30',
          'group-hover:shadow-blue-500/50 transition-shadow duration-300',
        )}
      >
        <Zap size={cfg.icon} className="text-white" aria-hidden="true" fill="currentColor" />
      </motion.div>

      {/* Wordmark */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              cfg.text,
              'font-bold font-display',
              'bg-gradient-to-r from-blue-600 to-violet-600',
              'dark:from-blue-400 dark:to-violet-400',
              'bg-clip-text text-transparent',
              'tracking-tight',
            )}
          >
            ElectroHub
          </span>
          <span className="text-[9px] font-medium tracking-widest text-[var(--text-subtle)] uppercase mt-0.5 hidden sm:block">
            Electronics Store
          </span>
        </div>
      )}
    </Link>
  );
}
