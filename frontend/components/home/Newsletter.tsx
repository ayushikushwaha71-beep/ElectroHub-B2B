'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, CheckCircle2, Zap, Bell, Tag, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ─── Feature items ────────────────────────────────────────────────────────────
const BENEFITS = [
  { icon: <Tag size={15} />,     label: 'Exclusive discount codes' },
  { icon: <Bell size={15} />,    label: 'Restock & new product alerts' },
  { icon: <Package size={15} />, label: 'Early access to deals' },
  { icon: <Zap size={15} />,     label: 'Weekly project tutorials' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function Newsletter() {
  const [email,      setEmail]      = React.useState('');
  const [submitted,  setSubmitted]  = React.useState(false);
  const [isLoading,  setIsLoading]  = React.useState(false);
  const [error,      setError]      = React.useState('');

  const validate = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Please enter a valid email address.';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(email);
    if (err) { setError(err); return; }
    setError('');
    setIsLoading(true);
    // Simulate async
    await new Promise((r) => setTimeout(r, 1200));
    setIsLoading(false);
    setSubmitted(true);
  };

  return (
    <section
      id="newsletter"
      className="py-20 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-violet-700"
      aria-label="Newsletter signup"
    >
      {/* Background patterns */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />

      <div className="relative container-fluid">
        <div className="max-w-2xl mx-auto text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm mb-6 shadow-lg"
          >
            <Mail size={30} className="text-white" />
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <h2 className="text-3xl sm:text-4xl font-black font-display text-white leading-tight">
              Stay in the{' '}
              <span className="bg-gradient-to-r from-yellow-300 to-amber-300 bg-clip-text text-transparent">
                Loop
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-blue-100 leading-relaxed">
              Join 25,000+ makers who get weekly project ideas, restocking alerts,
              and exclusive discounts straight to their inbox. Zero spam, unsubscribe anytime.
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-3 mt-6 mb-8"
          >
            {BENEFITS.map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-xs text-white/90 backdrop-blur-sm border border-white/10"
              >
                {b.icon}
                {b.label}
              </span>
            ))}
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                  >
                    <CheckCircle2 size={40} className="text-emerald-300" />
                  </motion.div>
                  <p className="text-lg font-bold text-white">You&apos;re subscribed! 🎉</p>
                  <p className="text-sm text-blue-100">
                    Welcome to the ElectroHub community. Check your inbox for a confirmation.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-3"
                  noValidate
                >
                  <div className="flex-1 flex flex-col gap-1.5">
                    <input
                      type="email"
                      id="newsletter-email"
                      name="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="your@email.com"
                      required
                      aria-label="Email address for newsletter"
                      aria-describedby={error ? 'newsletter-error' : undefined}
                      className="w-full h-12 px-5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white placeholder-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
                    />
                    {error && (
                      <p id="newsletter-error" className="text-xs text-red-300 text-left px-1">
                        {error}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    variant="gradient"
                    size="lg"
                    isLoading={isLoading}
                    loadingText="Subscribing…"
                    leftIcon={<Send size={16} />}
                    className="sm:w-auto bg-white text-blue-700 hover:bg-blue-50 border-0 shrink-0"
                  >
                    Subscribe Free
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-xs text-blue-200"
          >
            By subscribing, you agree to our Privacy Policy. We promise: no spam, ever.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
