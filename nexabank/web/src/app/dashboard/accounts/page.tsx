'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus, Eye, EyeOff, Copy, CheckCircle, TrendingUp,
  Landmark, CreditCard, PiggyBank, ArrowRight, Info,
  Shield, Calendar, Building2, Loader2, X
} from 'lucide-react';
import { api } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Account } from '@/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const accountGradients: Record<string, string> = {
  savings: 'from-brand-600 to-brand-800',
  current: 'from-slate-700 to-slate-900',
  salary: 'from-emerald-600 to-emerald-800',
  fixed_deposit: 'from-amber-600 to-amber-800',
  recurring_deposit: 'from-purple-600 to-purple-800',
};

const accountIcons: Record<string, any> = {
  savings: PiggyBank,
  current: Building2,
  salary: TrendingUp,
  fixed_deposit: Shield,
  recurring_deposit: Calendar,
};

function DepositModal({ account, onClose }: { account: Account; onClose: () => void }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState(5000);
  const depositMutation = useMutation({
    mutationFn: () => api.post(`/accounts/${account.id}/deposit`, { amount, description: 'Cash Deposit' }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); toast.success('Deposit successful!'); onClose(); },
    onError: () => toast.error('Deposit failed'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Deposit Money</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4 font-mono">To: {account.account_number}</p>
        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full text-center text-3xl font-bold py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl mb-6" />
        <button onClick={() => depositMutation.mutate()} disabled={depositMutation.isPending}
          className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2">
          {depositMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Deposit'}
        </button>
      </motion.div>
    </div>
  );
}

function AccountCard({ account }: { account: Account }) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const gradient = accountGradients[account.account_type] || accountGradients.savings;
  const Icon = accountIcons[account.account_type] || Landmark;

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(account.account_number);
    setCopied(true);
    toast.success('Account number copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div whileHover={{ y: -2 }} className="group">
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 text-white mb-4`}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-20 translate-x-20" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/5 rounded-full translate-y-16 -translate-x-16" />
        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-white/70" />
                <p className="text-white/70 text-xs uppercase tracking-widest">{account.account_type.replace(/_/g, ' ')}</p>
              </div>
              {account.is_primary && (
                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">Primary</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {account.is_frozen && (
                <span className="text-xs bg-red-500/30 text-red-200 px-2 py-0.5 rounded-full border border-red-400/30">Frozen</span>
              )}
              {!account.is_active && (
                <span className="text-xs bg-slate-500/30 text-slate-200 px-2 py-0.5 rounded-full">Inactive</span>
              )}
            </div>
          </div>
          <div className="mb-6">
            <p className="text-white/60 text-xs mb-1">Available Balance</p>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-bold tracking-tight">
                {balanceVisible
                  ? `₹${Number(account.balance).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                  : '₹ ••••••'}
              </p>
              <button onClick={() => setBalanceVisible(v => !v)} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                {balanceVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <button onClick={copyAccountNumber} className="flex items-center gap-2 group/copy">
                <p className="font-mono text-sm text-white/80">{account.account_number}</p>
                {copied
                  ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  : <Copy className="w-3.5 h-3.5 text-white/40 group-hover/copy:text-white/80 transition-colors" />}
              </button>
              <p className="text-white/50 text-xs font-mono mt-0.5">{account.ifsc_code}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-xs">{account.interest_rate}% p.a.</p>
              <p className="text-white/70 text-xs">{account.branch_name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details Below Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Min. Balance', value: `₹${Number(account.minimum_balance).toLocaleString('en-IN')}` },
            { label: 'Daily Limit', value: `₹${(Number(account.daily_transaction_limit) / 100000).toFixed(1)}L` },
            { label: 'Opened', value: format(new Date(account.opened_at), 'dd MMM yyyy') },
            { label: 'Nomination', value: account.nomination_name ? `${account.nomination_name} (${account.nomination_relation})` : 'Not set' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-slate-400 mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => setShowDeposit(true)}
             className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-xl hover:bg-amber-100 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Deposit
          </button>
          <Link href={`/dashboard/transactions?account_id=${account.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-brand-600 bg-brand-50 dark:bg-brand-900/20 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors">
            <TrendingUp className="w-3.5 h-3.5" /> Statement
          </Link>
          <Link href={`/dashboard/transfer?from=${account.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
            <ArrowRight className="w-3.5 h-3.5" /> Transfer
          </Link>
          <Link href={`/dashboard/cards?account_id=${account.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
            <CreditCard className="w-3.5 h-3.5" /> Cards
          </Link>
        </div>
      </div>
      {showDeposit && <DepositModal account={account} onClose={() => setShowDeposit(false)} />}
    </motion.div>
  );
}

export default function AccountsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then(r => r.data),
  });

  const accounts: Account[] = data?.accounts || [];
  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">My Accounts</h2>
          <p className="text-slate-400 text-sm">{accounts.length} account{accounts.length !== 1 ? 's' : ''} · Total ₹{totalBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <Link href="/dashboard/accounts/open"
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors">
          <Plus className="w-4 h-4" /> Open Account
        </Link>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30 rounded-2xl p-4 mb-6">
        <Info className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-brand-800 dark:text-brand-300">IFSC Code: NXBK0001001</p>
          <p className="text-xs text-brand-600 dark:text-brand-400 mt-0.5">Use this IFSC code to receive transfers from other banks. Always verify before sharing.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2].map(i => (
            <div key={i} className="space-y-4">
              <div className="h-44 bg-slate-100 dark:bg-slate-800 rounded-3xl shimmer" />
              <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl shimmer" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
          <Landmark className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-slate-900 dark:text-white font-semibold mb-2">No Accounts Found</h3>
          <p className="text-slate-400 text-sm mb-6">Open your first account to get started</p>
          <Link href="/dashboard/accounts/open" className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors">
            <Plus className="w-4 h-4" /> Open Account
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {accounts.map(acc => <AccountCard key={acc.id} account={acc} />)}
        </div>
      )}
    </div>
  );
}
