'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { User, Mail, Calendar, Shield, Pencil, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth, type AuthUser } from '@/lib/providers/AuthProvider';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { formatDate } from '@/utils/format';
import { Badge } from '@/components/ui/Badge';

interface ProfileForm {
  name:  string;
  email: string;
}

export function AccountProfile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving,  setIsSaving]  = React.useState(false);
  const [savedUser, setSavedUser] = React.useState<AuthUser | null>(user);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  });

  // Sync when user changes
  React.useEffect(() => {
    if (user) {
      setSavedUser(user);
      reset({ name: user.name, email: user.email });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileForm) => {
    setIsSaving(true);
    try {
      const accessToken = typeof window !== 'undefined'
        ? localStorage.getItem('electrohub_access_token') ?? ''
        : '';

      // Split name into first/last
      const parts     = data.name.trim().split(/\s+/);
      const firstName = parts[0] ?? '';
      const lastName  = parts.slice(1).join(' ');

      await api.patch('/profile/', { first_name: firstName, last_name: lastName }, { token: accessToken });

      // Update local auth state
      const raw = localStorage.getItem('electrohub_user');
      if (raw) {
        const parsed  = JSON.parse(raw);
        const updated = { ...parsed, name: data.name };
        localStorage.setItem('electrohub_user', JSON.stringify(updated));
        setSavedUser(updated);
      }
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    reset({ name: savedUser?.name ?? '', email: savedUser?.email ?? '' });
    setIsEditing(false);
  };

  const initials = savedUser?.name
    ? savedUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const memberSince = savedUser?.createdAt
    ? formatDate(savedUser.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-[var(--text)]">Profile</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage your personal information</p>
        </div>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Pencil size={14} />}
            onClick={() => setIsEditing(true)}
            id="profile-edit-btn"
          >
            Edit
          </Button>
        )}
      </div>

      {/* Avatar + info card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden shadow-[var(--shadow-card)]">
        {/* Gradient top bar */}
        <div className="h-24 bg-gradient-to-r from-blue-600 via-violet-600 to-blue-800 relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #ffffff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}
          />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex items-end gap-4 -mt-10 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-2xl select-none shadow-lg ring-4 ring-[var(--background-card)]">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--success)] rounded-full border-2 border-[var(--background-card)] flex items-center justify-center">
                <Check size={10} className="text-white" />
              </div>
            </div>
            <div className="pb-2">
              <h3 className="font-bold text-[var(--text)] text-lg">{savedUser?.name}</h3>
              <Badge variant="success" size="sm" icon={<Shield size={10} />}>
                Verified Account
              </Badge>
            </div>
          </div>

          {/* Info grid (view mode) */}
          {!isEditing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={<User size={16} />}     label="Full Name"    value={savedUser?.name ?? '—'} />
              <InfoRow icon={<Mail size={16} />}     label="Email"        value={savedUser?.email ?? '—'} />
              <InfoRow icon={<Calendar size={16} />} label="Member Since" value={memberSince} />
              <InfoRow icon={<Shield size={16} />}   label="Account ID"   value={savedUser?.id ?? '—'} mono />
            </div>
          )}

          {/* Edit form */}
          {isEditing && (
            <motion.form
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  leftIcon={<User size={15} />}
                  error={errors.name?.message}
                  required
                  id="profile-name"
                  {...register('name', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })}
                />
                <Input
                  label="Email Address"
                  type="email"
                  leftIcon={<Mail size={15} />}
                  error={errors.email?.message}
                  required
                  id="profile-email"
                  hint="Cannot change email after registration"
                  readOnly
                  {...register('email')}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                  loadingText="Saving…"
                  id="profile-save-btn"
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleCancel}
                  disabled={isSaving}
                  id="profile-cancel-btn"
                >
                  Cancel
                </Button>
              </div>
            </motion.form>
          )}
        </div>
      </div>

      {/* Security notice */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
          <Shield size={16} className="text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text)]">Account Security</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Your account is protected. Password changes and email updates are not available in the demo.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon:    React.ReactNode;
  label:   string;
  value:   string;
  mono?:   boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--background-alt)]">
      <span className="text-[var(--text-muted)] mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-subtle)] mb-0.5">{label}</p>
        <p className={cn(
          'text-sm font-medium text-[var(--text)] break-all',
          mono && 'font-mono text-xs',
        )}>
          {value}
        </p>
      </div>
    </div>
  );
}
