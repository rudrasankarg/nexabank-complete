'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Lock, User, AlertTriangle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<{
    employee_id: string; password: string;
  }>();

  const onSubmit = async (data: { employee_id: string; password: string }) => {
    setLoading(true);
    try {
      const res = await adminApi.post('/admin/auth/login', {
        ...data,
        two_factor_code: requires2FA ? twoFactorCode : undefined
      });

      if (res.data.requires_2fa) {
        setRequires2FA(true);
        toast.success('Enter your 2FA code to continue');
        setLoading(false);
        return;
      }

      Cookies.set('admin_access_token', res.data.access_token, {
        expires: 1/3, // 8 hours
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      toast.success(`Welcome, ${res.data.admin.full_name}`);
      router.push('/admin/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Login failed';
      toast.error(msg);
      if (msg.includes('Account locked')) setRequires2FA(false);
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = () => {
    if (twoFactorCode.length !== 6) { toast.error('Enter 6-digit code'); return; }
    handleSubmit(onSubmit)();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-600/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Admin Portal</h1>
          <p className="text-slate-400 text-sm mt-1">NexaBank Internal System</p>
        </div>

        {/* Warning banner */}
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-2xl p-3 mb-6 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-amber-400 text-xs leading-relaxed">
            This portal is for authorized NexaBank staff only. All activities are logged and monitored.
            Unauthorized access will be prosecuted.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {!requires2FA ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Employee ID</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input {...register('employee_id', { required: 'Employee ID required' })}
                    placeholder="EMP-XXXXXX"
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-brand-500 transition-all font-mono" />
                </div>
                {errors.employee_id && <p className="text-red-400 text-xs mt-1">{errors.employee_id.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input {...register('password', { required: 'Password required' })}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-brand-500 transition-all" />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? 'Authenticating...' : <><Shield className="w-4 h-4" /> Secure Login</>}
              </button>
            </form>
          ) : (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 bg-brand-900/30 rounded-2xl flex items-center justify-center mx-auto">
                <Shield className="w-7 h-7 text-brand-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Two-Factor Authentication</h3>
                <p className="text-slate-400 text-sm mt-1">Enter the 6-digit code from your authenticator app</p>
              </div>
              <div className="flex gap-2 justify-center">
                {[...Array(6)].map((_, i) => (
                  <input key={i} type="tel" maxLength={1}
                    value={twoFactorCode[i] || ''}
                    onChange={(e) => {
                      const code = twoFactorCode.split('');
                      code[i] = e.target.value;
                      setTwoFactorCode(code.join(''));
                      if (e.target.value && i < 5) (e.target.nextSibling as HTMLInputElement)?.focus();
                    }}
                    className="w-11 h-13 text-center text-lg font-mono font-semibold bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-brand-500 transition-all py-3" />
                ))}
              </div>
              <button onClick={handle2FASubmit} disabled={loading || twoFactorCode.length < 6}
                className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button onClick={() => setRequires2FA(false)} className="text-slate-500 text-sm hover:text-slate-300 transition-colors">
                ← Back
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center border-t border-slate-800 pt-6">
          <a href="/auth/login" className="text-brand-400 text-sm hover:text-brand-300 font-medium transition-colors">
            ← Back to Customer Login
          </a>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © 2024 NexaBank · Admin Access Only · v1.0.0
        </p>
      </motion.div>
    </div>
  );
}
