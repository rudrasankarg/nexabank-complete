'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Plus, Search, MapPin, Phone, Mail, 
  Globe, Shield, RefreshCw, X, Check, AlertCircle, Loader2
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '', branch_code: '', ifsc_code: '', micr_code: '',
    address: '', city: '', state: '', pincode: '',
    phone: '', email: ''
  });

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/branches');
      setBranches(res.data.branches);
    } catch (err) {
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminApi.post('/admin/branches', formData);
      toast.success('Branch added successfully');
      setShowAddModal(false);
      setFormData({
        name: '', branch_code: '', ifsc_code: '', micr_code: '',
        address: '', city: '', state: '', pincode: '',
        phone: '', email: ''
      });
      fetchBranches();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBranches = branches
    .filter(b => 
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.branch_code?.toLowerCase().includes(search.toLowerCase()) ||
      b.city?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const s = search.toLowerCase();
      // Prefix matches get priority
      const aStarts = a.name?.toLowerCase().startsWith(s) || a.branch_code?.toLowerCase().startsWith(s);
      const bStarts = b.name?.toLowerCase().startsWith(s) || b.branch_code?.toLowerCase().startsWith(s);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Branch Network</h1>
          <p className="text-slate-400 text-sm">Manage physical bank locations and their operational status.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search branches..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all w-full md:w-64"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-600/20 hover:bg-brand-500 transition-all font-semibold whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Branch
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-900/50 border border-slate-800 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
          <Building2 className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg">No Branches Found</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-2">Adjust your search or add a new branch to the network.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => (
            <motion.div 
              layout
              key={branch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 group hover:border-brand-500/30 transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-brand-600/10 rounded-2xl flex items-center justify-center text-brand-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${branch.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {branch.is_active ? 'Online' : 'Offline'}
                  </span>
                  <p className="text-slate-500 text-[10px] mt-1 font-mono uppercase tracking-tighter">#{branch.branch_code}</p>
                </div>
              </div>
              
              <h3 className="text-white font-bold text-lg mb-4">{branch.name}</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-slate-400">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate">{branch.city}, {branch.state}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <Shield className="w-4 h-4 shrink-0" />
                  <span className="font-mono text-xs">{branch.ifsc_code}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>{branch.phone}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Pin Code</p>
                  <p className="text-white text-sm font-semibold">{branch.pincode}</p>
                </div>
                <button className="text-brand-400 hover:text-brand-300 transition-colors text-xs font-semibold">
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

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
              className="bg-slate-900 border border-slate-800 rounded-[2rem] w-full max-w-2xl overflow-hidden relative shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Add New Branch</h3>
                  <p className="text-slate-500 text-sm">Expand the NexaBank network with a new location.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddBranch} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Branch Name</label>
                     <input 
                       required
                       value={formData.name}
                       onChange={(e) => setFormData({...formData, name: e.target.value})}
                       className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all"
                       placeholder="Central Square"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Branch Code</label>
                     <input 
                       required
                       value={formData.branch_code}
                       onChange={(e) => setFormData({...formData, branch_code: e.target.value})}
                       className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all font-mono"
                       placeholder="BR001"
                     />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">IFSC Code</label>
                     <input 
                       required
                       value={formData.ifsc_code}
                       onChange={(e) => setFormData({...formData, ifsc_code: e.target.value})}
                       className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all font-mono"
                       placeholder="NEXA0000001"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">MICR Code</label>
                     <input 
                       required
                       value={formData.micr_code}
                       onChange={(e) => setFormData({...formData, micr_code: e.target.value})}
                       className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all font-mono"
                       placeholder="110001001"
                     />
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Detailed Address</label>
                  <textarea 
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows={2}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all resize-none"
                    placeholder="Floor 4, Nexa Tower, Financial District"
                  />
                </div>

                <div className="grid grid-cols-3 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">City</label>
                     <input 
                       required
                       value={formData.city}
                       onChange={(e) => setFormData({...formData, city: e.target.value})}
                       className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all"
                       placeholder="Mumbai"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">State</label>
                     <input 
                       required
                       value={formData.state}
                       onChange={(e) => setFormData({...formData, state: e.target.value})}
                       className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all"
                       placeholder="Maharashtra"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Pincode</label>
                     <input 
                       required
                       value={formData.pincode}
                       onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                       className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all"
                       placeholder="400001"
                     />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Phone</label>
                     <input 
                       required
                       value={formData.phone}
                       onChange={(e) => setFormData({...formData, phone: e.target.value})}
                       className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all"
                       placeholder="+91 22 1234 5678"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Email</label>
                     <input 
                       required
                       type="email"
                       value={formData.email}
                       onChange={(e) => setFormData({...formData, email: e.target.value})}
                       className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all"
                       placeholder="mumbai@nexabank.com"
                     />
                   </div>
                </div>

                <button 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/20 hover:bg-brand-500 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Branch'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
