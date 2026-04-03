'use client';
import { motion } from 'framer-motion';
import { PiggyBank, FileText, CheckCircle, XCircle, MoreVertical, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoans = () => {
    setLoading(true);
    adminApi.get('/admin/loans')
      .then(r => setLoans(r.data.loans))
      .catch(() => setLoans([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await adminApi.patch(`/admin/loans/${id}/approve`, { action });
      toast.success(`Loan application ${action === 'approve' ? 'approved & disbursed' : 'rejected'}`);
      fetchLoans();
    } catch (err) {
      toast.error('Failed to process loan request');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Loan Applications</h1>
          <p className="text-slate-400">Review, approve, or reject platform-wide loan requests.</p>
        </div>
        <button onClick={fetchLoans} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
           <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 uppercase text-[10px] font-bold tracking-widest bg-white/[0.01]">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loans.map((loan, i) => (
                <motion.tr 
                  key={loan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="px-6 py-4 font-mono text-slate-400 text-xs">{loan.id}</td>
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{loan.full_name}</p>
                    <p className="text-slate-500 text-[10px]">{new Date(loan.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4 text-white font-bold text-right">₹{parseFloat(loan.principal_amount || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-400">{loan.loan_type || 'Personal'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest
                      ${loan.status === 'applied' ? 'bg-amber-500/10 text-amber-500' : 
                        loan.status === 'approved' || loan.status === 'disbursed' ? 'bg-emerald-500/10 text-emerald-500' : 
                        'bg-red-500/10 text-red-500'}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       {loan.status === 'applied' && (
                         <>
                           <button 
                             onClick={() => handleAction(loan.id, 'approve')}
                             className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors"
                           >
                             <CheckCircle className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleAction(loan.id, 'reject')}
                             className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                           >
                             <XCircle className="w-4 h-4" />
                           </button>
                         </>
                       )}
                       <button className="p-2 text-slate-500 hover:text-white transition-colors">
                         <MoreVertical className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {loans.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-600 font-bold uppercase text-[10px] tracking-widest">
                    No loan applications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
