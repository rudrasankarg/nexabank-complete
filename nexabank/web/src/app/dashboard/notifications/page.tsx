'use client';
import { motion } from 'framer-motion';
import { Bell, Gift, Zap, Shield, TrendingUp, ArrowRight, ExternalLink } from 'lucide-react';

export default function NotificationsPage() {
  const offers = [
    { title: 'Home Loans @ 8.4%', desc: 'Special rate for NexaBank Privilege customers. Limited period offer.', icon: TrendingUp, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' },
    { title: 'Cyber Insurance Cover', desc: 'Secure your online transactions with our premium cyber protection plan.', icon: Shield, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
    { title: 'Instant FD Booking', desc: 'Open a Fixed Deposit in 60 seconds and earn up to 7.75% returns.', icon: Zap, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Marketing & Offers</h2>
        <p className="text-slate-500 text-sm">Exclusive products and deals tailored for you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Current Offers</h3>
          {offers.map((offer, i) => (
            <motion.div key={offer.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
              <div className="flex gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${offer.color}`}>
                  <offer.icon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1 text-lg">{offer.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">{offer.desc}</p>
                  <button className="flex items-center gap-2 text-brand-600 text-sm font-bold hover:gap-3 transition-all">
                    Apply Now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Promotional Campaigns</h3>
          <div className="bg-gradient-to-br from-indigo-600 to-brand-700 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-2xl font-bold mb-2">Refer & Earn ₹500</h4>
              <p className="text-white/70 text-sm mb-6 leading-relaxed">Invite your friends to NexaBank and get ₹500 for every successful account opening.</p>
              <button className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                Share Referral Code
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4">NexaBank Insights</h4>
            <div className="space-y-4">
              {[
                { label: 'Weekly Spend Analysis', date: 'Oct 12, 2023' },
                { label: 'Investment Portfolio Review', date: 'Oct 08, 2023' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer group">
                  <div>
                    <p className="text-sm font-medium group-hover:text-brand-600 transition-colors">{item.label}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{item.date}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
