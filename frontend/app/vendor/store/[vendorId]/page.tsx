import { VendorStore } from '@/components/vendor/VendorPortal';
export default async function VendorStoreRoute({ params }: { params: Promise<{ vendorId: string }> }) { const { vendorId } = await params; return <VendorStore vendorId={vendorId} />; }
