import type { Metadata } from 'next';
import { LoginPage } from '@/components/auth/LoginPage';

export const metadata: Metadata = {
  title: 'Sign In — ElectroHub',
  description: 'Sign in to your ElectroHub account to manage orders, wishlist, and checkout.',
  robots: { index: false, follow: false },
};

export default function LoginRoute() {
  return <LoginPage />;
}
