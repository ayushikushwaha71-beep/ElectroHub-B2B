'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  User,
  MapPin,
  ShoppingBag,
  LogOut,
  X,
  ChevronRight,
  Zap,
  FileText,
  Receipt,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/lib/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/Toast';
import type { AccountSection } from './AccountDashboard';

interface NavItem {
  id: AccountSection;
  label: string;
  icon: React.ElementType;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview',    label: 'Overview',    icon: LayoutDashboard, description: 'Dashboard summary' },
  { id: 'profile',     label: 'Profile',     icon: User,            description: 'Personal info' },
  { id: 'addresses',   label: 'Addresses',   icon: MapPin,          description: 'Shipping addresses' },
  { id: 'orders',      label: 'Orders',      icon: ShoppingBag,     description: 'Order history' },
  { id: 'rfqs',        label: 'RFQs',        icon: FileText,        description: 'Request for Quotation' },
  { id: 'quotations',  label: 'Quotations',  icon: Receipt,         description: 'B2B Quotations' },
];

interface AccountSidebarProps {
  activeSection:    AccountSection;
  onSectionChange:  (section: AccountSection) => void;
  mobileOpen:       boolean;
  onMobileClose:    () => void;
}

export function AccountSidebar({
  activeSection,
  onSectionChange,
  mobileOpen,
  onMobileClose,
}: AccountSidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    router.push('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* User card */}
      <div className="px-4 py-5 border-b border-[var(--border)] mb-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-sm select-none shadow-md">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[var(--success)] border-2 border-[var(--background-card)] rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--text)] text-sm truncate">{user?.name}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200',
                isActive
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]',
              )}
              aria-current={isActive ? 'page' : undefined}
              id={`account-nav-${item.id}`}
            >
              <span className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors',
                isActive
                  ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
                  : 'bg-[var(--background-alt)] text-[var(--text-muted)]',
              )}>
                <Icon size={16} />
              </span>
              <span className="flex-1 text-sm">{item.label}</span>
              {isActive && <ChevronRight size={14} className="shrink-0 text-[var(--primary)]" />}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-[var(--border)] mt-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-all duration-200 group"
          id="account-logout-btn"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--danger-bg)] group-hover:bg-[var(--danger)]/20 transition-colors">
            <LogOut size={16} />
          </span>
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>

      {/* Brand footer */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-subtle)]">
          <Zap size={11} className="text-[var(--primary)]" />
          <span>ElectroHub Account</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col">
        <div className="sticky top-24 rounded-2xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden shadow-[var(--shadow-card)]">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={onMobileClose}
            />

            {/* Drawer */}
            <motion.div
              key="sidebar-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-[var(--background-card)] border-r border-[var(--border)] shadow-2xl lg:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <span className="font-semibold text-[var(--text)] text-sm">My Account</span>
                <button
                  onClick={onMobileClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
                  aria-label="Close menu"
                >
                  <X size={16} />
                </button>
              </div>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
