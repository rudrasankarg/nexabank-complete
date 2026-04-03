'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Shield, Mail, Phone, MapPin, MoreVertical, X, Loader2, Key, Building2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    employee_id: '', full_name: '', email: '',
    password: '', role: 'admin', branch_id: '', phone: ''
  });

  const fetchAdmins = () => {
    adminApi.get('/admin/admins')
      .then(r => setAdmins(r.data.admins))
      .catch(() => setAdmins([]));
  };

  useEffect(() => {
    fetchAdmins();
    adminApi.get('/admin/branches').then(r => setBranches(r.data.branches)).catch(() => []);
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminApi.post('/admin/admins', formData);
      toast.success('Admin added successfully');
      setShowAddModal(false);
      setFormData({
        employee_id: '', full_name: '', email: '',
        password: '', role: 'admin', branch_id: '', phone: ''
      });
      fetchAdmins();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Internal Administration</h1>
          <p className="text-slate-400">Manage bank employees and their system access levels.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl shadow-lg shadow-brand-600/20 hover:bg-brand-500 transition-all font-semibold"
        >
          <UserPlus className="w-5 h-5" /> Add Admin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins.map((admin, i) => (
          <motion.div 
            key={admin.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-3xl border border-white/5 relative group"
          >
            <div className="absolute top-6 right-6">
              <button className="p-2 text-slate-500 hover:text-white transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-brand-600/10 rounded-2xl flex items-center justify-center border border-brand-500/20">
                <Shield className="w-8 h-8 text-brand-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{admin.full_name}</h3>
                <span className="text-brand-400 text-xs font-bold uppercase tracking-widest">{admin.role.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <Mail className="w-4 h-4" /> {admin.email}
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <MapPin className="w-4 h-4" /> {admin.branch_name || 'Global HQ'}
              </div>
              <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Emp ID: {admin.employee_id}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest
                  ${admin.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  {admin.is_active ? 'Active' : 'Suspended'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-xl overflow-hidden relative shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Register Admin</h3>
                  <p className="text-slate-500 text-sm">Grant specialized system access to employees.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddAdmin} className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Employee ID</label>
                     <input 
                       required
                       value={formData.employee_id}
                       onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                       className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all font-mono"
                       placeholder="ADMIN002"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Role</label>
                     <select 
                       value={formData.role}
                       onChange={(e) => setFormData({...formData, role: e.target.value})}
                       className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all appearance-none"
                     >
                       <option value="admin">Admin</option>
                       <option value="super_admin">Super Admin</option>
                       <option value="compliance">Compliance Officer</option>
                       <option value="auditor">Internal Auditor</option>
                     </select>
                   </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Full Name</label>
                  <input 
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Email</label>
                    <input 
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all"
                      placeholder="john@nexabank.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Temporary Password</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        required
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Assign Branch</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <select 
                        required
                        value={formData.branch_id}
                        onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all appearance-none"
                      >
                        <option value="">Select Branch</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Phone</label>
                    <input 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all"
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>

                <button 
                  disabled={isSubmitting}
                  className="w-full py-4 mt-4 bg-brand-600 text-white rounded-[1.25rem] font-bold shadow-lg shadow-brand-600/20 hover:bg-brand-500 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Admin Account'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
