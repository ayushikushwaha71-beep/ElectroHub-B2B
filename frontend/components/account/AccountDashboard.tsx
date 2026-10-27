'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/AuthProvider';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
import { AccountSidebar } from './AccountSidebar';
import { AccountOverview } from './AccountOverview';
import { AccountProfile } from './AccountProfile';
import { AccountAddresses } from './AccountAddresses';
import { AccountOrders } from './AccountOrders';
import { AccountRFQs } from './AccountRFQs';
import { AccountQuotations } from './AccountQuotations';

export type AccountSection = 'overview' | 'profile' | 'addresses' | 'orders' | 'rfqs' | 'quotations';

export function AccountDashboard() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = React.useState<AccountSection>('overview');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoading || !isLoggedIn) {
    return (
      <GlobalLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
            <p className="text-sm text-[var(--text-muted)]">Loading your account…</p>
          </div>
        </div>
      </GlobalLayout>
    );
  }

  return (
    <GlobalLayout>
      <div className="bg-[var(--background)] min-h-screen">
        <div className="container-fluid py-8">
          {/* Mobile header bar */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <h1 className="text-xl font-bold font-display text-[var(--text)]">My Account</h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
              aria-label="Toggle account menu"
            >
              <span className="text-xs text-[var(--text-muted)]">Menu</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 4h12M2 8h12M2 12h12" />
              </svg>
            </button>
          </div>

          <div className="flex gap-6 relative">
            {/* Sidebar */}
            <AccountSidebar
              activeSection={activeSection}
              onSectionChange={(s) => { setActiveSection(s); setSidebarOpen(false); }}
              mobileOpen={sidebarOpen}
              onMobileClose={() => setSidebarOpen(false)}
            />

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {activeSection === 'overview'   && <AccountOverview  onSectionChange={setActiveSection} />}
              {activeSection === 'profile'    && <AccountProfile />}
              {activeSection === 'addresses'  && <AccountAddresses />}
              {activeSection === 'orders'     && <AccountOrders />}
              {activeSection === 'rfqs'       && <AccountRFQs onSectionChange={setActiveSection} />}
              {activeSection === 'quotations' && <AccountQuotations onSectionChange={setActiveSection} />}
            </div>
          </div>
        </div>
      </div>
    </GlobalLayout>
  );
}
