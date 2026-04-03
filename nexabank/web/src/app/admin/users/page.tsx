'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search, Filter, Eye, UserCheck, UserX, Mail,
  Phone, Calendar, ChevronLeft, ChevronRight, X, Shield
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, page, statusFilter, kycFilter],
    queryFn: () => adminApi.get(`/admin/users?page=${page}&limit=15&search=${search}&status=${statusFilter}&kyc_status=${kycFilter}`).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const users = data?.users || [];
  const pagination = data?.pagination;

  const suspendMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'suspend' | 'activate' }) =>
      adminApi.patch(`/admin/users/${id}/status`, { status: action === 'suspend' ? 'suspended' : 'active' }).then(r => r.data),
    onSuccess: (_, { action }) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`User ${action === 'suspend' ? 'suspended' : 'activated'}`);
      setSelectedUser(null);
    },
    onError: () => toast.error('Action failed'),
  });

  const approveKYCMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      adminApi.patch(`/admin/kyc/${id}`, { status: action }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('KYC updated'); setSelectedUser(null); },
  });

  const kycColor: any = {
    approved: 'bg-emerald-900/30 text-emerald-400',
    pending: 'bg-amber-900/30 text-amber-400',
    under_review: 'bg-blue-900/30 text-blue-400',
    rejected: 'bg-red-900/30 text-red-400',
  };

  const statusColor: any = {
    active: 'bg-emerald-900/30 text-emerald-400',
    pending: 'bg-amber-900/30 text-amber-400',
    suspended: 'bg-red-900/30 text-red-400',
    closed: 'bg-slate-800 text-slate-400',
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Customer Management</h2>
          <p className="text-slate-500 text-sm">{pagination?.total || 0} total customers</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, customer ID..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 placeholder-slate-600 text-sm focus:border-brand-500 transition-all" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-sm focus:border-brand-500">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={kycFilter} onChange={e => setKycFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-sm focus:border-brand-500">
          <option value="">All KYC</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {['Customer', 'Customer ID', 'Phone', 'Status', 'KYC', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs uppercase tracking-wider text-slate-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-slate-800 rounded shimmer w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-600">No users found</td></tr>
              ) : (
                users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-600/20 rounded-full flex items-center justify-center text-brand-400 text-xs font-semibold shrink-0">
                          {u.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{u.full_name}</p>
                          <p className="text-slate-500 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-400 text-sm">{u.customer_id}</td>
                    <td className="px-5 py-4 text-slate-400 text-sm">{u.phone}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[u.status] || ''}`}>{u.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${kycColor[u.kyc_status] || ''}`}>{u.kyc_status}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-sm">{u.created_at ? format(new Date(u.created_at), 'dd MMM yyyy') : '—'}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => setSelectedUser(u)}
                        className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
            <p className="text-slate-500 text-sm">Page {page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-lg">Customer Details</h3>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-5 p-4 bg-slate-800 rounded-2xl">
              <div className="w-14 h-14 bg-brand-600/20 rounded-full flex items-center justify-center text-brand-400 text-xl font-bold">
                {selectedUser.full_name?.charAt(0)}
              </div>
              <div>
                <p className="text-white font-semibold">{selectedUser.full_name}</p>
                <p className="text-slate-400 text-sm">{selectedUser.customer_id}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[selectedUser.status]}`}>{selectedUser.status}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${kycColor[selectedUser.kyc_status]}`}>{selectedUser.kyc_status}</span>
                </div>
              </div>
            </div>
            <div className="space-y-3 mb-5">
              {[
                { icon: Mail, label: 'Email', value: selectedUser.email },
                { icon: Phone, label: 'Phone', value: selectedUser.phone },
                { icon: Shield, label: 'PAN', value: selectedUser.pan_number || 'Not provided' },
                { icon: Calendar, label: 'Joined', value: selectedUser.created_at ? format(new Date(selectedUser.created_at), 'dd MMM yyyy') : '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-slate-500 text-sm w-16">{label}</span>
                  <span className="text-slate-300 text-sm">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              {selectedUser.status === 'active' ? (
                <button onClick={() => suspendMutation.mutate({ id: selectedUser.id, action: 'suspend' })}
                  disabled={suspendMutation.isPending}
                  className="flex-1 py-2.5 bg-red-900/20 text-red-400 rounded-xl text-sm font-medium hover:bg-red-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  <UserX className="w-4 h-4" /> Suspend
                </button>
              ) : (
                <button onClick={() => suspendMutation.mutate({ id: selectedUser.id, action: 'activate' })}
                  disabled={suspendMutation.isPending}
                  className="flex-1 py-2.5 bg-emerald-900/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-900/30 transition-all flex items-center justify-center gap-2">
                  <UserCheck className="w-4 h-4" /> Activate
                </button>
              )}
              {selectedUser.kyc_status === 'pending' || selectedUser.kyc_status === 'under_review' ? (
                <button onClick={() => approveKYCMutation.mutate({ id: selectedUser.id, action: 'approved' })}
                  className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-all">
                  Approve KYC
                </button>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
