'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send, ArrowRight, CheckCircle, Phone, ChevronDown,
  Building2, AlertCircle, Loader2, UserPlus, Clock, Mail
} from 'lucide-react';
import { api } from '@/lib/api';
import { Account } from '@/types';
import toast from 'react-hot-toast';

const transferSchema = z.object({
  from_account_id: z.string().min(1, 'Select source account'),
  to_account_number: z.string().min(9, 'Enter valid account number'),
  amount: z.number({ invalid_type_error: 'Enter valid amount' }).min(1).max(10000000),
  description: z.string().optional(),
  payment_mode: z.enum(['NEFT', 'IMPS', 'RTGS', 'UPI']),
  ifsc_code: z.string().optional(),
});
type TransferForm = z.infer<typeof transferSchema>;

const steps = ['Transfer Details', 'Verify OTP', 'Success'];

function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const digits = 6;
  const vals = value.split('').concat(Array(digits).fill('')).slice(0, digits);
  return (
    <div className="flex gap-3 justify-center">
      {vals.map((d, i) => (
        <input key={i} type="tel" maxLength={1} value={d}
          className="w-12 h-14 text-center text-xl font-semibold border-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all
            border-slate-200 dark:border-slate-700 focus:border-brand-500 dark:focus:border-brand-500"
          onChange={(e) => {
            const newVal = vals.slice();
            newVal[i] = e.target.value;
            onChange(newVal.join(''));
            if (e.target.value && i < digits - 1) {
              (e.target.nextSibling as HTMLInputElement)?.focus();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !d && i > 0) {
              (e.target as HTMLInputElement).previousSibling && ((e.target as HTMLInputElement).previousElementSibling as HTMLInputElement)?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}

export default function TransferPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [txResult, setTxResult] = useState<any>(null);
  const qc = useQueryClient();

  const { data: accData } = useQuery({ queryKey: ['accounts'], queryFn: () => api.get('/accounts').then(r => r.data) });
  const accounts: Account[] = accData?.accounts || [];

  const { register, handleSubmit, watch, formState: { errors } } = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
    defaultValues: { payment_mode: 'IMPS' },
  });

  const sendOTPMutation = useMutation({
    mutationFn: () => api.post('/transactions/request-otp').then(r => r.data),
    onSuccess: () => { setOtpSent(true); setStep(1); toast.success('OTP sent to your registered email'); },
    onError: () => toast.error('Failed to send OTP'),
  });

  const transferMutation = useMutation({
    mutationFn: (data: TransferForm) => api.post('/transactions/transfer', { ...data, otp }).then(r => r.data),
    onSuccess: (data) => {
      setTxResult(data);
      setStep(2);
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['transactions-recent'] });
      toast.success('Transfer successful');
      router.push('/dashboard/transactions');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Transfer failed'),
  });

  const onSubmit = (data: TransferForm) => sendOTPMutation.mutate();

  const selectedAccount = accounts.find(a => a.id === watch('from_account_id'));

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Fund Transfer</h2>
        <p className="text-slate-400 text-sm">Transfer money instantly to any bank account</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
              ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className="text-xs hidden sm:block text-slate-500">{s}</span>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-5">

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">From Account</label>
              <div className="relative">
                <select {...register('from_account_id')}
                  className="w-full appearance-none px-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white pr-10">
                  <option value="">Select account</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.account_number} ({a.account_type}) — ₹{parseFloat(String(a.balance)).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {errors.from_account_id && <p className="text-red-500 text-xs mt-1">{errors.from_account_id.message}</p>}
              {selectedAccount && (
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  Available: ₹{parseFloat(String(selectedAccount.balance)).toLocaleString('en-IN')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">To Account Number</label>
              <input {...register('to_account_number')} placeholder="Enter beneficiary account number"
                className="w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 font-mono tracking-wider" />
              {errors.to_account_number && <p className="text-red-500 text-xs mt-1">{errors.to_account_number.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">IFSC Code (for other banks)</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('ifsc_code')} placeholder="e.g. HDFC0001234 (optional for NexaBank)"
                  className="w-full pl-10 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 font-mono uppercase" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Amount (₹)</label>
              <input {...register('amount', { valueAsNumber: true })} type="number" placeholder="0.00"
                className="w-full px-4 py-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-2xl font-semibold font-mono" />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {['IMPS', 'NEFT', 'RTGS', 'UPI'].map(mode => {
                const selected = watch('payment_mode') === mode;
                return (
                  <label key={mode} className={`flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all
                    ${selected ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-brand-300'}`}>
                    <input {...register('payment_mode')} type="radio" value={mode} className="sr-only" />
                    <span className={`font-semibold text-sm ${selected ? 'text-brand-600' : 'text-slate-600 dark:text-slate-400'}`}>{mode}</span>
                    <span className="text-xs text-slate-400 mt-0.5">
                      {mode === 'IMPS' ? 'Instant' : mode === 'NEFT' ? '2 hrs' : mode === 'RTGS' ? '1 hr' : 'Now'}
                    </span>
                  </label>
                );
              })}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Remarks (optional)</label>
              <input {...register('description')} placeholder="Add a note"
                className="w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400" />
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">Always verify beneficiary details before transferring. NexaBank will never ask for your OTP.</p>
            </div>

            <button onClick={handleSubmit(onSubmit)} disabled={sendOTPMutation.isPending}
              className="w-full bg-brand-600 text-white py-4 rounded-xl font-semibold hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {sendOTPMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Send OTP to Verify</>}
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/20 rounded-2xl flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-brand-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Verify Transaction</h3>
              <p className="text-slate-500 text-sm mt-2">Enter the 6-digit OTP sent to your registered email</p>
            </div>

            <OTPInput value={otp} onChange={setOtp} />

            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>OTP expires in 10:00 minutes</span>
            </div>

            <div className="space-y-3">
              <button onClick={() => transferMutation.mutate(watch() as TransferForm)}
                disabled={otp.length < 6 || transferMutation.isPending}
                className="w-full bg-brand-600 text-white py-4 rounded-xl font-semibold hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {transferMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Confirm Transfer <ArrowRight className="w-5 h-5" /></>}
              </button>
              <button onClick={() => { setStep(0); setOtp(''); }}
                className="w-full py-3 text-slate-600 dark:text-slate-400 text-sm hover:text-slate-900 dark:hover:text-white transition-colors">
                ← Edit Details
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && txResult && (
          <motion.div key="step2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 text-center space-y-5">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Transfer Successful!</h3>
              <p className="text-3xl font-bold text-emerald-600 mt-2">₹{parseFloat(txResult.amount).toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Reference No.</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white text-sm">{txResult.transaction_ref}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">New Balance</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹{parseFloat(txResult.balance).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setStep(0); setOtp(''); setTxResult(null); }}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                New Transfer
              </button>
              <a href="/dashboard" className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium text-center hover:bg-brand-700 transition-colors">
                Dashboard
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
