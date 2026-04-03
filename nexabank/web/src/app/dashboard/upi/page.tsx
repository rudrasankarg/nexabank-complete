'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Zap, ArrowLeft, CheckCircle, Shield, Smartphone, 
  Info, Loader2, Mail, Clock, ArrowRight, ChevronDown 
} from 'lucide-react';
import { api } from '@/lib/api';
import { Account } from '@/types';
import toast from 'react-hot-toast';

function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const digits = 6;
  const vals = value.split('').concat(Array(digits).fill('')).slice(0, digits);
  return (
    <div className="flex gap-3 justify-center">
      {vals.map((d, i) => (
        <input key={i} type="tel" maxLength={1} value={d}
          className="w-12 h-14 text-center text-xl font-semibold border-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all
            border-slate-200 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-500"
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

export default function UPIPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [vpa, setVpa] = useState('');
  const [amount, setAmount] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [otp, setOtp] = useState('');
  const [txResult, setTxResult] = useState<any>(null);

  const { data: accData } = useQuery({ 
    queryKey: ['accounts'], 
    queryFn: () => api.get('/accounts').then(r => r.data) 
  });
  const accounts: Account[] = accData?.accounts || [];

  const sendOTPMutation = useMutation({
    mutationFn: () => api.post('/transactions/request-otp').then(r => r.data),
    onSuccess: () => { 
      setStep(2); 
      toast.success('Verification code sent to your email'); 
    },
    onError: () => toast.error('Failed to send OTP'),
  });

  const payMutation = useMutation({
    mutationFn: () => api.post('/transactions/transfer', {
      from_account_id: fromAccountId,
      to_vpa: vpa,
      amount: parseFloat(amount),
      description: description || `UPI payment to ${vpa}`,
      payment_mode: 'UPI',
      otp
    }).then(r => r.data),
    onSuccess: (data) => {
      setTxResult(data);
      setStep(3);
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['transactions-recent'] });
      toast.success('Payment successful');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Payment failed'),
  });

  const handleInitiate = () => {
    if (!fromAccountId) return toast.error('Select source account');
    if (!vpa.includes('@')) return toast.error('Invalid UPI ID');
    if (!amount || Number(amount) <= 0) return toast.error('Invalid amount');
    sendOTPMutation.mutate();
  };

  const selectedAccount = accounts.find(a => a.id === fromAccountId);

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </button>

      <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-3xl p-6 text-white mb-8 relative overflow-hidden shadow-xl shadow-cyan-500/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">UPI Payments</h2>
            <p className="text-white/70 text-sm italic">Instant. Secure. Limitless.</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5 flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Debit From</label>
                <div className="relative">
                  <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)}
                    className="w-full appearance-none px-4 py-3.5 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white pr-10 focus:ring-2 focus:ring-cyan-500 transition-all outline-none">
                    <option value="">Select account</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.account_number} ({a.account_type}) — ₹{parseFloat(String(a.balance)).toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {selectedAccount && (
                  <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    Available: ₹{parseFloat(String(selectedAccount.balance)).toLocaleString('en-IN')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pay to UPI ID (VPA)</label>
                <div className="relative">
                  <input type="text" placeholder="example@upi" value={vpa} onChange={(e) => setVpa(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-lg font-medium focus:ring-2 focus:ring-cyan-500 transition-all outline-none" />
                  <Shield className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                </div>
                <div className="flex gap-2 mt-3">
                  {['john@okaxis', 'alice@okhdfc', 'mom@upi'].map(prev => (
                    <button key={prev} onClick={() => setVpa(prev)} className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500 hover:bg-slate-200">{prev}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Amount (₹)</label>
                <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-3xl font-bold focus:ring-2 focus:ring-cyan-500 transition-all outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Remarks (optional)</label>
                <input type="text" placeholder="What's this for?" value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white" />
              </div>

              <div className="pt-4">
                <button onClick={handleInitiate} disabled={sendOTPMutation.isPending}
                  className="w-full bg-cyan-600 text-white py-4 rounded-2xl font-bold hover:bg-cyan-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30">
                  {sendOTPMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Continue</>}
                </button>
              </div>

              <div className="flex items-start gap-3 p-4 bg-cyan-50 dark:bg-cyan-900/10 rounded-2xl border border-cyan-100 dark:border-cyan-800">
                <Info className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                <p className="text-xs text-cyan-700 dark:text-cyan-400 leading-relaxed">
                  UPI transfers are instant. Ensure you have verified the recipient's VPA before confirming the payment.
                </p>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-16 h-16 bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl flex items-center justify-center">
                <Mail className="w-8 h-8 text-cyan-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verify Payment</h3>
                <p className="text-slate-500 text-sm mt-2">Enter the code sent to your email to authorize ₹{amount} transfer to {vpa}</p>
              </div>

              <OTPInput value={otp} onChange={setOtp} />

              <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
                <Clock className="w-4 h-4" />
                <span>Expires in 10:00 minutes</span>
              </div>

              <div className="w-full space-y-3">
                <button onClick={() => payMutation.mutate()} disabled={otp.length < 6 || payMutation.isPending}
                  className="w-full bg-cyan-600 text-white py-4 rounded-2xl font-bold hover:bg-cyan-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {payMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Confirm Payment <ArrowRight className="w-5 h-5" /></>}
                </button>
                <button onClick={() => setStep(1)} className="text-slate-500 text-sm font-medium hover:text-slate-900">Edit Details</button>
              </div>
            </motion.div>
          )}

          {step === 3 && txResult && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Successful</h3>
              <p className="text-slate-500 mb-8 max-w-xs text-sm">₹{txResult.amount} has been successfully transferred to <span className="font-bold text-slate-900 dark:text-white">{vpa}</span></p>
              
              <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-left space-y-2 mb-8">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Transaction Ref.</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white uppercase">{txResult.transaction_ref}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">New Balance</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{parseFloat(txResult.balance).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex w-full gap-3">
                <button onClick={() => { setStep(1); setOtp(''); setAmount(''); setVpa(''); }}
                  className="flex-1 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-sm">
                  New Payment
                </button>
                <button onClick={() => router.push('/dashboard/transactions')}
                  className="flex-1 bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-2xl font-bold text-sm">
                  View History
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
          <Smartphone className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold">Scan QR</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-center text-cyan-600">
          <Zap className="w-6 h-6 mx-auto mb-2" />
          <p className="text-xs font-semibold">My VPA</p>
        </div>
      </div>
    </div>
  );
}
