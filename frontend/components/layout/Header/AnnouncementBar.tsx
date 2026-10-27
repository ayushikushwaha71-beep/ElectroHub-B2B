'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/utils/cn';
import { ANNOUNCEMENTS, type Announcement } from '@/lib/data/navigation';

interface AnnouncementBarProps {
  className?: string;
}

export function AnnouncementBar({ className }: AnnouncementBarProps) {
  const [dismissed,   setDismissed]   = useState(false);
  const [current,     setCurrent]     = useState(0);
  const [direction,   setDirection]   = useState(1);

  // Auto-rotate
  useEffect(() => {
    if (dismissed || ANNOUNCEMENTS.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % ANNOUNCEMENTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [dismissed]);

  const handlePrev = () => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length);
  };
  const handleNext = () => {
    setDirection(1);
    setCurrent((c) => (c + 1) % ANNOUNCEMENTS.length);
  };

  if (dismissed) return null;

  const item = ANNOUNCEMENTS[current];

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        'bg-gradient-to-r from-blue-600 via-violet-600 to-blue-700',
        'dark:from-blue-800 dark:via-violet-800 dark:to-blue-900',
        className
      )}
      role="banner"
      aria-label="Announcements"
    >
      {/* Animated noise texture */}
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIxIi8+PC9zdmc+')]" />

      <div className="relative container-fluid flex items-center justify-between py-2 gap-4">
        {/* Prev (desktop) */}
        <button
          onClick={handlePrev}
          className="hidden sm:flex items-center justify-center h-5 w-5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors shrink-0"
          aria-label="Previous announcement"
        >
          <ChevronRight size={12} className="rotate-180" />
        </button>

        {/* Message */}
        <div className="flex-1 overflow-hidden text-center">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={item.id}
              custom={direction}
              initial={{ opacity: 0, y: direction > 0 ? 10 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: direction > 0 ? -10 : 10 }}
              transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
              className="flex items-center justify-center gap-2"
            >
              {item.emoji && (
                <span className="text-sm" aria-hidden="true">{item.emoji}</span>
              )}
              <span className="text-xs sm:text-sm font-medium text-white">
                {item.text}
              </span>
              {item.link && (
                <Link
                  href={item.link}
                  className="hidden sm:inline-flex items-center gap-0.5 text-xs font-semibold text-white/80 hover:text-white underline underline-offset-2 transition-colors"
                >
                  Shop Now <ChevronRight size={11} />
                </Link>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right side: indicators + next + dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Dot indicators */}
          {ANNOUNCEMENTS.length > 1 && (
            <div className="hidden sm:flex items-center gap-1">
              {ANNOUNCEMENTS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { setDirection(idx > current ? 1 : -1); setCurrent(idx); }}
                  className={cn(
                    'rounded-full transition-all duration-200',
                    idx === current
                      ? 'w-4 h-1.5 bg-white'
                      : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60',
                  )}
                  aria-label={`Go to announcement ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Next */}
          <button
            onClick={handleNext}
            className="hidden sm:flex items-center justify-center h-5 w-5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            aria-label="Next announcement"
          >
            <ChevronRight size={12} />
          </button>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="flex items-center justify-center h-5 w-5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            aria-label="Dismiss announcements"
          >
            <X size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
