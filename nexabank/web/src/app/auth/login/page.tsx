'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Building2, AlertCircle, Fingerprint, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email_or_phone: z.string().min(1, 'Email or phone required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const result = await login(data);
      if (result.requires_2fa) {
        setOtpStep(true);
        toast.success('OTP sent to your registered number');
      } else {
        toast.success(`Welcome back, ${result.user.full_name.split(' ')[0]}!`);
        router.push('/dashboard');
      }
    } catch (err: any) {
      const message = err.response?.data?.error || 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-navy-700/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-gold-500/10 rounded-full blur-[80px]" />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        </div>
        <div className="relative text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-8 shadow-glow-gold">
            <Building2 size={36} className="text-navy-950" />
          </div>
          <h1 className="font-display text-5xl font-bold text-white mb-4 tracking-tight">NEXABANK</h1>
          <p className="text-slate-400 text-lg mb-12">Banking Reimagined for India</p>

          <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
            {[
              { icon: Shield, label: 'Secure', sub: '256-bit encryption' },
              { icon: Fingerprint, label: 'Biometric', sub: 'Face & fingerprint' },
              { icon: Building2, label: 'Insured', sub: 'RBI regulated' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="glass rounded-2xl p-3 text-center">
                <Icon size={18} className="text-gold-400 mx-auto mb-2" />
                <p className="text-white text-xs font-medium">{label}</p>
                <p className="text-slate-500 text-[10px] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <Building2 size={16} className="text-navy-950" />
            </div>
            <span className="font-display font-bold text-xl text-white">NEXABANK</span>
          </div>

          <AnimatePresence mode="wait">
            {!otpStep ? (
              <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="font-display text-3xl font-bold text-white mb-1">Welcome back</h2>
                <p className="text-slate-400 mb-8">Sign in to your account</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="text-sm text-slate-300 font-medium block mb-2">Email or Mobile Number</label>
                    <input
                      {...register('email_or_phone')}
                      className="nexabank-input"
                      placeholder="you@example.com or 9876543210"
                      autoComplete="username"
                    />
                    {errors.email_or_phone && (
                      <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5">
                        <AlertCircle size={12} /> {errors.email_or_phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-slate-300 font-medium">Password</label>
                      <Link href="/auth/forgot-password" className="text-xs text-gold-400 hover:text-gold-300">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        className="nexabank-input pr-10"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5">
                        <AlertCircle size={12} /> {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input {...register('remember')} type="checkbox" id="remember" className="w-4 h-4 rounded border-white/20 bg-white/5" />
                    <label htmlFor="remember" className="text-sm text-slate-400">Remember this device</label>
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base">
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-navy-950/30 border-t-navy-950 rounded-full animate-spin" /> Signing in...</>
                    ) : 'Sign In to NexaBank'}
                  </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                  <p className="text-slate-500 text-sm">
                    Don't have an account?{' '}
                    <Link href="/auth/register" className="text-gold-400 hover:text-gold-300 font-medium">Open free account</Link>
                  </p>
                  <div className="border-t border-white/5 pt-4">
                    <Link href="/admin/login" className="text-xs text-slate-500 hover:text-slate-400 transition-colors flex items-center justify-center gap-1">
                      <Shield size={12} /> Admin / Staff Login
                    </Link>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 className="font-display text-3xl font-bold text-white mb-1">Two-Factor Auth</h2>
                <p className="text-slate-400 mb-8">Enter the 6-digit code sent to your mobile</p>
                <div className="flex gap-3 justify-center mb-8">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/, '');
                        const newOtp = [...otp];
                        newOtp[i] = val;
                        setOtp(newOtp);
                        if (val && i < 5) {
                          (document.getElementById(`otp-${i + 1}`) as HTMLInputElement)?.focus();
                        }
                      }}
                      id={`otp-${i}`}
                      className="w-12 h-14 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-400 focus:outline-none transition-colors"
                    />
                  ))}
                </div>
                <button className="btn-primary w-full py-4">Verify Code</button>
                <button onClick={() => setOtpStep(false)} className="w-full text-sm text-slate-500 hover:text-slate-300 mt-4 transition-colors">← Back to login</button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
