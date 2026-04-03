'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, Shield, Wallet, Globe, 
  Save, RefreshCw, AlertTriangle, Lock, Banknote,
  Smartphone, Bell, Zap, Loader2
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('financials');
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.get('/admin/settings');
      setSettings(res.data);
    } catch (err) {
      toast.error('Failed to load system settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      await adminApi.patch('/admin/settings', settings);
      toast.success('System settings updated');
    } catch (err) {
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
    </div>
  );

  const tabs = [
    { id: 'financials', label: 'Financials', icon: Banknote },
    { id: 'security', label: 'Security & Limits', icon: Shield },
    { id: 'system', label: 'System Control', icon: Globe },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">System Settings</h1>
          <p className="text-slate-400 text-sm">Global configuration for NexaBank platform parameters.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchSettings} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button 
            onClick={saveChanges}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-600/20 hover:bg-brand-500 transition-all font-bold disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-900/50 border border-slate-800 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {activeTab === 'financials' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
              <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2 text-brand-400">
                <Wallet className="w-5 h-5" /> Interest Rates (% per annum)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(settings.interest_rates).map(([key, val]: any) => (
                  <div key={key} className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                      {key.replace('_', ' ')} Rate
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.01"
                        value={val}
                        onChange={(e) => handleUpdate('interest_rates', { ...settings.interest_rates, [key]: parseFloat(e.target.value) })}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all font-mono"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
              <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2 text-amber-400">
                <Lock className="w-5 h-5" /> Transaction Limits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Daily UPI Limit</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                      <input 
                        type="number" 
                        step="1000"
                        value={settings.transaction_limits.daily_upi}
                        onChange={(e) => handleUpdate('transaction_limits', { ...settings.transaction_limits, daily_upi: parseInt(e.target.value) })}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Daily ATM Limit</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                      <input 
                        type="number" 
                        step="1000"
                        value={settings.transaction_limits.daily_atm}
                        onChange={(e) => handleUpdate('transaction_limits', { ...settings.transaction_limits, daily_atm: parseInt(e.target.value) })}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all font-mono"
                      />
                    </div>
                  </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'system' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
              <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-5 h-5" /> Maintenance Mode
              </h3>
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-red-950/20 border border-red-900/30 rounded-2xl mb-6">
                <div>
                  <h4 className="text-white font-bold mb-1 underline decoration-red-500/30">Immediate Lockdown</h4>
                  <p className="text-slate-500 text-sm">Prevent all user logins and transactions immediately.</p>
                </div>
                <button 
                  onClick={() => handleUpdate('maintenance_mode', { ...settings.maintenance_mode, enabled: !settings.maintenance_mode.enabled })}
                  className={`mt-4 md:mt-0 px-6 py-2.5 rounded-xl font-bold transition-all ${
                    settings.maintenance_mode.enabled ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {settings.maintenance_mode.enabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Maintenance Message</label>
                <textarea 
                  value={settings.maintenance_mode.message}
                  onChange={(e) => handleUpdate('maintenance_mode', { ...settings.maintenance_mode, message: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-all resize-none"
                  placeholder="System under scheduled maintenance. Please check back in 2 hours."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div 
                  onClick={async () => {
                    const t = toast.loading('Clearing system cache...');
                    try {
                      await adminApi.post('/admin/system/clear-cache');
                      toast.success('System cache cleared', { id: t });
                    } catch (err) {
                      toast.error('Failed to clear cache', { id: t });
                    }
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center gap-4 group hover:border-brand-500/30 transition-all cursor-pointer"
               >
                  <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Clear Cache</h4>
                    <p className="text-slate-500 text-xs">Purge all redis and memory caches.</p>
                  </div>
               </div>
               <div 
                  onClick={async () => {
                    const t = toast.loading('Flushing notifications...');
                    try {
                      await adminApi.post('/admin/system/flush-notifications');
                      toast.success('Marketing notifications flushed', { id: t });
                    } catch (err) {
                      toast.error('Failed to flush notifications', { id: t });
                    }
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center gap-4 group hover:border-brand-500/30 transition-all cursor-pointer"
               >
                  <div className="w-12 h-12 bg-brand-600/10 rounded-2xl flex items-center justify-center text-brand-400">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Flush Notifications</h4>
                    <p className="text-slate-500 text-xs">Clear pending email/SMS queues.</p>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
