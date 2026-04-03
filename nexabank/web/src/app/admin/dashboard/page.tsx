'use client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Users, ArrowLeftRight, CreditCard, TrendingUp,
  TrendingDown, AlertTriangle, CheckCircle, Clock,
  UserCheck, Building2, DollarSign, Activity
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const cardVariant = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

function StatCard({ label, value, icon: Icon, trend, color }: any) {
  const colorMap: any = {
    blue: 'text-brand-400 bg-brand-900/20',
    green: 'text-emerald-400 bg-emerald-900/20',
    amber: 'text-amber-400 bg-amber-900/20',
    red: 'text-red-400 bg-red-900/20',
    purple: 'text-purple-400 bg-purple-900/20',
  };
  return (
    <motion.div variants={cardVariant}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.blue}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold text-white mb-1">{value}</p>
      <p className="text-slate-500 text-xs">{label}</p>
    </motion.div>
  );
}

const txVolumeData = [
  { day: 'Mon', volume: 42000000, count: 1240 },
  { day: 'Tue', volume: 38000000, count: 1180 },
  { day: 'Wed', volume: 55000000, count: 1560 },
  { day: 'Thu', volume: 48000000, count: 1380 },
  { day: 'Fri', volume: 62000000, count: 1720 },
  { day: 'Sat', volume: 35000000, count: 980 },
  { day: 'Sun', volume: 28000000, count: 820 },
];

const kycData = [
  { month: 'Jan', approved: 240, rejected: 18 },
  { month: 'Feb', approved: 310, rejected: 22 },
  { month: 'Mar', approved: 285, rejected: 15 },
  { month: 'Apr', approved: 420, rejected: 28 },
  { month: 'May', approved: 380, rejected: 20 },
  { month: 'Jun', approved: 460, rejected: 32 },
];

export default function AdminDashboard() {
  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminApi.get('/admin/analytics').then(r => r.data).catch(() => null),
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.get('/admin/dashboard').then(r => r.data).catch(() => ({
      users: { total: 0, active: 0, today_new: 0 },
      accounts: { total: 0, total_deposits: 0 },
      today_transactions: { total: 0, volume: 0 },
      pending_kyc: 0, 
      pending_loans: 0,
      pending_cards: 0,
      charts: []
    })),
    refetchInterval: 60000,
  });

  const { data: recentUsers } = useQuery({
    queryKey: ['admin-recent-users'],
    queryFn: () => adminApi.get('/admin/users?limit=6&sort=newest').then(r => r.data).catch(() => ({ users: [] })),
  });

  const { data: recentTx } = useQuery({
    queryKey: ['admin-recent-tx'],
    queryFn: () => adminApi.get('/admin/transactions?limit=6').then(r => r.data).catch(() => ({ transactions: [] })),
  });

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">Admin Dashboard</h2>
        <p className="text-slate-500 text-sm">{format(new Date(), 'EEEE, dd MMMM yyyy')} · Real-time data</p>
      </div>

      {/* Stats Grid */}
      <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        initial="hidden" animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Customers" value={stats?.users?.total || '0'} icon={Users} trend={12} color="blue" />
        <StatCard label="New Today" value={stats?.users?.today_new || '0'} icon={UserCheck} trend={8} color="green" />
        <StatCard label="Pending KYC" value={stats?.pending_kyc || '0'} icon={Clock} trend={-5} color="amber" />
        <StatCard label="Accounts Deposits" value={`₹${((stats?.accounts?.total_deposits || 0) / 10000000).toFixed(1)}Cr`} icon={Building2} trend={3} color="purple" />
        <StatCard label="Today's Transactions" value={stats?.today_transactions?.total || '0'} icon={ArrowLeftRight} trend={18} color="green" />
        <StatCard label="Today's Volume" value={`₹${((stats?.today_transactions?.volume || 0) / 100000).toFixed(1)}L`} icon={DollarSign} trend={18} color="green" />
        <StatCard label="Pending Cards" value={stats?.pending_cards || '0'} icon={CreditCard} trend={5} color="blue" />
        <StatCard label="Pending Loans" value={stats?.pending_loans || '0'} icon={Activity} color="amber" />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Volume */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-white font-semibold">Transaction Volume</h3>
              <p className="text-slate-500 text-xs">This week</p>
            </div>
            <span className="text-emerald-400 text-sm font-medium">+18% vs last week</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats?.charts && stats.charts.length > 0 ? stats.charts : txVolumeData}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3366ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3366ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 12 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(1)}k`} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f1f5f9' }}
                formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Volume']}
              />
              <Area type="monotone" dataKey="volume" stroke="#3366ff" strokeWidth={2} fill="url(#volGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* KYC Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-1">KYC Activity</h3>
          <p className="text-slate-500 text-xs mb-5">Approvals vs Rejections</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats?.kyc_activity && stats.kyc_activity.length > 0 ? stats.kyc_activity : kycData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f1f5f9' }} />
              <Bar dataKey="approved" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h3 className="text-white font-semibold">Recent Registrations</h3>
            <a href="/admin/users" className="text-brand-400 text-xs hover:underline">View all</a>
          </div>
          <div className="divide-y divide-slate-800">
            {(recentUsers?.users || []).length === 0 ? (
              <div className="py-8 text-center text-slate-600">No data</div>
            ) : (
              (recentUsers?.users || []).map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 bg-brand-600/20 rounded-full flex items-center justify-center text-brand-400 text-sm font-semibold shrink-0">
                    {u.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{u.full_name}</p>
                    <p className="text-slate-500 text-xs">{u.customer_id}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium
                    ${u.kyc_status === 'approved' ? 'bg-emerald-900/30 text-emerald-400'
                      : u.kyc_status === 'pending' ? 'bg-amber-900/30 text-amber-400'
                      : 'bg-red-900/30 text-red-400'}`}>
                    {u.kyc_status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Flagged / Recent Transactions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h3 className="text-white font-semibold">Recent Transactions</h3>
            <a href="/admin/transactions" className="text-brand-400 text-xs hover:underline">View all</a>
          </div>
          <div className="divide-y divide-slate-800">
            {(recentTx?.transactions || []).length === 0 ? (
              <div className="py-8 text-center text-slate-600">No transactions</div>
            ) : (
              (recentTx?.transactions || []).map((tx: any) => (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${tx.type === 'credit' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{tx.description || tx.type}</p>
                    <p className="text-slate-500 text-xs">{tx.transaction_ref}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                      ₹{parseFloat(tx.amount).toLocaleString('en-IN')}
                    </p>
                    <p className="text-slate-600 text-xs">{tx.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
