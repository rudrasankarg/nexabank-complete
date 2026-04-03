'use client';
import { motion } from 'framer-motion';
import { CreditCard, Plus, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CardsPage() {
  const [cardStats, setCardStats] = useState({ active: 0, blocked: 0, pending: 0 });
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = () => {
    setLoading(true);
    adminApi.get('/admin/cards/pending') 
      .then(r => setRequests(r.data.cards))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
    
    adminApi.get('/admin/stats')
      .then(r => setCardStats({ 
        active: r.data.active_cards, 
        blocked: r.data.blocked_cards,
        pending: r.data.pending_cards 
      }))
      .catch(() => null);
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await adminApi.patch(`/admin/cards/${id}/review`, { status: action === 'approve' ? 'active' : 'rejected' });
      toast.success(`Card application ${action}d`);
      fetchCards();
    } catch (err) {
      toast.error('Failed to update card status');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Card Management</h1>
          <p className="text-slate-400">Review card applications and manage active physical/virtual cards.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchCards} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl shadow-lg shadow-brand-600/20 hover:bg-brand-500 transition-all font-semibold">
            <Plus className="w-5 h-5" /> New Batch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl border border-indigo-500/20">
          <p className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">Pending Requests</p>
          <p className="text-3xl font-bold text-white">{cardStats.pending}</p>
        </div>
        <div className="glass p-6 rounded-3xl border border-emerald-500/20">
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">Active Cards</p>
          <p className="text-3xl font-bold text-white">{cardStats.active}</p>
        </div>
        <div className="glass p-6 rounded-3xl border border-red-500/20">
          <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">Blocked/Lost</p>
          <p className="text-3xl font-bold text-white">{cardStats.blocked}</p>
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-white/5">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-white font-bold">Pending Applications</h3>
        </div>
        <div className="divide-y divide-white/5">
          {requests.map((req, i) => (
            <motion.div 
              key={req.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-600/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">{req.full_name}</p>
                  <p className="text-slate-500 text-xs">{req.card_type} • {req.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                   <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-1 text-amber-500">
                     <Clock className="w-3 h-3" /> {req.status?.replace('_', ' ')}
                   </p>
                   <p className="text-slate-500 text-[10px] mt-0.5">{new Date(req.created_at || req.requested_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAction(req.id, 'approve')}
                    className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors border border-emerald-500/10"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleAction(req.id, 'reject')}
                    className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/10"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {requests.length === 0 && !loading && (
            <div className="p-12 text-center text-slate-500 uppercase text-xs font-bold tracking-widest">
              No pending applications
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
