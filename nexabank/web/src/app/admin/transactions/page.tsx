'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Filter, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, PiggyBank } from 'lucide-react';
import { adminApi } from '@/lib/api';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get('/admin/transactions')
      .then(r => setTransactions(r.data.transactions))
      .catch(() => {
        setTransactions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Global Transactions</h1>
          <p className="text-slate-400">Monitor all financial activity across the NexaBank platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-all">
            <Download className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-600/20 hover:bg-brand-500 transition-all font-medium">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input 
          placeholder="Search by Transaction ID, User, or Account..." 
          className="w-full pl-12 pr-6 py-4 bg-transparent text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
        />
      </div>

      {/* Transactions Table */}
      <div className="glass rounded-3xl overflow-hidden border border-white/5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              <th className="px-6 py-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">Ref ID</th>
              <th className="px-6 py-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.map((txn, i) => (
              <motion.tr 
                key={txn.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="hover:bg-white/[0.02] transition-all group cursor-pointer"
              >
                <td className="px-6 py-4 text-slate-300 font-mono text-xs">{txn.id}</td>
                <td className="px-6 py-4 text-white font-medium">{txn.full_name}</td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-2 text-slate-400 capitalize text-sm">
                    {txn.type === 'transfer' ? <ArrowLeftRight className="w-3 h-3 text-brand-400" /> : <PiggyBank className="w-3 h-3 text-emerald-400" />}
                    {txn.type.replace('_', ' ')}
                  </span>
                </td>
                <td className={`px-6 py-4 font-bold ${txn.amount > 0 ? 'text-white' : 'text-slate-400'}`}>
                  ₹{txn.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${txn.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    {txn.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm">{txn.date}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
