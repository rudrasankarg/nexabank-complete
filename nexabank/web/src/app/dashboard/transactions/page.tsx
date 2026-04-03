'use client';
import { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight, ArrowDownLeft, Search, Filter, Download,
  Calendar, ChevronLeft, ChevronRight, X, SlidersHorizontal,
  ArrowLeftRight, Receipt, CreditCard, RefreshCw, CheckCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { Transaction } from '@/types';
import { format } from 'date-fns';
import { useSearchParams } from 'next/navigation';

const typeIcons: Record<string, any> = {
  credit: { icon: ArrowDownLeft, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  debit: { icon: ArrowUpRight, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  transfer: { icon: ArrowLeftRight, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-900/20' },
  bill_payment: { icon: Receipt, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  opening_balance: { icon: CheckCircle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
};

const categoryColors: Record<string, string> = {
  bill_payment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  transfer: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
  shopping: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  food: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  emi: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

function TransactionsContent() {
  const searchParams = useSearchParams();
  const initialAccountId = searchParams.get('account_id') || '';

  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [accountId, setAccountId] = useState(initialAccountId);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Transaction | null>(null);

  const { data: accData } = useQuery({ queryKey: ['accounts'], queryFn: () => api.get('/accounts').then(r => r.data) });
  const accounts: any[] = accData?.accounts || [];

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['transactions', search, type, accountId, startDate, endDate, page],
    queryFn: () => api.get('/transactions', {
      params: { search, type, account_id: accountId, start_date: startDate, end_date: endDate, page, limit: 20 }
    }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const transactions: Transaction[] = data?.transactions || [];
  const pagination = data?.pagination;

  const clearFilters = () => { setSearch(''); setType(''); setAccountId(''); setStartDate(''); setEndDate(''); setPage(1); };
  const hasFilters = search || type || accountId || startDate || endDate;

  const downloadStatement = () => {
    const rows = [
      ['Date', 'Ref', 'Description', 'Type', 'Amount', 'Status'],
      ...transactions.map(t => [
        format(new Date(t.created_at), 'dd/MM/yyyy HH:mm'),
        t.transaction_ref,
        t.description || '',
        t.type,
        t.amount.toString(),
        t.status,
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `nexabank-statement-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Transaction History</h2>
          <p className="text-slate-400 text-sm">{pagination?.total || 0} transactions found</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
          <button onClick={downloadStatement} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 mb-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by description, ref number..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm" />
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${showFilters ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-500 text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 overflow-hidden">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Type</label>
                <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm">
                  <option value="">All Types</option>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Account</label>
                <select value={accountId} onChange={e => { setAccountId(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm">
                  <option value="">All Accounts</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.account_number} ({a.account_type})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">From Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full px-2 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">To Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full px-2 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {transactions.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Credits', value: transactions.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0), color: 'text-emerald-600' },
            { label: 'Debits', value: transactions.filter(t => t.type !== 'credit').reduce((s, t) => s + Number(t.amount), 0), color: 'text-red-500' },
            { label: 'Net', value: transactions.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0) - transactions.filter(t => t.type !== 'credit').reduce((s, t) => s + Number(t.amount), 0), color: 'text-slate-900 dark:text-white' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-3">
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p className={`font-semibold text-sm ${color}`}>₹{Math.abs(value).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 p-4 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl shimmer" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-20 text-center"><ArrowLeftRight className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" /><p className="text-slate-500">No transactions found</p></div>
        ) : (
          <div className="text-sm">
            {Object.entries(
              transactions.reduce((groups: any, tx) => {
                const date = format(new Date(tx.created_at), 'yyyy-MM-dd');
                if (!groups[date]) groups[date] = [];
                groups[date].push(tx);
                return groups;
              }, {})
            ).map(([date, txs]: [string, any]) => (
              <div key={date}>
                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-y border-slate-100 dark:border-slate-800">
                  {format(new Date(date), 'dd MMMM yyyy')}
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {txs.map((tx: any) => {
                    const isOpening = tx.description?.includes('Opening Balance') || tx.description?.includes('Opening Bonus');
                    const meta = isOpening ? typeIcons.opening_balance : (typeIcons[tx.type] || typeIcons.debit);
                    const Icon = meta.icon;
                    return (
                      <div key={tx.id} onClick={() => setSelected(tx)}
                        className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}><Icon className={`w-5 h-5 ${meta.color}`} /></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">{tx.description || tx.merchant_name || 'Transaction'}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{format(new Date(tx.created_at), 'hh:mm a')} · {tx.payment_mode || 'Online'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-semibold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>{tx.type === 'credit' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}</p>
                          {tx.balance_after && (
                            <p className="text-[10px] text-slate-400 mt-0.5">Bal: ₹{Number(tx.balance_after).toLocaleString('en-IN')}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500">Page {page} of {pagination.pages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold">Transaction Details</h3>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${typeIcons[selected.type]?.bg || 'bg-slate-100'}`}>
                {(() => { const Icon = (typeIcons[selected.type] || typeIcons.debit).icon; return <Icon className={`w-8 h-8 ${(typeIcons[selected.type] || typeIcons.debit).color}`} />; })()}
              </div>
              <p className={`text-3xl font-bold text-center mb-1 ${selected.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                {selected.type === 'credit' ? '+' : '-'}₹{Number(selected.amount).toLocaleString('en-IN')}
              </p>
              <div className="space-y-3 mt-6 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-sm">
                <div className="flex justify-between text-slate-500"><span>Date</span><span className="text-slate-900 dark:text-white">{format(new Date(selected.created_at), 'dd MMM yyyy, hh:mm a')}</span></div>
                <div className="flex justify-between text-slate-500"><span>Reference</span><span className="text-slate-900 dark:text-white font-mono">{selected.transaction_ref}</span></div>
                <div className="flex justify-between text-slate-500"><span>Status</span><span className="text-emerald-600 font-bold capitalize">{selected.status}</span></div>
                {selected.balance_after && <div className="flex justify-between text-slate-500"><span>Balance After</span><span className="text-slate-900 dark:text-white">₹{Number(selected.balance_after).toLocaleString('en-IN')}</span></div>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading transactions...</div>}>
      <TransactionsContent />
    </Suspense>
  );
}
