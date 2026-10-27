'use client';

/**
 * ElectroHub — RFQ Entry Button
 * Self-contained trigger that opens the RFQFormModal.
 * Accepts an optional product prop for pre-filling the form on a product page.
 * Renders nothing beyond a styled Button + the modal portal — no layout changes.
 */

import * as React from 'react';
import { FileText } from 'lucide-react';
import { Button }   from '@/components/ui/Button';
import { RFQFormModal } from '@/components/quotations/RFQFormModal';
import type { Product } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RFQEntryButtonProps {
  /** When provided, the modal is pre-filled with the product's details */
  product?:    Product;
  /** Pre-fill quantity (defaults to 1) */
  quantity?:   number;
  /** Pass-through className for the wrapping button */
  className?:  string;
  /** Override button label */
  label?:      string;
  /** Button variant (default: secondary) */
  variant?:    'primary' | 'secondary' | 'outline' | 'ghost';
  /** Button size */
  size?:       'sm' | 'md' | 'lg';
}

// ─── Component ────────────────────────────────────────────────────────────────
export function RFQEntryButton({
  product,
  quantity  = 1,
  className,
  label     = 'Request a Quote',
  variant   = 'secondary',
  size      = 'lg',
}: RFQEntryButtonProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        id="rfq-entry-btn"
        variant={variant}
        size={size}
        fullWidth
        className={className}
        leftIcon={<FileText size={size === 'sm' ? 14 : 16} />}
        onClick={() => setOpen(true)}
        aria-label="Open Request a Quote form"
      >
        {label}
      </Button>

      <RFQFormModal
        open={open}
        onClose={() => setOpen(false)}
        prefillProductId={product?.id}
        prefillProductName={product?.name}
        prefillQuantity={quantity}
      />
    </>
  );
}
