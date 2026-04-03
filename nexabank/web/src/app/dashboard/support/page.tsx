'use client';
import { motion } from 'framer-motion';
import { HelpCircle, Mail, Phone, MessageSquare, ChevronRight, Search, FileText, Smartphone, Shield, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';

export default function SupportPage() {
  const router = useRouter();
  const { toggleChat } = useChatStore();

  const faqs = [
    { q: 'How do I reset my transaction PIN?', a: 'You can reset your PIN from the Security settings using Email OTP.' },
    { q: 'What is the daily transfer limit?', a: 'Standard accounts have a limit of ₹2,00,000 per day.' },
    { q: 'Are there any charges for FD premature closure?', a: 'Premature closure incurs a 1% penalty on the prevailing interest rate.' },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Support Center</h2>
        <p className="text-slate-500 text-sm">How can we help you today?</p>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input type="text" placeholder="Search for help topics, FAQs..."
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl transition-all outline-none focus:ring-2 focus:ring-brand-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <button onClick={toggleChat} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-left hover:shadow-lg transition-all group">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-brand-600 bg-brand-50 dark:bg-brand-900/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-1">Live Chat</h4>
          <p className="text-xs text-slate-400">Average wait: 2 mins</p>
        </button>

        <a href="mailto:support@nexabank.com?subject=Support%20Request" className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-left hover:shadow-lg transition-all group">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20">
            <Mail className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-1">Email Support</h4>
          <p className="text-xs text-slate-400">Response in 24 hours</p>
        </a>

        <a href="tel:+1800NEXABANK" className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-left hover:shadow-lg transition-all group">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-purple-600 bg-purple-50 dark:bg-purple-900/20">
            <Phone className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-1">Call Us</h4>
          <p className="text-xs text-slate-400">Available 24/7</p>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Frequently Asked Questions</h3>
          <div className="space-y-3">
            {faqs.map(f => (
              <div key={f.q} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{f.q}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Self Service</h3>
          {[
            { icon: FileText, label: 'Download Statements', onClick: () => router.push('/dashboard/transactions') },
            { icon: Smartphone, label: 'Update Contact Info', onClick: () => router.push('/dashboard/profile') },
            { icon: Shield, label: 'Report Fraud', onClick: () => toggleChat() },
          ].map(item => (
            <button key={item.label} onClick={item.onClick}
              className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group shadow-sm">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-inner">
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">{item.label}</span>
              <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-brand-500 transition-colors" />
            </button>
          ))}
        </section>
      </div>

      <div className="mt-12 p-8 bg-gradient-to-r from-brand-600 to-brand-800 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10">
          <h4 className="text-xl font-bold mb-1">Still need help?</h4>
          <p className="text-white/70 text-sm">Our advisors are available 24 hours a day, 7 days a week.</p>
        </div>
        <button onClick={() => window.location.href = 'mailto:support@nexabank.com'}
          className="relative z-10 px-8 py-3 bg-white text-brand-600 rounded-xl font-bold hover:bg-brand-50 hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2">
          Contact Advisor <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
