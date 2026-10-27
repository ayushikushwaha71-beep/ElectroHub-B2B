'use client';

/**
 * Mock Address storage — persists to localStorage.
 */

import type { AddressType } from '@/types';

export interface MockAddress {
  id:        string;
  userId:    string;
  type:      AddressType;
  label?:    string;
  firstName: string;
  lastName:  string;
  phone:     string;
  line1:     string;
  line2?:    string;
  city:      string;
  state:     string;
  pincode:   string;
  country:   string;
  isDefault: boolean;
}

const ADDRESSES_KEY = 'electrohub_addresses';

const SEED_ADDRESSES: MockAddress[] = [
  {
    id:        'addr-001',
    userId:    '__seed__',
    type:      'home',
    label:     'Home',
    firstName: 'Alex',
    lastName:  'Johnson',
    phone:     '9876543210',
    line1:     '42 Circuit Street, Koramangala',
    line2:     '3rd Floor, Tower B',
    city:      'Bengaluru',
    state:     'Karnataka',
    pincode:   '560034',
    country:   'India',
    isDefault: true,
  },
  {
    id:        'addr-002',
    userId:    '__seed__',
    type:      'work',
    label:     'Office',
    firstName: 'Alex',
    lastName:  'Johnson',
    phone:     '9876543210',
    line1:     '100 Tech Park, Whitefield',
    city:      'Bengaluru',
    state:     'Karnataka',
    pincode:   '560066',
    country:   'India',
    isDefault: false,
  },
];

function getKey(userId: string) {
  return `${ADDRESSES_KEY}_${userId}`;
}

export function getStoredAddresses(userId: string): MockAddress[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(getKey(userId));
    if (raw) return JSON.parse(raw) as MockAddress[];
    // Seed on first access
    const seeded = SEED_ADDRESSES.map((a) => ({ ...a, userId }));
    localStorage.setItem(getKey(userId), JSON.stringify(seeded));
    return seeded;
  } catch {
    return [];
  }
}

export function saveAddresses(userId: string, addresses: MockAddress[]) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(getKey(userId), JSON.stringify(addresses));
  } catch {
    // ignore
  }
}
