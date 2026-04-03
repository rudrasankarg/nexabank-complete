'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight, ArrowDownLeft, CreditCard, TrendingUp,
  ArrowRight, Plus, Zap, RefreshCw, Eye, EyeOff,
  Landmark, Receipt, PiggyBank, Send, ArrowLeftRight, Loader2, X
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Account, Transaction } from '@/types';
import { format } from 'date-fns';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemVariant = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function BalanceCard({ account }: { account: Account }) {
  const [visible, setVisible] = useState(true);
  const gradients: Record<string, string> = {
    savings: 'from-brand-700 to-brand-500',
    current: 'from-slate-800 to-slate-600',
    salary: 'from-emerald-700 to-emerald-500',
    fixed_deposit: 'from-amber-700 to-amber-500',
    recurring_deposit: 'from-purple-700 to-purple-500',
  };
  const gradient = gradients[account.account_type] || gradients.savings;

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 text-white`}>
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/70 text-xs uppercase tracking-widest">{account.account_type.replace('_', ' ')} Account</p>
            <p className="text-white/60 font-mono text-sm mt-1">•••• {account.account_number.slice(-4)}</p>
          </div>
          <button onClick={() => setVisible(v => !v)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
            {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
        <div className="mb-6">
          <p className="text-white/60 text-xs mb-1">Available Balance</p>
          <p className="text-3xl font-semibold tracking-tight">
            {visible ? formatCurrency(account.balance) : '₹ ••••••'}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-white/50 text-xs">{account.ifsc_code}</p>
          <Link href="/dashboard/accounts" className="text-white/80 text-xs flex items-center gap-1 hover:text-white transition-colors">
            Details <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isCredit = tx.type === 'credit';
  const isOpening = tx.description?.includes('Opening Balance') || tx.description?.includes('Opening Bonus');
  const Icon = isOpening ? CheckCircle : (isCredit ? ArrowDownLeft : ArrowUpRight);
  const bgColor = isOpening ? 'bg-amber-50 dark:bg-amber-900/20' : (isCredit ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20');
  const iconColor = isOpening ? 'text-amber-600' : (isCredit ? 'text-emerald-600' : 'text-red-500');

  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgColor}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
          {tx.description || tx.merchant_name || `${tx.type} transaction`}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {format(new Date(tx.created_at), 'dd MMM, hh:mm a')} · {tx.payment_mode || 'Online'}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={`font-semibold text-sm ${isOpening ? 'text-amber-600' : (isCredit ? 'text-emerald-600' : 'text-red-500')}`}>
          {isOpening ? '' : (isCredit ? '+' : '-')}{formatCurrency(tx.amount)}
        </p>
        <p className="text-xs text-slate-400">{tx.status}</p>
      </div>
    </div>
  );
}

const quickActions = [
  { icon: Send, label: 'Transfer', href: '/dashboard/transfer', color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' },
  { icon: ArrowDownLeft, label: 'Deposit', href: '#deposit', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  { icon: Receipt, label: 'Pay Bill', href: '/dashboard/bills', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
  { icon: CreditCard, label: 'Cards', href: '/dashboard/cards', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  { icon: PiggyBank, label: 'Loans', href: '/dashboard/loans', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  { icon: Landmark, label: 'Accounts', href: '/dashboard/accounts', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const [showDeposit, setShowDeposit] = useState(false);
  const { data: accountsData, isLoading: accLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then(r => r.data),
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['transactions-recent'],
    queryFn: () => api.get('/transactions?limit=6').then(r => r.data),
  });

  const accounts: Account[] = accountsData?.accounts || [];
  const transactions: Transaction[] = txData?.transactions || [];
  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(String(a.balance)), 0);

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

        {/* Greeting */}
        <motion.div variants={itemVariant} className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {getHour()}, {user?.full_name?.split(' ')[0]} 👋
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
          </div>
          <button className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors">
            <RefreshCw className="w-5 h-5 text-slate-400" />
          </button>
        </motion.div>

        {/* Total Balance Banner */}
        <motion.div variants={itemVariant}
          className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-3xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
          </div>
          <div className="relative">
            <p className="text-white/70 text-sm">Total Portfolio Balance</p>
            <p className="text-4xl font-semibold mt-1 mb-4">{formatCurrency(totalBalance)}</p>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-white/60 text-xs">Accounts</p>
                <p className="font-semibold">{Math.max(1, accounts.length)}</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <p className="text-white/60 text-xs">Customer ID</p>
                <p className="font-semibold font-mono tracking-wider">{user?.customer_id || '---'}</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <p className="text-white/60 text-xs">KYC Status</p>
                <p className={`font-semibold capitalize ${user?.kyc_status === 'approved' ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {user?.kyc_status === 'approved' ? 'Active' : (user?.kyc_status || 'Pending')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariant}>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {quickActions.map(({ icon: Icon, label, href, color }) => (
              href.startsWith('#') ? (
                <button key={label} onClick={() => label === 'Deposit' && setShowDeposit(true)}
                  className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
                </button>
              ) : (
                <Link key={href} href={href}
                  className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
                </Link>
              )
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Cards */}
          <motion.div variants={itemVariant} className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">My Accounts</h3>
              <Link href="/dashboard/accounts/open" className="text-brand-600 text-xs font-medium flex items-center gap-1 hover:underline">
                <Plus className="w-3 h-3" /> New Account
              </Link>
            </div>
            {accLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-3xl shimmer" />)}
              </div>
            ) : accounts.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-slate-400 text-sm">No accounts found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {accounts.slice(0, 2).map(acc => <BalanceCard key={acc.id} account={acc} />)}
              </div>
            )}
          </motion.div>

          {/* Transactions */}
          <motion.div variants={itemVariant} className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recent Transactions</h3>
              <Link href="/dashboard/transactions" className="text-brand-600 text-xs font-medium flex items-center gap-1 hover:underline">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4">
              {txLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 shimmer" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded shimmer w-3/4" />
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded shimmer w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-12 text-center">
                  <ArrowLeftRight className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No transactions yet</p>
                  <Link href="/dashboard/transfer" className="text-brand-600 text-sm font-medium mt-2 inline-block hover:underline">
                    Make your first transfer →
                  </Link>
                </div>
              ) : (
                <div>{transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)}</div>
              )}
            </div>
          </motion.div>
        </div>

      </motion.div>
      <AnimatePresence>
        {showDeposit && <DepositModal accounts={accounts} onClose={() => setShowDeposit(false)} />}
      </AnimatePresence>
    </div>
  );
}

function DepositModal({ accounts, onClose }: { accounts: Account[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [formData, setFormData] = useState({ account_id: '', amount: 1000, description: 'Self Deposit' });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post(`/accounts/${data.account_id}/deposit`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['transactions-recent'] });
      toast.success('Funds deposited successfully');
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Deposit failed'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Deposit Money</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Select Account</label>
            <select onChange={(e) => setFormData({ ...formData, account_id: e.target.value })} value={formData.account_id}
              className="w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
              <option value="">Choose an account</option>
              {accounts.filter(a => a.account_type !== 'fixed_deposit').map(acc => (
                <option key={acc.id} value={acc.id}>{acc.account_number} ({acc.account_type}) — ₹{Number(acc.balance).toLocaleString()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Amount (₹)</label>
            <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
              className="w-full px-4 py-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-2xl font-bold" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes</label>
            <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
          </div>
          <button onClick={() => mutation.mutate(formData)} disabled={!formData.account_id || formData.amount <= 0 || mutation.isPending}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 mt-4">
            {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Deposit'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
