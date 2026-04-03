'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PiggyBank, Calculator, ChevronRight,
  Clock, CheckCircle, XCircle, AlertCircle, Plus,
  Calendar, Percent, DollarSign, Wallet, ArrowRight, Info
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const loanTypes = [
  { id: 'personal', label: 'Personal Loan', icon: '👤', rate: '10.5–18%', maxAmount: 2500000, maxAmountLabel: '₹25 Lakhs', tenure: 'Up to 5 years', desc: 'For any personal need — travel, wedding, medical' },
  { id: 'home', label: 'Home Loan', icon: '🏠', rate: '8.5–12%', maxAmount: 50000000, maxAmountLabel: '₹5 Crores', tenure: 'Up to 30 years', desc: 'Buy or construct your dream home' },
  { id: 'car', label: 'Car Loan', icon: '🚗', rate: '9.5–14%', maxAmount: 5000000, maxAmountLabel: '₹50 Lakhs', tenure: 'Up to 7 years', desc: 'New or used vehicle financing' },
  { id: 'education', label: 'Education Loan', icon: '🎓', rate: '8–13%', maxAmount: 2000000, maxAmountLabel: '₹20 Lakhs', tenure: 'Up to 15 years', desc: 'For higher education in India or abroad' },
  { id: 'business', label: 'Business Loan', icon: '💼', rate: '11–18%', maxAmount: 5000000, maxAmountLabel: '₹50 Lakhs', tenure: 'Up to 5 years', desc: 'Grow your business with easy capital' },
  { id: 'gold', label: 'Gold Loan', icon: '🥇', rate: '7.5–12%', maxAmount: 2500000, maxAmountLabel: '₹25 Lakhs', tenure: 'Up to 3 years', desc: 'Quick loan against your gold jewellery' },
];

const fdRates = [
  { tenure: '7 – 29 days', days: 7, rate: '3.50', seniorRate: '4.00' },
  { tenure: '30 – 89 days', days: 30, rate: '4.50', seniorRate: '5.00' },
  { tenure: '90 – 179 days', days: 90, rate: '5.50', seniorRate: '6.00' },
  { tenure: '180 – 364 days', days: 180, rate: '6.25', seniorRate: '6.75' },
  { tenure: '1 – 2 years', days: 365, rate: '7.00', seniorRate: '7.50' },
  { tenure: '2 – 3 years', days: 730, rate: '7.25', seniorRate: '7.75' },
  { tenure: '3 – 5 years', days: 1095, rate: '7.50', seniorRate: '8.00' },
  { tenure: '5 – 10 years', days: 1825, rate: '7.25', seniorRate: '7.75' },
];

const statusMeta: Record<string, { color: string; icon: any }> = {
  applied: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock },
  under_review: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertCircle },
  approved: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
  disbursed: { color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400', icon: CheckCircle },
  active: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
  rejected: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  closed: { color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400', icon: CheckCircle },
};

function EMICalculator() {
  const [principal, setPrincipal] = useState(500000);
  const [rate, setRate] = useState(10.5);
  const [tenure, setTenure] = useState(24);

  const monthlyRate = rate / 12 / 100;
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenure) / (Math.pow(1 + monthlyRate, tenure) - 1);
  const totalAmount = emi * tenure;
  const totalInterest = totalAmount - principal;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <Calculator className="w-5 h-5 text-brand-600" />
        <h3 className="font-semibold text-slate-900 dark:text-white">EMI Calculator</h3>
      </div>
      <div className="space-y-5">
        {[
          { label: 'Loan Amount', value: principal, min: 10000, max: 5000000, step: 10000, format: (v: number) => `₹${v.toLocaleString('en-IN')}`, onChange: setPrincipal },
          { label: 'Interest Rate (% p.a.)', value: rate, min: 5, max: 24, step: 0.5, format: (v: number) => `${v}%`, onChange: setRate },
          { label: 'Tenure (Months)', value: tenure, min: 3, max: 360, step: 3, format: (v: number) => `${v} months`, onChange: setTenure },
        ].map(({ label, value, min, max, step, format, onChange }) => (
          <div key={label}>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{format(value)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
              onChange={e => onChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-brand-600" />
          </div>
        ))}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          {[
            { label: 'Monthly EMI', value: `₹${isFinite(emi) ? Math.round(emi).toLocaleString('en-IN') : 0}`, highlight: true },
            { label: 'Total Interest', value: `₹${isFinite(totalInterest) ? Math.round(totalInterest).toLocaleString('en-IN') : 0}` },
            { label: 'Total Amount', value: `₹${isFinite(totalAmount) ? Math.round(totalAmount).toLocaleString('en-IN') : 0}` },
          ].map(({ label, value, highlight }) => (
            <div key={label} className={`p-3 rounded-xl text-center ${highlight ? 'bg-brand-600 text-white shadow-brand-600/20 shadow-lg' : 'bg-slate-50 dark:bg-slate-800'}`}>
              <p className={`text-lg font-bold ${highlight ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{value}</p>
              <p className={`text-xs mt-0.5 ${highlight ? 'text-white/70' : 'text-slate-400'}`}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoansPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'my-loans' | 'apply' | 'fd-rates'>('my-loans');
  const [applyingLoan, setApplyingLoan] = useState<any>(null);
  const [openingFD, setOpeningFD] = useState<boolean>(false);
  const [loanForm, setLoanForm] = useState({ amount: 100000, tenure: 12, account_id: '', purpose: '' });
  const [fdForm, setFdForm] = useState({ amount: 10000, tenure_days: 365, source_account_id: '' });

  const { data: loansData } = useQuery({
    queryKey: ['loans'],
    queryFn: () => api.get('/loans').then(r => r.data).catch(() => ({ loans: [] })),
  });

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then(r => r.data),
  });

  const applyMutation = useMutation({
    mutationFn: (data: any) => api.post('/loans/apply', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Loan application submitted successfully');
      setApplyingLoan(null);
      setActiveTab('my-loans');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to submit application'),
  });

  const fdMutation = useMutation({
    mutationFn: (data: any) => api.post('/accounts/open', { ...data, account_type: 'fixed_deposit' }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Fixed Deposit opened successfully');
      setOpeningFD(false);
      setActiveTab('my-loans');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to open FD'),
  });

  const loans = loansData?.loans || [];
  const accounts = accountsData?.accounts || [];

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto min-h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Loans & Deposits</h2>
          <p className="text-slate-500 text-sm">Manage your loans, EMIs, and fixed deposits</p>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-1 mb-6">
        {[
          { id: 'my-loans', label: 'My Portfolio' },
          { id: 'apply', label: 'Apply Loan' },
          { id: 'fd-rates', label: 'FD Rates' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${activeTab === tab.id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'my-loans' && (
          <motion.div key="my-loans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <EMICalculator />
            
            {loans.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PiggyBank className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-slate-900 dark:text-white font-bold text-lg">No active financial products</p>
                <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">Explore our loan options and high-interest fixed deposits to grow your wealth.</p>
                <button onClick={() => setActiveTab('apply')} className="mt-6 bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 flex items-center gap-2 mx-auto">
                  Get Started <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {loans.map((loan: any) => {
                  const meta = statusMeta[loan.status] || statusMeta.applied;
                  const Icon = meta.icon;
                  const paidPercent = Math.round(((Number(loan.principal_amount) - Number(loan.outstanding_amount || 0)) / Number(loan.principal_amount)) * 100);
                  return (
                    <div key={loan.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm group hover:border-brand-300 dark:hover:border-brand-800 transition-all">
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-brand-50 dark:group-hover:bg-brand-900/20 transition-colors">
                            {loanTypes.find(t => t.id === loan.loan_type)?.icon || '💰'}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{loan.loan_number}</p>
                            <h4 className="font-bold text-slate-900 dark:text-white capitalize text-lg">{loan.loan_type.replace('_', ' ')} Loan</h4>
                          </div>
                        </div>
                        <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-tight ${meta.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {loan.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                          { label: 'Principal', value: `₹${Number(loan.principal_amount).toLocaleString('en-IN')}` },
                          { label: 'Next Due', value: `₹${Number(loan.emi_amount || 0).toLocaleString('en-IN')}` },
                          { label: 'Rate', value: `${loan.interest_rate}% p.a.` },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/50">
                            <p className="text-xs text-slate-400 mb-1">{label}</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{value}</p>
                          </div>
                        ))}
                      </div>
                      {(loan.status === 'active' || loan.status === 'disbursed') && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-[11px] font-bold text-slate-400">
                            <span>Repayment Progress</span>
                            <span className="text-brand-600">{paidPercent}% Paid</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${paidPercent}%` }} className="h-full bg-brand-600 rounded-full shadow-[0_0_8px_rgba(var(--brand-600-rgb),0.5)]" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'apply' && (
          <motion.div key="apply" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loanTypes.map(loan => (
                <button key={loan.id} onClick={() => { setApplyingLoan(loan); setLoanForm({...loanForm, account_id: accounts[0]?.id}) }}
                  className="text-left p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-600 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-4xl filter drop-shadow-sm">{loan.icon}</span>
                    <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-all text-slate-300">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-lg">{loan.label}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">{loan.desc}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <Percent className="w-3.5 h-3.5 text-brand-500" /> {loan.rate}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <Wallet className="w-3.5 h-3.5 text-emerald-500" /> {loan.maxAmountLabel}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'fd-rates' && (
          <motion.div key="fd-rates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">FD Comparison Table</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Updated: April 2026 · Compound interest calculated quarterly</p>
                </div>
                <div className="px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center gap-2">
                  <Info className="w-4 h-4 text-brand-600" />
                  <span className="text-xs font-bold text-brand-700 dark:text-brand-400">+0.5% for Seniors</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/20">
                    <tr>
                      <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Tenure Period</th>
                      <th className="text-center px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">General (%)</th>
                      <th className="text-center px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Senior Citizen (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {fdRates.map((row, i) => (
                      <tr key={i} className="hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{row.tenure}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{row.rate}%</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{row.seniorRate}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/30 dark:bg-slate-800/10">
                <button onClick={() => { setOpeningFD(true); setFdForm({...fdForm, source_account_id: accounts[0]?.id}) }} 
                  className="bg-brand-600 text-white px-10 py-3.5 rounded-2xl font-bold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/30 hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto">
                  Open New FD Account <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Apply Loan Modal */}
      <Modal isOpen={!!applyingLoan} onClose={() => setApplyingLoan(null)} title={`New ${applyingLoan?.label} Application`}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Loan Amount (₹)</label>
            <input type="number" value={loanForm.amount} onChange={e => setLoanForm({...loanForm, amount: parseInt(e.target.value)})}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tenure (Months)</label>
              <select value={loanForm.tenure} onChange={e => setLoanForm({...loanForm, tenure: parseInt(e.target.value)})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white">
                {[12, 24, 36, 48, 60, 120, 240, 360].filter(t => applyingLoan?.id === 'home' || t <= 60).map(t => <option key={t} value={t}>{t} Months</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Disbursement To</label>
              <select value={loanForm.account_id} onChange={e => setLoanForm({...loanForm, account_id: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white">
                {accounts.map((acc: any) => <option key={acc.id} value={acc.id}>{acc.account_type.toUpperCase()} ({acc.account_number.slice(-4)})</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Purpose of Loan</label>
            <input type="text" placeholder="e.g. Dream Wedding, Home Renovation" value={loanForm.purpose} onChange={e => setLoanForm({...loanForm, purpose: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white" />
          </div>
          <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-2xl text-xs text-brand-700 dark:text-brand-300 leading-relaxed font-medium">
            By clicking apply, you authorize NexaBank to verify your credit score and financial records. Pre-approval takes 24-48 business hours.
          </div>
          <button onClick={() => applyMutation.mutate({ ...loanForm, loan_type: applyingLoan?.id })} disabled={applyMutation.isPending}
            className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition-all disabled:opacity-50">
            {applyMutation.isPending ? 'Submitting Application...' : 'Apply Now'}
          </button>
        </div>
      </Modal>

      {/* Open FD Modal */}
      <Modal isOpen={openingFD} onClose={() => setOpeningFD(false)} title="Open Fixed Deposit">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Principal Amount (₹)</label>
            <input type="number" value={fdForm.amount} onChange={e => setFdForm({...fdForm, amount: parseInt(e.target.value)})}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Duration</label>
              <select value={fdForm.tenure_days} onChange={e => setFdForm({...fdForm, tenure_days: parseInt(e.target.value)})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white">
                {fdRates.map(r => <option key={r.days} value={r.days}>{r.tenure}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Debit From</label>
              <select value={fdForm.source_account_id} onChange={e => setFdForm({...fdForm, source_account_id: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white">
                {accounts.map((acc: any) => <option key={acc.id} value={acc.id}>{acc.account_type.toUpperCase()} (₹{Number(acc.balance).toLocaleString()})</option>)}
              </select>
            </div>
          </div>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">Rate of Interest</p>
              <p className="text-lg font-bold text-emerald-800 dark:text-emerald-400">{fdRates.find(r => r.days === fdForm.tenure_days)?.rate}% p.a.</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">Maturity Est.</p>
              <p className="text-lg font-bold text-emerald-800 dark:text-emerald-400">₹{Math.round(fdForm.amount * (1 + (parseFloat(fdRates.find(r => r.days === fdForm.tenure_days)?.rate || '0') / 100) * (fdForm.tenure_days / 365))).toLocaleString()}</p>
            </div>
          </div>
          <button onClick={() => fdMutation.mutate({ source_account_id: fdForm.source_account_id, initial_deposit: fdForm.amount, tenure_days: fdForm.tenure_days, interest_rate: parseFloat(fdRates.find(r => r.days === fdForm.tenure_days)?.rate || '7.5') })} 
            disabled={fdMutation.isPending}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all disabled:opacity-50">
            {fdMutation.isPending ? 'Processing...' : 'Confirm Fixed Deposit'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <XCircle className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
}
