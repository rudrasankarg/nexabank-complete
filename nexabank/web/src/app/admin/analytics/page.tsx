'use client';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Wallet, CreditCard, ArrowUpRight } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

const fallbackData = [
  { name: 'Mon', revenue: 4000, users: 2400 },
  { name: 'Tue', revenue: 3000, users: 1398 },
  { name: 'Wed', revenue: 2000, users: 9800 },
  { name: 'Thu', revenue: 2780, users: 3908 },
  { name: 'Fri', revenue: 1890, users: 4800 },
  { name: 'Sat', revenue: 2390, users: 3800 },
  { name: 'Sun', revenue: 3490, users: 4300 },
];

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics-full'],
    queryFn: () => adminApi.get('/admin/analytics').then(r => r.data),
  });

  if (isLoading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
    </div>
  );

  const stats = [
    { label: 'Total Revenue', value: analytics?.stats?.total_revenue || '₹0.0M', icon: Wallet },
    { label: 'Active Users', value: analytics?.stats?.active_users || '0', icon: Users },
    { label: 'Txn Volume', value: analytics?.stats?.txn_volume || '0/total', icon: TrendingUp },
    { label: 'New Cards', value: analytics?.stats?.new_cards || '0', icon: CreditCard },
  ];

  const revenueData = analytics?.revenueChart || fallbackData.map(d => ({ ...d, amount: d.revenue }));
  const usersData = analytics?.usersChart || fallbackData.map(d => ({ ...d, count: d.users }));

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Platform Analytics</h1>
        <p className="text-slate-400">Track user growth, transaction volume, and system performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
             <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-brand-600/10 rounded-xl text-brand-400">
                 <stat.icon className="w-5 h-5" />
               </div>
             </div>
             <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
             <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
        <div className="glass p-6 rounded-3xl border border-white/5">
           <h3 className="text-white font-bold mb-6">Revenue Growth</h3>
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3f5da1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3f5da1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#3f5da1" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/5">
           <h3 className="text-white font-bold mb-6">User Activity</h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={usersData}>
                <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {usersData.map((_item: any, i: number) => <Cell key={i} fill={i % 2 === 0 ? '#3f5da1' : '#d49a10'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
