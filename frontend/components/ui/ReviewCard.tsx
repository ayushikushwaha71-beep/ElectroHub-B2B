'use client';

import * as React from 'react';
import { Star, ThumbsUp, CheckCircle2, Image as ImageIcon, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Badge } from './Badge';
import type { Review } from '@/types';
import { formatRelativeTime } from '@/utils/format';

// ─── Star Rating Display ───────────────────────────────────────────────────────
function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={cn(
            s <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-[var(--border-strong)] text-[var(--border-strong)]'
          )}
        />
      ))}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, url, size = 40 }: { name: string; url?: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const colors = [
    'bg-blue-500', 'bg-violet-500', 'bg-pink-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-cyan-500', 'bg-red-500', 'bg-indigo-500',
  ];
  const colorIdx = name.charCodeAt(0) % colors.length;

  return (
    <div
      className={cn(
        'rounded-full overflow-hidden shrink-0 flex items-center justify-center',
        !url && colors[colorIdx],
      )}
      style={{ width: size, height: size }}
    >
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <span className="text-white font-semibold" style={{ fontSize: size * 0.35 }}>
          {initials}
        </span>
      )}
    </div>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface ReviewCardProps {
  review:       Review;
  variant?:     'default' | 'compact' | 'featured';
  showProduct?: boolean;
  onHelpful?:   (reviewId: string) => void;
  className?:   string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ReviewCard({
  review,
  variant     = 'default',
  showProduct = false,
  onHelpful,
  className,
}: ReviewCardProps) {
  const [helpfulCount, setHelpfulCount] = React.useState(review.helpful);
  const [hasVoted,     setHasVoted]     = React.useState(false);

  const handleHelpful = () => {
    if (hasVoted) return;
    setHelpfulCount((c) => c + 1);
    setHasVoted(true);
    onHelpful?.(review.id);
  };

  // ── Compact ──────────────────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex gap-3 p-4 rounded-xl',
        'bg-[var(--background-card)] border border-[var(--border)]',
        className
      )}>
        <Avatar name={review.userName} url={review.userAvatar} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">{review.userName}</p>
              <Stars rating={review.rating} size={12} />
            </div>
            <span className="text-xs text-[var(--text-subtle)] shrink-0">
              {formatRelativeTime(review.createdAt)}
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-1.5 line-clamp-2">{review.content}</p>
        </div>
      </div>
    );
  }

  // ── Featured (for hero/spotlight reviews) ────────────────────────────────────
  if (variant === 'featured') {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        className={cn(
          'relative p-6 rounded-2xl overflow-hidden',
          'bg-gradient-to-br from-[var(--surface)] to-[var(--background-alt)]',
          'border border-[var(--border)]',
          'shadow-[var(--shadow-card)]',
          className
        )}
      >
        {/* Quote mark */}
        <div className="absolute top-4 right-5 text-6xl font-serif text-[var(--border)] select-none" aria-hidden="true">
          "
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Avatar name={review.userName} url={review.userAvatar} size={44} />
          <div>
            <p className="font-semibold text-[var(--text)]">{review.userName}</p>
            <div className="flex items-center gap-2">
              <Stars rating={review.rating} size={13} />
              {review.verified && (
                <Badge variant="success" size="xs" icon={<CheckCircle2 size={10} />}>
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        {review.title && (
          <h4 className="text-sm font-semibold text-[var(--text)] mb-2">{review.title}</h4>
        )}

        <p className="text-sm text-[var(--text-muted)] leading-relaxed line-clamp-4">{review.content}</p>

        <p className="text-xs text-[var(--text-subtle)] mt-4">
          {formatRelativeTime(review.createdAt)}
        </p>
      </motion.div>
    );
  }

  // ── Default ───────────────────────────────────────────────────────────────────
  return (
    <div className={cn(
      'flex flex-col gap-4 p-5 rounded-2xl',
      'bg-[var(--background-card)] border border-[var(--border)]',
      'shadow-[var(--shadow-card)]',
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar name={review.userName} url={review.userAvatar} size={42} />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[var(--text)]">{review.userName}</p>
              {review.verified && (
                <Badge variant="success" size="xs" icon={<CheckCircle2 size={10} />}>
                  Verified Purchase
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Stars rating={review.rating} size={13} />
              <span className="text-xs font-medium text-amber-500">{review.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-[var(--text-subtle)]">
            {formatRelativeTime(review.createdAt)}
          </span>
          <button
            className="h-6 w-6 flex items-center justify-center rounded-md text-[var(--text-subtle)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
            aria-label="Review options"
          >
            <MoreVertical size={14} />
          </button>
        </div>
      </div>

      {/* Review title */}
      {review.title && (
        <h4 className="text-sm font-semibold text-[var(--text)]">"{review.title}"</h4>
      )}

      {/* Content */}
      <p className="text-sm text-[var(--text-muted)] leading-relaxed">{review.content}</p>

      {/* Pros/Cons */}
      {(review.pros?.length || review.cons?.length) && (
        <div className="grid grid-cols-2 gap-3">
          {review.pros?.length && (
            <div>
              <p className="text-xs font-semibold text-[var(--success)] mb-1.5">✓ Pros</p>
              <ul className="space-y-1">
                {review.pros.map((pro, i) => (
                  <li key={i} className="text-xs text-[var(--text-muted)] flex gap-1.5">
                    <span className="text-[var(--success)] shrink-0">+</span>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {review.cons?.length && (
            <div>
              <p className="text-xs font-semibold text-[var(--danger)] mb-1.5">✗ Cons</p>
              <ul className="space-y-1">
                {review.cons.map((con, i) => (
                  <li key={i} className="text-xs text-[var(--text-muted)] flex gap-1.5">
                    <span className="text-[var(--danger)] shrink-0">−</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Media */}
      {review.media?.length && (
        <div className="flex gap-2">
          {review.media.slice(0, 5).map((m, i) => (
            <button
              key={i}
              className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--background-alt)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--primary)] transition-colors"
              aria-label={`Review ${m.type} ${i + 1}`}
            >
              {m.type === 'image' ? (
                <img src={m.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <ImageIcon size={20} className="text-[var(--text-subtle)]" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
        <button
          onClick={handleHelpful}
          disabled={hasVoted}
          className={cn(
            'flex items-center gap-1.5 text-xs',
            'transition-colors',
            hasVoted
              ? 'text-[var(--success)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]',
            hasVoted && 'cursor-default',
          )}
        >
          <ThumbsUp size={13} className={hasVoted ? 'fill-current' : ''} />
          <span>Helpful ({helpfulCount})</span>
        </button>
        <span className="text-xs text-[var(--text-subtle)]">
          {new Date(review.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
}

// ─── Rating Summary Bar ────────────────────────────────────────────────────────
export interface RatingSummaryProps {
  average:      number;
  total:        number;
  distribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
  className?:   string;
}

export function RatingSummary({ average, total, distribution, className }: RatingSummaryProps) {
  const maxCount = Math.max(...Object.values(distribution));

  return (
    <div className={cn('flex gap-6 p-5 rounded-2xl bg-[var(--background-card)] border border-[var(--border)]', className)}>
      {/* Average */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <span className="text-5xl font-bold font-display text-[var(--text)]">{average.toFixed(1)}</span>
        <Stars rating={average} size={16} />
        <span className="text-xs text-[var(--text-muted)]">{total.toLocaleString('en-IN')} reviews</span>
      </div>

      {/* Distribution bars */}
      <div className="flex-1 flex flex-col gap-1.5">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const count   = distribution[star];
          const pct     = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const pctOfTotal = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] w-3 shrink-0">{star}</span>
              <Star size={11} className="fill-amber-400 text-amber-400 shrink-0" />
              <div className="flex-1 h-2 rounded-full bg-[var(--background-alt)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-amber-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: (5 - star) * 0.1, ease: [0, 0, 0.2, 1] }}
                />
              </div>
              <span className="text-xs text-[var(--text-subtle)] w-8 text-right shrink-0">{pctOfTotal}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { Stars, Avatar };
