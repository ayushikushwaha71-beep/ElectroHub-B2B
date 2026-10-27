'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Zap, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn }       from '@/utils/cn';
import { Button }   from '@/components/ui/Button';
import { Input }    from '@/components/ui/Input';
import { toast }    from '@/components/ui/Toast';
import { useAuth }  from '@/lib/providers/AuthProvider';

interface RegisterForm {
  name:            string;
  email:           string;
  password:        string;
  confirmPassword: string;
}

// ─── Password strength indicator ──────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Uppercase letter',       ok: /[A-Z]/.test(password) },
    { label: 'Number',                 ok: /\d/.test(password)    },
  ];
  const score = checks.filter((c) => c.ok).length;
  const color = score === 0 ? 'bg-[var(--border)]' : score === 1 ? 'bg-[var(--danger)]' : score === 2 ? 'bg-[var(--warning)]' : 'bg-[var(--success)]';

  if (!password) return null;

  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn('h-1 flex-1 rounded-full transition-all duration-300', i < score ? color : 'bg-[var(--border)]')}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {checks.map(({ label, ok }) => (
          <span key={label} className={cn('text-[10px] flex items-center gap-1', ok ? 'text-[var(--success)]' : 'text-[var(--text-subtle)]')}>
            <CheckCircle2 size={10} className={ok ? 'opacity-100' : 'opacity-30'} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RegisterPage() {
  const router                = useRouter();
  const { register: authReg, isLoggedIn } = useAuth();
  const [apiError, setApiError]           = React.useState('');
  const [showPwd,  setShowPwd]            = React.useState(false);
  const [showCPwd, setShowCPwd]           = React.useState(false);

  React.useEffect(() => {
    if (isLoggedIn) router.replace('/account');
  }, [isLoggedIn, router]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ mode: 'onBlur' });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: RegisterForm) => {
    setApiError('');
    // register() returns { error, user } — use the returned user directly
    // so routing works without relying on async React state.
    const { error, user: newUser } = await authReg(data.name, data.email, data.password);
    if (error) {
      setApiError(error.message);
    } else {
      toast.success('Account created!', { description: `Welcome to ElectroHub, ${data.name.split(' ')[0]}!` });
      // Customers always land on /account; vendors/admins go to their dashboards
      if (newUser?.role === 'vendor') router.push('/vendor/dashboard');
      else if (newUser?.role === 'admin') router.push('/admin/vendors');
      else router.push('/account');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

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
          <div className="h-1.5 bg-gradient-to-r from-violet-600 via-blue-500 to-violet-600" />

          <div className="p-8">
            {/* Heading */}
            <div className="flex flex-col items-center gap-3 mb-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20">
                <Zap size={24} className="text-violet-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display text-[var(--text)]">Create account</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">Join ElectroHub — it's free</p>
              </div>
            </div>

            {/* API error */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 flex items-center gap-2.5 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-bg)] px-4 py-3"
              >
                <span className="text-[var(--danger)] text-sm">{apiError}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {/* Name */}
              <Input
                label="Full Name"
                type="text"
                required
                placeholder="Ayushi Sharma"
                leftIcon={<User size={15} />}
                error={errors.name?.message}
                autoComplete="name"
                id="register-name"
                {...register('name', {
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  maxLength: { value: 60, message: 'Name is too long' },
                })}
              />

              {/* Email */}
              <Input
                label="Email Address"
                type="email"
                required
                placeholder="you@example.com"
                leftIcon={<Mail size={15} />}
                error={errors.email?.message}
                autoComplete="email"
                id="register-email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
                })}
              />

              {/* Password */}
              <div>
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPwd ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    leftIcon={<Lock size={15} />}
                    error={errors.password?.message}
                    autoComplete="new-password"
                    id="register-password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' },
                    })}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-[2.1rem] text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors"
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <PasswordStrength password={passwordValue} />
              </div>

              {/* Confirm password */}
              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showCPwd ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  leftIcon={<Lock size={15} />}
                  error={errors.confirmPassword?.message}
                  autoComplete="new-password"
                  id="register-confirm-password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (val) => val === passwordValue || 'Passwords do not match',
                  })}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowCPwd((v) => !v)}
                  className="absolute right-3 top-[2.1rem] text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors"
                  aria-label={showCPwd ? 'Hide password' : 'Show password'}
                >
                  {showCPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Terms notice */}
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                By creating an account, you agree to ElectroHub's{' '}
                <button type="button" className="text-[var(--primary)] hover:underline" onClick={() => toast.info('Terms coming soon!')}>Terms of Service</button>
                {' '}and{' '}
                <button type="button" className="text-[var(--primary)] hover:underline" onClick={() => toast.info('Privacy policy coming soon!')}>Privacy Policy</button>.
              </p>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                loadingText="Creating account…"
                rightIcon={!isSubmitting ? <ArrowRight size={16} /> : undefined}
                id="register-submit"
              >
                Create Account
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[var(--background-card)] px-3 text-xs text-[var(--text-subtle)]">
                  Already have an account?
                </span>
              </div>
            </div>

            <Link
              href="/login"
              className={cn(
                'flex items-center justify-center w-full h-10 rounded-lg',
                'border border-[var(--border)] text-sm font-medium text-[var(--text)]',
                'hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]',
                'transition-all duration-200',
              )}
            >
              Sign in instead
            </Link>
          </div>
        </motion.div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          <Link href="/" className="hover:text-[var(--primary)] hover:underline underline-offset-2 transition-colors">
            ← Back to ElectroHub
          </Link>
        </p>
      </div>
    </div>
  );
}
