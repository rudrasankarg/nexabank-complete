'use client';
import Link from 'next/link';
import { Building2, ChevronDown, Shield, Eye, Lock, FileText } from 'lucide-react';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#070e1c] text-white flex flex-col font-sans">
      <nav className="w-full bg-[#111827] sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#ef4444] flex items-center justify-center shadow-lg shadow-red-500/20">
              <Building2 size={22} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-white hidden sm:block">NexaBank</span>
          </Link>
          <Link href="/auth/login" className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-sm px-6 py-2.5 rounded shadow-lg shadow-red-500/20 transition-all flex items-center gap-2">
            LOGIN <ChevronDown size={16} />
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-[900px] mx-auto px-6 py-24 animate-fade-up">
        <div className="text-center mb-20">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500 mx-auto mb-6">
            <Shield size={32} />
          </div>
          <h1 className="text-5xl font-bold font-display mb-6">Privacy Policy</h1>
          <p className="text-slate-400 text-lg">Your privacy is our number one priority. Learn how we handle your data.</p>
        </div>

        <div className="space-y-12 text-slate-300 leading-relaxed bg-[#111827]/50 border border-white/5 p-10 lg:p-16 rounded-3xl">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Eye className="text-blue-500" size={24} /> 1. Data Collection
            </h2>
            <p className="mb-4">
              We collect information you provide directly to us when you open an account, use our services, 
              or communicate with us. This includes your name, address, contact details, and financial information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Lock className="text-blue-500" size={24} /> 2. Data Security
            </h2>
            <p className="mb-4">
              We employ state-of-the-art security measures to protect your information. This includes 
              AES-256 encryption, multi-factor authentication, and regular third-party security audits.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <FileText className="text-blue-500" size={24} /> 3. Data Usage
            </h2>
            <p>
              Your data is used solely to provide and improve our banking services. NexaBank **NEVER** sells 
              your personal information to third parties for marketing purposes.
            </p>
          </section>

          <div className="pt-10 border-t border-white/5 text-sm text-slate-500 italic">
            Last updated: October 24, 2023. For any privacy related concerns, please email 
            <a href="mailto:privacy@nexabank.com" className="text-blue-500 ml-1 hover:underline">privacy@nexabank.com</a>.
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
