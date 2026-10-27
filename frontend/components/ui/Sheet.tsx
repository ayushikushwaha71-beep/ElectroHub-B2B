'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

// ─── Re-use Dialog primitives for portal/overlay ──────────────────────────────
const Sheet         = DialogPrimitive.Root;
const SheetTrigger  = DialogPrimitive.Trigger;
const SheetClose    = DialogPrimitive.Close;
const SheetPortal   = DialogPrimitive.Portal;

// ─── Overlay ──────────────────────────────────────────────────────────────────
const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
      'data-[state=open]:animate-fade-in',
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = 'SheetOverlay';

// ─── Content ──────────────────────────────────────────────────────────────────
type SheetSide = 'top' | 'right' | 'bottom' | 'left';

const sideVariants: Record<SheetSide, string> = {
  top:    [
    'inset-x-0 top-0 border-b border-[var(--border)]',
    'data-[state=open]:animate-slide-down',
    'rounded-b-2xl',
  ].join(' '),
  right:  [
    'inset-y-0 right-0 h-full border-l border-[var(--border)]',
    'w-full max-w-sm sm:max-w-md',
    'data-[state=open]:animate-slide-up',
    'rounded-l-2xl',
  ].join(' '),
  bottom: [
    'inset-x-0 bottom-0 border-t border-[var(--border)]',
    'data-[state=open]:animate-slide-up',
    'rounded-t-2xl',
  ].join(' '),
  left:   [
    'inset-y-0 left-0 h-full border-r border-[var(--border)]',
    'w-full max-w-sm sm:max-w-md',
    'data-[state=open]:animate-slide-up',
    'rounded-r-2xl',
  ].join(' '),
};

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?:      SheetSide;
  showClose?: boolean;
}

const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, showClose = true, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50',
        'bg-[var(--background-card)]',
        'shadow-[var(--shadow-dialog)]',
        'outline-none',
        'overflow-y-auto',
        sideVariants[side],
        className
      )}
      {...props}
    >
      {children}
      {showClose && (
        <SheetClose
          className={cn(
            'absolute right-4 top-4 z-10',
            'flex h-7 w-7 items-center justify-center rounded-lg',
            'text-[var(--text-muted)] hover:text-[var(--text)]',
            'bg-[var(--background-alt)] hover:bg-[var(--surface-hover)]',
            'transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
          )}
          aria-label="Close sheet"
        >
          <X size={14} />
        </SheetClose>
      )}
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = 'SheetContent';

// ─── Header ───────────────────────────────────────────────────────────────────
function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-1 px-6 pt-6 pb-4', className)} {...props} />
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2',
        'px-6 pb-6 pt-4 border-t border-[var(--border)]',
        className
      )}
      {...props}
    />
  );
}

// ─── Body ─────────────────────────────────────────────────────────────────────
function SheetBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-2 flex-1', className)} {...props} />;
}

// ─── Title ────────────────────────────────────────────────────────────────────
const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-[var(--text)]', className)}
    {...props}
  />
));
SheetTitle.displayName = 'SheetTitle';

// ─── Description ──────────────────────────────────────────────────────────────
const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-[var(--text-muted)]', className)}
    {...props}
  />
));
SheetDescription.displayName = 'SheetDescription';

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetBody,
  SheetTitle,
  SheetDescription,
};
