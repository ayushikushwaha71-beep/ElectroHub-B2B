'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, Heart, GitCompare, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ProductImage } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ProductGalleryProps {
  images:      ProductImage[];
  productName: string;
  isWishlisted?: boolean;
  onWishlist?:   () => void;
  onCompare?:    () => void;
  className?:    string;
}

// ─── Zoom Modal ───────────────────────────────────────────────────────────────
function ZoomModal({
  image,
  onClose,
}: {
  image: ProductImage;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Product image zoom"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="relative max-w-3xl max-h-[90vh] w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.url}
          alt={image.alt}
          className="w-full h-full object-contain rounded-2xl"
          style={{ maxHeight: '80vh' }}
        />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
          aria-label="Close zoom"
        >
          <X size={18} />
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ProductGallery({
  images,
  productName,
  isWishlisted = false,
  onWishlist,
  onCompare,
  className,
}: ProductGalleryProps) {
  const [currentIdx, setCurrentIdx]   = React.useState(0);
  const [wishlisted, setWishlisted]   = React.useState(isWishlisted);
  const [compared,   setCompared]     = React.useState(false);
  const [zoomOpen,   setZoomOpen]     = React.useState(false);
  const [direction,  setDirection]    = React.useState(0);

  const safeImages = images.length > 0 ? images : [
    { id: 'placeholder', url: 'https://placehold.co/600x600/1e293b/64748b?text=No+Image', alt: productName, isPrimary: true },
  ];

  const currentImage = safeImages[currentIdx];
  const total        = safeImages.length;

  const navigate = (dir: 1 | -1) => {
    setDirection(dir);
    setCurrentIdx((prev) => (prev + dir + total) % total);
  };

  const handleThumbnail = (idx: number) => {
    setDirection(idx > currentIdx ? 1 : -1);
    setCurrentIdx(idx);
  };

  const handleWishlist = () => {
    setWishlisted((w) => !w);
    onWishlist?.();
  };

  const handleCompare = () => {
    setCompared((c) => !c);
    onCompare?.();
  };

  const imageVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
    }),
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* ── Main Image ──────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-[var(--background-alt)] border border-[var(--border)] aspect-square group">
        {/* Image */}
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentIdx}
            custom={direction}
            variants={imageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
            className="absolute inset-0 p-6 flex items-center justify-center"
          >
            <img
              src={currentImage.url}
              alt={currentImage.alt}
              className="w-full h-full object-contain"
              loading="eager"
            />
          </motion.div>
        </AnimatePresence>

        {/* Zoom trigger */}
        <button
          onClick={() => setZoomOpen(true)}
          className={cn(
            'absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl',
            'bg-[var(--background-card)]/80 backdrop-blur-sm border border-[var(--border)]',
            'text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]',
            'opacity-0 group-hover:opacity-100 transition-all duration-200',
            'cursor-zoom-in',
          )}
          aria-label="Zoom image"
        >
          <ZoomIn size={16} />
        </button>

        {/* Image counter */}
        {total > 1 && (
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-medium">
            {currentIdx + 1} / {total}
          </div>
        )}

        {/* Previous / Next */}
        {total > 1 && (
          <>
            <button
              onClick={() => navigate(-1)}
              className={cn(
                'absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl',
                'bg-[var(--background-card)]/80 backdrop-blur-sm border border-[var(--border)]',
                'text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]',
                'opacity-0 group-hover:opacity-100 transition-all duration-200',
              )}
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => navigate(1)}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl',
                'bg-[var(--background-card)]/80 backdrop-blur-sm border border-[var(--border)]',
                'text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]',
                'opacity-0 group-hover:opacity-100 transition-all duration-200',
              )}
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className={cn(
            'absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl',
            'bg-[var(--background-card)]/80 backdrop-blur-sm border border-[var(--border)]',
            'transition-all duration-200',
            wishlisted
              ? 'text-red-500 border-red-200 bg-red-50 dark:bg-red-950/30'
              : 'text-[var(--text-muted)] hover:text-red-500 hover:border-red-200',
          )}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlisted}
        >
          <motion.div animate={wishlisted ? { scale: [1, 1.35, 1] } : {}} transition={{ duration: 0.3 }}>
            <Heart size={16} className={wishlisted ? 'fill-current' : ''} />
          </motion.div>
        </button>

        {/* Compare */}
        <button
          onClick={handleCompare}
          className={cn(
            'absolute top-14 right-3 flex h-9 w-9 items-center justify-center rounded-xl',
            'bg-[var(--background-card)]/80 backdrop-blur-sm border border-[var(--border)]',
            'transition-all duration-200',
            compared
              ? 'text-[var(--primary)] border-[var(--primary)] bg-blue-50 dark:bg-blue-950/30'
              : 'text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]',
          )}
          aria-label={compared ? 'Remove from compare' : 'Add to compare'}
          aria-pressed={compared}
        >
          <GitCompare size={16} />
        </button>
      </div>

      {/* ── Thumbnail Strip ────────────────────────────────────────────────── */}
      {total > 1 && (
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1" role="group" aria-label="Product image thumbnails">
          {safeImages.map((img, idx) => (
            <motion.button
              key={img.id}
              onClick={() => handleThumbnail(idx)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={cn(
                'relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200',
                'bg-[var(--background-alt)]',
                idx === currentIdx
                  ? 'border-[var(--primary)] shadow-[0_0_0_2px_var(--primary)]/20'
                  : 'border-[var(--border)] hover:border-[var(--border-strong)]',
              )}
              aria-label={`View image ${idx + 1}: ${img.alt}`}
              aria-pressed={idx === currentIdx}
            >
              <img
                src={img.url}
                alt={img.alt}
                className="w-full h-full object-contain p-1.5"
                loading="lazy"
              />
              {idx === currentIdx && (
                <motion.div
                  layoutId="thumb-indicator"
                  className="absolute inset-0 bg-[var(--primary)]/8 rounded-xl"
                />
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Zoom modal */}
      <AnimatePresence>
        {zoomOpen && (
          <ZoomModal image={currentImage} onClose={() => setZoomOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
