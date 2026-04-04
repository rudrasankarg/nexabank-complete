'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token');
      router.push('/auth/login');
    }
  }, [token, router]);

  const onSubmit = async (data: FormData) => {
    if (!token) return;
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: data.password
      });
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center max-w-md w-full shadow-2xl">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">Password Reset!</h2>
          <p className="text-slate-500 mb-8">Your password has been updated. You can now login with your new password.</p>
          <Link href="/auth/login" className="block w-full bg-navy-600 text-white py-3 rounded-xl font-semibold hover:bg-navy-700 transition-colors shadow-lg shadow-blue-900/20">
            Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8">
        
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">Reset Password</h1>
        <p className="text-slate-500 mb-8">Create a new secure password for your NexaBank account.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input {...register('password')} type={showPass ? 'text' : 'password'}
                placeholder="Min 8 chars, uppercase, symbol"
                className="w-full pl-10 pr-12 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400" />
              <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input {...register('confirm_password')} type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat new password"
                className="w-full pl-10 pr-12 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400" />
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-navy-600 text-white py-3.5 rounded-xl font-semibold hover:bg-navy-700 transition-colors disabled:opacity-50 shadow-lg shadow-blue-900/20">
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-navy-950 text-white">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
