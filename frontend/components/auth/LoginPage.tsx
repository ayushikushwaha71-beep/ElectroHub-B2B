'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, Zap, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { cn }       from '@/utils/cn';
import { Button }   from '@/components/ui/Button';
import { Input }    from '@/components/ui/Input';
import { toast }    from '@/components/ui/Toast';
import { useAuth }  from '@/lib/providers/AuthProvider';

interface LoginForm {
  email:    string;
  password: string;
}

export function LoginPage() {
  const router              = useRouter();
  const { login, isLoggedIn, user } = useAuth();
  const [apiError, setApiError]       = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  // Helper: derive redirect path from role
  function roleRedirect(role: string | undefined) {
    if (role === 'vendor') return '/vendor/dashboard';
    if (role === 'admin')  return '/admin/vendors';
    return '/account';
  }

  // Redirect if already logged in (e.g. navigated to /login while session active)
  React.useEffect(() => {
    if (isLoggedIn) router.replace(roleRedirect(user?.role));
  }, [isLoggedIn, router, user?.role]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ mode: 'onBlur' });

  const onSubmit = async (data: LoginForm) => {
    setApiError('');
    // login() returns { error, user } — use the returned user directly
    // so routing works without waiting for React state to re-render.
    const { error, user: loggedInUser } = await login(data.email, data.password);
    if (error) {
      setApiError(error.message);
    } else {
      toast.success('Welcome back!');
      router.push(roleRedirect(loggedInUser?.role));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            'rounded-2xl border border-[var(--border)]',
            'bg-[var(--background-card)] shadow-[var(--shadow-lg)]',
            'overflow-hidden',
          )}
        >
          {/* Header gradient strip */}
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-violet-500 to-blue-600" />

          <div className="p-8">
            {/* Logo + heading */}
            <div className="flex flex-col items-center gap-3 mb-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                <Zap size={24} className="text-[var(--primary)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display text-[var(--text)]">Welcome back</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">Sign in to your ElectroHub account</p>
              </div>
            </div>

            {/* API error banner */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 flex items-center gap-2.5 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-bg)] px-4 py-3"
              >
                <span className="text-[var(--danger)] text-sm">{apiError}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                required
                placeholder="you@example.com"
                leftIcon={<Mail size={15} />}
                error={errors.email?.message}
                autoComplete="email"
                id="login-email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
                })}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  leftIcon={<Lock size={15} />}
                  error={errors.password?.message}
                  autoComplete="current-password"
                  id="login-password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-[2.1rem] text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Forgot password (placeholder) */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs text-[var(--primary)] hover:underline underline-offset-2"
                  onClick={() => toast.info('Password reset coming soon!')}
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                loadingText="Signing in…"
                rightIcon={!isSubmitting ? <ArrowRight size={16} /> : undefined}
                id="login-submit"
              >
                Sign In
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[var(--background-card)] px-3 text-xs text-[var(--text-subtle)]">
                  Don't have an account?
                </span>
              </div>
            </div>

            <Link
              href="/register"
              className={cn(
                'flex items-center justify-center w-full h-10 rounded-lg',
                'border border-[var(--border)] text-sm font-medium text-[var(--text)]',
                'hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]',
                'transition-all duration-200',
              )}
            >
              Create an account
            </Link>
          </div>
        </motion.div>

        {/* Back link */}
        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          <Link href="/" className="hover:text-[var(--primary)] hover:underline underline-offset-2 transition-colors">
            ← Back to ElectroHub
          </Link>
        </p>
      </div>
    </div>
  );
}
