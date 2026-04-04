'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Lock, Eye, EyeOff, Shield, Smartphone, Monitor,
  CheckCircle, AlertTriangle, Trash2, Key, QrCode
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Enter current password'),
  new_password: z.string().min(8).regex(/[A-Z]/, 'Uppercase required').regex(/[0-9]/, 'Number required').regex(/[^A-Za-z0-9]/, 'Symbol required'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] });

type PwForm = z.infer<typeof passwordSchema>;

const InputField = ({ name, label, show, setShow, register, errors }: { name: any; label: string; show: boolean; setShow: any; register: any; errors: any }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input {...register(name)} type={show ? 'text' : 'password'}
        className="w-full pl-10 pr-12 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:ring-2 focus:ring-brand-500/20 outline-none" />
      <button type="button" onClick={() => setShow((v: boolean) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
    {(errors as any)[name] && <p className="text-red-500 text-[10px] mt-1">{(errors as any)[name]?.message}</p>}
  </div>
);

function PasswordSection() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PwForm>({
    resolver: zodResolver(passwordSchema),
  });

  const newPw = watch('new_password') || '';
  const strength = [newPw.length >= 8, /[A-Z]/.test(newPw), /[0-9]/.test(newPw), /[^A-Za-z0-9]/.test(newPw)].filter(Boolean).length;
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500'];

  const mutation = useMutation({
    mutationFn: (data: PwForm) => api.post('/users/change-password', data).then(r => r.data),
    onSuccess: () => { toast.success('Password changed successfully'); reset(); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to change password'),
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center">
          <Key className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Change Password</h3>
          <p className="text-slate-400 text-xs">Use a strong password with uppercase, numbers, and symbols</p>
        </div>
      </div>
      <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-4">
        <InputField name="current_password" label="Current Password" show={showCurrent} setShow={setShowCurrent} register={register} errors={errors} />
        <InputField name="new_password" label="New Password" show={showNew} setShow={setShowNew} register={register} errors={errors} />
        {newPw && (
          <div>
            <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= strength ? strengthColors[strength] : 'bg-slate-200 dark:bg-slate-700'}`} />
              ))}
            </div>
            <p className={`text-xs ${strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-amber-500' : strength === 3 ? 'text-yellow-500' : 'text-emerald-500'}`}>
              {strengthLabels[strength]}
            </p>
          </div>
        )}
        <InputField name="confirm_password" label="Confirm New Password" show={showConfirm} setShow={setShowConfirm} register={register} errors={errors} />
        <button type="submit" disabled={mutation.isPending}
          className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-md shadow-brand-500/10 active:scale-[0.98] transition-transform">
          {mutation.isPending ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

export default function SecurityPage() {
  const qc = useQueryClient();
  
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/profile').then(r => r.data),
  });

  const { data: sessionData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get('/users/sessions').then(r => r.data),
  });

  const twoFactorMutation = useMutation({
    mutationFn: (enabled: boolean) => api.patch('/users/notifications/preferences', { '2fa': enabled }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); toast.success('Security preference updated'); },
    onError: () => toast.error('Update failed'),
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/sessions/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sessions'] }); toast.success('Session terminated'); },
  });

  const deleteAllOthersMutation = useMutation({
    mutationFn: (currentId: string) => api.delete('/users/sessions/all/others', { data: { current_session_id: currentId } }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sessions'] }); toast.success('Other sessions terminated'); },
  });

  const profile = profileData?.user;
  const sessions = sessionData?.sessions || [];
  const currentSessionId = sessionData?.current_session_id;
  const twoFAEnabled = profile?.two_factor_enabled || false;

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Security Center</h2>
        <p className="text-slate-400 text-sm">Manage your account security and active sessions</p>
      </div>

      {/* Security Score */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Security Score</p>
            <p className="text-3xl font-bold mt-1">{twoFAEnabled ? '92' : '72'} / 100</p>
            <p className="text-white/70 text-sm mt-1">
              {twoFAEnabled ? 'Excellent — Your account is highly secure' : 'Good — Enable 2FA to reach 90+'}
            </p>
          </div>
          <div className="w-20 h-20 relative">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" strokeWidth="8" stroke="rgba(255,255,255,0.2)" fill="none" />
              <circle cx="40" cy="40" r="32" strokeWidth="8" stroke="white" fill="none"
                strokeDasharray={`${2 * Math.PI * 32 * (twoFAEnabled ? 0.92 : 0.72)} ${2 * Math.PI * 32 * (twoFAEnabled ? 0.08 : 0.28)}`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
              {twoFAEnabled ? '92%' : '72%'}
            </span>
          </div>
        </div>
      </div>

      <PasswordSection />

      {/* Two-Factor Auth */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white">Two-Factor Authentication</h3>
            <p className="text-slate-400 text-xs">Add an extra layer of security to your account</p>
          </div>
          <button onClick={() => twoFactorMutation.mutate(!twoFAEnabled)} disabled={twoFactorMutation.isPending}
            className={`relative w-12 h-6 rounded-full transition-all disabled:opacity-50 ${twoFAEnabled ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${twoFAEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
        {!twoFAEnabled ? (
          <div className="flex items-start gap-3 text-slate-500">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-600 dark:text-slate-400">2FA is disabled. Enable it to secure your account with an authenticator app like Google Authenticator or Authy.</p>
          </div>
        ) : (
          <div className="text-center py-4 space-y-3">
            <QrCode className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm text-slate-500">Scan the QR code with your authenticator app to set up 2FA.</p>
            <button className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors">
              Setup 2FA Now
            </button>
          </div>
        )}
      </div>

      {/* Active Devices */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
            <Monitor className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Active Sessions</h3>
            <p className="text-slate-400 text-xs">Devices currently logged into your account</p>
          </div>
        </div>
        <div className="space-y-3">
          {sessionsLoading ? (
             <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-slate-50 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
          ) : sessions.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-4">No active sessions found.</p>
          ) : (
            sessions.map((session: any) => {
              const isCurrent = session.id === currentSessionId;
              return (
                <div key={session.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 transition-all group">
                  <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                    {session.device_name?.toLowerCase().includes('android') || session.device_name?.toLowerCase().includes('iphone') ? <Smartphone className="w-5 h-5 text-slate-500" /> : <Monitor className="w-5 h-5 text-slate-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{session.device_name || 'Browser Session'}</p>
                      {isCurrent && <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Current</span>}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {new Date(session.created_at).toLocaleDateString()} · {session.ip_address}
                    </p>
                  </div>
                  {!isCurrent && (
                    <button onClick={() => deleteSessionMutation.mutate(session.id)} disabled={deleteSessionMutation.isPending}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-slate-400 hover:text-red-500 transition-all disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
        <button onClick={() => deleteAllOthersMutation.mutate(currentSessionId)} disabled={deleteAllOthersMutation.isPending || sessions.length <= 1}
          className="w-full mt-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors border border-red-200 dark:border-red-800 disabled:opacity-50">
          {deleteAllOthersMutation.isPending ? 'Processing...' : 'Sign Out All Other Sessions'}
        </button>
      </div>
    </div>
  );
}
