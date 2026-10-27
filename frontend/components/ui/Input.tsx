'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Eye, EyeOff, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/utils/cn';

// ─── CVA Variants ─────────────────────────────────────────────────────────────
const inputVariants = cva(
  // Base
  [
    'w-full font-[family-name:var(--font-sans)]',
    'text-[var(--text)] placeholder:text-[var(--text-subtle)]',
    'bg-[var(--surface)] border border-[var(--border)]',
    'rounded-lg outline-none',
    'transition-all duration-200 ease-out',
    'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'read-only:opacity-70 read-only:cursor-default',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--surface)] border-[var(--border)]',
          'hover:border-[var(--border-strong)]',
        ],
        filled: [
          'bg-[var(--background-alt)] border-transparent',
          'hover:bg-[var(--surface-hover)]',
          'focus:bg-[var(--surface)] focus:border-[var(--primary)]',
        ],
        ghost: [
          'bg-transparent border-transparent',
          'hover:bg-[var(--surface-hover)]',
          'focus:bg-[var(--surface)] focus:border-[var(--border)]',
        ],
      },
      size: {
        sm:  'h-8  px-3 text-sm',
        md:  'h-10 px-4 text-sm',
        lg:  'h-12 px-4 text-base',
        xl:  'h-14 px-5 text-base',
      },
      state: {
        default: '',
        error:   'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20',
        success: 'border-[var(--success)] focus:border-[var(--success)] focus:ring-[var(--success)]/20',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'md',
      state:   'default',
    },
  }
);

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?:       string;
  hint?:        string;
  error?:       string;
  success?:     string;
  leftIcon?:    React.ReactNode;
  rightIcon?:   React.ReactNode;
  clearable?:   boolean;
  onClear?:     () => void;
  /** Wrapper className */
  wrapperClass?: string;
  labelClass?:   string;
  /** Show character count */
  showCount?:    boolean;
  maxLength?:    number;
  required?:     boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      state,
      label,
      hint,
      error,
      success,
      leftIcon,
      rightIcon,
      clearable,
      onClear,
      wrapperClass,
      labelClass,
      showCount,
      maxLength,
      type = 'text',
      value,
      onChange,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(value ?? '');
    const inputId = id ?? React.useId();

    // Determine computed state
    const computedState = error ? 'error' : success ? 'success' : state ?? 'default';

    // Password toggle
    const isPassword = type === 'password';
    const inputType  = isPassword ? (showPassword ? 'text' : 'password') : type;

    const hasLeftIcon  = !!leftIcon;
    const hasRightContent = isPassword || clearable || !!rightIcon || !!error || !!success;

    const charCount = typeof value === 'string' ? value.length : String(internalValue).length;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      onChange?.(e);
    };

    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClass)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium text-[var(--text)]',
              labelClass
            )}
          >
            {label}
            {required && <span className="text-[var(--danger)] ml-0.5">*</span>}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative flex items-center">
          {/* Left icon */}
          {hasLeftIcon && (
            <span className="absolute left-3 flex items-center text-[var(--text-subtle)] pointer-events-none z-10">
              {leftIcon}
            </span>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            value={value}
            maxLength={maxLength}
            onChange={handleChange}
            className={cn(
              inputVariants({ variant, size, state: computedState }),
              hasLeftIcon        && 'pl-10',
              hasRightContent    && 'pr-10',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={
              error   ? `${inputId}-error`   :
              success ? `${inputId}-success`  :
              hint    ? `${inputId}-hint`     :
              undefined
            }
            required={required}
            {...props}
          />

          {/* Right content */}
          <div className="absolute right-3 flex items-center gap-1.5 z-10">
            {/* State icons */}
            {error   && <AlertCircle  size={16} className="text-[var(--danger)]  shrink-0" />}
            {success && !error && <CheckCircle2 size={16} className="text-[var(--success)] shrink-0" />}

            {/* Clear button */}
            {clearable && (value || internalValue) && (
              <button
                type="button"
                onClick={onClear}
                className="text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors"
                aria-label="Clear input"
                tabIndex={-1}
              >
                <X size={14} />
              </button>
            )}

            {/* Password toggle */}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}

            {/* Custom right icon */}
            {!isPassword && rightIcon && (
              <span className="text-[var(--text-subtle)]">{rightIcon}</span>
            )}
          </div>
        </div>

        {/* Hint / Error / Success messages */}
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-[var(--danger)] flex items-center gap-1">
            <AlertCircle size={12} /> {error}
          </p>
        )}
        {success && !error && (
          <p id={`${inputId}-success`} className="text-xs text-[var(--success)] flex items-center gap-1">
            <CheckCircle2 size={12} /> {success}
          </p>
        )}
        {hint && !error && !success && (
          <p id={`${inputId}-hint`} className="text-xs text-[var(--text-muted)]">
            {hint}
          </p>
        )}

        {/* Character count */}
        {showCount && maxLength && (
          <p className={cn(
            'text-xs self-end',
            charCount > maxLength * 0.9 ? 'text-[var(--warning)]' : 'text-[var(--text-subtle)]'
          )}>
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ─── Textarea ─────────────────────────────────────────────────────────────────
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:       string;
  hint?:        string;
  error?:       string;
  wrapperClass?: string;
  showCount?:   boolean;
  required?:    boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, wrapperClass, showCount, maxLength, required, id, ...props }, ref) => {
    const inputId = id ?? React.useId();
    const charCount = String(props.value ?? '').length;

    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClass)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--text)]">
            {label}
            {required && <span className="text-[var(--danger)] ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          maxLength={maxLength}
          className={cn(
            'w-full min-h-[100px] px-4 py-3',
            'text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)]',
            'bg-[var(--surface)] border border-[var(--border)] rounded-lg',
            'transition-all duration-200 outline-none resize-y',
            'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20',
            'hover:border-[var(--border-strong)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-[var(--danger)] focus:ring-[var(--danger)]/20',
            className
          )}
          aria-invalid={!!error}
          required={required}
          {...props}
        />
        {error && (
          <p role="alert" className="text-xs text-[var(--danger)] flex items-center gap-1">
            <AlertCircle size={12} /> {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-[var(--text-muted)]">{hint}</p>
        )}
        {showCount && maxLength && (
          <p className={cn(
            'text-xs self-end',
            charCount > maxLength * 0.9 ? 'text-[var(--warning)]' : 'text-[var(--text-subtle)]'
          )}>
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Input, Textarea, inputVariants };
