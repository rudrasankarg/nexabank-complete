'use client';
import Link from 'next/link';
import { Globe, Building2, ChevronDown, RefreshCcw, ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function NRIPage() {
  return (
    <div className="min-h-screen bg-[#070e1c] text-white flex flex-col font-sans relative overflow-hidden">
      
      {/* Custom Gradient Background mapping to screenshot */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a]/40 via-[#0a1020] to-[#040810] z-0"></div>

      <Navbar />

      {/* ── Hero Content ─────────────────────────── */}
      <div className="flex flex-col items-center justify-center pt-24 pb-16 px-6 text-center relative z-10 w-full animate-fade-up">
        
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-8 border border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.3)]">
          <Globe className="text-blue-500" size={40} strokeWidth={1.5} />
        </div>

        <h1 className="text-5xl lg:text-6xl font-bold font-display mb-6 tracking-tight drop-shadow-lg">
          Global Reach, Local Comfort
        </h1>
        
        <p className="text-blue-100/70 text-lg md:text-xl max-w-3xl mb-12 leading-relaxed">
          Manage your Indian accounts from anywhere in the world. Enjoy seamless currency conversions, premium NRE/NRO accounts, and dedicated international relationship managers.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/auth/register" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-3.5 rounded shadow-lg shadow-blue-500/25 transition-colors w-full sm:w-auto text-[15px]">
            Open NRI Account
          </Link>
          <Link href="/auth/register" className="bg-[#1f2937]/50 hover:bg-[#1f2937] border border-white/10 text-white font-semibold px-8 py-3.5 rounded shadow-lg transition-colors w-full sm:w-auto text-[15px]">
            Login to NetBanking
          </Link>
        </div>
      </div>

      {/* ── International Banking Solutions ──────────────── */}
      <div className="w-full max-w-[1200px] mx-auto px-6 pb-24 relative z-10">
        <h2 className="text-3xl font-bold font-display text-center mb-10 mt-16 text-white">International Banking Solutions</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#111827] border border-white/5 rounded-xl p-8 hover:bg-[#151f32] transition-colors relative flex flex-col items-center text-center">
            <Building2 className="text-blue-500 mb-6" size={32} strokeWidth={1.5} />
            <h3 className="text-2xl font-bold text-white mb-3">NRE & NRO Accounts</h3>
            <p className="text-slate-400 text-[15px] mb-8 leading-relaxed flex-grow">
              Tax-free repatriable accounts tailored for your savings in India.
            </p>
            <Link href="/auth/register" className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-md w-full transition-colors text-sm block text-center">
              Apply Now
            </Link>
          </div>

          <div className="bg-[#111827] border border-white/5 rounded-xl p-8 hover:bg-[#151f32] transition-colors relative flex flex-col items-center text-center">
            <RefreshCcw className="text-blue-500 mb-6" size={32} strokeWidth={1.5} />
            <h3 className="text-2xl font-bold text-white mb-3">Multi-Currency Accounts</h3>
            <p className="text-slate-400 text-[15px] mb-8 leading-relaxed flex-grow">
              Hold and manage funds in USD, GBP, EUR, and 12 other currencies effortlessly.
            </p>
            <Link href="/auth/register" className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-md w-full transition-colors text-sm block text-center">
              Apply Now
            </Link>
          </div>

          <div className="bg-gradient-to-br from-blue-900/60 to-[#111827] border border-blue-500/20 rounded-xl p-8 hover:from-blue-900/70 transition-colors relative flex flex-col items-center text-center">
            <ArrowRight className="text-white mb-6" size={32} strokeWidth={1.5} />
            <h3 className="text-2xl font-bold text-white mb-3">Premium Remittances</h3>
            <p className="text-blue-100/70 text-[15px] mb-8 leading-relaxed flex-grow">
              Enjoy zero-fee incoming wire transfers and priority clearing.
            </p>
            <Link href="/auth/register" className="bg-[#1f2937]/50 hover:bg-[#1f2937] border border-white/10 text-white font-medium py-3 rounded-md w-full transition-colors text-sm block text-center">
              Learn More
            </Link>
          </div>
        </div>

        {/* ── Need Help Banner ──────────────── */}
        <div className="w-full bg-[#111827]/80 backdrop-blur-md border border-white/5 rounded-2xl p-10 flex flex-col items-center text-center mt-16 mb-20 hover:bg-[#151f32] transition-colors shadow-2xl">
          <h3 className="text-2xl lg:text-3xl font-bold mb-4">Need help choosing the right account?</h3>
          <p className="text-slate-400 text-[15px] mb-8 max-w-xl">
            Our dedicated NRI concierge team is available 24/7 to assist you.
          </p>
          <Link href="/auth/register" className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-8 py-3.5 rounded shadow-lg transition-colors">
            Contact NRI Support
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
