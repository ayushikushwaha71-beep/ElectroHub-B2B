'use client';

import * as React from 'react';
import { SiteHeader } from './Header/SiteHeader';
import { SiteFooter } from './SiteFooter';

interface GlobalLayoutProps {
  children: React.ReactNode;
}

/**
 * GlobalLayout — wraps every page with SiteHeader + SiteFooter.
 * Reuse this in every page's layout or directly in page files.
 */
export function GlobalLayout({ children }: GlobalLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1" id="main-content" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
