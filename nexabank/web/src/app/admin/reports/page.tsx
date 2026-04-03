'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Download, Filter, Search, 
  TrendingUp, Users, Wallet, CreditCard 
} from 'lucide-react';
import { adminApi } from '@/lib/api';

export default function ReportsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get('/admin/audit-log')
      .then(r => setLogs(r.data.logs))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">System Reports</h1>
          <p className="text-slate-400">Detailed audit trail and performance reports for internal review.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-600/20 hover:bg-brand-500 transition-all font-medium">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {[
           { label: 'Total Audits', value: logs.length.toString(), icon: FileText, color: 'blue' },
           { label: 'Admin Actions', value: logs.filter(l => l.actor_type === 'admin').length.toString(), icon: Users, color: 'emerald' },
           { label: 'System Alerts', value: '12', icon: Wallet, color: 'amber' },
           { label: 'Reports Gen', value: '45', icon: CreditCard, color: 'purple' },
         ].map((stat, i) => (
           <div key={i} className="glass p-5 rounded-2xl border border-white/5">
             <div className="flex items-center gap-3 mb-3">
               <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                 <stat.icon className="w-4 h-4" />
               </div>
               <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{stat.label}</span>
             </div>
             <p className="text-2xl font-bold text-white">{stat.value}</p>
           </div>
         ))}
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-white/5">
        <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
           <h3 className="text-white font-bold text-sm">Recent System Activity</h3>
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
             <input placeholder="Search logs..." className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500/50" />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log, i) => (
                <tr key={log.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-4 text-slate-400 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-white font-medium">{log.actor_type.toUpperCase()}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded-md text-[10px] font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{log.entity_type}</td>
                  <td className="px-6 py-4 text-right text-slate-500 text-xs font-mono">{log.ip}</td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-600">No activity logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
