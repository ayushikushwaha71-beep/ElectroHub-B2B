'use client';

import * as React from 'react';
import { motion, AnimatePresence, type TargetAndTransition } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────────────────
type DrawerSide = 'left' | 'right' | 'bottom';

export interface DrawerProps {
  open:           boolean;
  onClose:        () => void;
  side?:          DrawerSide;
  title?:         string;
  description?:   string;
  children?:      React.ReactNode;
  footer?:        React.ReactNode;
  className?:     string;
  width?:         string;   // e.g. 'max-w-sm'
  height?:        string;   // for bottom drawer
  closeOnOverlay?: boolean;
  showClose?:     boolean;
}

// ─── Motion variants ───────────────────────────────────────────────────────────
const drawerVariants: Record<DrawerSide, { hidden: TargetAndTransition; visible: TargetAndTransition }> = {
  right:  { hidden: { x: '100%', opacity: 0 }, visible: { x: 0, opacity: 1 } },
  left:   { hidden: { x: '-100%', opacity: 0 }, visible: { x: 0, opacity: 1 } },
  bottom: { hidden: { y: '100%', opacity: 0 }, visible: { y: 0, opacity: 1 } },
};

const sideClasses: Record<DrawerSide, string> = {
  right:  'fixed inset-y-0 right-0 h-full max-w-sm w-full rounded-l-2xl',
  left:   'fixed inset-y-0 left-0 h-full max-w-sm w-full rounded-r-2xl',
  bottom: 'fixed inset-x-0 bottom-0 w-full rounded-t-2xl max-h-[85dvh]',
};

// ─── Component ────────────────────────────────────────────────────────────────
export function Drawer({
  open,
  onClose,
  side          = 'right',
  title,
  description,
  children,
  footer,
  className,
  width,
  closeOnOverlay = true,
  showClose     = true,
}: DrawerProps) {
  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={closeOnOverlay ? onClose : undefined}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer"
            initial={drawerVariants[side].hidden}
            animate={drawerVariants[side].visible}
            exit={drawerVariants[side].hidden}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className={cn(
              'fixed z-50',
              'bg-[var(--background-card)] border-[var(--border)]',
              side === 'right'  && 'border-l',
              side === 'left'   && 'border-r',
              side === 'bottom' && 'border-t',
              'shadow-[var(--shadow-dialog)]',
              'flex flex-col',
              'outline-none',
              sideClasses[side],
              width,
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* Drag handle (bottom drawer) */}
            {side === 'bottom' && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[var(--border-strong)]" />
              </div>
            )}

            {/* Header */}
            {(title || showClose) && (
              <div className={cn(
                'flex items-start justify-between gap-4',
                'px-6 py-5',
                'border-b border-[var(--border)]',
                'shrink-0',
              )}>
                <div className="flex-1 min-w-0">
                  {title && (
                    <h2 className="text-lg font-semibold text-[var(--text)] truncate">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">{description}</p>
                  )}
                </div>
                {showClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                      'text-[var(--text-muted)] hover:text-[var(--text)]',
                      'bg-[var(--background-alt)] hover:bg-[var(--surface-hover)]',
                      'transition-colors',
                    )}
                    aria-label="Close drawer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="shrink-0 border-t border-[var(--border)] px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
