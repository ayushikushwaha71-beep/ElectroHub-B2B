'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Zap,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  ArrowUp,
} from 'lucide-react';

// ─── Custom SVG Social Icons ──────────────────────────────────────────────────
const TwitterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
  </svg>
);
const InstagramIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);
const YoutubeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
  </svg>
);
const LinkedinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);
const GithubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);
const FacebookIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);
import { Logo } from './Header/Logo';
import { cn } from '@/utils/cn';

// ─── Footer link columns ──────────────────────────────────────────────────────
const FOOTER_COLS = [
  {
    title: 'Products',
    links: [
      { label: 'Arduino',        href: '/categories/arduino'        },
      { label: 'Raspberry Pi',   href: '/categories/raspberry-pi'  },
      { label: 'ESP32',          href: '/categories/esp32'          },
      { label: 'Sensors',        href: '/categories/sensors'        },
      { label: 'Motors',         href: '/categories/motors'         },
      { label: 'Displays',       href: '/categories/displays'       },
      { label: 'Power Modules',  href: '/categories/power-modules'  },
      { label: 'Robotics Kits',  href: '/categories/robotics'       },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign In',         href: '/login'     },
      { label: 'Create Account',  href: '/signup'    },
      { label: 'My Orders',       href: '/orders'    },
      { label: 'Wishlist',        href: '/wishlist'  },
      { label: 'My Profile',      href: '/profile'   },
      { label: 'Addresses',       href: '/addresses' },
      { label: 'Notifications',   href: '/notifications' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us',         href: '/about'    },
      { label: 'Careers',          href: '/careers', badge: "We're hiring!" },
      { label: 'Blog / Tutorials', href: '/blog'     },
      { label: 'Partner Program',  href: '/partners' },
      { label: 'Press',            href: '/press'    },
      { label: 'Sitemap',          href: '/sitemap'  },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center',       href: '/help'          },
      { label: 'Shipping Info',     href: '/shipping'      },
      { label: 'Returns & Refunds', href: '/returns'       },
      { label: 'Track Order',       href: '/track'         },
      { label: 'Bulk Orders',       href: '/bulk-orders'   },
      { label: 'Privacy Policy',    href: '/privacy'       },
      { label: 'Terms of Service',  href: '/terms'         },
    ],
  },
];

const SOCIAL = [
  { Icon: FacebookIcon,  href: '#', label: 'Facebook'  },
  { Icon: TwitterIcon,   href: '#', label: 'Twitter'   },
  { Icon: InstagramIcon, href: '#', label: 'Instagram' },
  { Icon: YoutubeIcon,   href: '#', label: 'YouTube'   },
  { Icon: LinkedinIcon,  href: '#', label: 'LinkedIn'  },
  { Icon: GithubIcon,    href: '#', label: 'GitHub'    },
];

const PAYMENTS = ['Visa', 'Mastercard', 'UPI', 'Net Banking', 'COD'];

// ─── Back to top ──────────────────────────────────────────────────────────────
function BackToTop() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  if (!show) return null;
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-30 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-lg hover:bg-[var(--primary-hover)] transition-colors"
      aria-label="Back to top"
    >
      <ArrowUp size={18} />
    </motion.button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function SiteFooter() {
  return (
    <>
      <footer
        className="bg-[var(--background-card)] border-t border-[var(--border)]"
        aria-label="Site footer"
      >
        {/* Main footer grid */}
        <div className="container-fluid py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
            {/* Brand column */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              <Logo size="md" />
              <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xs">
                India&apos;s most trusted electronics platform for makers, engineers,
                and students. 2,500+ genuine products, fast delivery, expert support.
              </p>

              {/* Contact */}
              <div className="flex flex-col gap-2">
                <a
                  href="mailto:support@electrohub.in"
                  className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                >
                  <Mail size={13} /> support@electrohub.in
                </a>
                <a
                  href="tel:+918800000000"
                  className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                >
                  <Phone size={13} /> +91 88000 00000
                </a>
                <span className="inline-flex items-start gap-2 text-xs text-[var(--text-muted)]">
                  <MapPin size={13} className="shrink-0 mt-0.5" />
                  Koregaon Park, Pune, Maharashtra 411001
                </span>
              </div>

              {/* Social */}
              <div className="flex gap-2 flex-wrap">
                {SOCIAL.map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-all"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {FOOTER_COLS.map((col) => (
              <div key={col.title} className="flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                  {col.title}
                </h3>
                <ul className="flex flex-col gap-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors group"
                      >
                        {link.label}
                        {'badge' in link && link.badge && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="border-t border-[var(--border)]">
          <div className="container-fluid py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Payment methods */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[var(--text-subtle)] font-medium">Secure payments:</span>
                {PAYMENTS.map((p) => (
                  <span
                    key={p}
                    className="px-2.5 py-1 text-[10px] font-semibold rounded-md border border-[var(--border)] text-[var(--text-muted)] bg-[var(--background-alt)]"
                  >
                    {p}
                  </span>
                ))}
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-3 text-xs text-[var(--text-subtle)] flex-wrap">
                <span className="flex items-center gap-1">🔒 SSL Secured</span>
                <span className="w-px h-4 bg-[var(--border)]" />
                <span className="flex items-center gap-1">✓ ISO 9001:2015</span>
                <span className="w-px h-4 bg-[var(--border)]" />
                <span className="flex items-center gap-1">⭐ 4.9/5 Rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="border-t border-[var(--border)] bg-[var(--background-alt)]">
          <div className="container-fluid py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--text-subtle)]">
              <p>
                © {new Date().getFullYear()} ElectroHub. All rights reserved.
                Made with ❤️ for makers in India.
              </p>
              <div className="flex items-center gap-4">
                <Link href="/privacy" className="hover:text-[var(--text)] transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-[var(--text)] transition-colors">Terms</Link>
                <Link href="/cookies" className="hover:text-[var(--text)] transition-colors">Cookies</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to top FAB */}
      <BackToTop />
    </>
  );
}
