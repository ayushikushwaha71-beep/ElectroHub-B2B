'use client';

import * as React from 'react';
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface BreadcrumbItem {
  label:     string;
  href?:     string;
  icon?:     React.ReactNode;
  current?:  boolean;   // aria-current
}

export interface BreadcrumbProps {
  items:         BreadcrumbItem[];
  /** Show home icon for first item */
  showHome?:     boolean;
  /** Max items before collapsing (0 = no collapse) */
  maxItems?:     number;
  separator?:    React.ReactNode;
  className?:    string;
  itemClass?:    string;
  /** Structured data JSON-LD */
  structuredData?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Breadcrumb({
  items,
  showHome     = false,
  maxItems     = 0,
  separator,
  className,
  itemClass,
  structuredData = true,
}: BreadcrumbProps) {
  const [expanded, setExpanded] = React.useState(false);

  const sep = separator ?? (
    <ChevronRight
      size={14}
      className="text-[var(--text-subtle)] shrink-0"
      aria-hidden="true"
    />
  );

  // Determine displayed items
  let displayedItems = items;
  let collapsed = false;

  if (maxItems > 0 && items.length > maxItems && !expanded) {
    const half = Math.floor(maxItems / 2);
    displayedItems = [
      ...items.slice(0, half),
      { label: '...', href: undefined, current: false },
      ...items.slice(items.length - half),
    ];
    collapsed = true;
  }

  return (
    <>
      {/* JSON-LD structured data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context':        'https://schema.org',
              '@type':           'BreadcrumbList',
              itemListElement: items.map((item, i) => ({
                '@type':   'ListItem',
                position:   i + 1,
                name:       item.label,
                item:       item.href,
              })),
            }),
          }}
        />
      )}

      <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
        <ol
          className="flex flex-wrap items-center gap-1"
          itemScope
          itemType="https://schema.org/BreadcrumbList"
        >
          {displayedItems.map((item, idx) => {
            const isLast     = idx === displayedItems.length - 1;
            const isCollapsed = item.label === '...';

            return (
              <li
                key={idx}
                className="flex items-center gap-1"
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                {/* Separator (not before first item) */}
                {idx > 0 && (
                  <span className="flex items-center" aria-hidden="true">{sep}</span>
                )}

                {/* Collapsed indicator */}
                {isCollapsed ? (
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className={cn(
                      'flex items-center justify-center h-6 w-6 rounded',
                      'text-[var(--text-muted)] hover:text-[var(--text)]',
                      'hover:bg-[var(--surface-hover)]',
                      'transition-colors'
                    )}
                    aria-label="Show all breadcrumbs"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                ) : isLast ? (
                  /* Current page */
                  <span
                    className={cn(
                      'flex items-center gap-1 text-sm font-medium text-[var(--text)]',
                      itemClass
                    )}
                    aria-current="page"
                    itemProp="name"
                  >
                    {idx === 0 && showHome && <Home size={14} aria-hidden="true" />}
                    {item.icon && <span aria-hidden="true">{item.icon}</span>}
                    {item.label}
                  </span>
                ) : item.href ? (
                  /* Linked item */
                  <a
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1 text-sm text-[var(--text-muted)]',
                      'hover:text-[var(--text)] hover:underline underline-offset-2',
                      'transition-colors',
                      itemClass
                    )}
                    itemProp="item"
                  >
                    <span itemProp="name">
                      {idx === 0 && showHome && <Home size={13} className="inline -mt-0.5 mr-0.5" aria-hidden="true" />}
                      {item.icon && <span aria-hidden="true" className="inline mr-0.5">{item.icon}</span>}
                      {item.label}
                    </span>
                  </a>
                ) : (
                  /* Non-linked item */
                  <span
                    className={cn('text-sm text-[var(--text-muted)]', itemClass)}
                    itemProp="name"
                  >
                    {item.label}
                  </span>
                )}

                <meta itemProp="position" content={String(idx + 1)} />
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
