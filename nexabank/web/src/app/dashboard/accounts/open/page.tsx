'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, Landmark, PiggyBank, Calendar, ArrowLeft,
  CheckCircle, Loader2, AlertCircle, TrendingUp, Info
} from 'lucide-react';
import { api } from '@/lib/api';
import { Account } from '@/types';
import toast from 'react-hot-toast';

const types = [
  { id: 'savings', label: 'Savings Account', icon: PiggyBank, desc: 'High interest daily savings with full liquidity', rate: '4.5%' },
  { id: 'fixed_deposit', label: 'Fixed Deposit', icon: Shield, desc: 'Highest returns for fixed tenure investments', rate: '7.5%' },
  { id: 'current', label: 'Current Account', icon: Landmark, desc: 'Optimized for business and high-volume transactions', rate: '0%' },
];

export default function OpenAccountPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    account_type: 'savings',
    initial_deposit: 10000,
    source_account_id: '',
    tenure_days: 365,
    nomination_name: '',
    nomination_relation: '',
  });

  const { data: accData } = useQuery({ 
    queryKey: ['accounts'], 
    queryFn: () => api.get('/accounts').then(r => r.data) 
  });
  const accounts: Account[] = accData?.accounts || [];

  const openMutation = useMutation({
    mutationFn: (data: any) => api.post('/accounts/open', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Account opened successfully!');
      router.push('/dashboard/accounts');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to open account'),
  });

  const canProceed = () => {
    if (formData.account_type === 'fixed_deposit') {
      return formData.source_account_id && formData.initial_deposit >= 5000;
    }
    return formData.initial_deposit >= 1000;
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Accounts
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Open New Account</h2>
        <p className="text-slate-500 text-sm">Expand your banking relationship with NexaBank</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">1. Select Account Type</h3>
            <div className="space-y-3">
              {types.map(t => (
                <button key={t.id} onClick={() => setFormData({ ...formData, account_type: t.id })}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left
                    ${formData.account_type === t.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-brand-200'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.account_type === t.id ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    <t.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${formData.account_type === t.id ? 'text-brand-700 dark:text-brand-300' : 'text-slate-900 dark:text-white'}`}>{t.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{t.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{t.rate}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Per Annum</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">2. Investment Details</h3>
            <div className="space-y-5">
              {formData.account_type === 'fixed_deposit' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fund From Account</label>
                  <select onChange={(e) => setFormData({ ...formData, source_account_id: e.target.value })} value={formData.source_account_id}
                    className="w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500">
                    <option value="">Select funding source</option>
                    {accounts.filter(a => a.account_type === 'savings').map(a => (
                      <option key={a.id} value={a.id}>
                        {a.account_number} — ₹{parseFloat(String(a.balance)).toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Initial Deposit Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-400">₹</span>
                  <input type="number" value={formData.initial_deposit} onChange={(e) => setFormData({ ...formData, initial_deposit: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xl font-bold font-mono focus:ring-2 focus:ring-brand-500" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 uppercase font-medium">Minimum: ₹{formData.account_type === 'fixed_deposit' ? '5,000' : '1,000'}</p>
              </div>

              {formData.account_type === 'fixed_deposit' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tenure (Days)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[90, 180, 365, 730].map(d => (
                      <button key={d} onClick={() => setFormData({ ...formData, tenure_days: d })}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-all
                          ${formData.tenure_days === d ? 'bg-brand-600 text-white border-brand-600' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                        {d >= 365 ? `${d / 365} Year${d > 365 ? 's' : ''}` : `${d} Days`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Nomination Details (Optional)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Nominee Name</label>
                    <input type="text" placeholder="Full name" value={formData.nomination_name} onChange={e => setFormData({ ...formData, nomination_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Relation</label>
                    <select value={formData.nomination_relation} onChange={e => setFormData({ ...formData, nomination_relation: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm">
                      <option value="">Select Relation</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <button onClick={() => openMutation.mutate(formData)} disabled={!canProceed() || openMutation.isPending}
            className="w-full bg-brand-600 text-white py-4 rounded-2xl font-bold hover:bg-brand-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50">
            {openMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Open My Account</>}
          </button>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl">
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 italic">
              <TrendingUp className="w-5 h-5 text-brand-500" /> Investment Preview
            </h4>
            <div className="space-y-4 border-t border-white/10 pt-4">
              <div className="flex justify-between text-xs text-white/50">
                <span>Principal</span>
                <span className="font-mono text-white">₹{formData.initial_deposit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-white/50">
                <span>Interest Rate</span>
                <span className="font-mono text-brand-400">{formData.account_type === 'fixed_deposit' ? '7.5%' : '4.5%'}</span>
              </div>
              <div className="flex justify-between text-xs text-white/50">
                <span>Tenure</span>
                <span className="font-mono text-white">{formData.tenure_days} Days</span>
              </div>
              <div className="pt-2 border-t border-white/5">
                <div className="flex justify-between font-bold">
                  <span className="text-sm">Estimated Maturity</span>
                  <span className="text-brand-500">
                    ₹{(formData.initial_deposit * (1 + (formData.account_type === 'fixed_deposit' ? 0.075 : 0.045) * (formData.tenure_days / 365))).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Security Note</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                  Fixed Deposits will deduct the principal amount from your selected savings account immediately upon successful creation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
