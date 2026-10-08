/**
 * ElectroHub — Navigation & Mega Menu Data
 * Single source of truth for all navigation content.
 */

// ─── Mega Menu Category Type ───────────────────────────────────────────────────
export interface MegaMenuCategory {
  id:           string;
  label:        string;
  slug:         string;
  description:  string;
  iconName:     string;           // Lucide icon name
  accentColor:  string;          // Hex color for accent/icon
  imageUrl:     string;
  href:         string;
  subcategories: MegaMenuSubcategory[];
  featuredProducts: MegaMenuProduct[];
  trending:     string[];         // Quick-link labels
}

export interface MegaMenuSubcategory {
  label: string;
  href:  string;
  count?: number;
}

export interface MegaMenuProduct {
  name:  string;
  price: number;
  imageUrl: string;
  href:  string;
  badge?: string;
}

// ─── Mega Menu Categories ──────────────────────────────────────────────────────
export const MEGA_MENU_CATEGORIES: MegaMenuCategory[] = [
  {
    id:          'arduino',
    label:       'Arduino',
    slug:        'arduino',
    description: 'Official & compatible Arduino boards, shields, and starter kits for every project level.',
    iconName:    'cpu',
    accentColor: '#00979d',
    imageUrl:    'https://placehold.co/280x160/00979d/ffffff?text=Arduino',
    href:        '/categories/arduino',
    subcategories: [
      { label: 'Arduino UNO',      href: '/product/ard-001',        count: 12 },
      { label: 'Arduino Mega',     href: '/product/ard-002',       count: 8  },
      { label: 'Arduino Nano',     href: '/product/ard-003',       count: 10 },
      { label: 'Arduino Leonardo', href: '/categories/arduino/leonardo',   count: 5  },
      { label: 'Arduino Shields',  href: '/categories/arduino/shields',    count: 24 },
      { label: 'Starter Kits',     href: '/categories/arduino/kits',       count: 7  },
    ],
    featuredProducts: [
      { name: 'Arduino UNO R4 WiFi',    price: 2499, imageUrl: 'https://placehold.co/80x80/00979d/fff?text=UNO', href: '/product/ard-001', badge: 'New' },
      { name: 'Arduino Mega 2560 R3',   price: 1899, imageUrl: 'https://placehold.co/80x80/00979d/fff?text=Mega', href: '/product/ard-002' },
      { name: 'Arduino Starter Kit Pro',price: 3299, imageUrl: 'https://placehold.co/80x80/00979d/fff?text=Kit',  href: '/product/ard-001', badge: 'Popular' },
    ],
    trending: ['UNO R4', 'Nano 33 IoT', 'Portenta H7', 'WiFi Shield'],
  },
  {
    id:          'raspberry-pi',
    label:       'Raspberry Pi',
    slug:        'raspberry-pi',
    description: 'Full-featured single-board computers for AI, IoT, robotics, and embedded Linux projects.',
    iconName:    'server',
    accentColor: '#c51a4a',
    imageUrl:    'https://placehold.co/280x160/c51a4a/ffffff?text=Raspberry+Pi',
    href:        '/categories/raspberry-pi',
    subcategories: [
      { label: 'Raspberry Pi 5',    href: '/product/rpi-001',     count: 6  },
      { label: 'Raspberry Pi 4',    href: '/product/rpi-002',     count: 12 },
      { label: 'Raspberry Pi Zero', href: '/categories/raspberry-pi/zero',    count: 8  },
      { label: 'Pi Pico / RP2040',  href: '/categories/raspberry-pi/pico',   count: 10 },
      { label: 'HATs & Add-ons',    href: '/categories/raspberry-pi/hats',   count: 18 },
      { label: 'Cases & Cooling',   href: '/categories/raspberry-pi/cases',  count: 14 },
    ],
    featuredProducts: [
      { name: 'Raspberry Pi 5 (8GB)',  price: 7499, imageUrl: 'https://placehold.co/80x80/c51a4a/fff?text=Pi5',  href: '/product/rpi-001', badge: 'New' },
      { name: 'Raspberry Pi 4 (4GB)',  price: 5999, imageUrl: 'https://placehold.co/80x80/c51a4a/fff?text=Pi4',  href: '/product/rpi-002' },
      { name: 'Raspberry Pi Pico W',   price:  799, imageUrl: 'https://placehold.co/80x80/c51a4a/fff?text=Pico', href: '/product/rpi-001', badge: 'Popular' },
    ],
    trending: ['Pi 5', 'Pico W', 'Pi Camera', 'Touch Display'],
  },
  {
    id:          'esp32',
    label:       'ESP32 / ESP8266',
    slug:        'esp32-esp8266',
    description: 'Wi-Fi & Bluetooth microcontrollers for IoT, smart home, and wireless sensor networks.',
    iconName:    'wifi',
    accentColor: '#e7442e',
    imageUrl:    'https://placehold.co/280x160/e7442e/ffffff?text=ESP32',
    href:        '/categories/esp32-esp8266',
    subcategories: [
      { label: 'ESP32 DevKit',      href: '/product/esp-001',      count: 14 },
      { label: 'ESP32-S3',          href: '/categories/esp32/s3',          count: 8  },
      { label: 'ESP32-C3',          href: '/categories/esp32/c3',          count: 6  },
      { label: 'ESP8266 NodeMCU',   href: '/product/esp-002',   count: 10 },
      { label: 'Wemos / LOLIN',     href: '/categories/esp32/wemos',       count: 7  },
      { label: 'ESP32 Modules',     href: '/categories/esp32/modules',     count: 12 },
    ],
    featuredProducts: [
      { name: 'ESP32-S3 DevKitC-1',  price:  599, imageUrl: 'https://placehold.co/80x80/e7442e/fff?text=S3',   href: '/product/esp-001', badge: 'Popular' },
      { name: 'ESP32 WROOM-32 Kit',  price:  449, imageUrl: 'https://placehold.co/80x80/e7442e/fff?text=ESP32', href: '/product/esp-001' },
      { name: 'NodeMCU ESP8266 V3',  price:  299, imageUrl: 'https://placehold.co/80x80/e7442e/fff?text=8266',  href: '/product/esp-002' },
    ],
    trending: ['ESP32-S3', 'ESP32-C6', 'Wemos D1 Mini', 'ESP32 CAM'],
  },
  {
    id:          'sensors',
    label:       'Sensors',
    slug:        'sensors',
    description: 'Temperature, humidity, motion, gas, ultrasonic, IR, and specialty sensors for every application.',
    iconName:    'activity',
    accentColor: '#7c3aed',
    imageUrl:    'https://placehold.co/280x160/7c3aed/ffffff?text=Sensors',
    href:        '/categories/sensors',
    subcategories: [
      { label: 'Temperature & Humidity', href: '/product/sen-001', count: 18 },
      { label: 'Motion & PIR',           href: '/product/sen-002',      count: 12 },
      { label: 'Ultrasonic',             href: '/categories/sensors/ultrasonic',  count: 8  },
      { label: 'Gas & Air Quality',      href: '/categories/sensors/gas',         count: 14 },
      { label: 'Light & Color',          href: '/categories/sensors/light',       count: 10 },
      { label: 'Pressure & Force',       href: '/categories/sensors/pressure',    count: 9  },
    ],
    featuredProducts: [
      { name: 'DHT22 Temp & Humidity',   price:  199, imageUrl: 'https://placehold.co/80x80/7c3aed/fff?text=DHT22', href: '/product/sen-001', badge: 'Popular' },
      { name: 'HC-SR04 Ultrasonic',      price:   99, imageUrl: 'https://placehold.co/80x80/7c3aed/fff?text=HCSR04', href: '/product/sen-001' },
      { name: 'MPU6050 IMU Sensor',      price:  249, imageUrl: 'https://placehold.co/80x80/7c3aed/fff?text=MPU',   href: '/product/sen-002' },
    ],
    trending: ['BME280', 'MPU6050', 'VL53L0X', 'ACS712'],
  },
  {
    id:          'motors',
    label:       'Motors',
    slug:        'motors',
    description: 'DC motors, servo motors, stepper motors, brushless motors, and motor driver modules.',
    iconName:    'rotate-cw',
    accentColor: '#059669',
    imageUrl:    'https://placehold.co/280x160/059669/ffffff?text=Motors',
    href:        '/categories/motors',
    subcategories: [
      { label: 'DC Motors',          href: '/categories/motors/dc',        count: 16 },
      { label: 'Servo Motors',       href: '/categories/motors/servo',     count: 12 },
      { label: 'Stepper Motors',     href: '/product/mot-001',   count: 10 },
      { label: 'BLDC Motors',        href: '/categories/motors/bldc',      count: 8  },
      { label: 'Motor Drivers',      href: '/product/mot-002',   count: 14 },
      { label: 'Gear Motors',        href: '/categories/motors/gear',      count: 9  },
    ],
    featuredProducts: [
      { name: 'SG90 Micro Servo',      price:   99, imageUrl: 'https://placehold.co/80x80/059669/fff?text=SG90',  href: '/product/mot-001', badge: 'Popular' },
      { name: 'NEMA 17 Stepper',       price:  649, imageUrl: 'https://placehold.co/80x80/059669/fff?text=NEMA',  href: '/product/mot-001' },
      { name: 'L298N Motor Driver',    price:  149, imageUrl: 'https://placehold.co/80x80/059669/fff?text=L298N', href: '/product/mot-002' },
    ],
    trending: ['MG996R', 'TB6600', 'DRV8833', 'A4988'],
  },
  {
    id:          'displays',
    label:       'Displays',
    slug:        'displays',
    description: 'OLED, LCD, TFT, e-Paper displays and LED matrix modules for visual output in your projects.',
    iconName:    'monitor',
    accentColor: '#0ea5e9',
    imageUrl:    'https://placehold.co/280x160/0ea5e9/ffffff?text=Displays',
    href:        '/categories/displays',
    subcategories: [
      { label: 'OLED Displays',     href: '/product/dsp-002',    count: 10 },
      { label: 'LCD 16x2 / 20x4',  href: '/categories/displays/lcd',     count: 12 },
      { label: 'TFT / Color LCD',   href: '/product/dsp-001',     count: 8  },
      { label: 'e-Paper / e-Ink',   href: '/categories/displays/epaper',  count: 6  },
      { label: 'LED Matrix',        href: '/categories/displays/matrix',  count: 9  },
      { label: '7-Segment',         href: '/categories/displays/segment', count: 7  },
    ],
    featuredProducts: [
      { name: '0.96" OLED I2C 128x64',  price:  149, imageUrl: 'https://placehold.co/80x80/0ea5e9/fff?text=OLED', href: '/product/dsp-002', badge: 'Popular' },
      { name: '2.8" TFT Touch ILI9341', price:  599, imageUrl: 'https://placehold.co/80x80/0ea5e9/fff?text=TFT',  href: '/product/dsp-001' },
      { name: '1.54" e-Paper Module',   price:  799, imageUrl: 'https://placehold.co/80x80/0ea5e9/fff?text=ePaper', href: '/product/dsp-001' },
    ],
    trending: ['SSD1306', 'ST7789', 'ILI9488', 'MAX7219'],
  },
  {
    id:          'power-modules',
    label:       'Power Modules',
    slug:        'power-modules',
    description: 'Voltage regulators, LiPo chargers, power banks, step-up/down converters, and UPS modules.',
    iconName:    'zap',
    accentColor: '#f59e0b',
    imageUrl:    'https://placehold.co/280x160/f59e0b/ffffff?text=Power',
    href:        '/categories/power-modules',
    subcategories: [
      { label: 'Voltage Regulators', href: '/categories/power/regulators', count: 14 },
      { label: 'LiPo Chargers',      href: '/product/pwr-002',       count: 10 },
      { label: 'Buck Converters',     href: '/product/pwr-001',       count: 12 },
      { label: 'Boost Converters',    href: '/categories/power/boost',      count: 8  },
      { label: 'UPS Modules',         href: '/categories/power/ups',        count: 6  },
      { label: 'Solar Chargers',      href: '/categories/power/solar',      count: 5  },
    ],
    featuredProducts: [
      { name: 'LM2596 Buck Converter',  price:   99, imageUrl: 'https://placehold.co/80x80/f59e0b/fff?text=Buck', href: '/product/pwr-001', badge: 'Popular' },
      { name: 'TP4056 LiPo Charger',   price:   49, imageUrl: 'https://placehold.co/80x80/f59e0b/fff?text=TP',   href: '/product/pwr-002' },
      { name: 'XL6009 Boost Module',   price:  129, imageUrl: 'https://placehold.co/80x80/f59e0b/fff?text=Boost', href: '/product/pwr-001' },
    ],
    trending: ['LM7805', 'MT3608', 'XL4016', 'IP5306'],
  },
  {
    id:          'robotics-kits',
    label:       'Robotics Kits',
    slug:        'robotics-kits',
    description: 'Complete robot building kits, chassis, arms, drones, and STEM educational kits.',
    iconName:    'bot',
    accentColor: '#db2777',
    imageUrl:    'https://placehold.co/280x160/db2777/ffffff?text=Robotics',
    href:        '/categories/robotics-kits',
    subcategories: [
      { label: 'Arduino Robot Kits',  href: '/categories/robotics/arduino',  count: 8  },
      { label: 'Raspberry Pi Robots', href: '/categories/robotics/rpi',      count: 6  },
      { label: 'Chassis & Frames',    href: '/categories/robotics/chassis',  count: 14 },
      { label: 'Robot Arms',          href: '/categories/robotics/arms',     count: 7  },
      { label: 'STEM Kits',           href: '/categories/robotics/stem',     count: 10 },
      { label: 'Line Follower Kits',  href: '/categories/robotics/follower', count: 5  },
    ],
    featuredProducts: [
      { name: '4WD Robot Car Kit',      price: 1299, imageUrl: 'https://placehold.co/80x80/db2777/fff?text=4WD',   href: '/product/rob-002', badge: 'Popular' },
      { name: 'Robot Arm 6-DOF Kit',    price: 4499, imageUrl: 'https://placehold.co/80x80/db2777/fff?text=Arm',   href: '/product/rob-001' },
      { name: 'STEM Learning Kit Pro',  price: 2999, imageUrl: 'https://placehold.co/80x80/db2777/fff?text=STEM',  href: '/product/rob-002', badge: 'New' },
    ],
    trending: ['Tank Bot', 'MeArm', 'Zumo', 'Makeblock'],
  },
  {
    id:          'tools',
    label:       'Tools & Accessories',
    slug:        'tools-accessories',
    description: 'Soldering equipment, multimeters, oscilloscopes, jumper wires, breadboards, and more.',
    iconName:    'wrench',
    accentColor: '#475569',
    imageUrl:    'https://placehold.co/280x160/475569/ffffff?text=Tools',
    href:        '/categories/tools-accessories',
    subcategories: [
      { label: 'Soldering Kits',      href: '/categories/tools/soldering',   count: 12 },
      { label: 'Multimeters',         href: '/categories/tools/multimeters', count: 10 },
      { label: 'Breadboards',         href: '/categories/tools/breadboards', count: 8  },
      { label: 'Jumper Wires',        href: '/categories/tools/wires',       count: 14 },
      { label: 'Oscilloscopes',       href: '/categories/tools/scopes',      count: 6  },
      { label: 'Helping Hands',       href: '/categories/tools/helpers',     count: 7  },
    ],
    featuredProducts: [
      { name: 'Hakko FX-888D Soldering', price: 8999, imageUrl: 'https://placehold.co/80x80/475569/fff?text=Hakko', href: '/product/ard-001', badge: 'Premium' },
      { name: 'Digital Multimeter Pro',  price:  899, imageUrl: 'https://placehold.co/80x80/475569/fff?text=DMM',   href: '/product/ard-001' },
      { name: '830pt Breadboard Kit',    price:  199, imageUrl: 'https://placehold.co/80x80/475569/fff?text=BB',    href: '/product/ard-001', badge: 'Popular' },
    ],
    trending: ['Logic Analyzer', 'Hot Air Gun', 'PCB Holder', 'Flux Pen'],
  },
];

// ─── Primary Navigation Links ──────────────────────────────────────────────────
export interface NavLink {
  label:       string;
  href:        string;
  hasMegaMenu?: boolean;
  badge?:      string;
  isNew?:      boolean;
}

export const PRIMARY_NAV_LINKS: NavLink[] = [
  { label: 'Home',       href: '/' },
  { label: 'Categories', href: '/categories', hasMegaMenu: true },
  { label: 'Products',   href: '/products' },
  { label: 'Brands',     href: '/brands' },
  { label: 'Deals',      href: '/deals', badge: 'Hot', isNew: true },
  { label: 'Blog',       href: '/blog' },
];

// ─── Announcement Bar Messages ─────────────────────────────────────────────────
export interface Announcement {
  id:     string;
  text:   string;
  link?:  string;
  emoji?: string;
}

export const ANNOUNCEMENTS: Announcement[] = [
  { id: '1', text: 'Free Delivery on orders above ₹499', emoji: '🚚', link: '/products' },
  { id: '2', text: 'New Arrivals: ESP32-S3 & Arduino Uno R4', emoji: '✨', link: '/products?sort=newest' },
  { id: '3', text: 'Get 15% off on your first order! Use code WELCOME15', emoji: '🎉', link: '/products' },
  { id: '4', text: 'Raspberry Pi 5 Now In Stock — Order Now!', emoji: '🔥', link: '/product/raspberry-pi-5-8gb' },
];

// ─── Trending Searches ─────────────────────────────────────────────────────────
export const TRENDING_SEARCHES = [
  'Arduino UNO', 'ESP32', 'Raspberry Pi 5', 'DHT22', 'OLED Display',
  'Servo Motor', 'L298N', 'Breadboard', 'Jumper Wires', 'Stepper Motor',
];

// ─── Recent Search Keys ────────────────────────────────────────────────────────
export const RECENT_SEARCHES_KEY = 'eh_recent_searches';

// ─── Footer Links ──────────────────────────────────────────────────────────────
export const FOOTER_LINKS = {
  categories: [
    { label: 'Arduino',           href: '/categories/arduino'         },
    { label: 'Raspberry Pi',      href: '/categories/raspberry-pi'    },
    { label: 'ESP32 / ESP8266',   href: '/categories/esp32-esp8266'   },
    { label: 'Sensors',           href: '/categories/sensors'         },
    { label: 'Motors',            href: '/categories/motors'          },
    { label: 'Displays',          href: '/categories/displays'        },
    { label: 'Power Modules',     href: '/categories/power-modules'   },
    { label: 'Robotics Kits',     href: '/categories/robotics-kits'   },
    { label: 'Tools',             href: '/categories/tools-accessories'},
  ],
  support: [
    { label: 'Help Center',       href: '/support'         },
    { label: 'Track Order',       href: '/track-order'     },
    { label: 'Returns & Refunds', href: '/returns'         },
    { label: 'Shipping Policy',   href: '/shipping-policy' },
    { label: 'FAQs',              href: '/faq'             },
    { label: 'Contact Us',        href: '/contact'         },
  ],
  company: [
    { label: 'About Us',         href: '/about'      },
    { label: 'Careers',          href: '/careers'    },
    { label: 'Blog',             href: '/blog'       },
    { label: 'Press',            href: '/press'      },
    { label: 'Partners',         href: '/partners'   },
    { label: 'Affiliate',        href: '/affiliate'  },
  ],
  quickLinks: [
    { label: 'Deals & Offers',   href: '/deals'          },
    { label: 'New Arrivals',     href: '/products?sort=newest'     },
    { label: 'Bestsellers',      href: '/products?sort=bestseller' },
    { label: 'Bulk Orders',      href: '/bulk-orders'    },
    { label: 'Gift Cards',       href: '/gift-cards'     },
    { label: 'Sitemap',          href: '/sitemap'        },
  ],
  legal: [
    { label: 'Privacy Policy',   href: '/privacy'      },
    { label: 'Terms of Service', href: '/terms'        },
    { label: 'Cookie Policy',    href: '/cookies'      },
  ],
} as const;

// ─── Social Links ──────────────────────────────────────────────────────────────
export const SOCIAL_LINKS = [
  { platform: 'twitter',   label: 'Follow us on X',        href: 'https://x.com/electrohub',        iconName: 'twitter'   },
  { platform: 'instagram', label: 'Follow on Instagram',   href: 'https://instagram.com/electrohub', iconName: 'instagram' },
  { platform: 'youtube',   label: 'Watch on YouTube',      href: 'https://youtube.com/electrohub',   iconName: 'youtube'   },
  { platform: 'linkedin',  label: 'Connect on LinkedIn',   href: 'https://linkedin.com/company/electrohub', iconName: 'linkedin' },
  { platform: 'github',    label: 'GitHub',                href: 'https://github.com/electrohub',    iconName: 'github'    },
] as const;
