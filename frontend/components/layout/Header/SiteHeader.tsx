'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  Heart,
  Menu,
  X,
  ChevronDown,
  Cpu,
  Server,
  Wifi,
  Activity,
  RotateCw,
  Monitor,
  Bot,
  Zap,
  UserCircle2,
  LogOut,
} from 'lucide-react';
import { Logo } from './Logo';
import { AnnouncementBar } from './AnnouncementBar';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { MEGA_MENU_CATEGORIES } from '@/lib/data/navigation';
import { useCart } from '@/lib/providers/CartProvider';
import { useAuth } from '@/lib/providers/AuthProvider';

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  cpu:       <Cpu size={16} />,
  server:    <Server size={16} />,
  wifi:      <Wifi size={16} />,
  activity:  <Activity size={16} />,
  'rotate-cw': <RotateCw size={16} />,
  monitor:   <Monitor size={16} />,
  bot:       <Bot size={16} />,
  zap:       <Zap size={16} />,
};

// ─── Nav Items ────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Home',       href: '/' },
  { label: 'Categories', href: '/categories', hasMegaMenu: true },
  { label: 'Products',   href: '/products' },
  { label: 'Brands',     href: '/brands' },
  { label: 'Deals',      href: '/deals', badge: 'Hot' },
];

// ─── Mega Menu ────────────────────────────────────────────────────────────────
function MegaMenu({ open }: { open: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
          className="absolute left-0 right-0 top-full z-50 border-t border-[var(--border)] shadow-2xl"
          style={{ background: 'var(--background-card)' }}
        >
          <div className="container-fluid py-8">
            <div className="grid grid-cols-4 gap-8">
              {MEGA_MENU_CATEGORIES.slice(0, 4).map((cat) => (
                <div key={cat.id}>
                  <Link
                    href={cat.href}
                    className="flex items-center gap-2 text-sm font-bold text-[var(--text)] hover:text-[var(--primary)] transition-colors mb-3 group"
                  >
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${cat.accentColor}20`, color: cat.accentColor }}
                    >
                      {ICON_MAP[cat.iconName] ?? <Zap size={14} />}
                    </span>
                    {cat.label}
                  </Link>
                  <ul className="space-y-1.5">
                    {cat.subcategories.slice(0, 5).map((sub) => (
                      <li key={sub.label}>
                        <Link
                          href={sub.href}
                          className="flex items-center justify-between text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group/item"
                        >
                          <span className="group-hover/item:translate-x-1 transition-transform">
                            {sub.label}
                          </span>
                          {sub.count && (
                            <span className="text-[10px] text-[var(--text-subtle)]">{sub.count}</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {/* Bottom strip */}
            <div className="mt-6 pt-5 border-t border-[var(--border)] flex items-center justify-between">
              <p className="text-xs text-[var(--text-muted)]">
                Explore{' '}
                <span className="font-semibold text-[var(--text)]">2,500+</span>{' '}
                electronics products
              </p>
              <Link
                href="/categories"
                className="text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                View all categories →
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── User Menu (desktop) ─────────────────────────────────────────────────────
function UserMenu() {
  const { user, isLoggedIn, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="hidden md:flex items-center gap-1 ml-1">
        <Link
          href="/login"
          className="inline-flex items-center px-3 h-9 rounded-lg border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center px-3 h-9 rounded-lg bg-[var(--primary)] text-[var(--primary-fore)] text-xs font-semibold hover:bg-[var(--primary-hover)] transition-all"
        >
          Register
        </Link>
      </div>
    );
  }

  const initials = user!.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div ref={ref} className="relative hidden md:block ml-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-9 pl-1 pr-2 rounded-lg hover:bg-[var(--surface-hover)] transition-all"
        aria-expanded={open}
        aria-label="User menu"
        id="user-menu-btn"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white text-[11px] font-bold shrink-0">
          {initials}
        </span>
        <span className="text-xs font-medium text-[var(--text)] max-w-[80px] truncate hidden lg:block">
          {user!.name.split(' ')[0]}
        </span>
        <ChevronDown size={13} className={cn('text-[var(--text-muted)] transition-transform duration-200', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[var(--border)] bg-[var(--background-card)] shadow-[var(--shadow-lg)] overflow-hidden z-50"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <p className="text-sm font-semibold text-[var(--text)] truncate">{user!.name}</p>
              <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{user!.email}</p>
            </div>

            {/* Menu items */}
            <div className="p-1.5">
              {[
                { label: 'My Account', href: '/account' },
                { label: 'Wishlist',   href: '/wishlist' },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <UserCircle2 size={14} className="shrink-0" />
                  {label}
                </Link>
              ))}
            </div>

            {/* Logout */}
            <div className="p-1.5 border-t border-[var(--border)]">
              <button
                onClick={() => { logout(); setOpen(false); router.push('/login'); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors"
                id="logout-btn"
              >
                <LogOut size={14} className="shrink-0" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Mobile Nav ───────────────────────────────────────────────────────────────
function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.nav
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-80 max-w-full bg-[var(--background-card)] border-l border-[var(--border)] shadow-2xl flex flex-col"
            aria-label="Mobile navigation"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <Logo size="sm" />
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] transition-colors"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto p-5 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={onClose}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-hover)] hover:text-[var(--primary)] transition-colors group"
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <Badge variant="sale" size="xs">{link.badge}</Badge>
                  )}
                </Link>
              ))}

              {/* Category quick links */}
              <div className="pt-4 mt-4 border-t border-[var(--border)]">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)] px-4 mb-3">
                  Top Categories
                </p>
                {MEGA_MENU_CATEGORIES.slice(0, 6).map((cat) => (
                  <Link
                    key={cat.id}
                    href={cat.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--primary)] transition-colors"
                  >
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${cat.accentColor}20`, color: cat.accentColor }}
                    >
                      {ICON_MAP[cat.iconName] ?? <Zap size={14} />}
                    </span>
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Footer actions */}
            <MobileAuthSection onClose={onClose} />
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Mobile Auth Section ──────────────────────────────────────────────────────
function MobileAuthSection({ onClose }: { onClose: () => void }) {
  const { user, isLoggedIn, logout } = useAuth();
  const router = useRouter();

  if (isLoggedIn && user) {
    return (
      <div className="p-5 border-t border-[var(--border)] space-y-2">
        <div className="flex items-center gap-3 px-2 py-1 mb-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white text-xs font-bold shrink-0">
            {user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text)] truncate">{user.name}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); onClose(); router.push('/login'); }}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[var(--danger)]/30 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 border-t border-[var(--border)] space-y-2">
      <Link
        href="/login"
        onClick={onClose}
        className="block w-full text-center py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
      >
        Sign In
      </Link>
      <Link
        href="/register"
        onClick={onClose}
        className="block w-full text-center py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
      >
        Create Account
      </Link>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function SiteHeader() {
  const [megaOpen,   setMegaOpen]   = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled,   setScrolled]   = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [query,      setQuery]      = React.useState('');
  const { totalItems: cartCount } = useCart();
  const wishCount = 5;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 w-full"
      aria-label="Site header"
    >
      {/* Announcement bar */}
      <AnnouncementBar />

      {/* Main header */}
      <div
        className={cn(
          'w-full border-b transition-all duration-200',
          scrolled
            ? 'bg-[var(--background-card)]/95 backdrop-blur-md border-[var(--border)] shadow-sm'
            : 'bg-[var(--background-card)] border-[var(--border)]'
        )}
      >
        <div className="container-fluid">
          <div className="flex items-center gap-4 h-16">
            {/* Logo */}
            <Logo size="md" />

            {/* Desktop nav */}
            <nav
              className="hidden lg:flex items-center gap-1 flex-1"
              aria-label="Main navigation"
            >
              {NAV_LINKS.map((link) => {
                const isCategories = link.hasMegaMenu;
                return isCategories ? (
                  <button
                    key={link.label}
                    onMouseEnter={() => setMegaOpen(true)}
                    onMouseLeave={() => setMegaOpen(false)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-hover)] transition-all"
                    aria-expanded={megaOpen}
                    aria-haspopup="true"
                  >
                    {link.label}
                    <ChevronDown
                      size={14}
                      className={cn('transition-transform duration-200', megaOpen && 'rotate-180')}
                    />
                  </button>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-hover)] transition-all"
                  >
                    {link.label}
                    {link.badge && (
                      <Badge variant="sale" size="xs">{link.badge}</Badge>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Spacer */}
            <div className="hidden lg:block flex-1" />

            {/* Search (desktop inline) */}
            <div className="hidden md:flex items-center relative">
              <AnimatePresence mode="wait">
                {searchOpen ? (
                  <motion.form
                    key="search-open"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center overflow-hidden"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <input
                      autoFocus
                      type="search"
                      placeholder="Search products…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="h-9 w-full pl-4 pr-10 rounded-lg bg-[var(--background-alt)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                      aria-label="Search products"
                    />
                    <button
                      type="button"
                      onClick={() => { setSearchOpen(false); setQuery(''); }}
                      className="absolute right-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                      aria-label="Close search"
                    >
                      <X size={15} />
                    </button>
                  </motion.form>
                ) : (
                  <motion.button
                    key="search-closed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSearchOpen(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-hover)] transition-all"
                    aria-label="Open search"
                  >
                    <Search size={18} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Theme toggle */}
              <ThemeToggle />

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-hover)] transition-all"
                aria-label={`Wishlist (${wishCount} items)`}
              >
                <Heart size={18} />
                {wishCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {wishCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-hover)] transition-all"
                aria-label={`Cart (${cartCount} items)`}
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)] text-[9px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Auth (desktop) */}
              <UserMenu />

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-all ml-1"
                aria-label="Open mobile menu"
                aria-expanded={mobileOpen}
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Mega menu (hovers the nav) */}
        <div
          onMouseEnter={() => setMegaOpen(true)}
          onMouseLeave={() => setMegaOpen(false)}
        >
          <MegaMenu open={megaOpen} />
        </div>
      </div>

      {/* Mobile menu */}
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
