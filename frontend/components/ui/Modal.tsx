'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface ModalAction {
  label:     string;
  onClick?:  () => void;
  variant?:  'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  isLoading?: boolean;
  disabled?: boolean;
}

export interface ModalProps {
  open:           boolean;
  onClose:        () => void;
  title?:         string;
  description?:   string;
  children?:      React.ReactNode;
  actions?:       ModalAction[];
  size?:          'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?:     boolean;
  closeOnOverlay?: boolean;
  className?:     string;
  /** Scroll behavior: 'inside' keeps header/footer fixed; 'outside' scrolls the whole modal */
  scroll?:        'inside' | 'outside';
}

const sizeConfig = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-2xl',
  full: 'max-w-[95vw]',
};

// ─── Component ────────────────────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  actions       = [],
  size          = 'md',
  showClose     = true,
  closeOnOverlay = true,
  className,
  scroll        = 'inside',
}: ModalProps) {
  // Prevent body scroll
  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else       document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Escape to close
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeOnOverlay ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            key="modal-content"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className={cn(
              'relative z-10 w-full flex flex-col',
              sizeConfig[size],
              scroll === 'outside' ? 'max-h-full' : 'max-h-[90dvh]',
              'bg-[var(--background-card)] border border-[var(--border)]',
              'rounded-2xl shadow-[var(--shadow-dialog)]',
              className
            )}
          >
            {/* Header */}
            {(title || showClose) && (
              <div className={cn(
                'flex items-start justify-between gap-4',
                'px-6 py-5 shrink-0',
                (children || actions.length > 0) && 'border-b border-[var(--border)]',
              )}>
                <div className="flex-1 min-w-0">
                  {title && (
                    <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
                  )}
                  {description && (
                    <p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>
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
                    aria-label="Close modal"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            {children && (
              <div className={cn(
                'flex-1 px-6 py-4',
                scroll === 'inside' && 'overflow-y-auto scrollbar-thin',
              )}>
                {children}
              </div>
            )}

            {/* Footer actions */}
            {actions.length > 0 && (
              <div className={cn(
                'shrink-0 px-6 py-4',
                'border-t border-[var(--border)]',
                'flex flex-col-reverse sm:flex-row sm:justify-end gap-2',
              )}>
                {actions.map((action, i) => (
                  <Button
                    key={i}
                    variant={action.variant ?? (i === actions.length - 1 ? 'primary' : 'secondary')}
                    isLoading={action.isLoading}
                    disabled={action.disabled}
                    onClick={action.onClick}
                    size="md"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
