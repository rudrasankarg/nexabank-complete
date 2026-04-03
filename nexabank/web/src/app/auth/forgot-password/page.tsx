'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm<{ email_or_phone: string }>();

  const onSubmit = async (data: { email_or_phone: string }) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8">

        {!sent ? (
          <>
            <Link href="/auth/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6">
              <Mail className="w-8 h-8 text-navy-600" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">Forgot Password?</h1>
            <p className="text-slate-500 mb-6">Enter your registered email or phone number. We'll send you a reset link.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email or Mobile Number</label>
                <input {...register('email_or_phone')} placeholder="email@example.com or 9876543210"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-navy-600 text-white py-3 rounded-xl font-semibold hover:bg-navy-700 transition-colors disabled:opacity-50 shadow-lg shadow-blue-900/20">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">Check Your Email</h2>
            <p className="text-slate-500 mb-8">
              If an account exists, we've sent a password reset link. Check your inbox and spam folder.
              The link expires in 10 minutes.
            </p>
            <Link href="/auth/login" className="block w-full bg-navy-600 text-white py-3 rounded-xl font-semibold hover:bg-navy-700 transition-colors shadow-lg shadow-blue-900/20">
              Back to Login
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
