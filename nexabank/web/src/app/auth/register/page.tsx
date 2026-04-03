'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Phone, Lock, Calendar, CreditCard, ArrowRight, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const schema = z.object({
  full_name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile number'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  confirm_password: z.string(),
  date_of_birth: z.string().min(1, 'Date of birth required'),
  gender: z.string().min(1, 'Gender is required'),
  agree_terms: z.boolean().refine(v => v, 'You must accept terms'),
}).refine(d => d.password === d.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] });

type FormData = z.infer<typeof schema>;

const steps = ['Details', 'Verify', 'Security', 'Review'];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [accountInfo, setAccountInfo] = useState<{ customer_id: string; account_number: string } | null>(null);
  
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const { register, handleSubmit, formState: { errors }, trigger, watch, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const sendOtp = async () => {
    const email = getValues('email');
    if (!email || errors.email) {
      toast.error('Please enter a valid email first');
      return;
    }
    setOtpLoading(true);
    try {
      await api.post('/auth/send-registration-otp', { email });
      setOtpSent(true);
      toast.success('Verification code sent!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send code');
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    const email = getValues('email');
    setOtpLoading(true);
    try {
      await api.post('/auth/verify-registration-otp', { email, otp });
      setEmailVerified(true);
      setStep(2);
      toast.success('Email verified successfully');
    } catch (err: any) {
      toast.error('Invalid verification code');
    } finally {
      setOtpLoading(false);
    }
  };

  const nextStep = async () => {
    if (step === 0) {
      const valid = await trigger(['full_name', 'email', 'phone', 'date_of_birth', 'gender']);
      if (valid) {
        if (!emailVerified) {
          sendOtp();
          setStep(1);
        } else {
          setStep(2);
        }
      }
    } else if (step === 1) {
      if (emailVerified) setStep(2);
    } else if (step === 2) {
      const valid = await trigger(['password', 'confirm_password']);
      if (valid) setStep(3);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { ...data, email_otp: otp });
      setAccountInfo({ customer_id: res.data.customer_id, account_number: res.data.account_number });
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success && accountInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center max-w-md w-full shadow-2xl">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">Account Created!</h2>
          <p className="text-slate-500 mb-6">Welcome to NexaBank. Check your email to verify your account.</p>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 mb-6 text-left space-y-3">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Customer ID</p>
              <p className="font-mono text-lg font-semibold text-navy-600">{accountInfo.customer_id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Account Number</p>
              <p className="font-mono text-lg font-semibold text-slate-900 dark:text-white">{accountInfo.account_number}</p>
            </div>
          </div>
          <p className="text-sm text-amber-600 bg-amber-50 rounded-xl p-3 mb-6">
            📋 Please save these details safely. You'll need your Customer ID to login.
          </p>
          <Link href="/auth/login" className="block w-full bg-navy-600 text-white py-3 rounded-xl font-semibold hover:bg-navy-700 transition-colors">
            Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-navy-950">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <span className="text-white font-semibold text-xl">NexaBank</span>
        </Link>
        <div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-semibold text-white leading-tight mb-4">
            Your financial journey starts here.
          </motion.h1>
          <p className="text-white/60 text-lg">Open your account in minutes with zero paperwork.</p>
          <div className="mt-10 space-y-4">
            {['Zero fees for first year', 'Instant account activation', 'Free debit card delivery', '24/7 customer support'].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 text-white/80">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <p className="text-white/30 text-sm">© 2024 NexaBank. All rights reserved.</p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg p-8">

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                  ${i <= step ? 'bg-navy-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] hidden sm:block ${i <= step ? 'text-navy-600 font-medium' : 'text-slate-400'}`}>{s}</span>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-navy-600' : 'bg-slate-100 dark:bg-slate-800'}`} />}
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">
            {step === 0 ? 'Personal Details' : step === 1 ? 'Email Verification' : step === 2 ? 'Security Setup' : 'Final Review'}
          </h2>
          <p className="text-slate-500 text-sm mb-6">Step {step + 1} of {steps.length}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {step === 0 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input {...register('full_name')} placeholder="As per PAN card"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 transition-all" />
                  </div>
                  {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input {...register('email')} type="email" placeholder="you@email.com"
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400" />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mobile</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input {...register('phone')} placeholder="10-digit number"
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400" />
                    </div>
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input {...register('date_of_birth')} type="date"
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                    </div>
                    {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Gender</label>
                    <select {...register('gender')}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <div className="space-y-6 py-4 text-center">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Mail className="w-8 h-8 text-navy-600" />
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">We've sent a 6-digit code to</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{watch('email')}</p>
                </div>
                <div className="flex justify-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full max-w-[200px] text-center text-2xl font-bold tracking-[0.5em] py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-300 placeholder:text-sm placeholder:tracking-normal"
                  />
                </div>
                <p className="text-sm text-slate-500">
                  Didn't receive it?{' '}
                  <button type="button" onClick={sendOtp} disabled={otpLoading} className="text-navy-600 font-medium hover:underline disabled:opacity-50">
                    Resend Code
                  </button>
                </p>
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={otpLoading || otp.length < 6}
                  className="w-full bg-navy-600 text-white py-3.5 rounded-xl font-semibold hover:bg-navy-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20"
                >
                  {otpLoading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </div>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input {...register('password')} type={showPass ? 'text' : 'password'}
                      placeholder="Min 8 chars, uppercase, number, symbol"
                      className="w-full pl-10 pr-12 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400" />
                    <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input {...register('confirm_password')} type={showConfirm ? 'text' : 'password'} placeholder="Repeat password"
                      className="w-full pl-10 pr-12 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400" />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>}
                </div>
              </>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 space-y-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-base">Registration Summary</h3>
                  {[
                    { label: 'Full Name', key: 'full_name' },
                    { label: 'Email Address', key: 'email' },
                    { label: 'Phone Number', key: 'phone' },
                  ].map(({ label, key }) => (
                    <div key={key} className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                      <span className="text-slate-500 text-sm">{label}</span>
                      <span className="text-slate-900 dark:text-white text-sm font-medium">{watch(key as keyof FormData) as string}</span>
                    </div>
                  ))}
                  <div className="pt-1">
                    <span className="badge badge-success">Email Verified ✓</span>
                  </div>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input {...register('agree_terms')} type="checkbox" className="mt-1 rounded" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    I agree to the{' '}
                    <Link href="/terms" className="text-navy-600 hover:underline">Terms of Service</Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-navy-600 hover:underline">Privacy Policy</Link>.
                    I consent to KYC verification.
                  </span>
                </label>
                {errors.agree_terms && <p className="text-red-500 text-xs">{errors.agree_terms.message}</p>}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <button type="button" onClick={() => setStep(s => s - 1)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Back
                </button>
              )}
              {step < steps.length - 1 ? (
                step !== 1 && (
                  <button type="button" onClick={nextStep}
                    className="flex-1 bg-navy-600 text-white py-3.5 rounded-xl font-semibold hover:bg-navy-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                )
              ) : (
                <button type="submit" disabled={loading}
                  className="flex-1 bg-navy-600 text-white py-3.5 rounded-xl font-semibold hover:bg-navy-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-900/20">
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              )}
            </div>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-navy-600 font-medium hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
