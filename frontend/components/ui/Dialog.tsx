'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

// ─── Root primitives ───────────────────────────────────────────────────────────
const Dialog         = DialogPrimitive.Root;
const DialogTrigger  = DialogPrimitive.Trigger;
const DialogPortal   = DialogPrimitive.Portal;
const DialogClose    = DialogPrimitive.Close;

// ─── Overlay ──────────────────────────────────────────────────────────────────
const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50',
      'bg-black/60 backdrop-blur-sm',
      'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-in',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// ─── Content ──────────────────────────────────────────────────────────────────
interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  showClose?:      boolean;
  size?:           'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-2xl',
  full: 'max-w-[95vw] max-h-[95vh]',
};

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, showClose = true, size = 'md', ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50',
        '-translate-x-1/2 -translate-y-1/2',
        'w-full',
        sizeClasses[size],
        'bg-[var(--background-card)] border border-[var(--border)]',
        'rounded-2xl shadow-[var(--shadow-dialog)]',
        'outline-none',
        'data-[state=open]:animate-scale-in',
        'overflow-y-auto max-h-[90vh]',
        className
      )}
      {...props}
    >
      {children}
      {showClose && (
        <DialogPrimitive.Close
          className={cn(
            'absolute right-4 top-4 z-10',
            'flex h-7 w-7 items-center justify-center rounded-lg',
            'text-[var(--text-muted)] hover:text-[var(--text)]',
            'bg-[var(--background-alt)] hover:bg-[var(--surface-hover)]',
            'transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
          )}
          aria-label="Close dialog"
        >
          <X size={14} />
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

// ─── Header ───────────────────────────────────────────────────────────────────
function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-1.5 px-6 pt-6 pb-4', className)}
      {...props}
    />
  );
}
DialogHeader.displayName = 'DialogHeader';

// ─── Footer ───────────────────────────────────────────────────────────────────
function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
        'px-6 pb-6 pt-4',
        'border-t border-[var(--border)]',
        className
      )}
      {...props}
    />
  );
}
DialogFooter.displayName = 'DialogFooter';

// ─── Body ─────────────────────────────────────────────────────────────────────
function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-2', className)} {...props} />;
}

// ─── Title ────────────────────────────────────────────────────────────────────
const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-[var(--text)]', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

// ─── Description ──────────────────────────────────────────────────────────────
const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-[var(--text-muted)]', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// ─── Separator ────────────────────────────────────────────────────────────────
function DialogSeparator({ className }: { className?: string }) {
  return <div className={cn('h-px bg-[var(--border)] mx-6', className)} />;
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogBody,
  DialogTitle,
  DialogDescription,
  DialogSeparator,
};
