'use client';

import * as React from 'react';
import { Search, X, Loader2, Mic, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface SearchSuggestionItem {
  type:     'product' | 'category' | 'brand' | 'query' | 'recent';
  id?:      string;
  label:    string;
  subLabel?: string;
  imageUrl?: string;
  href?:    string;
}

export interface SearchBarProps {
  value?:           string;
  defaultValue?:    string;
  placeholder?:     string;
  suggestions?:     SearchSuggestionItem[];
  isLoading?:       boolean;
  showVoice?:       boolean;
  autoFocus?:       boolean;
  size?:            'sm' | 'md' | 'lg' | 'xl';
  className?:       string;
  wrapperClass?:    string;
  onChange?:        (value: string) => void;
  onSearch?:        (value: string) => void;
  onClear?:         () => void;
  onSuggestionClick?: (item: SearchSuggestionItem) => void;
  onFocus?:         () => void;
  onBlur?:          () => void;
}

const sizeConfig = {
  sm: { height: 'h-9',  text: 'text-sm',  iconSize: 16, padding: 'pl-9 pr-9'  },
  md: { height: 'h-11', text: 'text-sm',  iconSize: 18, padding: 'pl-11 pr-11' },
  lg: { height: 'h-13', text: 'text-base', iconSize: 20, padding: 'pl-12 pr-12' },
  xl: { height: 'h-16', text: 'text-lg',  iconSize: 22, padding: 'pl-14 pr-14' },
};

// ─── Component ────────────────────────────────────────────────────────────────
export function SearchBar({
  value,
  defaultValue,
  placeholder = 'Search for products, brands, categories...',
  suggestions = [],
  isLoading   = false,
  showVoice   = false,
  autoFocus   = false,
  size        = 'md',
  className,
  wrapperClass,
  onChange,
  onSearch,
  onClear,
  onSuggestionClick,
  onFocus,
  onBlur,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '');
  const [isFocused,     setIsFocused]     = React.useState(false);
  const inputRef  = React.useRef<HTMLInputElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const displayValue = value !== undefined ? value : internalValue;
  const showSuggestions = isFocused && (suggestions.length > 0 || isLoading);
  const cfg = sizeConfig[size];

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalValue(val);
    onChange?.(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && displayValue.trim()) {
      onSearch?.(displayValue.trim());
      setIsFocused(false);
    }
    if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setInternalValue('');
    onChange?.('');
    onClear?.();
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (item: SearchSuggestionItem) => {
    setInternalValue(item.label);
    onChange?.(item.label);
    onSuggestionClick?.(item);
    setIsFocused(false);
  };

  return (
    <div ref={wrapperRef} className={cn('relative w-full', wrapperClass)}>
      {/* Input */}
      <div className={cn(
        'relative flex items-center',
        'bg-[var(--surface)] border border-[var(--border)] rounded-xl',
        'transition-all duration-200',
        isFocused && 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20',
        !isFocused && 'hover:border-[var(--border-strong)]',
      )}>
        {/* Search icon */}
        <span className="absolute left-3.5 text-[var(--text-subtle)] pointer-events-none">
          {isLoading
            ? <Loader2 size={cfg.iconSize} className="animate-spin text-[var(--primary)]" />
            : <Search  size={cfg.iconSize} />
          }
        </span>

        <input
          ref={inputRef}
          type="search"
          value={displayValue}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { setIsFocused(true); onFocus?.(); }}
          onBlur={() => { setTimeout(() => { setIsFocused(false); onBlur?.(); }, 150); }}
          className={cn(
            'w-full bg-transparent outline-none',
            'text-[var(--text)] placeholder:text-[var(--text-subtle)]',
            cfg.height, cfg.text, cfg.padding,
            className
          )}
          aria-label="Search"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />

        {/* Right controls */}
        <div className="absolute right-3 flex items-center gap-1">
          {displayValue && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                'p-1 rounded-md',
                'text-[var(--text-subtle)] hover:text-[var(--text)]',
                'hover:bg-[var(--surface-hover)]',
                'transition-colors'
              )}
              aria-label="Clear search"
            >
              <X size={cfg.iconSize - 2} />
            </button>
          )}
          {showVoice && !displayValue && (
            <button
              type="button"
              className={cn(
                'p-1 rounded-md',
                'text-[var(--text-subtle)] hover:text-[var(--primary)]',
                'hover:bg-[var(--surface-hover)]',
                'transition-colors'
              )}
              aria-label="Voice search"
            >
              <Mic size={cfg.iconSize - 2} />
            </button>
          )}
          {displayValue && (
            <button
              type="button"
              onClick={() => { onSearch?.(displayValue); setIsFocused(false); }}
              className={cn(
                'px-3 h-7 rounded-md',
                'bg-[var(--primary)] text-[var(--primary-fore)]',
                'text-xs font-medium',
                'hover:bg-[var(--primary-hover)]',
                'transition-colors'
              )}
              aria-label="Search"
            >
              Search
            </button>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
            className={cn(
              'absolute top-full left-0 right-0 mt-2 z-50',
              'bg-[var(--surface)] border border-[var(--border)] rounded-xl',
              'shadow-[var(--shadow-dropdown)]',
              'overflow-hidden',
            )}
            role="listbox"
          >
            {isLoading ? (
              <div className="flex items-center gap-2 p-4 text-sm text-[var(--text-muted)]">
                <Loader2 size={16} className="animate-spin" />
                Searching...
              </div>
            ) : (
              <ul className="py-1 max-h-80 overflow-y-auto scrollbar-thin">
                {suggestions.map((item, idx) => (
                  <li key={`${item.type}-${item.id ?? idx}`}>
                    <button
                      type="button"
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5',
                        'text-left text-sm text-[var(--text)]',
                        'hover:bg-[var(--surface-hover)]',
                        'transition-colors',
                      )}
                      onClick={() => handleSuggestionClick(item)}
                      role="option"
                    >
                      {/* Icon / image */}
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.label}
                          className="w-8 h-8 rounded-md object-cover bg-[var(--background-alt)] shrink-0"
                        />
                      ) : (
                        <span className="w-8 h-8 flex items-center justify-center rounded-md bg-[var(--background-alt)] shrink-0">
                          {item.type === 'query' || item.type === 'recent'
                            ? <Search size={14} className="text-[var(--text-subtle)]" />
                            : <ArrowRight size={14} className="text-[var(--text-subtle)]" />
                          }
                        </span>
                      )}

                      {/* Labels */}
                      <span className="flex-1 min-w-0">
                        <span className="block truncate">{item.label}</span>
                        {item.subLabel && (
                          <span className="block text-xs text-[var(--text-muted)] truncate">{item.subLabel}</span>
                        )}
                      </span>

                      {/* Type badge */}
                      <span className="shrink-0 text-xs text-[var(--text-subtle)] capitalize">
                        {item.type === 'recent' ? 'Recent' : item.type}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
