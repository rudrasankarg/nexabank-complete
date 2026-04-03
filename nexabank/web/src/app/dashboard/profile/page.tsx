'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User, Mail, Phone, MapPin, Calendar, CreditCard,
  Edit3, Save, X, Camera, CheckCircle, Shield,
  Bell, Smartphone, Key, AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'kyc' | 'preferences'>('personal');

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/profile').then(r => r.data),
  });

  const profile = data?.user;

  const { register, handleSubmit, formState: { isDirty } } = useForm({
    values: profile ? {
      address_line1: profile.address_line1 || '',
      address_line2: profile.address_line2 || '',
      city: profile.city || '',
      state: profile.state || '',
      pincode: profile.pincode || '',
    } : {},
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch('/users/profile', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated');
      setEditing(false);
    },
    onError: () => toast.error('Update failed'),
  });

  const prefMutation = useMutation({
    mutationFn: (data: any) => api.patch('/users/notifications/preferences', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); toast.success('Preference updated'); },
    onError: () => toast.error('Update failed'),
  });

  const photoMutation = useMutation({
    mutationFn: (url: string) => api.patch('/users/profile-photo', { photo_url: url }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); toast.success('Profile photo updated'); },
    onError: () => toast.error('Photo update failed'),
  });

  const handleToggle = (key: string, currentVal: boolean) => {
    prefMutation.mutate({ [key]: !currentVal });
  };

  const handlePhotoClick = () => {
    const url = prompt('Enter image URL (e.g., from Unsplash):', profile?.profile_photo_url || '');
    if (url && url !== profile?.profile_photo_url) photoMutation.mutate(url);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'kyc', label: 'KYC & Documents' },
    { id: 'preferences', label: 'Preferences' },
  ] as const;

  const InfoRow = ({ icon: Icon, label, value, verified }: { icon: any; label: string; value: string; verified?: boolean }) => (
    <div className="flex items-center gap-4 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{value || '—'}</p>
      </div>
      {verified !== undefined && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${verified ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'}`}>
          {verified ? '✓ Verified' : 'Pending'}
        </span>
      )}
    </div>
  );

  const PreferenceToggle = ({ icon: Icon, label, desc, prefKey, value }: any) => (
    <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
          <p className="text-xs text-slate-400">{desc}</p>
        </div>
      </div>
      <button onClick={() => handleToggle(prefKey, value)} disabled={prefMutation.isPending}
        className={`relative w-11 h-6 rounded-full transition-all disabled:opacity-50 ${value ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-6 text-white mb-6 relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
        </div>
        <div className="relative flex items-center gap-5">
          <div className="relative">
            {profile?.profile_photo_url ? (
              <img src={profile.profile_photo_url} className="w-20 h-20 rounded-2xl object-cover border-2 border-white/40" alt="Profile" />
            ) : (
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold">
                {profile?.full_name?.charAt(0) || user?.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <button onClick={handlePhotoClick} className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
              <Camera className="w-4 h-4 text-brand-600" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile?.full_name || user?.full_name}</h2>
            <p className="text-white/70 text-sm font-mono">{profile?.customer_id || user?.customer_id}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium
                ${profile?.kyc_status === 'approved' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' : 'bg-amber-500/20 text-amber-200 border-amber-500/30'}`}>
                KYC: {profile?.kyc_status || 'Pending'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/20 uppercase">
                {profile?.status || 'Active'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 mb-5">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all
              ${activeTab === tab.id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'personal' && (
          <motion.div key="personal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">Personal Information</h3>
                <button onClick={() => setEditing(v => !v)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all
                    ${editing ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                  {editing ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Edit3 className="w-3.5 h-3.5" /> Edit</>}
                </button>
              </div>
              {isLoading ? (
                <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl shimmer" />)}</div>
              ) : (
                <>
                  <InfoRow icon={User} label="Full Name" value={profile?.full_name} />
                  <InfoRow icon={Mail} label="Email Address" value={profile?.email} verified={profile?.email_verified} />
                  <InfoRow icon={Phone} label="Mobile Number" value={profile?.phone} verified={profile?.phone_verified} />
                  <InfoRow icon={Calendar} label="Date of Birth" value={profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
                  <InfoRow icon={CreditCard} label="PAN Number" value={profile?.pan_number} />
                </>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Address Details</h3>
              {editing ? (
                <form onSubmit={handleSubmit(data => updateMutation.mutate(data))} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { name: 'address_line1', label: 'Address Line 1', placeholder: 'House/Flat/Block No.' },
                      { name: 'address_line2', label: 'Address Line 2', placeholder: 'Street/Colony/Area' },
                      { name: 'city', label: 'City', placeholder: 'City' },
                      { name: 'state', label: 'State', placeholder: 'State' },
                      { name: 'pincode', label: 'PIN Code', placeholder: '6-digit PIN' },
                    ].map(({ name, label, placeholder }) => (
                      <div key={name}>
                        <label className="block text-xs text-slate-500 mb-1">{label}</label>
                        <input {...register(name as any)} placeholder={placeholder}
                          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm" />
                      </div>
                    ))}
                  </div>
                  <button type="submit" disabled={updateMutation.isPending || !isDirty}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 mt-2">
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </form>
              ) : (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-900 dark:text-white">
                      {[profile?.address_line1, profile?.address_line2].filter(Boolean).join(', ') || 'No address provided'}
                    </p>
                    <p className="text-sm text-slate-900 dark:text-white">
                      {[profile?.city, profile?.state, profile?.pincode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'kyc' && (
          <motion.div key="kyc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4 shadow-sm">
            <h3 className="font-semibold text-slate-900 dark:text-white">KYC Documents</h3>
            <div className={`flex items-start gap-3 p-4 rounded-xl ${profile?.kyc_status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-amber-50 dark:bg-amber-900/10'}`}>
              {profile?.kyc_status === 'approved' ? <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />}
              <div>
                <p className={`font-semibold text-sm ${profile?.kyc_status === 'approved' ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
                  KYC Status: {profile?.kyc_status?.toUpperCase() || 'PENDING'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {profile?.kyc_status === 'approved' ? 'Identity verified. Full banking access enabled.' : 'Complete KYC to unlock higher transaction limits.'}
                </p>
              </div>
            </div>
            {['Aadhaar Card', 'PAN Card', 'Address Proof'].map((doc) => (
              <div key={doc} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className="flex items-center gap-3"><Shield className="w-4 h-4 text-slate-400" /><span className="text-sm">{doc}</span></div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${profile?.kyc_status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {profile?.kyc_status === 'approved' ? 'Verified' : 'Pending'}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'preferences' && (
          <motion.div key="prefs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <PreferenceToggle icon={Bell} label="Email Notifications" desc="Alerts, statements, and offers" prefKey="email" value={profile?.notification_preferences?.email} />
            <PreferenceToggle icon={Phone} label="SMS Alerts" desc="OTP and transaction alerts via SMS" prefKey="sms" value={profile?.notification_preferences?.sms} />
            <PreferenceToggle icon={Smartphone} label="Push Notifications" desc="App notifications for activity" prefKey="push" value={profile?.notification_preferences?.push} />
            <PreferenceToggle icon={Key} label="Two-Factor Auth" desc="2FA via email verification" prefKey="2fa" value={profile?.two_factor_enabled || false} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { AnimatePresence } from 'framer-motion';
