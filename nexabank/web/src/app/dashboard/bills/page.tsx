'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Loader2, Zap, Wifi, Tv, Phone, Droplets, Flame, Car, GraduationCap, CreditCard, Mail } from 'lucide-react';
import { api } from '@/lib/api';
import { Account } from '@/types';
import toast from 'react-hot-toast';

const billCategories = [
  { id: 'electricity', label: 'Electricity', icon: Zap, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
  { id: 'water', label: 'Water', icon: Droplets, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  { id: 'gas', label: 'Gas', icon: Flame, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
  { id: 'internet', label: 'Internet', icon: Wifi, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' },
  { id: 'dth', label: 'DTH/Cable', icon: Tv, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
  { id: 'mobile', label: 'Mobile', icon: Phone, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  { id: 'fastag', label: 'FASTag', icon: Car, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
  { id: 'education', label: 'Education', icon: GraduationCap, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20' },
  { id: 'credit_card', label: 'Credit Card', icon: CreditCard, color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20' },
];

const operators: Record<string, string[]> = {
  electricity: ['MSEB', 'BSES Rajdhani', 'BSES Yamuna', 'TPDDL', 'CESC', 'BESCOM', 'TNEB', 'APSPDCL'],
  water: ['BMC', 'DJB', 'BWSSB', 'MCD'],
  gas: ['Mahanagar Gas', 'Gujarat Gas', 'Indraprastha Gas', 'Adani Gas'],
  internet: ['Jio Fiber', 'Airtel Fiber', 'BSNL Broadband', 'ACT Fibernet', 'Hathway'],
  dth: ['Tata Play', 'Dish TV', 'Airtel DTH', 'Sun Direct', 'Videocon D2H'],
  mobile: ['Jio', 'Airtel', 'Vi (Vodafone Idea)', 'BSNL'],
  fastag: ['Paytm FASTag', 'HDFC FASTag', 'ICICI FASTag', 'SBI FASTag'],
  education: ['School Fee', 'College Fee', 'Coaching Fee'],
  credit_card: ['HDFC Credit Card', 'SBI Credit Card', 'ICICI Credit Card', 'Axis Credit Card'],
};

const schema = z.object({
  account_id: z.string().min(1, 'Select account'),
  bill_type: z.string().min(1),
  operator: z.string().min(1, 'Select operator'),
  bill_reference: z.string().min(1, 'Enter consumer number / account ID'),
  amount: z.number({ invalid_type_error: 'Enter valid amount' }).min(1),
  description: z.string().optional(),
});

type BillForm = z.infer<typeof schema>;

export default function BillsPage() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [step, setStep] = useState<'select' | 'form' | 'otp' | 'success'>('select');
  const [otp, setOtp] = useState('');
  const [result, setResult] = useState<any>(null);
  const qc = useQueryClient();

  const { data: accData } = useQuery({ queryKey: ['accounts'], queryFn: () => api.get('/accounts').then(r => r.data) });
  const accounts: Account[] = accData?.accounts || [];

  const { data: txData } = useQuery({
    queryKey: ['recent-bills'],
    queryFn: () => api.get('/transactions', { params: { category: 'bill_payment', limit: 5 } }).then(r => r.data),
  });
  const recentBills = txData?.transactions || [];

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<BillForm>({
    resolver: zodResolver(schema),
  });

  const sendOTPMutation = useMutation({
    mutationFn: () => api.post('/transactions/request-otp').then(r => r.data),
    onSuccess: () => { setStep('otp'); toast.success('Verification code sent'); },
    onError: () => toast.error('Failed to send verification code'),
  });

  const mutation = useMutation({
    mutationFn: (data: BillForm) => api.post('/transactions/pay-bill', { ...data, otp }).then(r => r.data),
    onSuccess: (data) => {
      setResult(data);
      setStep('success');
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['recent-bills'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Payment failed'),
  });

  const selectCategory = (id: string) => {
    setSelectedCategory(id);
    setValue('bill_type', id);
    setStep('form');
  };

  const cat = billCategories.find(c => c.id === selectedCategory);

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Pay Bills</h2>
        <p className="text-slate-400 text-sm">Pay utility bills, recharges, and more</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'select' && (
          <motion.div key="select" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="grid grid-cols-3 gap-3">
              {billCategories.map(({ id, label, icon: Icon, color }) => (
                <button key={id} onClick={() => selectCategory(id)}
                  className="flex flex-col items-center gap-3 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>

            {/* Recent bills */}
            <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Quick Pay (Recent)</h3>
              {recentBills.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-4">No recent bills. Pay a bill to see it here.</p>
              ) : (
                <div className="space-y-3">
                  {recentBills.map((tx: any) => (
                    <button key={tx.transaction_ref} onClick={() => {
                      selectCategory(tx.bill_type);
                      setValue('operator', tx.description.split(' ')[0]);
                      setValue('bill_reference', tx.bill_reference);
                      setValue('amount', Number(tx.amount));
                    }}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-50 dark:border-slate-800 hover:border-brand-100 dark:hover:border-brand-900 group transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                          {billCategories.find(c => c.id === tx.bill_type)?.icon ? (
                            (() => { const Icon = billCategories.find(c => c.id === tx.bill_type)!.icon; return <Icon className="w-5 h-5" />; })()
                          ) : <Zap className="w-5 h-5" />}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{tx.description}</p>
                          <p className="text-xs text-slate-400 truncate w-32">{tx.bill_reference}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">₹{Number(tx.amount)}</p>
                        <p className="text-[10px] text-slate-400 uppercase">Repeat</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === 'form' && cat && (
          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <button onClick={() => { setStep('select'); reset(); setSelectedCategory(''); }}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm mb-5 transition-colors">
              ← Back to Categories
            </button>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.color}`}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{cat.label} Bill Payment</h3>
                  <p className="text-slate-400 text-xs">Instant payment · No charges</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Pay From</label>
                <select {...register('account_id')}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm">
                  <option value="">Select account</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.account_number} — ₹{Number(a.balance).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
                {errors.account_id && <p className="text-red-500 text-xs mt-1">{errors.account_id.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Select Operator / Provider</label>
                <select {...register('operator')}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm">
                  <option value="">Select operator</option>
                  {(operators[selectedCategory] || []).map(op => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
                {errors.operator && <p className="text-red-500 text-xs mt-1">{errors.operator.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {selectedCategory === 'mobile' ? 'Mobile Number' : selectedCategory === 'credit_card' ? 'Card Number' : 'Consumer / Account Number'}
                </label>
                <input {...register('bill_reference')}
                  placeholder={selectedCategory === 'mobile' ? '10-digit mobile number' : selectedCategory === 'electricity' ? 'Consumer number on bill' : 'Account / Reference number'}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-mono" />
                {errors.bill_reference && <p className="text-red-500 text-xs mt-1">{errors.bill_reference.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Amount (₹)</label>
                <input {...register('amount', { valueAsNumber: true })} type="number" placeholder="0.00"
                  className="w-full px-4 py-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-2xl font-bold" />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[100, 299, 499, 999, 1499, 2000].map(amt => (
                  <button key={amt} type="button" onClick={() => setValue('amount', amt)}
                    className={`py-2 rounded-xl text-sm font-medium border transition-all
                      ${watch('amount') === amt ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-300'}`}>
                    ₹{amt}
                  </button>
                ))}
              </div>

              <button onClick={handleSubmit(data => sendOTPMutation.mutate())} disabled={sendOTPMutation.isPending}
                className="w-full bg-brand-600 text-white py-4 rounded-xl font-semibold hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {sendOTPMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Pay Now (Requires OTP)</>}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'otp' && (
          <motion.div key="otp" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 text-center">
            <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-brand-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Verify Payment</h3>
            <p className="text-sm text-slate-500 mb-8">Enter 6-digit code sent to your email</p>
            
            <input type="text" maxLength={6} placeholder="000000" onChange={(e) => setOtp(e.target.value)}
              className="w-full mb-6 text-center text-3xl font-bold tracking-[1em] py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-brand-500 outline-none transition-all" />

            <button onClick={handleSubmit(data => mutation.mutate(data))} disabled={otp.length !== 6 || mutation.isPending}
              className="w-full bg-brand-600 text-white py-4 rounded-xl font-semibold hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Confirm Payment</>}
            </button>
            <button onClick={() => setStep('form')} className="mt-4 text-sm text-slate-400 hover:text-slate-600">Cancel</button>
          </motion.div>
        )}
        {step === 'success' && result && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-10 text-center">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Successful!</h3>
            <p className="text-3xl font-bold text-emerald-600 mb-6">₹{Number(result.amount).toLocaleString('en-IN')}</p>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-left space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Reference</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">{result.transaction_ref}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">New Balance</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹{Number(result.balance).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setStep('select'); setSelectedCategory(''); reset(); setResult(null); }}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Pay Another Bill
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
