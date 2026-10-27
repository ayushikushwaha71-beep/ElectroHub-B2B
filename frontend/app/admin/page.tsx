import { redirect } from 'next/navigation';

// Redirect /admin → /admin/vendors
export default function AdminRootPage() {
  redirect('/admin/vendors');
}
