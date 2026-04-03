'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    const verify = async () => {
      try {
        await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
      } catch (err) {
        setStatus('error');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center max-w-md w-full shadow-2xl">
        
        {status === 'loading' && (
          <div className="space-y-6">
            <Loader2 className="w-16 h-16 text-navy-600 animate-spin mx-auto" />
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Verifying your email...</h2>
            <p className="text-slate-500">Please wait while we confirm your account security.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Email Verified!</h2>
            <p className="text-slate-500">Your account is now fully active. You can now access all NexaBank features.</p>
            <Link href="/auth/login" className="block w-full bg-navy-600 text-white py-3.5 rounded-xl font-semibold hover:bg-navy-700 transition-all flex items-center justify-center gap-2">
              Continue to Login <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Verification Failed</h2>
            <p className="text-slate-500">The verification link is invalid or has expired. Please log in to request a new link.</p>
            <Link href="/auth/login" className="block w-full bg-navy-600 text-white py-3.5 rounded-xl font-semibold hover:bg-navy-700 transition-all">
              Back to Login
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy-950 flex items-center justify-center text-white">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
