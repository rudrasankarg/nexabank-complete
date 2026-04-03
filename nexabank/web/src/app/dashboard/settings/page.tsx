'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, Shield, Smartphone, Mail, Lock, 
  Moon, Sun, Eye, EyeOff, Save, Loader2 
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';

export default function UserSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    email_alerts: true,
    sms_alerts: false,
    push_notifications: true,
    marketing: false,
    two_factor: false,
    biometric: false,
    dark_mode: true
  });

  useEffect(() => {
    // We already have some prefs in user context maybe, but let's fetch fresh
    api.get('/users/profile')
      .then(res => {
        const u = res.data.user;
        const prefs = u.notification_preferences || {};
        setSettings({
          email_alerts: prefs.email_alerts !== false,
          sms_alerts: prefs.sms_alerts || false,
          push_notifications: prefs.push_notifications !== false,
          marketing: prefs.marketing || false,
          two_factor: u.two_factor_enabled || false,
          biometric: u.biometric_enabled || false,
          dark_mode: true
        });
        
        // After mount, update dark_mode state based on actual element
        if (typeof document !== 'undefined') {
          setSettings(s => ({ ...s, dark_mode: document.documentElement.classList.contains('dark') }));
        }
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.patch('/users/notifications/preferences', {
        '2fa': settings.two_factor,
        email_alerts: settings.email_alerts,
        sms_alerts: settings.sms_alerts,
        push_notifications: settings.push_notifications,
        marketing: settings.marketing
      });
      toast.success('Settings updated successfully');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    </div>
  );

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Account Settings</h2>
          <p className="text-slate-500 text-sm">Manage your preferences, notifications, and security</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-600/20 hover:bg-brand-500 transition-all font-bold disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Settings */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Security</h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Two-Factor Authentication</p>
                <p className="text-xs text-slate-500">Require an OTP when logging in from new devices.</p>
              </div>
              <Toggle active={settings.two_factor} onClick={() => handleToggle('two_factor')} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Biometric Login</p>
                <p className="text-xs text-slate-500">Use Face ID or Fingerprint on supported mobile devices.</p>
              </div>
              <Toggle active={settings.biometric} onClick={() => handleToggle('biometric')} disabled />
            </div>
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Notifications</h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Push Notifications</p>
                <p className="text-xs text-slate-500">Real-time alerts for transactions and OTPs.</p>
              </div>
              <Toggle active={settings.push_notifications} onClick={() => handleToggle('push_notifications')} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Email Alerts</p>
                <p className="text-xs text-slate-500">Receive statements and important account updates.</p>
              </div>
              <Toggle active={settings.email_alerts} onClick={() => handleToggle('email_alerts')} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">SMS Alerts</p>
                <p className="text-xs text-slate-500">Standard carrier charges may apply.</p>
              </div>
              <Toggle active={settings.sms_alerts} onClick={() => handleToggle('sms_alerts')} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Marketing & Offers</p>
                <p className="text-xs text-slate-500">Get notified about new credit cards and loans.</p>
              </div>
              <Toggle active={settings.marketing} onClick={() => handleToggle('marketing')} />
            </div>
          </div>
        </motion.div>
        
        {/* Appearance Settings */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm md:col-span-2">
           <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Appearance</h3>
          </div>
          <div className="flex items-center justify-between max-w-sm">
             <div>
                <p className="font-semibold text-slate-900 dark:text-white">Dark Mode</p>
                <p className="text-xs text-slate-500">Switch between light and dark modes.</p>
             </div>
             <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
               <button 
                 onClick={() => {
                   setSettings(s => ({...s, dark_mode: false}));
                   document.documentElement.classList.remove('dark');
                   localStorage.setItem('theme', 'light');
                 }}
                 className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!settings.dark_mode ? 'bg-white shadow-md text-slate-900' : 'hover:bg-white/50 text-slate-400'}`}>
                 <Sun className="w-4 h-4 mx-auto mb-1" /> Light
               </button>
               <button 
                 onClick={() => {
                   setSettings(s => ({...s, dark_mode: true}));
                   document.documentElement.classList.add('dark');
                   localStorage.setItem('theme', 'dark');
                 }}
                 className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${settings.dark_mode ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-400'}`}>
                 <Moon className="w-4 h-4 mx-auto mb-1" /> Dark
               </button>
             </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

function Toggle({ active, onClick, disabled = false }: { active: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-12 h-6 rounded-full p-1 transition-colors ${active ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <motion.div 
        layout 
        className="w-4 h-4 bg-white rounded-full shadow-sm"
        animate={{ x: active ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
