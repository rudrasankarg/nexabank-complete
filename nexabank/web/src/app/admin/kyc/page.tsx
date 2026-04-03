'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserCheck, Clock, CheckCircle, XCircle, Eye, X, AlertTriangle, User, Phone, Mail, CreditCard } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminKYCPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-kyc-pending'],
    queryFn: () => adminApi.get('/admin/kyc/pending').then(r => r.data),
    refetchInterval: 30000,
  });

  const users = data?.users || [];

  const updateKYC = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      adminApi.patch(`/admin/kyc/${id}`, { status, notes }).then(r => r.data),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['admin-kyc-pending'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(`KYC ${status}`);
      setSelected(null);
      setRejectNote('');
      setShowRejectForm(false);
    },
    onError: () => toast.error('Action failed'),
  });

  const statusMeta: Record<string, any> = {
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
    under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Eye },
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">KYC Review Queue</h2>
          <p className="text-slate-500 text-sm">{users.length} pending review{users.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-900/20 px-3 py-2 rounded-xl border border-amber-800/30">
          <AlertTriangle className="w-4 h-4" />
          {users.length} pending
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: users.filter((u: any) => u.kyc_status === 'pending').length, color: 'text-amber-400' },
          { label: 'Under Review', value: users.filter((u: any) => u.kyc_status === 'under_review').length, color: 'text-blue-400' },
          { label: 'Total Queue', value: users.length, color: 'text-white' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-slate-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-900 rounded-xl shimmer border border-slate-800" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <p className="text-white font-semibold">All Clear!</p>
          <p className="text-slate-500 text-sm mt-1">No pending KYC reviews</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-slate-800">
            {users.map((user: any) => {
              const meta = statusMeta[user.kyc_status] || statusMeta.pending;
              const StatusIcon = meta.icon;
              return (
                <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-slate-800/30 transition-colors">
                  <div className="w-10 h-10 bg-brand-600/20 rounded-full flex items-center justify-center text-brand-400 font-semibold text-sm shrink-0">
                    {user.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{user.full_name}</p>
                    <p className="text-slate-500 text-xs">{user.customer_id} · Joined {user.created_at ? format(new Date(user.created_at), 'dd MMM yyyy') : '—'}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${meta.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {meta.label}
                  </span>
                  <button onClick={() => setSelected(user)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors">
                    <Eye className="w-3.5 h-3.5" /> Review
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-lg">KYC Review</h3>
              <button onClick={() => { setSelected(null); setShowRejectForm(false); setRejectNote(''); }}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer info */}
            <div className="bg-slate-800 rounded-2xl p-4 mb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-brand-600/20 rounded-xl flex items-center justify-center text-brand-400 text-xl font-bold">
                  {selected.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-semibold">{selected.full_name}</p>
                  <p className="text-slate-400 text-sm">{selected.customer_id}</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { icon: Mail, label: selected.email },
                  { icon: Phone, label: selected.phone },
                  { icon: CreditCard, label: selected.pan_number || 'PAN not provided' },
                  { icon: User, label: `Joined: ${selected.created_at ? format(new Date(selected.created_at), 'dd MMM yyyy') : '—'}` },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-slate-400 text-sm">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div className="mb-5">
              <h4 className="text-white text-sm font-medium mb-3">Submitted Documents</h4>
              {(selected.documents || []).length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-700 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selected.documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
                      <span className="text-slate-300 text-sm">{doc.document_type}</span>
                      <div className="flex gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${doc.status === 'approved' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400'}`}>
                          {doc.status}
                        </span>
                        {doc.document_url && (
                          <a href={doc.document_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-brand-400 hover:underline">View</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showRejectForm && (
              <div className="mb-4">
                <label className="block text-slate-400 text-sm mb-1.5">Rejection Reason</label>
                <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                  placeholder="Explain why KYC is being rejected..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 placeholder-slate-600 text-sm resize-none" />
              </div>
            )}

            <div className="flex gap-3">
              {showRejectForm ? (
                <>
                  <button onClick={() => setShowRejectForm(false)}
                    className="flex-1 py-3 border border-slate-700 rounded-xl text-slate-400 text-sm hover:bg-slate-800 transition-colors">
                    Back
                  </button>
                  <button onClick={() => updateKYC.mutate({ id: selected.id, status: 'rejected', notes: rejectNote })}
                    disabled={!rejectNote.trim() || updateKYC.isPending}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    <XCircle className="w-4 h-4" /> Confirm Reject
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setShowRejectForm(true)}
                    className="flex-1 py-3 bg-red-900/20 text-red-400 rounded-xl text-sm font-medium hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2 border border-red-800/30">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button onClick={() => updateKYC.mutate({ id: selected.id, status: 'under_review' })}
                    disabled={updateKYC.isPending}
                    className="flex-1 py-3 bg-blue-900/20 text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-900/30 transition-colors border border-blue-800/30 disabled:opacity-50">
                    Mark Under Review
                  </button>
                  <button onClick={() => updateKYC.mutate({ id: selected.id, status: 'approved' })}
                    disabled={updateKYC.isPending}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
