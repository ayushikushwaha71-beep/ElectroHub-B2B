import type { Metadata } from 'next';
import { RegisterPage } from '@/components/auth/RegisterPage';

export const metadata: Metadata = {
  title: 'Create Account — ElectroHub',
  description: 'Create your free ElectroHub account to shop electronics, track orders, and save wishlists.',
  robots: { index: false, follow: false },
};

export default function RegisterRoute() {
  return <RegisterPage />;
}
