'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Building2, CheckCircle2, ClipboardList, LayoutDashboard, LogOut, Package, Pencil,
  Plus, ShieldCheck, ShoppingBag, Store, Trash2, Users, XCircle, Clock,
  Save, X as XIcon, ChevronDown, ChevronUp, Send, AlertCircle, CalendarClock, FileText,
} from 'lucide-react';
import { Button }       from '@/components/ui/Button';
import { Card }         from '@/components/ui/Card';
import { Input }        from '@/components/ui/Input';
import { Badge }        from '@/components/ui/Badge';
import { toast }        from '@/components/ui/Toast';
import { GlobalLayout }  from '@/components/layout/GlobalLayout';
import { useAuth }      from '@/lib/providers/AuthProvider';
import { api }          from '@/lib/api';
import { formatINR }    from '@/utils/format';

// ─── Backend Types ─────────────────────────────────────────────────────────────
type BackendProduct = {
  id: number; name: string; slug: string; sku: string;
  price: string; discount_price: string | null; final_price: string;
  stock: number; status: string;
  short_description: string; description: string;
  images: Array<{ image: string; alt_text: string }>;
};
type ProductResponse = { count: number; results: BackendProduct[] };

type BackendOrderItem = {
  id: number; product: number; product_name: string; vendor: number;
  vendor_name: string; quantity: number; unit_price: string; total_price: string;
};
type BackendOrder = {
  id: number; order_number: string; total_amount: string;
  status: string; created_at: string; full_name: string;
  phone: string; city: string; state: string;
  items: BackendOrderItem[];
};
type OrderResponse = { count: number; results: BackendOrder[] };

type VendorProfile = {
  id: number; email: string; name: string; business_name: string;
  business_address: string; city: string; state: string; pincode: string;
  gstin: string; description: string; website: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejection_reason: string; created_at: string; updated_at: string;
};
type VendorProfileList = { count: number; results: VendorProfile[] };

// ─── Token helper ──────────────────────────────────────────────────────────────
const token = () =>
  typeof window === 'undefined' ? '' : localStorage.getItem('electrohub_access_token') ?? '';

// ─── Vendor Guard ──────────────────────────────────────────────────────────────
function Guard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const allowed = isLoggedIn && user?.role === 'vendor';
  React.useEffect(() => {
    if (!isLoggedIn) router.replace('/login');
    else if (user?.role !== 'vendor') router.replace('/');
  }, [isLoggedIn, router, user?.role]);
  if (!allowed) return (
    <GlobalLayout>
      <div className="container-fluid py-24 text-center">
        <ShieldCheck className="mx-auto mb-4 text-[var(--primary)]" size={36} />
        <h1 className="text-2xl font-bold text-[var(--text)]">Vendor access required</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Please log in with a vendor account.</p>
      </div>
    </GlobalLayout>
  );
  return <>{children}</>;
}

// ─── Admin Guard ───────────────────────────────────────────────────────────────
function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const isAdmin = isLoggedIn && user?.role === 'admin';
  React.useEffect(() => {
    if (!isLoggedIn) router.replace('/login');
    else if (!isAdmin) router.replace('/');
  }, [isAdmin, isLoggedIn, router]);
  if (!isAdmin) return (
    <GlobalLayout>
      <div className="container-fluid py-24 text-center">
        <ShieldCheck className="mx-auto mb-4 text-[var(--primary)]" size={36} />
        <h1 className="text-2xl font-bold text-[var(--text)]">Admin access required</h1>
      </div>
    </GlobalLayout>
  );
  return <>{children}</>;
}

// ─── Vendor Shell ──────────────────────────────────────────────────────────────
function Shell({ children, active }: { children: React.ReactNode; active: string }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const links = [
    ['Dashboard',        '/vendor/dashboard',     LayoutDashboard],
    ['My Products',      '/vendor/products',      Package],
    ['Add Product',      '/vendor/products/add',  Plus],
    ['Orders',           '/vendor/orders',        ShoppingBag],
    ['Dealer Requests',  '/vendor/requests',      ClipboardList],
    ['Purchase Orders',  '/vendor/po',            FileText],
    ['Business Profile', '/vendor/profile',       Building2],
  ] as const;
  return (
    <GlobalLayout>
      <div className="container-fluid py-8">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Marketplace workspace</p>
            <h1 className="mt-1 text-2xl font-bold font-display text-[var(--text)]">
              {active === 'Dashboard' ? `Welcome, ${user?.name?.split(' ')[0] ?? 'Vendor'}` : active}
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { logout(); router.push('/login'); }} leftIcon={<LogOut size={14} />}>Logout</Button>
        </div>
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-3">
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-[var(--surface)] p-3">
              <Store size={18} className="text-[var(--primary)]" />
              <p className="text-sm font-semibold text-[var(--text)]">Vendor workspace</p>
            </div>
            <nav className="space-y-1">
              {links.map(([label, href, Icon]) => (
                <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active === label ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'}`}>
                  <Icon size={15} />{label}
                </Link>
              ))}
            </nav>
          </aside>
          <main>{children}</main>
        </div>
      </div>
    </GlobalLayout>
  );
}

// ─── Vendor Data Hook ──────────────────────────────────────────────────────────
// Single shared hook. Components that need the data should receive it as props
// from the parent that calls this hook — avoids duplicate fetches.
function useVendorData() {
  const [products, setProducts] = React.useState<BackendProduct[]>([]);
  const [orders,   setOrders]   = React.useState<BackendOrder[]>([]);
  const [profile,  setProfile]  = React.useState<VendorProfile | null>(null);
  const [loading,  setLoading]  = React.useState(true);
  const [error,    setError]    = React.useState('');

  const reload = React.useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<ProductResponse>('/products/vendor/', { token: token() }),
      api.get<OrderResponse>('/orders/vendor/',     { token: token() }),
      api.get<VendorProfile>('/vendor/profile/',    { token: token() }),
    ]).then(([p, o, vp]) => {
      setProducts(Array.isArray(p) ? p : (p.results ?? []));
      setOrders(Array.isArray(o) ? o : (o.results ?? []));
      setProfile(vp);
    }).catch((e) => setError(e instanceof Error ? e.message : 'Unable to load vendor data.'))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { reload(); }, [reload]);

  return { products, orders, profile, error, loading, setProducts, setOrders, setProfile, reload };
}

// ─── Approval Status Banner ────────────────────────────────────────────────────
function ApprovalBanner({ status, reason }: { status: string; reason?: string }) {
  if (status === 'approved') return null;
  const configs = {
    pending:   { color: 'bg-amber-50 border-amber-200 text-amber-800',   icon: <Clock size={16} />,      msg: 'Your vendor application is pending admin review. You will be able to manage products once approved.' },
    rejected:  { color: 'bg-red-50 border-red-200 text-red-800',         icon: <XCircle size={16} />,    msg: `Your application was rejected. ${reason ? `Reason: ${reason}` : 'Please contact support.'}` },
    suspended: { color: 'bg-orange-50 border-orange-200 text-orange-800', icon: <ShieldCheck size={16} />, msg: 'Your vendor account has been suspended. Please contact support.' },
  };
  const cfg = configs[status as keyof typeof configs];
  if (!cfg) return null;
  return (
    <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${cfg.color}`}>
      {cfg.icon}
      <p className="text-sm font-medium">{cfg.msg}</p>
    </div>
  );
}

// ─── Real Vendor Dashboard ─────────────────────────────────────────────────────
export function RealVendorDashboard() {
  const { products, orders, profile, error, loading } = useVendorData();
  const stats: Array<{ label: string; value: string | number; icon: React.ElementType }> = [
    { label: 'Total Products',  value: products.length,                                                    icon: Package      },
    { label: 'Active Products', value: products.filter((p) => p.status === 'active').length,               icon: CheckCircle2 },
    { label: 'Orders',          value: orders.length,                                                      icon: ShoppingBag  },
    { label: 'Total Sales',     value: formatINR(orders.reduce((s, o) => s + Number(o.total_amount), 0)),  icon: ShoppingBag  },
  ];
  return (
    <Guard>
      <Shell active="Dashboard">
        {profile && <ApprovalBanner status={profile.status} reason={profile.rejection_reason} />}
        {error && <p className="mb-5 text-sm text-[var(--danger)]">{error}</p>}
        {loading && <p className="mb-5 text-sm text-[var(--text-muted)]">Loading…</p>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="p-5">
              <Icon size={18} className="text-[var(--primary)]" />
              <p className="mt-4 text-sm text-[var(--text-muted)]">{label}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text)]">{value}</p>
            </Card>
          ))}
        </div>
        {orders.length > 0 && (
          <Card className="mt-6 overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-[var(--text)]">Recent Orders</h2>
              <Link href="/vendor/orders" className="text-xs text-[var(--primary)] hover:underline">View all →</Link>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {orders.slice(0, 3).map((o) => (
                <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-sm text-[var(--text)]">Order #{o.order_number}</p>
                    <p className="text-xs text-[var(--text-muted)]">{new Date(o.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <Badge variant={o.status === 'completed' ? 'success' : o.status === 'pending' ? 'warning' : 'info'}>{o.status}</Badge>
                  <span className="font-semibold text-sm text-[var(--text)]">{formatINR(Number(o.total_amount))}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </Shell>
    </Guard>
  );
}

// ─── Real Vendor Products (parent — owns data) ─────────────────────────────────
export function RealVendorProducts({ add = false }: { add?: boolean }) {
  const data = useVendorData();
  return (
    <Guard>
      <Shell active={add ? 'Add Product' : 'My Products'}>
        {add
          ? <RealAddProduct onCreated={data.reload} />
          : <RealProductList
              products={data.products}
              profile={data.profile}
              error={data.error}
              loading={data.loading}
              setProducts={data.setProducts}
              reload={data.reload}
            />
        }
      </Shell>
    </Guard>
  );
}

// ─── Inline Edit Form ──────────────────────────────────────────────────────────
interface EditForm {
  name: string; price: string; discount_price: string;
  stock: string; status: string; short_description: string;
}

function InlineEditForm({
  product,
  onSave,
  onCancel,
}: {
  product: BackendProduct;
  onSave: (updated: BackendProduct) => void;
  onCancel: () => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EditForm>({
    defaultValues: {
      name:              product.name,
      price:             product.price,
      discount_price:    product.discount_price ?? product.price,
      stock:             String(product.stock),
      status:            product.status,
      short_description: product.short_description,
    },
  });

  const submit = async (data: EditForm) => {
    try {
      const updated = await api.patch<BackendProduct>(
        `/products/${product.slug}/`,
        {
          name:              data.name,
          price:             data.price,
          discount_price:    data.discount_price || null,
          stock:             parseInt(data.stock, 10),
          status:            data.status,
          short_description: data.short_description,
        },
        { token: token() },
      );
      onSave(updated);
      toast.success('Product updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to update product.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="border border-[var(--primary)]/30 rounded-xl bg-[var(--background-alt)] p-4 mt-2 space-y-3"
    >
      <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide mb-3">Editing: {product.name}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Input label="Product Name" {...register('name', { required: 'Required' })} error={errors.name?.message} />
        </div>
        <Input label="Price (₹)" type="number" step="0.01" {...register('price', { required: 'Required' })} error={errors.price?.message} />
        <Input label="Discount Price (₹)" type="number" step="0.01" placeholder="Leave blank for no discount" {...register('discount_price')} />
        <Input label="Stock" type="number" {...register('stock', { required: 'Required', min: { value: 0, message: 'Cannot be negative' } })} error={errors.stock?.message} />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text)]">Status</label>
          <select
            {...register('status')}
            className="w-full h-10 px-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--primary)] outline-none"
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <Input label="Short Description" {...register('short_description')} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" isLoading={isSubmitting} leftIcon={<Save size={13} />}>Save Changes</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} leftIcon={<XIcon size={13} />}>Cancel</Button>
      </div>
    </form>
  );
}

// ─── Product List ──────────────────────────────────────────────────────────────
function RealProductList({
  products,
  profile,
  error,
  loading,
  setProducts,
  reload,
}: {
  products: BackendProduct[];
  profile: VendorProfile | null;
  error: string;
  loading: boolean;
  setProducts: React.Dispatch<React.SetStateAction<BackendProduct[]>>;
  reload: () => void;
}) {
  const [editingId, setEditingId] = React.useState<number | null>(null);

  const remove = async (product: BackendProduct) => {
    if (!confirm(`Deactivate "${product.name}"?`)) return;
    try {
      await api.delete(`/products/${product.slug}/`, { token: token() });
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success('Product deactivated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to deactivate product.');
    }
  };

  const handleSaved = (updated: BackendProduct) => {
    setProducts((prev) => prev.map((p) => p.id === updated.id ? updated : p));
    setEditingId(null);
  };

  return (
    <div>
      {profile && profile.status !== 'approved' && (
        <ApprovalBanner status={profile.status} reason={profile.rejection_reason} />
      )}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text)]">My Products</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Loaded from the Django catalogue.</p>
        </div>
        <Link href="/vendor/products/add">
          <Button size="sm" leftIcon={<Plus size={14} />}>Add Product</Button>
        </Link>
      </div>
      {error && <p className="mb-4 text-sm text-[var(--danger)]">{error}</p>}
      {loading && <p className="mb-4 text-sm text-[var(--text-muted)]">Loading products…</p>}
      <Card className="overflow-hidden">
        {products.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--text-muted)]">No products yet. Add your first product.</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {products.map((p) => (
              <div key={p.id} className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <img
                    src={p.images[0]?.image ?? '/favicon.ico'}
                    alt={p.images[0]?.alt_text ?? p.name}
                    className="h-14 w-14 rounded-lg bg-[var(--background-alt)] object-contain p-1"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/favicon.ico'; }}
                  />
                  <div className="min-w-[180px] flex-1">
                    <p className="font-semibold text-[var(--text)]">{p.name}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">SKU: {p.sku}</p>
                  </div>
                  <span className="font-semibold text-[var(--text)]">{formatINR(Number(p.final_price))}</span>
                  <span className="text-sm text-[var(--text-muted)]">Stock: {p.stock}</span>
                  <Badge variant={p.status === 'active' ? 'success' : 'default'}>{p.status}</Badge>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                      className="text-[var(--primary)] hover:opacity-70 transition-opacity"
                      title="Edit product"
                      aria-label={`Edit ${p.name}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => remove(p)}
                      className="text-[var(--danger)] hover:opacity-70 transition-opacity"
                      title="Deactivate product"
                      aria-label={`Deactivate ${p.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {editingId === p.id && (
                  <InlineEditForm
                    product={p}
                    onSave={handleSaved}
                    onCancel={() => setEditingId(null)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Add Product Form ──────────────────────────────────────────────────────────
interface AddForm {
  name: string; sku: string; price: string; discount_price: string;
  stock: string; short_description: string; description: string;
  category_id: string; brand_id: string;
}

const CATEGORY_OPTIONS = [
  { value: '1', label: 'Arduino' },
  { value: '2', label: 'Raspberry Pi' },
  { value: '3', label: 'ESP32 / ESP8266' },
  { value: '4', label: 'Sensors' },
  { value: '5', label: 'Motors & Actuators' },
  { value: '6', label: 'Displays' },
];

const BRAND_OPTIONS = [
  { value: '1', label: 'Arduino' },
  { value: '2', label: 'Raspberry Pi Foundation' },
  { value: '3', label: 'Espressif' },
  { value: '4', label: 'Generic' },
];

function RealAddProduct({ onCreated }: { onCreated?: () => void }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AddForm>({
    defaultValues: { category_id: '1', brand_id: '4' },
  });

  const submit = async (data: AddForm) => {
    try {
      // Generate a URL-safe slug from name + random suffix
      const base = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const slug = `${base}-${crypto.randomUUID().slice(0, 8)}`;
      await api.post('/products/', {
        name:              data.name,
        sku:               data.sku,
        slug,
        price:             data.price,
        discount_price:    data.discount_price || null,
        stock:             parseInt(data.stock, 10),
        short_description: data.short_description,
        description:       data.description,
        category_id:       data.category_id ? parseInt(data.category_id, 10) : null,
        brand_id:          data.brand_id ? parseInt(data.brand_id, 10) : null,
        status:            'active',
        is_active:         true,
      }, { token: token() });
      toast.success('Product saved to Django');
      onCreated?.();
      router.push('/vendor/products');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to save product.');
    }
  };

  return (
    <Card className="max-w-3xl p-6">
      <h2 className="text-xl font-bold text-[var(--text)]">Add Product</h2>
      <p className="mt-1 mb-6 text-sm text-[var(--text-muted)]">
        This product will be saved to the Django database and appear in the shop once active.
      </p>
      <form onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Product Name" required error={errors.name?.message}
            {...register('name', { required: 'Product name is required' })} />
        </div>
        <Input label="SKU" required placeholder="EH-MY-SKU-001" error={errors.sku?.message}
          {...register('sku', { required: 'SKU is required' })} />
        <Input label="Stock Quantity" type="number" required error={errors.stock?.message}
          {...register('stock', { required: 'Stock is required', min: { value: 0, message: 'Cannot be negative' } })} />
        <Input label="Price (₹)" type="number" step="0.01" required error={errors.price?.message}
          {...register('price', { required: 'Price is required' })} />
        <Input label="Discount Price (₹)" type="number" step="0.01" placeholder="Leave blank for no discount"
          {...register('discount_price')} />

        {/* Category dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text)]">Category</label>
          <select
            {...register('category_id')}
            className="w-full h-10 px-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--primary)] outline-none"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Brand dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text)]">Brand</label>
          <select
            {...register('brand_id')}
            className="w-full h-10 px-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--primary)] outline-none"
          >
            {BRAND_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>

        <Input label="Short Description" placeholder="Brief product summary (1–2 sentences)"
          {...register('short_description')} />
        <div className="sm:col-span-2">
          <Input label="Full Description" placeholder="Detailed product description"
            {...register('description')} />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" isLoading={isSubmitting} leftIcon={<Plus size={15} />}>Save Product to Django</Button>
        </div>
      </form>
    </Card>
  );
}

// ─── Real Vendor Orders ────────────────────────────────────────────────────────
export function RealVendorOrders() {
  const { orders, error, loading, setOrders } = useVendorData();

  return (
    <Guard>
      <Shell active="Orders">
        <h2 className="mb-5 text-xl font-bold text-[var(--text)]">Orders</h2>
        <p className="mb-5 text-sm text-[var(--text-muted)]">
          Only orders containing your products are shown. You can only see your own line items.
        </p>
        {error && <p className="mb-4 text-sm text-[var(--danger)]">{error}</p>}
        {loading && <p className="mb-4 text-sm text-[var(--text-muted)]">Loading orders…</p>}
        <Card className="overflow-hidden">
          {orders.length === 0 ? (
            <div className="py-16 text-center text-sm text-[var(--text-muted)]">
              No orders yet. Orders will appear here when customers purchase your products.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {orders.map((o) => (
                <div key={o.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--text)]">Order #{o.order_number}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {new Date(o.created_at).toLocaleDateString('en-IN')} · {o.full_name} · {o.city}
                      </p>
                    </div>
                    {/* Status selector — vendor updates order status */}
                    <select
                      value={o.status}
                      onChange={async (event) => {
                        const prev = o.status;
                        try {
                          const updated = await api.patch<BackendOrder>(
                            `/orders/vendor/${o.id}/status/`,
                            { status: event.target.value },
                            { token: token() },
                          );
                          setOrders((current) =>
                            current.map((order) => order.id === o.id ? updated : order),
                          );
                          toast.success(`Status updated to "${event.target.value}"`);
                        } catch (statusError) {
                          toast.error(statusError instanceof Error ? statusError.message : 'Unable to update order status.');
                          // Revert UI to previous value
                          setOrders((current) =>
                            current.map((order) =>
                              order.id === o.id ? { ...order, status: prev } : order,
                            ),
                          );
                        }
                      }}
                      className="rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-2 py-1.5 text-xs text-[var(--text)] cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <span className="font-semibold text-sm text-[var(--text)]">
                      {formatINR(Number(o.total_amount))}
                    </span>
                  </div>
                  {/* Show only this vendor's items (backend already filters) */}
                  <div className="mt-3 space-y-1.5 pl-1 border-l-2 border-[var(--primary)]/20">
                    {o.items.map((item, index) => (
                      <p key={`${o.id}-${index}`} className="text-sm text-[var(--text-muted)]">
                        <span className="font-medium text-[var(--text)]">{item.product_name}</span>
                        {' '}× {item.quantity}
                        {' '}· {formatINR(Number(item.total_price))}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Shell>
    </Guard>
  );
}

// ─── Real Vendor Profile ───────────────────────────────────────────────────────
export function RealVendorProfile() {
  const { profile, setProfile } = useVendorData();

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    try {
      const updated = await api.patch<VendorProfile>('/vendor/profile/', body, { token: token() });
      setProfile(updated);
      toast.success('Business profile updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to save profile.');
    }
  };

  if (!profile) return (
    <Guard>
      <Shell active="Business Profile">
        <div className="py-24 text-center text-sm text-[var(--text-muted)]">Loading business profile…</div>
      </Shell>
    </Guard>
  );

  return (
    <Guard>
      <Shell active="Business Profile">
        {profile.status !== 'approved' && (
          <ApprovalBanner status={profile.status} reason={profile.rejection_reason} />
        )}
        <Card className="max-w-3xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--text)]">Business Profile</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Your vendor status is <strong className={profile.status === 'approved' ? 'text-green-600' : 'text-amber-600'}>{profile.status}</strong>.
              </p>
            </div>
            <Badge variant={profile.status === 'approved' ? 'success' : profile.status === 'rejected' ? 'danger' : 'warning'}>
              {profile.status}
            </Badge>
          </div>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            {([
              ['business_name',    'Business Name'],
              ['business_address', 'Business Address'],
              ['city',             'City'],
              ['state',            'State'],
              ['pincode',          'Pincode'],
              ['gstin',            'GSTIN'],
              ['website',          'Website'],
              ['description',      'Description'],
            ] as const).map(([field, label]) => (
              <Input
                key={field}
                label={label}
                name={field}
                defaultValue={profile[field] ?? ''}
              />
            ))}
            <div className="sm:col-span-2">
              <Button type="submit" leftIcon={<Pencil size={14} />}>Save Profile</Button>
            </div>
          </form>
        </Card>
      </Shell>
    </Guard>
  );
}

// ─── Real Admin Vendors ────────────────────────────────────────────────────────
export function RealAdminVendors() {
  const [vendors,  setVendors]  = React.useState<VendorProfile[]>([]);
  const [error,    setError]    = React.useState('');
  const [loading,  setLoading]  = React.useState(true);
  const [reason,   setReason]   = React.useState('');

  React.useEffect(() => {
    api.get<VendorProfileList | VendorProfile[]>('/admin/vendors/', { token: token() })
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as VendorProfileList).results ?? [];
        setVendors(list);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Unable to load vendors.'))
      .finally(() => setLoading(false));
  }, []);

  const action = async (id: number, act: 'approve' | 'reject' | 'suspend') => {
    try {
      const body = act === 'reject' ? { reason: reason || 'Does not meet marketplace requirements.' } : {};
      const updated = await api.patch<VendorProfile>(`/admin/vendors/${id}/${act}/`, body, { token: token() });
      setVendors((current) => current.map((v) => v.id === id ? updated : v));
      toast.success(`Vendor ${act}d successfully`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Unable to ${act} vendor.`);
    }
  };

  return (
    <AdminGuard>
      <GlobalLayout>
        <div className="container-fluid py-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Administration</p>
            <h1 className="mt-1 text-2xl font-bold font-display text-[var(--text)]">Vendor Management</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Approve, reject, or suspend vendor applications.</p>
          </div>

          {error && <div className="mb-5 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

          {loading ? (
            <div className="py-24 text-center text-sm text-[var(--text-muted)]">Loading vendor data from Django…</div>
          ) : vendors.length === 0 ? (
            <div className="py-24 text-center text-sm text-[var(--text-muted)]">No vendor applications yet.</div>
          ) : (
            <Card className="overflow-hidden">
              <div className="divide-y divide-[var(--border)]">
                {vendors.map((vendor) => (
                  <div key={vendor.id} className="p-5">
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                        <Users size={17} />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <p className="font-semibold text-[var(--text)]">{vendor.business_name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{vendor.email} · {vendor.city}, {vendor.state}</p>
                        {vendor.gstin && <p className="text-xs text-[var(--text-muted)]">GSTIN: {vendor.gstin}</p>}
                        {vendor.description && <p className="mt-1 text-xs text-[var(--text-muted)]">{vendor.description}</p>}
                        {vendor.rejection_reason && (
                          <p className="mt-1 text-xs text-red-600">Rejection reason: {vendor.rejection_reason}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={
                          vendor.status === 'approved'  ? 'success' :
                          vendor.status === 'rejected'  ? 'danger'  :
                          vendor.status === 'suspended' ? 'warning' : 'default'
                        }>
                          {vendor.status}
                        </Badge>
                        {vendor.status !== 'approved' && (
                          <Button size="sm" onClick={() => action(vendor.id, 'approve')} leftIcon={<CheckCircle2 size={13} />}>
                            Approve
                          </Button>
                        )}
                        {vendor.status !== 'rejected' && (
                          <Button size="sm" variant="secondary" onClick={() => action(vendor.id, 'reject')} leftIcon={<XCircle size={13} />}>
                            Reject
                          </Button>
                        )}
                        {vendor.status === 'approved' && (
                          <Button size="sm" variant="ghost" onClick={() => action(vendor.id, 'suspend')}>
                            Suspend
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </GlobalLayout>
    </AdminGuard>
  );
}



// ═══════════════════════════════════════════════════════════════════════════════
// VENDOR QUOTATION BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductDisplay {
  id: number;
  name: string;
  sku: string;
}

type VendorRequest = {
  id: number;
  quotation: number;
  quotation_number: string;
  quotation_status: string;
  rfq_number: string;
  product_name: string;
  product_display: ProductDisplay | null;
  quantity: number;
  unit_price: string;
  discount_pct: string;
  tax_pct: string;
  availability_qty: number;
  available_from: string | null;
  vendor_quote_ref: string;
  notes: string;
  required_by_date: string;
  delivery_location: string;
  customer_name: string | null;
  customer_email: string | null;
  rfq_technical_specs: string;
  rfq_additional_notes: string;
  line_total: number;
  line_total_with_tax: number;
  created_at: string;
  updated_at: string;
};

type QuotationHeader = {
  id: number;
  quotation_number: string;
  status: string;
  shipping_charge: string;
  expected_delivery: string | null;
  valid_until: string | null;
  terms_notes: string;
  grand_total: number;
  delivery_location: string;
  created_at: string;
  rfq: {
    rfq_number: string;
    required_by_date: string | null;
    delivery_location: string;
    technical_specs: string;
    additional_notes: string;
  } | number;
};

// ─── Status helper ─────────────────────────────────────────────────────────────
function quotationStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
    draft: 'default', sent: 'info', viewed: 'info', negotiating: 'warning',
    revised: 'warning', accepted: 'success', rejected: 'danger',
    invoice_sent: 'info', payment_confirmed: 'success',
  };
  return map[status] ?? 'default';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-[var(--text-muted)] min-w-[110px] shrink-0">{label}:</span>
      <span className="text-[var(--text)] font-medium break-words">{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] mb-3">
      {children}
    </p>
  );
}

function LField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[var(--text)]">{label}</label>
      {children}
      {hint && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}

const iCls = "h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 text-sm text-[var(--text)] focus:border-[var(--primary)] outline-none transition-colors";
const taCls = "w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] outline-none transition-colors resize-none";

// ─── Item form state ──────────────────────────────────────────────────────────
type ItemForm = {
  unit_price: string;
  discount_pct: string;
  tax_pct: string;
  availability_qty: string;
  available_from: string;
  vendor_quote_ref: string;
  notes: string;
};

function makeItemForm(item: VendorRequest): ItemForm {
  return {
    unit_price:       String(item.unit_price       ?? '0'),
    discount_pct:     String(item.discount_pct     ?? '0'),
    tax_pct:          String(item.tax_pct          ?? '18'),
    availability_qty: String(item.availability_qty ?? 0),
    available_from:   item.available_from           ?? '',
    vendor_quote_ref: item.vendor_quote_ref         ?? '',
    notes:            item.notes                   ?? '',
  };
}

function calcTotals(f: ItemForm, qty: number) {
  const price   = parseFloat(f.unit_price   || '0') || 0;
  const disc    = parseFloat(f.discount_pct || '0') || 0;
  const taxPct  = parseFloat(f.tax_pct      || '0') || 0;
  const sub     = price * qty;
  const discAmt = sub * (disc / 100);
  const taxable = sub - discAmt;
  const taxAmt  = taxable * (taxPct / 100);
  return { sub, discAmt, taxable, taxAmt, total: taxable + taxAmt };
}

// ─── Line item card ───────────────────────────────────────────────────────────
function LineItem({
  item,
  form,
  onChange,
}: {
  item: VendorRequest;
  form: ItemForm;
  onChange: (p: Partial<ItemForm>) => void;
}) {
  const { total, discAmt, taxAmt } = calcTotals(form, item.quantity);
  const avail      = parseInt(form.availability_qty || '0', 10);
  const canFulfill = avail >= item.quantity;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-[var(--text)]">{item.product_name}</p>
          {item.product_display && (
            <p className="text-xs text-[var(--text-muted)]">SKU: {item.product_display.sku}</p>
          )}
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Qty requested: <strong className="text-[var(--text)]">{item.quantity}</strong>
            {item.required_by_date && (
              <span> · By <strong className="text-[var(--text)]">
                {new Date(item.required_by_date).toLocaleDateString('en-IN')}
              </strong></span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-[var(--primary)]">
            ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[var(--text-muted)]">line total incl. tax</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <LField label="Unit Price (₹) *">
          <input type="number" step="0.01" min="0"
            value={form.unit_price}
            onChange={(e) => onChange({ unit_price: e.target.value })}
            className={iCls} placeholder="0.00" />
        </LField>
        <LField label="Discount %" hint={discAmt > 0 ? `−₹${discAmt.toFixed(2)}` : ''}>
          <input type="number" step="0.01" min="0" max="100"
            value={form.discount_pct}
            onChange={(e) => onChange({ discount_pct: e.target.value })}
            className={iCls} placeholder="0" />
        </LField>
        <LField label="GST / Tax %" hint={`+₹${taxAmt.toFixed(2)}`}>
          <input type="number" step="0.01" min="0" max="100"
            value={form.tax_pct}
            onChange={(e) => onChange({ tax_pct: e.target.value })}
            className={iCls} placeholder="18" />
        </LField>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <LField label="Available Qty">
          <input type="number" min="0"
            value={form.availability_qty}
            onChange={(e) => onChange({ availability_qty: e.target.value })}
            className={iCls} placeholder="0" />
          <div className={`mt-1 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
            canFulfill ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                       : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
          }`}>
            {canFulfill ? '✓ Can fulfill' : '⚠ Partial / unavailable'}
          </div>
        </LField>
        <LField label="Available From" hint="Blank = immediate">
          <input type="date"
            value={form.available_from}
            onChange={(e) => onChange({ available_from: e.target.value })}
            className={iCls} />
        </LField>
        <LField label="Your Quote Reference">
          <input type="text"
            value={form.vendor_quote_ref}
            onChange={(e) => onChange({ vendor_quote_ref: e.target.value })}
            className={iCls} placeholder="e.g. Q-2026-001" />
        </LField>
      </div>

      <LField label="Item Notes">
        <textarea rows={2}
          value={form.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className={taCls}
          placeholder="Lead time, packing, condition, warranty…" />
      </LField>
    </div>
  );
}

// ─── Terms state ──────────────────────────────────────────────────────────────
type TermsForm = {
  expected_delivery: string;
  valid_until:       string;
  shipping_charge:   string;
  payment_terms:     string;
  return_terms:      string;
  special_terms:     string;
};

function makeTerms(q?: QuotationHeader): TermsForm {
  let parsed: Record<string, string> = {};
  if (q?.terms_notes) {
    try { parsed = JSON.parse(q.terms_notes); } catch { parsed = { special_terms: q.terms_notes }; }
  }
  return {
    expected_delivery: q?.expected_delivery ?? '',
    valid_until:       q?.valid_until       ?? '',
    shipping_charge:   q?.shipping_charge   ?? '0',
    payment_terms:     parsed.payment_terms  ?? '',
    return_terms:      parsed.return_terms   ?? '',
    special_terms:     parsed.special_terms  ?? '',
  };
}

function packTerms(t: TermsForm): string {
  return JSON.stringify({
    payment_terms: t.payment_terms,
    return_terms:  t.return_terms,
    special_terms: t.special_terms,
  });
}

// ─── Grand total summary ───────────────────────────────────────────────────────
function GrandSummary({
  items,
  forms,
  shipping,
}: {
  items: VendorRequest[];
  forms: Record<number, ItemForm>;
  shipping: string;
}) {
  let sub = 0, disc = 0, tax = 0;
  items.forEach((item) => {
    const f = forms[item.id];
    if (!f) return;
    const t = calcTotals(f, item.quantity);
    sub  += parseFloat(f.unit_price || '0') * item.quantity;
    disc += t.discAmt;
    tax  += t.taxAmt;
  });
  const ship  = parseFloat(shipping || '0') || 0;
  const grand = sub - disc + tax + ship;

  return (
    <div className="rounded-xl border border-[var(--primary)]/20 bg-[var(--background-alt)] p-5 space-y-2 text-sm">
      <SectionTitle>Quotation Summary</SectionTitle>
      <div className="flex justify-between">
        <span className="text-[var(--text-muted)]">Subtotal</span>
        <span className="font-medium">₹{sub.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      {disc > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Discount</span>
          <span>−₹{disc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-[var(--text-muted)]">GST / Tax</span>
        <span className="font-medium">₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      {ship > 0 && (
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Delivery Charges</span>
          <span className="font-medium">₹{ship.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      )}
      <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-1">
        <span className="font-bold text-[var(--text)]">Grand Total</span>
        <span className="text-xl font-bold text-[var(--primary)]">
          ₹{grand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}

// ─── Full Quotation Builder ────────────────────────────────────────────────────
function VendorQuotationBuilder({
  quotationId,
  initialItems,
  onBack,
  onSaved,
}: {
  quotationId: number;
  initialItems: VendorRequest[];
  onBack: () => void;
  onSaved: (updated: VendorRequest[]) => void;
}) {
  const [items, setItems]   = React.useState<VendorRequest[]>(initialItems);
  const [forms, setForms]   = React.useState<Record<number, ItemForm>>(() => {
    const m: Record<number, ItemForm> = {};
    initialItems.forEach((it) => { m[it.id] = makeItemForm(it); });
    return m;
  });
  const [terms, setTerms]   = React.useState<TermsForm>(makeTerms);
  const [header, setHeader] = React.useState<QuotationHeader | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    api.get<{ quotation: QuotationHeader; vendor_items: VendorRequest[] }>(
      `/quotations/vendor/quotations/${quotationId}/`
    ).then((res) => {
      setHeader(res.quotation);
      setTerms(makeTerms(res.quotation));
      const si = res.vendor_items;
      setItems(si);
      const m: Record<number, ItemForm> = {};
      si.forEach((it) => { m[it.id] = makeItemForm(it); });
      setForms(m);
    }).catch(() => {});
  }, [quotationId]);

  const updateForm = (id: number, patch: Partial<ItemForm>) =>
    setForms((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const buildPayloads = () => ({
    itemsPayload: items.map((it) => ({ id: it.id, ...forms[it.id] })),
    termsPayload: {
      expected_delivery: terms.expected_delivery || null,
      valid_until:       terms.valid_until       || null,
      shipping_charge:   terms.shipping_charge   || '0',
      terms_notes:       packTerms(terms),
    },
  });

  const saveDraft = async () => {
    setSaving(true);
    try {
      const { itemsPayload, termsPayload } = buildPayloads();
      const bulkRes = await api.post<{ updated: VendorRequest[]; errors: unknown[] }>(
        `/quotations/vendor/quotations/${quotationId}/items/bulk/`,
        { items: itemsPayload }
      );
      await api.patch(`/quotations/vendor/quotations/${quotationId}/terms/`, termsPayload);
      if (bulkRes.errors?.length) toast.error(`${bulkRes.errors.length} item(s) had errors.`);
      if (bulkRes.updated?.length) { setItems(bulkRes.updated); onSaved(bulkRes.updated); }
      toast.success('Draft saved.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const sendQuotation = async () => {
    setSending(true);
    try {
      const { itemsPayload, termsPayload } = buildPayloads();
      await api.post(`/quotations/vendor/quotations/${quotationId}/items/bulk/`, { items: itemsPayload });
      await api.patch(`/quotations/vendor/quotations/${quotationId}/terms/`, termsPayload);
      const res = await api.post<{ quotation: QuotationHeader; vendor_items: VendorRequest[]; message: string }>(
        `/quotations/vendor/quotations/${quotationId}/submit/`
      );
      toast.success(res.message ?? 'Quotation submitted to customer.');
      onSaved(res.vendor_items);
      onBack();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Send failed. Ensure all items have a unit price.');
    } finally {
      setSending(false);
    }
  };

  const rfqInfo = header && typeof header.rfq === 'object' ? header.rfq : null;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
            ← Back
          </button>
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">
              Quotation Builder
              {header && <span className="ml-2 text-base font-normal text-[var(--text-muted)]">#{header.quotation_number}</span>}
            </h2>
            <p className="text-sm text-[var(--text-muted)]">Fill in pricing and terms, then save or send.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={saveDraft} isLoading={saving} leftIcon={<Save size={13} />}>Save Draft</Button>
          <Button size="sm" onClick={sendQuotation} isLoading={sending} leftIcon={<Send size={13} />}>Send to Customer</Button>
        </div>
      </div>

      {/* RFQ context */}
      {(rfqInfo || header) && (
        <Card className="p-4 bg-[var(--background-alt)]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {header && <InfoRow label="Quotation #" value={header.quotation_number} />}
            {rfqInfo && <InfoRow label="RFQ #" value={String(rfqInfo.rfq_number ?? '')} />}
            {rfqInfo?.required_by_date && (
              <InfoRow label="Required By" value={new Date(rfqInfo.required_by_date).toLocaleDateString('en-IN')} />
            )}
            {header && <InfoRow label="Deliver To" value={header.delivery_location} />}
            {rfqInfo?.technical_specs && <InfoRow label="Tech Specs" value={rfqInfo.technical_specs} />}
            {rfqInfo?.additional_notes && <InfoRow label="RFQ Notes" value={rfqInfo.additional_notes} />}
          </div>
          {header && (
            <div className="mt-2">
              <Badge variant={quotationStatusVariant(header.status)}>{header.status?.replace(/_/g, ' ')}</Badge>
            </div>
          )}
        </Card>
      )}

      {/* Line items */}
      <Card className="p-5">
        <SectionTitle>Products &amp; Pricing</SectionTitle>
        <div className="space-y-4">
          {items.map((item) => (
            <LineItem
              key={item.id}
              item={item}
              form={forms[item.id] ?? makeItemForm(item)}
              onChange={(patch) => updateForm(item.id, patch)}
            />
          ))}
        </div>
      </Card>

      {/* Terms */}
      <Card className="p-5">
        <SectionTitle>Delivery &amp; Terms</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <LField label="Expected Delivery Date">
            <input type="date" value={terms.expected_delivery}
              onChange={(e) => setTerms((t) => ({ ...t, expected_delivery: e.target.value }))}
              className={iCls} />
          </LField>
          <LField label="Quotation Validity Until">
            <input type="date" value={terms.valid_until}
              onChange={(e) => setTerms((t) => ({ ...t, valid_until: e.target.value }))}
              className={iCls} />
          </LField>
          <LField label="Delivery / Shipping Charges (₹)">
            <input type="number" step="0.01" min="0"
              value={terms.shipping_charge}
              onChange={(e) => setTerms((t) => ({ ...t, shipping_charge: e.target.value }))}
              className={iCls} placeholder="0.00" />
          </LField>
          <LField label="Payment Terms" hint="e.g. 100% advance / Net 30">
            <input type="text" value={terms.payment_terms}
              onChange={(e) => setTerms((t) => ({ ...t, payment_terms: e.target.value }))}
              className={iCls} placeholder="e.g. 100% advance / Net 30" />
          </LField>
          <LField label="Return / Replacement Policy">
            <input type="text" value={terms.return_terms}
              onChange={(e) => setTerms((t) => ({ ...t, return_terms: e.target.value }))}
              className={iCls} placeholder="e.g. 7-day replacement for manufacturing defects" />
          </LField>
          <LField label="Special Terms / Conditions">
            <input type="text" value={terms.special_terms}
              onChange={(e) => setTerms((t) => ({ ...t, special_terms: e.target.value }))}
              className={iCls} placeholder="Any additional conditions" />
          </LField>
        </div>
      </Card>

      {/* Summary */}
      <GrandSummary items={items} forms={forms} shipping={terms.shipping_charge} />

      {/* Bottom actions */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-[var(--border)]">
        <Button variant="secondary" onClick={saveDraft} isLoading={saving} leftIcon={<Save size={14} />}>Save Draft</Button>
        <Button onClick={sendQuotation} isLoading={sending} leftIcon={<Send size={14} />}>Send Quotation to Customer</Button>
        <Button variant="ghost" onClick={onBack}>Cancel</Button>
      </div>
    </div>
  );
}

// ─── Group by quotation ───────────────────────────────────────────────────────
function groupByQuotation(items: VendorRequest[]) {
  const m = new Map<number, VendorRequest[]>();
  items.forEach((it) => {
    const arr = m.get(it.quotation) ?? [];
    arr.push(it);
    m.set(it.quotation, arr);
  });
  return m;
}

// ─── Quotation group card (list view) ─────────────────────────────────────────
function QuotationGroup({
  quotationId,
  items,
  onOpenBuilder,
}: {
  quotationId: number;
  items: VendorRequest[];
  onOpenBuilder: (id: number, items: VendorRequest[]) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const first     = items[0];
  const allQuoted = items.every((i) => Number(i.unit_price) > 0);
  const anyQuoted = items.some((i) => Number(i.unit_price) > 0);

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Group header */}
      <div
        role="button" tabIndex={0}
        onClick={() => setExpanded((e) => !e)}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((p) => !p)}
        className="flex flex-wrap items-center gap-4 p-4 cursor-pointer bg-[var(--background-alt)] hover:bg-[var(--surface-hover)] transition-colors"
      >
        <div className="flex-1 min-w-[180px]">
          <p className="font-bold text-[var(--text)]">{first.quotation_number}</p>
          <p className="text-xs text-[var(--text-muted)]">RFQ: {first.rfq_number} · {items.length} item{items.length !== 1 ? 's' : ''}</p>
          {first.delivery_location && <p className="text-xs text-[var(--text-muted)]">📍 {first.delivery_location}</p>}
        </div>
        {first.required_by_date && (
          <div className="hidden sm:block text-center">
            <p className="text-xs text-[var(--text-muted)]">Required By</p>
            <p className="text-sm font-medium text-[var(--text)]">{new Date(first.required_by_date).toLocaleDateString('en-IN')}</p>
          </div>
        )}
        <Badge variant={quotationStatusVariant(first.quotation_status)}>{first.quotation_status?.replace(/_/g, ' ')}</Badge>
        <Badge variant={allQuoted ? 'success' : anyQuoted ? 'warning' : 'default'}>
          {allQuoted ? '✓ All Quoted' : anyQuoted ? 'Partial' : 'Not Started'}
        </Badge>
        <Button
          size="sm"
          leftIcon={allQuoted ? <Pencil size={13} /> : <Send size={13} />}
          onClick={(e) => { e.stopPropagation(); onOpenBuilder(quotationId, items); }}
        >
          {allQuoted ? 'Edit Quotation' : 'Open Builder'}
        </Button>
        <div className="ml-auto text-[var(--text-muted)]">{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
      </div>

      {/* Expanded product rows */}
      {expanded && (
        <div className="divide-y divide-[var(--border)]">
          {items.map((it) => {
            const quoted = Number(it.unit_price) > 0;
            return (
              <div key={it.id} className="flex flex-wrap items-center gap-4 p-4 hover:bg-[var(--surface-hover)] transition-colors">
                <div className="flex-1 min-w-[180px]">
                  <p className="font-semibold text-sm text-[var(--text)]">{it.product_name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{it.rfq_number} · {it.quotation_number}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[var(--text-muted)]">Qty</p>
                  <p className="font-bold text-[var(--text)]">{it.quantity}</p>
                </div>
                {quoted && (
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)]">Your Price</p>
                    <p className="text-sm font-bold text-[var(--primary)]">
                      ₹{Number(it.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
                <Badge variant={quoted ? 'success' : 'warning'}>{quoted ? '✓ Quoted' : 'Pending'}</Badge>
                <Button size="sm" variant={quoted ? 'secondary' : 'primary'}
                  leftIcon={quoted ? <Pencil size={13} /> : <Send size={13} />}
                  onClick={() => onOpenBuilder(quotationId, items)}>
                  {quoted ? 'Edit' : 'Quote'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── VendorRequests Page ───────────────────────────────────────────────────────
export function VendorRequests() {
  const [items,   setItems]   = React.useState<VendorRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error,   setError]   = React.useState('');
  const [filter,  setFilter]  = React.useState('');
  const [builder, setBuilder] = React.useState<{ quotationId: number; items: VendorRequest[] } | null>(null);

  const load = React.useCallback(() => {
    setLoading(true); setError('');
    const qs = filter ? `?status=${encodeURIComponent(filter)}` : '';
    api.get<VendorRequest[] | { results: VendorRequest[] }>(`/quotations/vendor/requests/${qs}`)
      .then((res) => setItems(Array.isArray(res) ? res : (res.results ?? [])))
      .catch((e) => setError(e instanceof Error ? e.message : 'Unable to load requests.'))
      .finally(() => setLoading(false));
  }, [filter]);

  React.useEffect(() => { load(); }, [load]);

  const mergeItems = (updated: VendorRequest[]) => {
    setItems((prev) => {
      const map = new Map(prev.map((i) => [i.id, i]));
      updated.forEach((u) => map.set(u.id, u));
      return Array.from(map.values());
    });
  };

  if (builder) {
    return (
      <Guard>
        <Shell active="Dealer Requests">
          <VendorQuotationBuilder
            quotationId={builder.quotationId}
            initialItems={builder.items}
            onBack={() => setBuilder(null)}
            onSaved={(updated) => { mergeItems(updated); setBuilder(null); }}
          />
        </Shell>
      </Guard>
    );
  }

  const grouped   = groupByQuotation(items);
  const pending   = items.filter((i) => !Number(i.unit_price));
  const responded = items.filter((i) => !!Number(i.unit_price));

  return (
    <Guard>
      <Shell active="Dealer Requests">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">Dealer / RFQ Requests</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Quotation items assigned to your business. Open the builder to price, add terms, and send.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-9 rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 text-sm text-[var(--text)] focus:border-[var(--primary)] outline-none"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="negotiating">Negotiating</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
            <Button size="sm" variant="ghost" onClick={load}>↺ Refresh</Button>
          </div>
        </div>

        {!loading && items.length > 0 && (
          <div className="mb-5 grid grid-cols-3 gap-3">
            {[
              { label: 'Total Assigned',   value: items.length,     color: 'text-[var(--primary)]' },
              { label: 'Pending Response', value: pending.length,   color: 'text-amber-500' },
              { label: 'Responded',        value: responded.length, color: 'text-green-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-3 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            <AlertCircle size={16} />{error}
          </div>
        )}

        {loading && (
          <div className="py-16 text-center text-sm text-[var(--text-muted)]">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
            Loading assigned requests…
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <Card className="py-20 text-center">
            <CalendarClock className="mx-auto mb-4 text-[var(--text-muted)]" size={36} />
            <p className="font-semibold text-[var(--text)]">No requests assigned yet</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              When the admin assigns you to a customer RFQ, it will appear here.
            </p>
          </Card>
        )}

        {!loading && grouped.size > 0 && (
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([qId, qItems]) => (
              <QuotationGroup
                key={qId}
                quotationId={qId}
                items={qItems}
                onOpenBuilder={(id, its) => setBuilder({ quotationId: id, items: its })}
              />
            ))}
          </div>
        )}
      </Shell>
    </Guard>
  );
}

// ─── Real Vendor Purchase Orders ─────────────────────────────────────────────
export function RealVendorPurchaseOrders() {
  const [pos, setPos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  
  const [shipmentModalOpen, setShipmentModalOpen] = React.useState(false);
  const [shipmentPOId, setShipmentPOId] = React.useState<number | null>(null);
  const [shipmentForm, setShipmentForm] = React.useState({ status: 'processing', carrier: '', tracking_number: '' });

  React.useEffect(() => {
    api.get<any[]>('/quotations/vendor/purchase-orders/')
      .then((res) => {
        setPos(Array.isArray(res) ? res : (res as any).results ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Unable to load POs.'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const updated = await api.patch<any>(`/quotations/vendor/purchase-orders/${id}/status/`, { status: newStatus }, { token: token() });
      setPos(pos.map(po => po.id === id ? updated : po));
      toast.success(`PO status updated to ${newStatus}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to update status.');
    }
  };

  const generatePi = async (poId: number) => {
    try {
      const updated = await api.post<any>(`/quotations/vendor/purchase-orders/${poId}/proforma/`, {}, { token: token() });
      setPos(pos.map(po => {
        if (po.id === poId) {
          return { ...po, quotation_data: { ...po.quotation_data, invoice: updated } };
        }
        return po;
      }));
      toast.success('Proforma Invoice generated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate PI');
    }
  };

  const handleShipmentSubmit = async () => {
    if (!shipmentPOId) return;
    try {
      const updatedShipment = await api.post<any>(`/quotations/vendor/purchase-orders/${shipmentPOId}/shipment/`, shipmentForm, { token: token() });
      setPos(pos.map(po => {
        if (po.id === shipmentPOId) {
          return { ...po, shipment: updatedShipment };
        }
        return po;
      }));
      toast.success('Shipment updated');
      setShipmentModalOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update shipment');
    }
  };

  return (
    <Guard>
      <Shell active="Purchase Orders">
        <h2 className="mb-5 text-xl font-bold text-[var(--text)]">Purchase Orders</h2>
        <p className="mb-5 text-sm text-[var(--text-muted)]">
          These are the B2B Purchase Orders generated from accepted quotations containing your items.
        </p>
        {error && <p className="mb-4 text-sm text-[var(--danger)]">{error}</p>}
        {loading && <p className="mb-4 text-sm text-[var(--text-muted)]">Loading purchase orders…</p>}
        <Card className="overflow-hidden">
          {pos.length === 0 && !loading ? (
            <div className="py-16 text-center text-sm text-[var(--text-muted)]">
              No purchase orders yet.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {pos.map((po) => {
                const qd = po.quotation_data;
                const statusColor = po.status === 'issued' ? 'success' : po.status === 'acknowledged' ? 'info' : 'warning';
                return (
                  <div key={po.id} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--text)]">PO {po.po_number}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {new Date(po.created_at).toLocaleDateString('en-IN')} · Ref: {qd.quotation_number}
                        </p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge variant={statusColor}>{po.status.toUpperCase()}</Badge>
                        {qd.invoice && qd.invoice.status !== 'draft' && (
                          <Badge variant={qd.invoice.status === 'payment_confirmed' ? 'success' : qd.invoice.status === 'partially_paid' ? 'warning' : 'info'}>
                            PAY: {qd.invoice.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        )}
                        {po.shipment && (
                          <Badge variant={po.shipment.status === 'delivered' ? 'success' : po.shipment.status === 'shipped' ? 'info' : 'warning'}>
                            SHIP: {po.shipment.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <span className="font-semibold text-sm text-[var(--text)]">
                        {formatINR(Number(qd.grand_total))}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-[var(--background-alt)] p-3 rounded-lg border border-[var(--border)]">
                      <div>
                        <p className="font-medium text-[var(--text)] mb-1">Customer Details</p>
                        <p className="text-[var(--text-muted)]">{qd.customer_name}</p>
                        <p className="text-[var(--text-muted)]">{qd.customer_email}</p>
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text)] mb-1">Delivery Details</p>
                        <p className="text-[var(--text-muted)]">{qd.delivery_location}</p>
                        <p className="text-[var(--text-muted)]">By: {qd.expected_delivery ? new Date(qd.expected_delivery).toLocaleDateString('en-IN') : 'N/A'}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)]">Products</p>
                      <table className="w-full text-sm">
                        <thead className="text-[var(--text-muted)] border-b border-[var(--border)]">
                          <tr>
                            <th className="text-left py-1 font-medium">Item</th>
                            <th className="text-right py-1 font-medium">Qty</th>
                            <th className="text-right py-1 font-medium">Price</th>
                            <th className="text-right py-1 font-medium">GST %</th>
                            <th className="text-right py-1 font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                          {qd.items.map((item: any, i: number) => (
                            <tr key={i}>
                              <td className="py-2">{item.product_name}</td>
                              <td className="text-right py-2">{item.quantity}</td>
                              <td className="text-right py-2">{formatINR(Number(item.unit_price))}</td>
                              <td className="text-right py-2">{item.tax_pct}%</td>
                              <td className="text-right py-2 font-medium">{formatINR(Number(item.line_total_with_tax))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-5 flex gap-3">
                      {['pending', 'issued', 'acknowledged'].includes(po.status) && (
                        <>
                          <Button size="sm" variant="primary" onClick={() => updateStatus(po.id, 'accepted')} leftIcon={<CheckCircle2 size={14} />}>Accept PO</Button>
                          <Button size="sm" variant="secondary" onClick={() => updateStatus(po.id, 'rejected')} leftIcon={<XCircle size={14} />}>Reject</Button>
                        </>
                      )}
                      {po.status === 'accepted' && (
                        <Button size="sm" variant="primary" onClick={() => updateStatus(po.id, 'processing')} leftIcon={<Clock size={14} />}>Mark as Processing</Button>
                      )}
                      
                      {['accepted', 'processing'].includes(po.status) && (
                        qd.invoice ? (
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            leftIcon={<FileText size={14} />}
                            onClick={() => window.open(`/api/quotations/${qd.id}/invoice/pdf/?token=${token()}`, '_blank')}
                          >
                            {qd.invoice.is_proforma ? 'Download PI PDF' : 'Download Invoice PDF'}
                          </Button>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => generatePi(po.id)} leftIcon={<FileText size={14} />}>
                            Generate Proforma Invoice
                          </Button>
                        )
                      )}
                      {['processing'].includes(po.status) && po.shipment?.status !== 'delivered' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setShipmentPOId(po.id);
                            setShipmentForm({
                              status: po.shipment?.status || 'processing',
                              carrier: po.shipment?.carrier || '',
                              tracking_number: po.shipment?.tracking_number || ''
                            });
                            setShipmentModalOpen(true);
                          }}
                        >
                          Update Shipment
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </Shell>

      {/* Shipment Modal */}
      {shipmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-[var(--surface)] w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-[var(--text)]">Update Shipment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Status</label>
                <select
                  value={shipmentForm.status}
                  onChange={e => setShipmentForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full rounded-lg bg-[var(--background)] border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)]"
                >
                  <option value="processing">Processing</option>
                  <option value="ready_to_ship">Ready to Ship</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Carrier / Courier</label>
                <input
                  type="text"
                  value={shipmentForm.carrier}
                  onChange={e => setShipmentForm(f => ({ ...f, carrier: e.target.value }))}
                  className="w-full rounded-lg bg-[var(--background)] border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)]"
                  placeholder="e.g. BlueDart, FedEx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Tracking Number</label>
                <input
                  type="text"
                  value={shipmentForm.tracking_number}
                  onChange={e => setShipmentForm(f => ({ ...f, tracking_number: e.target.value }))}
                  className="w-full rounded-lg bg-[var(--background)] border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)]"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShipmentModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleShipmentSubmit}>Save Shipment</Button>
            </div>
          </div>
        </div>
      )}
    </Guard>
  );
}
