'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Banknote,
  BadgeCheck,
  BarChart3,
  Box,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Package,
  Receipt,
  Search,
  Send,
  Settings,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
  Wallet,
  X,
  Plus,
  Pencil,
  Trash2,
  Eye,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { formatINR, formatDate } from '@/utils/format';
import { AdminRFQs }           from './AdminRFQs';
import { AdminApprovals }      from './AdminApprovals';
import { AdminVendorNotify }   from './AdminVendorNotify';
import { AdminPurchaseOrder }  from './AdminPurchaseOrder';
import { AdminInvoice }        from './AdminInvoice';

type ProductStatus = 'active' | 'draft' | 'low-stock';

type AdminSection = 'dashboard' | 'rfqs' | 'approvals' | 'vendor-notify' | 'purchase-order' | 'invoice';

type AdminNavItem = {
  label: string;
  icon: React.ElementType;
  active?: boolean;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  addedAt: string;
};

type OrderRow = {
  id: string;
  customer: string;
  email: string;
  date: string;
  amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: string[];
};

const NAV_ITEMS: AdminNavItem[] = [
  { label: 'Dashboard',      icon: LayoutDashboard, active: true },
  { label: 'Products',       icon: Package },
  { label: 'Categories',     icon: FolderOpen },
  { label: 'Brands',         icon: Building2 },
  { label: 'Orders',         icon: ShoppingBag },
  { label: 'RFQ Mgmt',      icon: FileText },
  { label: 'Approvals',      icon: BadgeCheck },
  { label: 'Vendor Notify',  icon: Send },
  { label: 'Purchase Order', icon: ClipboardList },
  { label: 'Invoice',        icon: Receipt },
  { label: 'Users',          icon: Users },
  { label: 'Reviews',        icon: Star },
  { label: 'Settings',       icon: Settings },
];

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'default' | 'danger'> = {
  active: 'success',
  draft: 'default',
  'low-stock': 'warning',
  pending: 'warning',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
};

const PRODUCT_SEED: ProductRow[] = [
  { id: 'PRD-101', name: 'Arduino UNO R4 WiFi', category: 'Arduino', price: 2499, stock: 48, status: 'active', addedAt: '2026-08-02' },
  { id: 'PRD-102', name: 'Raspberry Pi 5 8GB', category: 'Raspberry Pi', price: 7999, stock: 18, status: 'active', addedAt: '2026-08-03' },
  { id: 'PRD-103', name: 'ESP32 DevKit V1', category: 'ESP32 / ESP8266', price: 449, stock: 7, status: 'low-stock', addedAt: '2026-08-04' },
  { id: 'PRD-104', name: 'DHT22 Temperature Sensor', category: 'Sensors', price: 229, stock: 63, status: 'active', addedAt: '2026-08-06' },
  { id: 'PRD-105', name: 'MG996R Servo Motor', category: 'Motors', price: 589, stock: 11, status: 'active', addedAt: '2026-08-08' },
  { id: 'PRD-106', name: '4.3" TFT Touch Display', category: 'Displays', price: 1499, stock: 0, status: 'draft', addedAt: '2026-08-09' },
];

const ORDER_SEED: OrderRow[] = [
  { id: 'ORD-1024', customer: 'Aarav Sharma', email: 'aarav@email.com', date: '2026-08-14', amount: 3899, status: 'processing', items: ['Arduino UNO R4 WiFi', 'DHT22 Sensor'] },
  { id: 'ORD-1023', customer: 'Meera Nair', email: 'meera@email.com', date: '2026-08-13', amount: 12599, status: 'shipped', items: ['Raspberry Pi 5 8GB', 'Power Supply'] },
  { id: 'ORD-1022', customer: 'Rahul Verma', email: 'rahul@email.com', date: '2026-08-12', amount: 2149, status: 'delivered', items: ['ESP32 DevKit', 'Breadboard Kit'] },
  { id: 'ORD-1021', customer: 'Ishita Kapoor', email: 'ishita@email.com', date: '2026-08-11', amount: 5299, status: 'pending', items: ['Motor Driver', 'IR Sensor'] },
  { id: 'ORD-1020', customer: 'Nikhil Singh', email: 'nikhil@email.com', date: '2026-08-10', amount: 1849, status: 'cancelled', items: ['Display Module'] },
  { id: 'ORD-1019', customer: 'Priya Menon', email: 'priya@email.com', date: '2026-08-09', amount: 6999, status: 'delivered', items: ['Robotics Kit', 'Servo Motor'] },
];

const revenueOverview = [48, 62, 58, 76, 82, 88, 94, 78, 66, 86, 96, 108];

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatStatusLabel(status: string) {
  return status
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function AdminDashboard() {
  const [activeSection, setActiveSection] = React.useState<AdminSection>('dashboard');
  const [products, setProducts] = React.useState<ProductRow[]>(PRODUCT_SEED);
  const [orders] = React.useState<OrderRow[]>(ORDER_SEED);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>('ORD-1024');
  const [productSearch, setProductSearch] = React.useState('');
  const [productFilter, setProductFilter] = React.useState<'all' | ProductStatus>('all');
  const [orderSearch, setOrderSearch] = React.useState('');

  const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
  const totalUsers = 1842;
  const statCards = [
    { label: 'Total Products', value: products.length.toString(), change: '+12.4%', icon: Package, tone: 'bg-blue-500/10 text-blue-600' },
    { label: 'Orders', value: orders.length.toString(), change: '+8.1%', icon: ShoppingBag, tone: 'bg-violet-500/10 text-violet-600' },
    { label: 'Users', value: totalUsers.toLocaleString('en-IN'), change: '+5.7%', icon: Users, tone: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Revenue', value: formatINR(totalRevenue), change: '+18.2%', icon: CircleDollarSign, tone: 'bg-amber-500/10 text-amber-600' },
  ];

  const filteredProducts = products.filter((product) => {
    const query = productSearch.toLowerCase();
    const matchesQuery =
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.id.toLowerCase().includes(query);
    const matchesFilter = productFilter === 'all' ? true : product.status === productFilter;
    return matchesQuery && matchesFilter;
  });

  const filteredOrders = orders.filter((order) => {
    const query = orderSearch.toLowerCase();
    return (
      order.id.toLowerCase().includes(query) ||
      order.customer.toLowerCase().includes(query) ||
      order.email.toLowerCase().includes(query)
    );
  });

  const statusSummary = [
    { label: 'Pending', value: orders.filter((o) => o.status === 'pending').length, tone: 'warning' },
    { label: 'Processing', value: orders.filter((o) => o.status === 'processing').length, tone: 'info' },
    { label: 'Shipped', value: orders.filter((o) => o.status === 'shipped').length, tone: 'primary' },
    { label: 'Delivered', value: orders.filter((o) => o.status === 'delivered').length, tone: 'success' },
    { label: 'Cancelled', value: orders.filter((o) => o.status === 'cancelled').length, tone: 'danger' },
  ];

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== productId));
    toast.info('Product removed from the list');
  };

  const handleAddProduct = () => {
    toast.info('Product creation flow is ready for the next backend integration.');
  };

  const handleEditProduct = (product: ProductRow) => {
    toast.info(`Editing ${product.name}`);
  };

  const handleOrderDetails = (orderId: string) => {
    setSelectedOrderId((current) => (current === orderId ? null : orderId));
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Operations</p>
            <h1 className="mt-1 text-2xl font-bold font-display text-[var(--text)] sm:text-3xl">Admin Dashboard</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" leftIcon={<BarChart3 size={14} />}>
              Export report
            </Button>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={handleAddProduct}>
              Add product
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-3 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-[var(--surface)] px-3 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <LayoutDashboard size={18} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-subtle)]">ElectroHub</p>
                <p className="text-sm font-semibold text-[var(--text)]">Admin Panel</p>
              </div>
            </div>

            <nav className="space-y-1">
              {NAV_ITEMS.map(({ label, icon: Icon }) => {
                const isActive =
                  (label === 'Dashboard'      && activeSection === 'dashboard') ||
                  (label === 'RFQ Mgmt'       && activeSection === 'rfqs') ||
                  (label === 'Approvals'      && activeSection === 'approvals') ||
                  (label === 'Vendor Notify'  && activeSection === 'vendor-notify') ||
                  (label === 'Purchase Order' && activeSection === 'purchase-order') ||
                  (label === 'Invoice'        && activeSection === 'invoice');
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      if (label === 'RFQ Mgmt')         setActiveSection('rfqs');
                      else if (label === 'Dashboard')        setActiveSection('dashboard');
                      else if (label === 'Approvals')        setActiveSection('approvals');
                      else if (label === 'Vendor Notify')    setActiveSection('vendor-notify');
                      else if (label === 'Purchase Order')   setActiveSection('purchase-order');
                      else if (label === 'Invoice')          setActiveSection('invoice');
                      else toast.info(`${label} section coming soon`);
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                      isActive
                        ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                        : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
                    )}
                  >
                    <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', isActive ? 'bg-[var(--primary)]/10' : 'bg-[var(--background-alt)]')}>
                      <Icon size={15} />
                    </span>
                    <span className="flex-1">{label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="space-y-6">
            {activeSection === 'rfqs' ? (
              <AdminRFQs />
            ) : activeSection === 'approvals' ? (
              <AdminApprovals />
            ) : activeSection === 'vendor-notify' ? (
              <AdminVendorNotify />
            ) : activeSection === 'purchase-order' ? (
              <AdminPurchaseOrder onNavigateToInvoice={() => setActiveSection('invoice')} />
            ) : activeSection === 'invoice' ? (
              <AdminInvoice />
            ) : (
            <React.Fragment>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map(({ label, value, change, icon: Icon, tone }) => (
                <Card key={label} className="p-4" variant="default" rounded="xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-[var(--text-muted)]">{label}</p>
                      <p className="mt-2 text-2xl font-bold font-display text-[var(--text)]">{value}</p>
                    </div>
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', tone)}>
                      <Icon size={18} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[var(--success)]">
                    <ArrowUpRight size={12} />
                    <span>{change}</span>
                    <span className="text-[var(--text-subtle)]">vs last month</span>
                  </div>
                </Card>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <Card className="p-5" variant="default" rounded="2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text)]">Sales / Revenue Overview</h2>
                    <p className="text-sm text-[var(--text-muted)]">Monthly gross value</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text-muted)]">
                    <TrendingUp size={12} className="text-[var(--success)]" />
                    <span>+18.2%</span>
                  </div>
                </div>

                <div className="mt-6 flex h-40 items-end gap-2">
                  {revenueOverview.map((value, index) => (
                    <div key={monthLabels[index]} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex w-full items-end justify-center">
                        <div
                          className="w-full rounded-t-xl bg-gradient-to-t from-blue-600 via-blue-500 to-violet-500"
                          style={{ height: `${Math.max(value, 16)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--text-subtle)]">{monthLabels[index]}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5" variant="default" rounded="2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text)]">Order Status Summary</h2>
                    <p className="text-sm text-[var(--text-muted)]">Live order funnel</p>
                  </div>
                  <Wallet size={18} className="text-[var(--primary)]" />
                </div>

                <div className="space-y-3">
                  {statusSummary.map(({ label, value, tone }) => (
                    <div key={label} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={cn('h-2.5 w-2.5 rounded-full', {
                          'bg-[var(--warning)]': tone === 'warning',
                          'bg-[var(--primary)]': tone === 'primary' || tone === 'info',
                          'bg-[var(--success)]': tone === 'success',
                          'bg-[var(--danger)]': tone === 'danger',
                        })} />
                        <span className="text-sm text-[var(--text)]">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--text)]">{value}</span>
                        <Badge variant={tone as 'success' | 'warning' | 'info' | 'default' | 'danger'} size="xs">{value}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <Card className="overflow-hidden" variant="default" rounded="2xl">
                <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text)]">Recent Orders</h2>
                    <p className="text-sm text-[var(--text-muted)]">Latest customer activity</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    View all
                  </Button>
                </div>

                <div className="divide-y divide-[var(--border)]">
                  {orders.slice(0, 4).map((order) => (
                    <div key={order.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--background-alt)] text-[var(--primary)]">
                        <ShoppingBag size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--text)]">{order.customer}</p>
                        <p className="text-xs text-[var(--text-muted)]">{order.id} · {formatDate(order.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[var(--text)]">{formatINR(order.amount)}</p>
                        <Badge variant={STATUS_VARIANT[order.status]} size="xs" className="mt-1">
                          {formatStatusLabel(order.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="overflow-hidden" variant="default" rounded="2xl">
                <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text)]">Recent Products</h2>
                    <p className="text-sm text-[var(--text-muted)]">Inventory highlights</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Manage
                  </Button>
                </div>

                <div className="divide-y divide-[var(--border)]">
                  {products.slice(0, 4).map((product) => (
                    <div key={product.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--background-alt)] text-[var(--primary)]">
                        <Box size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--text)]">{product.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[var(--text)]">{product.stock} in stock</p>
                        <Badge variant={STATUS_VARIANT[product.status]} size="xs" className="mt-1">
                          {formatStatusLabel(product.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-4 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text)]">Product Management</h2>
                  <p className="text-sm text-[var(--text-muted)]">Track catalog inventory and publish state</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative">
                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
                    <Input
                      aria-label="Search products"
                      className="pl-9"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                    />
                  </div>
                  <select
                    aria-label="Filter products"
                    value={productFilter}
                    onChange={(event) => setProductFilter(event.target.value as 'all' | ProductStatus)}
                    className="h-10 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text)] outline-none"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="low-stock">Low stock</option>
                    <option value="draft">Draft</option>
                  </select>
                  <Button size="sm" leftIcon={<Plus size={14} />} onClick={handleAddProduct}>
                    Add
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                      <th className="px-3 py-3 font-medium">Product</th>
                      <th className="px-3 py-3 font-medium">Category</th>
                      <th className="px-3 py-3 font-medium">Price</th>
                      <th className="px-3 py-3 font-medium">Stock</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-[var(--border)] last:border-none">
                        <td className="px-3 py-3">
                          <div>
                            <p className="font-medium text-[var(--text)]">{product.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">{product.id}</p>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-[var(--text-muted)]">{product.category}</td>
                        <td className="px-3 py-3 font-medium text-[var(--text)]">{formatINR(product.price)}</td>
                        <td className="px-3 py-3 text-[var(--text)]">{product.stock}</td>
                        <td className="px-3 py-3">
                          <Badge variant={STATUS_VARIANT[product.status]} size="sm">
                            {formatStatusLabel(product.status)}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="secondary" size="xs" leftIcon={<Pencil size={12} />} onClick={() => handleEditProduct(product)}>
                              Edit
                            </Button>
                            <Button variant="destructive" size="xs" leftIcon={<Trash2 size={12} />} onClick={() => handleDeleteProduct(product.id)}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-4 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text)]">Order Management</h2>
                  <p className="text-sm text-[var(--text-muted)]">Customer orders and fulfillment status</p>
                </div>

                <div className="relative w-full max-w-xs">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
                  <Input
                    aria-label="Search orders"
                    className="pl-9"
                    placeholder="Search orders..."
                    value={orderSearch}
                    onChange={(event) => setOrderSearch(event.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                      <th className="px-3 py-3 font-medium">Order ID</th>
                      <th className="px-3 py-3 font-medium">Customer</th>
                      <th className="px-3 py-3 font-medium">Date</th>
                      <th className="px-3 py-3 font-medium">Amount</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <React.Fragment key={order.id}>
                        <tr className="border-b border-[var(--border)] last:border-none">
                          <td className="px-3 py-3 font-medium text-[var(--text)]">{order.id}</td>
                          <td className="px-3 py-3">
                            <div>
                              <p className="font-medium text-[var(--text)]">{order.customer}</p>
                              <p className="text-xs text-[var(--text-muted)]">{order.email}</p>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-[var(--text-muted)]">{formatDate(order.date)}</td>
                          <td className="px-3 py-3 font-semibold text-[var(--text)]">{formatINR(order.amount)}</td>
                          <td className="px-3 py-3">
                            <Badge variant={STATUS_VARIANT[order.status]} size="sm">
                              {formatStatusLabel(order.status)}
                            </Badge>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex justify-end">
                              <Button variant="secondary" size="xs" leftIcon={<Eye size={12} />} onClick={() => handleOrderDetails(order.id)}>
                                {selectedOrderId === order.id ? 'Hide' : 'Details'}
                              </Button>
                            </div>
                          </td>
                        </tr>

                        {selectedOrderId === order.id && (
                          <tr>
                            <td colSpan={6} className="bg-[var(--surface)] px-3 py-3">
                              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <p className="text-sm font-semibold text-[var(--text)]">Order items</p>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderId(null)}
                                    className="text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
                                    aria-label="Close order details"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                                <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                                  {order.items.map((item) => (
                                    <li key={item} className="flex items-center justify-between rounded-lg bg-[var(--surface)] px-2.5 py-2">
                                      <span>{item}</span>
                                      <span className="font-medium text-[var(--text)]">Qty: 1</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            </React.Fragment>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
