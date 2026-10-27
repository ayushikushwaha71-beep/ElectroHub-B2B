import type { Product } from '@/types';

export interface DemoVendor {
  id: string;
  businessName: string;
  email: string;
  rating: number;
  verified: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  city: string;
  gstin: string;
  description: string;
}

export const DEMO_VENDORS: DemoVendor[] = [
  {
    id: 'vendor-techtron',
    businessName: 'Techtron Electronics',
    email: 'sales@techtron.in',
    rating: 4.8,
    verified: true,
    status: 'approved',
    city: 'Bengaluru',
    gstin: '29AABCT1234F1Z5',
    description: 'Reliable development boards and embedded electronics for makers and engineering teams.',
  },
  {
    id: 'vendor-roboparts',
    businessName: 'RoboParts India',
    email: 'hello@roboparts.in',
    rating: 4.7,
    verified: true,
    status: 'approved',
    city: 'Pune',
    gstin: '27AABCR5678G1Z2',
    description: 'Robotics, motion control, and prototyping components for ambitious builds.',
  },
  {
    id: 'vendor-circuithub',
    businessName: 'CircuitHub Technologies',
    email: 'team@circuithub.in',
    rating: 4.6,
    verified: true,
    status: 'approved',
    city: 'Hyderabad',
    gstin: '36AABCC9012H1Z8',
    description: 'IoT modules, sensors, and power electronics tested for real-world projects.',
  },
  {
    id: 'vendor-embedded-world',
    businessName: 'Embedded World',
    email: 'orders@embeddedworld.in',
    rating: 4.5,
    verified: true,
    status: 'approved',
    city: 'Chennai',
    gstin: '33AABCE3456J1Z4',
    description: 'Displays, modules, and embedded accessories for labs and classrooms.',
  },
  {
    id: 'vendor-maker-components',
    businessName: 'Maker Components',
    email: 'support@makercomponents.in',
    rating: 4.4,
    verified: true,
    status: 'approved',
    city: 'Mumbai',
    gstin: '27AABCM7890K1Z1',
    description: 'Accessible components and kits for makers getting ideas off the breadboard.',
  },
];

export interface ProductVendor {
  vendorId: string;
  vendorName: string;
  vendorRating: number;
  vendorVerified: boolean;
}

const PRODUCT_VENDOR_IDS: Record<string, string> = {
  'ard-001': 'vendor-techtron',
  'ard-002': 'vendor-roboparts',
  'ard-003': 'vendor-techtron',
  'rpi-001': 'vendor-circuithub',
  'rpi-002': 'vendor-circuithub',
  'esp-001': 'vendor-embedded-world',
  'sen-001': 'vendor-maker-components',
};

export function getVendor(vendorId: string) {
  return DEMO_VENDORS.find((vendor) => vendor.id === vendorId) ?? DEMO_VENDORS[0];
}

export function getProductVendor(productId: string): ProductVendor {
  const vendor = getVendor(PRODUCT_VENDOR_IDS[productId] ?? 'vendor-maker-components');
  return {
    vendorId: vendor.id,
    vendorName: vendor.businessName,
    vendorRating: vendor.rating,
    vendorVerified: vendor.verified,
  };
}

export function getVendorProducts(vendorId: string, products: Product[]): Product[] {
  return products.filter((product) => getProductVendor(product.id).vendorId === vendorId);
}
