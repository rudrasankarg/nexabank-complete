'use client';
import { motion } from 'framer-motion';
import { Building2, Search, Filter, MoreVertical, ShieldCheck, User, RefreshCw, Snowflake, Flame } from 'lucide-react';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAccounts = () => {
    setLoading(true);
    adminApi.get(`/admin/accounts?search=${search}`)
      .then(r => setAccounts(r.data.accounts))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchAccounts(), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleAction = async (id: string, isFrozen: boolean) => {
    try {
      await adminApi.patch(`/admin/accounts/${id}/freeze`, { freeze: !isFrozen, reason: 'Administrative action' });
      toast.success(`Account ${!isFrozen ? 'frozen' : 'unfrozen'}`);
      fetchAccounts();
    } catch (err) {
      toast.error('Failed to update account status');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Account Management</h1>
          <p className="text-slate-400">View and manage customer bank accounts across all branches.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or number..." 
              className="pl-10 pr-4 py-2.5 bg-slate-900 border border-white/5 rounded-2xl text-white text-sm focus:outline-none focus:border-brand-500/50 w-64" 
            />
          </div>
          <button className="p-2.5 bg-slate-900 text-slate-400 rounded-xl hover:text-white transition-colors border border-white/5">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">Loading accounts...</div>
        ) : accounts.length > 0 ? (
          accounts.map((acc, i) => (
            <motion.div 
              key={acc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass p-6 rounded-3xl border border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-brand-500/20 transition-all"
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border
                  ${acc.is_frozen ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                  {acc.is_frozen ? <Snowflake className="w-7 h-7" /> : <Building2 className="w-7 h-7" />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-white font-bold text-lg">{acc.owner_name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest
                      ${acc.is_frozen ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                      {acc.is_frozen ? 'Frozen' : 'Active'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm font-mono">{acc.account_number} • {acc.account_type} • {acc.branch_name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-slate-500 text-xs font-medium mb-1">Available Balance</p>
                  <p className="text-2xl font-bold text-white">₹{parseFloat(acc.balance || 0).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAction(acc.id, acc.is_frozen)}
                    className={`p-3 rounded-xl transition-all border
                      ${acc.is_frozen ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/10' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/10'}`}
                    title={acc.is_frozen ? 'Unfreeze' : 'Freeze'}
                  >
                    {acc.is_frozen ? <Flame className="w-5 h-5" /> : <Snowflake className="w-5 h-5" />}
                  </button>
                  <button className="p-3 bg-white/5 text-slate-400 rounded-xl hover:text-white hover:bg-white/10 transition-all border border-white/5">
                    <User className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="glass p-20 rounded-3xl border border-white/5 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6">
               <Building2 className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">No accounts found</h3>
            <p className="text-slate-500">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
