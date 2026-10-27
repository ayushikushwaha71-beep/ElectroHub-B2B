'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  MapPin,
  CreditCard,
  Truck,
  ShieldCheck,
  RotateCcw,
  Tag,
  CheckCircle2,
  Banknote,
  Smartphone,
  ChevronRight,
  Lock,
  Package,
  ArrowLeft,
} from 'lucide-react';
import { cn }           from '@/utils/cn';
import { Breadcrumb }   from '@/components/ui/Breadcrumb';
import { Button }       from '@/components/ui/Button';
import { Badge }        from '@/components/ui/Badge';
import { Input }        from '@/components/ui/Input';
import { EmptyState }   from '@/components/ui/EmptyState';
import { toast }        from '@/components/ui/Toast';
import { useCart }      from '@/lib/providers/CartProvider';
import { useAuth }      from '@/lib/providers/AuthProvider';
import { formatINR, calculateDiscount } from '@/utils/format';
import type { CartItem } from '@/lib/providers/CartProvider';
import { api } from '@/lib/api';

// ─── Indian States ──────────────────────────────────────────────────────────────
const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Chandigarh','Puducherry',
];

// ─── Types ─────────────────────────────────────────────────────────────────────
type PaymentMethod = 'cod' | 'online';

interface ShippingForm {
  fullName:  string;
  phone:     string;
  email:     string;
  address:   string;
  city:      string;
  state:     string;
  pincode:   string;
}

// ─── Step indicator ────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Shipping',  icon: MapPin      },
  { id: 2, label: 'Payment',   icon: CreditCard  },
  { id: 3, label: 'Confirm',   icon: CheckCircle2 },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const done   = current > step.id;
        const active = current === step.id;
        const Icon   = step.icon;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300',
                done   && 'bg-[var(--primary)] border-[var(--primary)] text-white',
                active && 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]',
                !done && !active && 'bg-[var(--background-alt)] border-[var(--border)] text-[var(--text-subtle)]',
              )}>
                {done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
              </div>
              <span className={cn(
                'text-xs font-medium hidden sm:block',
                active ? 'text-[var(--primary)]' : done ? 'text-[var(--text-muted)]' : 'text-[var(--text-subtle)]',
              )}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-2 rounded-full transition-all duration-500',
                current > step.id ? 'bg-[var(--primary)]' : 'bg-[var(--border)]',
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Order Item Row (mini) ─────────────────────────────────────────────────────
function OrderItemRow({ item }: { item: CartItem }) {
  const { product, quantity } = item;
  const img = product.images[0];
  const discount = calculateDiscount(product.originalPrice, product.sellingPrice);

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-none">
      <div className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-[var(--background-alt)]">
        <img
          src={img?.url ?? '/placeholder.png'}
          alt={img?.alt ?? product.name}
          className="w-full h-full object-contain p-1"
          loading="lazy"
        />
        {discount > 0 && (
          <span className="absolute -top-0.5 -right-0.5">
            <Badge variant="sale" size="xs">{discount}%</Badge>
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[var(--text)] line-clamp-1">{product.name}</p>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Qty: {quantity}</p>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Sold by {product.vendorName ?? 'ElectroHub'}</p>
      </div>
      <span className="text-xs font-bold text-[var(--text)] shrink-0">
        {formatINR(product.sellingPrice * quantity)}
      </span>
    </div>
  );
}

// ─── Order Summary Panel ───────────────────────────────────────────────────────
function OrderSummaryPanel({ step }: { step: number }) {
  const { items, subtotal, shipping, total } = useCart();
  const savings = items.reduce((sum, i) => {
    return sum + Math.max((i.product.originalPrice - i.product.sellingPrice) * i.quantity, 0);
  }, 0);

  return (
    <div className={cn(
      'rounded-2xl border border-[var(--border)]',
      'bg-[var(--background-card)] shadow-[var(--shadow-card)]',
      'overflow-hidden',
      step >= 2 && 'sticky top-24',
    )}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[var(--text)]">Order Summary</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
        </div>
        <ShoppingBag size={16} className="text-[var(--primary)]" />
      </div>

      {/* Items */}
      <div className="px-5 py-3 max-h-52 overflow-y-auto">
        {items.map((item) => (
          <OrderItemRow key={item.product.id} item={item} />
        ))}
      </div>

      {/* Totals */}
      <div className="px-5 pb-5 space-y-2.5 border-t border-[var(--border)] pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Subtotal</span>
          <span className="font-medium text-[var(--text)]">{formatINR(subtotal)}</span>
        </div>
        {savings > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[var(--success)] flex items-center gap-1"><Tag size={12} /> You save</span>
            <span className="font-semibold text-[var(--success)]">−{formatINR(savings)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Shipping</span>
          <span className={cn('font-medium', shipping === 0 ? 'text-[var(--success)]' : 'text-[var(--text)]')}>
            {shipping === 0 ? 'FREE' : formatINR(shipping)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">GST & Taxes</span>
          <span className="text-[var(--text-muted)] text-xs">Included</span>
        </div>
        <div className="flex justify-between border-t border-[var(--border)] pt-3">
          <span className="font-bold text-[var(--text)]">Total</span>
          <span className="text-xl font-bold font-display text-[var(--text)]">{formatINR(total)}</span>
        </div>
      </div>

      {/* Trust */}
      <div className="px-5 pb-4 space-y-2 border-t border-[var(--border)] pt-3">
        {[
          { icon: ShieldCheck, text: 'Secure Checkout — SSL encrypted' },
          { icon: Truck,       text: 'Free Delivery — On orders above ₹499' },
          { icon: RotateCcw,   text: 'Easy Returns — 7-day return policy' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Icon size={12} className="shrink-0 text-[var(--primary)]" />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Payment Option Card ───────────────────────────────────────────────────────
function PaymentCard({
  method,
  selected,
  onSelect,
}: {
  method: PaymentMethod;
  selected: PaymentMethod;
  onSelect: (m: PaymentMethod) => void;
}) {
  const isCod    = method === 'cod';
  const isActive = selected === method;

  return (
    <button
      type="button"
      onClick={() => onSelect(method)}
      id={`payment-${method}`}
      aria-pressed={isActive}
      className={cn(
        'w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left',
        isActive
          ? 'border-[var(--primary)] bg-[var(--primary)]/5'
          : 'border-[var(--border)] bg-[var(--background-card)] hover:border-[var(--border-strong)]',
      )}
    >
      {/* Radio indicator */}
      <div className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 mt-0.5 transition-colors',
        isActive ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-[var(--border-strong)]',
      )}>
        {isActive && <span className="h-2 w-2 rounded-full bg-white" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isCod
            ? <Banknote size={16} className="text-emerald-500 shrink-0" />
            : <Smartphone size={16} className="text-blue-500 shrink-0" />
          }
          <span className="text-sm font-semibold text-[var(--text)]">
            {isCod ? 'Cash on Delivery' : 'Online Payment'}
          </span>
          {!isCod && <Badge variant="new" size="xs">Popular</Badge>}
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
          {isCod
            ? 'Pay in cash when your order is delivered. No advance payment required.'
            : 'Pay securely via UPI, Net Banking, Credit/Debit card, or Wallets.'
          }
        </p>
        {!isCod && isActive && (
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {['UPI', 'Visa', 'Mastercard', 'Net Banking'].map((m) => (
              <span
                key={m}
                className="px-2 py-0.5 rounded-md border border-[var(--border)] text-[10px] font-semibold text-[var(--text-muted)] bg-[var(--surface)]"
              >
                {m}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Confirmation Screen ───────────────────────────────────────────────────────
function OrderConfirmation({
  orderNumber,
  paymentMethod,
  formData,
}: {
  orderNumber: string;
  paymentMethod: PaymentMethod;
  formData: ShippingForm;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
      className="flex flex-col items-center text-center py-10 px-4"
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 20 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--success-bg)] border-4 border-[var(--success)]/30 mb-6"
      >
        <CheckCircle2 size={40} className="text-[var(--success)]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2 mb-6"
      >
        <h2 className="text-2xl font-bold font-display text-[var(--text)]">Order Placed!</h2>
        <p className="text-[var(--text-muted)] text-sm max-w-sm">
          Thank you, <strong className="text-[var(--text)]">{formData.fullName.split(' ')[0]}</strong>! Your order has been confirmed and is being processed.
        </p>
      </motion.div>

      {/* Order details card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden mb-6"
      >
        <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
          <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wide">Order Details</p>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {[
            { label: 'Order Number', value: `#${orderNumber}` },
            { label: 'Payment',      value: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment' },
            { label: 'Deliver To',   value: `${formData.city}, ${formData.state} — ${formData.pincode}` },
            { label: 'Contact',      value: formData.phone },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-5 py-3 text-sm">
              <span className="text-[var(--text-muted)]">{label}</span>
              <span className="font-medium text-[var(--text)] text-right max-w-[55%] truncate">{value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Estimated delivery */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-400 mb-6 w-full max-w-md"
      >
        <Truck size={15} className="shrink-0" />
        <span>Estimated delivery: <strong>3–5 business days</strong></span>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap gap-3 justify-center"
      >
        <Button variant="gradient" onClick={() => { window.location.href = '/shop'; }}>
          Continue Shopping
        </Button>
        <Button variant="outline" onClick={() => { window.location.href = '/'; }}>
          Back to Home
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ─── Section heading helper ────────────────────────────────────────────────────
function SectionHeading({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 shrink-0">
        <Icon size={16} className="text-[var(--primary)]" />
      </div>
      <div>
        <h3 className="text-base font-bold text-[var(--text)]">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Select wrapper (native, styled) ──────────────────────────────────────────
function SelectField({
  label,
  required,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; required?: boolean; error?: string }) {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--text)]">
          {label}{required && <span className="text-[var(--danger)] ml-0.5">*</span>}
        </label>
      )}
      <select
        id={id}
        className={cn(
          'w-full h-10 px-4 text-sm rounded-lg border outline-none',
          'bg-[var(--surface)] text-[var(--text)]',
          'border-[var(--border)] hover:border-[var(--border-strong)]',
          'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-[var(--danger)] focus:ring-[var(--danger)]/20',
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p role="alert" className="text-xs text-[var(--danger)] flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

// ─── Main Checkout Page ────────────────────────────────────────────────────────
export function CheckoutPage() {
  const { items, subtotal, shipping, total, clearCart, totalItems } = useCart();
  const { isLoggedIn } = useAuth();
  const [step,          setStep]          = React.useState<1 | 2 | 3>(1);
  const [payment,       setPayment]       = React.useState<PaymentMethod>('cod');
  const [isPlacing,     setIsPlacing]     = React.useState(false);
  const [confirmedData, setConfirmedData] = React.useState<ShippingForm | null>(null);
  const [orderNumber,   setOrderNumber]   = React.useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
  } = useForm<ShippingForm>({ mode: 'onBlur' });

  const breadcrumbs = [
    { label: 'Home',  href: '/' },
    { label: 'Cart',  href: '/cart' },
    { label: 'Checkout', current: true },
  ];

  // ── Empty cart guard ─────────────────────────────────────────────────────────
  if (items.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Breadcrumb items={breadcrumbs} showHome className="mb-6" />
          <EmptyState
            preset="empty-cart"
            title="Your Cart is Empty"
            description="Add some products before proceeding to checkout."
            actions={[
              { label: 'Browse Products', onClick: () => { window.location.href = '/shop'; }, variant: 'primary' },
              { label: 'Go to Cart',      onClick: () => { window.location.href = '/cart'; }, variant: 'outline' },
            ]}
            size="lg"
          />
        </div>
      </div>
    );
  }

  // ── Auth guard ───────────────────────────────────────────────────────────────
  if (!isLoggedIn && step !== 3) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Breadcrumb items={breadcrumbs} showHome className="mb-6" />
          <div className="max-w-md mx-auto mt-12 text-center">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] shadow-[var(--shadow-card)] p-8 space-y-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 mx-auto">
                <Lock size={24} className="text-[var(--primary)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display text-[var(--text)]">Sign in to Checkout</h2>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  Please sign in or create a free account to complete your purchase. Your cart will be preserved.
                </p>
              </div>
              <div className="flex flex-col gap-2.5">
                <a
                  href="/login"
                  className="flex items-center justify-center w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Sign In
                </a>
                <a
                  href="/register"
                  className="flex items-center justify-center w-full h-11 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  Create Account — it's free
                </a>
              </div>
              <a href="/cart" className="inline-block text-xs text-[var(--text-muted)] hover:text-[var(--primary)] underline underline-offset-2 transition-colors">
                ← Back to Cart
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // ── Step 1 → Step 2: validate shipping ──────────────────────────────────────
  const handleShippingNext = async () => {
    const valid = await trigger(['fullName','phone','email','address','city','state','pincode']);
    if (valid) setStep(2);
    else toast.error('Please fill all required fields correctly.');
  };

  // ── Step 2 → Place order ─────────────────────────────────────────────────────
  const handlePlaceOrder = handleSubmit(async (data) => {
    setIsPlacing(true);
    try {
      const response = await api.post<{ order_number: string }>('/orders/', {
        ...data,
        payment_method: payment,
        items: items.map((item) => ({
          // Use numeric DB primary key when available (real API products)
          product_id: item.product.numericId ?? item.product.id,
          quantity: item.quantity,
        })),
      }, { token: localStorage.getItem('electrohub_access_token') ?? '' });
      setOrderNumber(response.order_number);
      setConfirmedData(data);
      clearCart();
      setStep(3);
      toast.success('Order placed successfully!', { description: `Order #${response.order_number}` });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not place your order.');
    } finally {
      setIsPlacing(false);
    }
  });

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbs} showHome className="mb-6" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
            <ShoppingBag size={22} className="text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text)]">Checkout</h1>
            {step < 3 && (
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} — {formatINR(total)}
              </p>
            )}
          </div>
        </div>

        {/* ── Confirmation (full-width) ─────────────────────────────────── */}
        {step === 3 && confirmedData ? (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] shadow-[var(--shadow-card)] overflow-hidden">
              <OrderConfirmation
                orderNumber={orderNumber}
                paymentMethod={payment}
                formData={confirmedData}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 xl:gap-8">

            {/* ── Left: Form ──────────────────────────────────────────── */}
            <div className="space-y-4">
              {/* Step bar */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] shadow-[var(--shadow-card)] p-5">
                <StepBar current={step} />

                <AnimatePresence mode="wait">

                  {/* ── Step 1: Shipping ────────────────────────────── */}
                  {step === 1 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <SectionHeading
                        icon={MapPin}
                        title="Shipping Address"
                        subtitle="We'll deliver to this address"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Full name */}
                        <Input
                          label="Full Name"
                          required
                          placeholder="Ayushi Sharma"
                          error={errors.fullName?.message}
                          {...register('fullName', {
                            required: 'Full name is required',
                            minLength: { value: 2, message: 'Name must be at least 2 characters' },
                          })}
                        />

                        {/* Phone */}
                        <Input
                          label="Phone Number"
                          required
                          type="tel"
                          placeholder="9876543210"
                          maxLength={10}
                          error={errors.phone?.message}
                          {...register('phone', {
                            required: 'Phone number is required',
                            pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit Indian mobile number' },
                          })}
                        />

                        {/* Email — full width */}
                        <div className="sm:col-span-2">
                          <Input
                            label="Email Address"
                            required
                            type="email"
                            placeholder="ayushi@example.com"
                            hint="Order confirmation will be sent here"
                            error={errors.email?.message}
                            {...register('email', {
                              required: 'Email is required',
                              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
                            })}
                          />
                        </div>

                        {/* Address — full width */}
                        <div className="sm:col-span-2">
                          <Input
                            label="Street Address"
                            required
                            placeholder="Flat / House No., Building, Street, Area"
                            error={errors.address?.message}
                            {...register('address', {
                              required: 'Address is required',
                              minLength: { value: 10, message: 'Please enter a complete address' },
                            })}
                          />
                        </div>

                        {/* City */}
                        <Input
                          label="City"
                          required
                          placeholder="Pune"
                          error={errors.city?.message}
                          {...register('city', {
                            required: 'City is required',
                            minLength: { value: 2, message: 'Enter a valid city' },
                          })}
                        />

                        {/* Pincode */}
                        <Input
                          label="Pincode"
                          required
                          placeholder="411001"
                          maxLength={6}
                          error={errors.pincode?.message}
                          {...register('pincode', {
                            required: 'Pincode is required',
                            pattern: { value: /^[1-9][0-9]{5}$/, message: 'Enter a valid 6-digit pincode' },
                          })}
                        />

                        {/* State — full width native select */}
                        <div className="sm:col-span-2">
                          <SelectField
                            label="State"
                            required
                            error={errors.state?.message}
                            defaultValue=""
                            {...register('state', { required: 'Please select a state' })}
                          >
                            <option value="" disabled>Select state…</option>
                            {INDIAN_STATES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </SelectField>
                        </div>
                      </div>

                      {/* Navigation */}
                      <div className="flex items-center justify-between mt-6 pt-5 border-t border-[var(--border)]">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<ArrowLeft size={14} />}
                          onClick={() => { window.location.href = '/cart'; }}
                        >
                          Back to Cart
                        </Button>
                        <Button
                          variant="gradient"
                          size="lg"
                          rightIcon={<ChevronRight size={16} />}
                          onClick={handleShippingNext}
                          id="continue-to-payment"
                        >
                          Continue to Payment
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 2: Payment ─────────────────────────────── */}
                  {step === 2 && (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <SectionHeading
                        icon={CreditCard}
                        title="Payment Method"
                        subtitle="Choose how you'd like to pay"
                      />

                      {/* Shipping recap */}
                      <div className={cn(
                        'flex items-start gap-3 p-3.5 rounded-xl mb-5',
                        'bg-[var(--background-alt)] border border-[var(--border)]',
                      )}>
                        <MapPin size={14} className="text-[var(--primary)] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[var(--text)]">{getValues('fullName')}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                            {getValues('address')}, {getValues('city')}, {getValues('state')} — {getValues('pincode')}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">{getValues('phone')} · {getValues('email')}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="shrink-0 text-xs text-[var(--primary)] hover:underline font-medium"
                        >
                          Edit
                        </button>
                      </div>

                      {/* Payment options */}
                      <div className="space-y-3">
                        <PaymentCard method="cod"    selected={payment} onSelect={setPayment} />
                        <PaymentCard method="online" selected={payment} onSelect={setPayment} />
                      </div>

                      {/* Secure note */}
                      <div className="flex items-center gap-2 mt-4 text-xs text-[var(--text-muted)]">
                        <Lock size={12} className="text-[var(--success)] shrink-0" />
                        <span>Your payment information is encrypted and secure.</span>
                      </div>

                      {/* Navigation */}
                      <div className="flex items-center justify-between mt-6 pt-5 border-t border-[var(--border)]">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<ArrowLeft size={14} />}
                          onClick={() => setStep(1)}
                        >
                          Back
                        </Button>
                        <Button
                          variant="gradient"
                          size="lg"
                          isLoading={isPlacing}
                          loadingText="Placing order…"
                          leftIcon={!isPlacing ? <Package size={16} /> : undefined}
                          onClick={handlePlaceOrder}
                          id="place-order-btn"
                        >
                          Place Order — {formatINR(total)}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Right: Order summary ─────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              <OrderSummaryPanel step={step} />
            </motion.div>

          </div>
        )}
      </div>
    </div>
  );
}
