'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function FlaggedPage() {
  const [flagged, setFlagged] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlagged = () => {
    setLoading(true);
    adminApi.get('/admin/transactions?flagged=true')
      .then(r => setFlagged(r.data.transactions))
      .catch(() => setFlagged([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFlagged();
  }, []);

  const handleAction = async (id: string, action: 'block' | 'whitelist') => {
    try {
      if (action === 'block') {
        await adminApi.patch(`/admin/transactions/${id}/flag`, { reason: 'Confirmed fraud' });
        toast.success('Transaction blocked');
      } else {
        await adminApi.patch(`/admin/transactions/${id}/unflag`);
        toast.success('Transaction marked safe');
      }
      fetchFlagged();
    } catch (err) {
      toast.error('Failed to update transaction');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Flagged Transactions</h1>
          <p className="text-slate-400">Review transactions flagged by NexaGuard AI for potential fraud.</p>
        </div>
        <button 
          onClick={fetchFlagged}
          className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">Loading checks...</div>
        ) : flagged.length > 0 ? (
          flagged.map((txn, idx) => (
            <motion.div
              key={txn.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass p-5 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 hover:border-red-500/30 transition-all border-white/5"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold">{txn.full_name}</span>
                  <span className="text-slate-500 text-xs">• {txn.id}</span>
                </div>
                <p className="text-slate-400 text-sm">{txn.flag_reason || 'High-risk anomaly detected'}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-lg">₹{parseFloat(txn.amount).toLocaleString()}</p>
                <p className="text-slate-500 text-xs">{new Date(txn.created_at).toLocaleTimeString()}</p>
              </div>
              <div className="flex gap-2 shrink-0 ml-auto md:ml-0">
                <button 
                  onClick={() => handleAction(txn.id, 'whitelist')}
                  className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-lg text-sm hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> White-list
                </button>
                <button 
                  onClick={() => handleAction(txn.id, 'block')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-500 transition-colors flex items-center gap-2 shadow-lg shadow-red-600/20"
                >
                  <ShieldCheck className="w-4 h-4" /> Block
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="glass p-12 rounded-3xl border border-white/5 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-white font-bold text-lg mb-1">All Clear!</h3>
            <p className="text-slate-500 max-w-sm">No suspicious transactions have been flagged by the AI at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
