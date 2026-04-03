'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, Plus, Shield, Globe, Wifi, Smartphone,
  Lock, Eye, EyeOff, ToggleLeft, ToggleRight, X, CheckCircle, Loader2, Mail
} from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/types';
import toast from 'react-hot-toast';

const networkColors: Record<string, string> = {
  VISA: 'from-brand-700 to-brand-500',
  MASTERCARD: 'from-slate-800 to-slate-600',
  RUPAY: 'from-emerald-700 to-emerald-500',
  AMEX: 'from-amber-700 to-amber-500',
};

function BankCard({ card, onClick }: { card: Card; onClick: () => void }) {
  const [showNumber, setShowNumber] = useState(false);
  const gradient = networkColors[card.network] || networkColors.VISA;

  return (
    <motion.div whileHover={{ y: -4 }} onClick={onClick}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 text-white cursor-pointer shadow-xl`}>
      {/* Card decorations */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-20 translate-x-20" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/5 rounded-full translate-y-16 -translate-x-16" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-widest">NexaBank</p>
            <p className="text-white font-semibold mt-0.5 capitalize">{card.card_type} Card</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium border
            ${card.status === 'active' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30'
              : card.status === 'blocked' ? 'bg-red-500/20 text-red-200 border-red-500/30'
              : 'bg-amber-500/20 text-amber-200 border-amber-500/30'}`}>
            {card.status.replace('_', ' ')}
          </div>
        </div>

        {/* Chip & NFC */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md" />
          {card.is_contactless_enabled && <Wifi className="w-5 h-5 text-white/60 rotate-90" />}
        </div>

        {/* Card number */}
        <div className="flex items-center gap-2 mb-6">
          <button onClick={(e) => { e.stopPropagation(); setShowNumber(v => !v); }}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            {showNumber ? <EyeOff className="w-4 h-4 text-white/60" /> : <Eye className="w-4 h-4 text-white/60" />}
          </button>
          <p className="font-mono tracking-widest text-lg">
            {showNumber ? card.card_number_masked : '•••• •••• •••• ' + card.card_number_masked.slice(-4)}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/50 text-xs mb-0.5">Card Holder</p>
            <p className="font-semibold text-sm">{card.card_holder_name}</p>
          </div>
          <div>
            <p className="text-white/50 text-xs mb-0.5">Expires</p>
            <p className="font-mono font-semibold text-sm">{card.expiry_month}/{card.expiry_year.slice(-2)}</p>
          </div>
          <p className="font-bold text-xl italic">{card.network}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ApplyCardModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({ account_id: '', card_type: 'debit', network: 'VISA', delivery_address: '' });

  const { data: accData } = useQuery({ queryKey: ['accounts'], queryFn: () => api.get('/accounts').then(r => r.data) });
  const accounts: any[] = accData?.accounts || [];

  const sendOTPMutation = useMutation({
    mutationFn: () => api.post('/cards/request-otp').then(r => r.data),
    onSuccess: () => { setStep(1); toast.success('Verification code sent to your email'); },
    onError: () => toast.error('Failed to send verification code'),
  });

  const applyMutation = useMutation({
    mutationFn: () => api.post('/cards/apply', { ...formData, otp }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cards'] }); toast.success('Card application submitted!'); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Application failed'),
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Apply for Card</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"><X className="w-5 h-5" /></button>
        </div>

        {step === 0 ? (
          <div className="space-y-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Linked Account</label>
              <select onChange={(e) => setFormData({ ...formData, account_id: e.target.value })} value={formData.account_id}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                <option value="">Select account</option>
                {accounts.filter(a => a.account_type !== 'fixed_deposit').map(a => (
                  <option key={a.id} value={a.id}>{a.account_number} ({a.account_type})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Card Type</label>
              <div className="grid grid-cols-2 gap-3">
                {['debit', 'credit'].map(t => (
                  <button key={t} onClick={() => setFormData({ ...formData, card_type: t })}
                    className={`py-3 rounded-xl border-2 font-medium capitalize ${formData.card_type === t ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600' : 'border-slate-100 dark:border-slate-800'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Network</label>
              <div className="grid grid-cols-3 gap-2">
                {['VISA', 'MASTERCARD', 'RUPAY'].map(n => (
                  <button key={n} onClick={() => setFormData({ ...formData, network: n })}
                    className={`py-2 text-xs rounded-lg border font-bold ${formData.network === n ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-100 dark:border-slate-800'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Delivery Address</label>
              <textarea placeholder="Enter full address for card delivery" rows={3} onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm" />
            </div>
            <button onClick={() => sendOTPMutation.mutate()} disabled={!formData.account_id || !formData.delivery_address || sendOTPMutation.isPending}
              className="w-full bg-brand-600 text-white py-4 rounded-xl font-semibold hover:bg-brand-700 transition-colors flex items-center justify-center gap-2">
              {sendOTPMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Apply Now (Requires OTP)'}
            </button>
          </div>
        ) : (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/20 rounded-2xl flex items-center justify-center mx-auto"><Mail className="w-8 h-8 text-brand-600" /></div>
            <div><h3 className="text-xl font-semibold">Verify Application</h3><p className="text-sm text-slate-500">A code was sent to your email</p></div>
            <input type="text" maxLength={6} placeholder="Enter 6-digit OTP" className="w-full text-center text-3xl font-bold tracking-widest py-4 border-2 border-slate-200 dark:border-slate-700 rounded-2xl"
              onChange={(e) => setOtp(e.target.value)} />
            <button onClick={() => applyMutation.mutate()} disabled={otp.length < 6 || applyMutation.isPending}
              className="w-full bg-brand-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2">
              {applyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Order'}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function CardSettings({ card, onClose }: { card: Card; onClose: () => void }) {
  const qc = useQueryClient();
  const [settings, setSettings] = useState({
    is_international_enabled: card.is_international_enabled,
    is_contactless_enabled: card.is_contactless_enabled,
    is_online_enabled: card.is_online_enabled,
    is_atm_enabled: card.is_atm_enabled,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/cards/${card.id}/settings`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cards'] }); toast.success('Settings updated'); },
    onError: () => toast.error('Failed to update settings'),
  });

  const blockMutation = useMutation({
    mutationFn: () => api.post(`/cards/${card.id}/block`, { reason: 'User request' }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cards'] }); toast.success('Card blocked'); onClose(); },
    onError: () => toast.error('Failed to block card'),
  });

  const Toggle = ({ label, icon: Icon, value, key }: { label: string; icon: any; value: boolean; key: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
          <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      </div>
      <button onClick={() => {
        const newVal = !value;
        const updated = { ...settings, [key]: newVal };
        setSettings(updated);
        updateMutation.mutate({ [key]: newVal });
      }}
        className={`relative w-11 h-6 rounded-full transition-all ${value ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Card Settings</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <Toggle label="International Transactions" icon={Globe} value={settings.is_international_enabled} key="is_international_enabled" />
          <Toggle label="Contactless Payments" icon={Wifi} value={settings.is_contactless_enabled} key="is_contactless_enabled" />
          <Toggle label="Online Transactions" icon={Smartphone} value={settings.is_online_enabled} key="is_online_enabled" />
          <Toggle label="ATM Withdrawals" icon={Lock} value={settings.is_atm_enabled} key="is_atm_enabled" />
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'ATM Limit', value: `₹${(card.daily_atm_limit / 1000).toFixed(0)}K` },
              { label: 'POS Limit', value: `₹${(card.daily_pos_limit / 1000).toFixed(0)}K` },
              { label: 'Online Limit', value: `₹${(card.daily_online_limit / 1000).toFixed(0)}K` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>

          {card.status === 'active' && (
            <button onClick={() => blockMutation.mutate()}
              disabled={blockMutation.isPending}
              className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl font-medium text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50">
              {blockMutation.isPending ? 'Blocking...' : '🔒 Block This Card'}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CardsPage() {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showApply, setShowApply] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['cards'],
    queryFn: () => api.get('/cards').then(r => r.data),
  });

  const cards: Card[] = data?.cards || [];

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">My Cards</h2>
          <p className="text-slate-400 text-sm">{cards.length} card{cards.length !== 1 ? 's' : ''} linked to your account</p>
        </div>
        <button onClick={() => setShowApply(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors">
          <Plus className="w-4 h-4" /> Apply Card
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="h-52 bg-slate-100 dark:bg-slate-800 rounded-3xl shimmer" />)}
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
          <CreditCard className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-slate-900 dark:text-white font-semibold mb-2">No Cards Yet</h3>
          <p className="text-slate-400 text-sm mb-6">Apply for a debit or credit card</p>
          <button onClick={() => setShowApply(true)}
            className="bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors">
            Apply Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {cards.map(card => <BankCard key={card.id} card={card} onClick={() => setSelectedCard(card)} />)}
        </div>
      )}

      {/* Card features info */}
      {cards.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Shield, label: 'Zero Liability', desc: 'On unauthorized transactions' },
            { icon: Globe, label: 'Global Access', desc: 'Use in 150+ countries' },
            { icon: Wifi, label: 'Tap & Pay', desc: 'Contactless payments' },
            { icon: Lock, label: '3D Secure', desc: 'OTP protected online use' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
              <div className="w-9 h-9 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-brand-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      )}

      {selectedCard && <CardSettings card={selectedCard} onClose={() => setSelectedCard(null)} />}
      {showApply && <ApplyCardModal onClose={() => setShowApply(false)} />}
    </div>
  );
}
