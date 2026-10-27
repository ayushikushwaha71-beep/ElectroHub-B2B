import type { Metadata, Viewport } from 'next';
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/lib/providers';
import './globals.css';

// ─── Fonts ─────────────────────────────────────────────────────────────────────
const fontSans = Inter({
  subsets:  ['latin'],
  variable: '--font-sans',
  display:  'swap',
  weight:   ['300', '400', '500', '600', '700', '800', '900'],
});

const fontDisplay = Outfit({
  subsets:  ['latin'],
  variable: '--font-display',
  display:  'swap',
  weight:   ['300', '400', '500', '600', '700', '800', '900'],
});

const fontMono = JetBrains_Mono({
  subsets:  ['latin'],
  variable: '--font-mono',
  display:  'swap',
  weight:   ['400', '500', '600'],
});

// ─── Metadata ──────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    template: '%s | ElectroHub',
    default:  'ElectroHub — Your Electronics Destination',
  },
  description:
    'Premium electronics, Arduino, Raspberry Pi, ESP32, sensors, motors, displays, and robotics kits for makers and engineers.',
  keywords: [
    'electronics', 'Arduino', 'Raspberry Pi', 'ESP32', 'sensors',
    'motors', 'robotics', 'IoT', 'components', 'maker',
  ],
  authors:      [{ name: 'ElectroHub' }],
  creator:      'ElectroHub',
  metadataBase: new URL('https://electrohub.in'),
  openGraph: {
    type:        'website',
    locale:      'en_IN',
    url:         'https://electrohub.in',
    siteName:    'ElectroHub',
    title:       'ElectroHub — Your Electronics Destination',
    description: 'Premium electronics and components for makers, engineers, and enthusiasts.',
  },
  twitter: {
    card:  'summary_large_image',
    title: 'ElectroHub — Your Electronics Destination',
  },
  robots: {
    index:  true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width:              'device-width',
  initialScale:       1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)',  color: '#60a5fa' },
  ],
};

// ─── Root Layout ───────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
