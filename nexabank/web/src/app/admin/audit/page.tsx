'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Filter, Calendar, Terminal, User } from 'lucide-react';
import { adminApi } from '@/lib/api';

export default function AuditLogPage() {
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
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Security & Audit Log</h1>
        <p className="text-slate-400">Immutable record of all administrative actions and system security events.</p>
      </div>

      <div className="flex flex-wrap gap-4 items-center p-4 glass rounded-2xl border border-white/5">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input placeholder="Search by actor or action..." className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:text-white transition-colors text-sm border border-white/5">
          <Calendar className="w-4 h-4" /> Date Range
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:text-white transition-colors text-sm border border-white/5">
          <Filter className="w-4 h-4" /> Category
        </button>
      </div>

      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.01]">
              <tr className="border-b border-white/5 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                <th className="px-6 py-4">Event Time</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log, i) => (
                <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 text-slate-400 text-xs font-mono">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 bg-brand-600/20 rounded-full flex items-center justify-center text-brand-400">
                         <User className="w-3 h-3" />
                       </div>
                       <span className="text-white font-medium capitalize">{log.actor_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-brand-600/10 text-brand-400 rounded text-[10px] font-bold tracking-widest border border-brand-500/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                       <Terminal className="w-3 h-3 text-slate-600" />
                       {log.entity_type}: {log.entity_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600 text-xs font-mono">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
