import type { Metadata } from 'next';
import { AccountDashboard } from '@/components/account/AccountDashboard';

export const metadata: Metadata = {
  title: 'My Account — ElectroHub',
  description: 'Manage your ElectroHub account, orders, addresses, and profile settings.',
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountDashboard />;
}
