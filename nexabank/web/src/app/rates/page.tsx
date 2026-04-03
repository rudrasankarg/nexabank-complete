'use client';
import Link from 'next/link';
import { Building2, ChevronDown, Percent, Wallet, Landmark, CreditCard, Home } from 'lucide-react';
import Footer from '@/components/Footer';

export default function RatesPage() {
  const accountRates = [
    { name: 'Savings Account', rate: '7.50%*', desc: 'Industry leading interest rates with daily compounding.' },
    { name: 'Salary Account', rate: '7.75%*', desc: 'Special rates for corporate employees and government officials.' },
    { name: 'Fixed Deposit (FD)', rate: '8.25%*', desc: 'Safe investments with assured returns and senior citizen benefits.' },
    { name: 'Recurring Deposit (RD)', rate: '7.90%*', desc: 'Systematic savings with interest rates at par with FDs.' }
  ];

  const loanRates = [
    { name: 'Personal Loan', rate: '10.25%*', desc: 'Initial rates starting from just 10.25% with zero processing fee.' },
    { name: 'Home Loan', rate: '8.50%*', desc: 'Lowest home loan interest rates in the industry for new buyers.' },
    { name: 'Auto Loan', rate: '9.20%*', desc: 'Drive your dream car with instant approval and low monthly EMIs.' },
    { name: 'Gold Loan', rate: '9.00%*', desc: 'Instant cash with the security of your gold jewelry.' }
  ];

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

      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-24 animate-fade-up">
        <div className="text-center mb-20">
          <h1 className="text-5xl lg:text-6xl font-bold font-display mb-6">Rates & Fees</h1>
          <p className="text-slate-400 text-xl max-w-3xl mx-auto leading-relaxed">
            Transparent pricing with no hidden charges. We offer the most competitive interest rates in India.
          </p>
        </div>

        <section className="mb-32">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
              <Wallet size={24} />
            </div>
            <h2 className="text-3xl font-bold">Savings & Deposits</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {accountRates.map((item, i) => (
              <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-8 hover:bg-[#151f32] transition-colors flex items-center justify-between group">
                <div className="max-w-[70%]">
                  <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                  <p className="text-slate-500 text-sm">{item.desc}</p>
                </div>
                <div className="text-right">
                  <div className="text-blue-500 text-3xl font-bold group-hover:scale-105 transition-transform">{item.rate}</div>
                  <div className="text-slate-600 text-xs mt-1 italic font-medium">p.a interest rate</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-32">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
              <Percent size={24} />
            </div>
            <h2 className="text-3xl font-bold">Loans Interest Rates</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {loanRates.map((item, i) => (
              <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-8 hover:bg-[#151f32] transition-colors flex items-center justify-between group">
                <div className="max-w-[70%]">
                  <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                  <p className="text-slate-500 text-sm">{item.desc}</p>
                </div>
                <div className="text-right">
                  <div className="text-blue-500 text-3xl font-bold group-hover:scale-105 transition-transform">{item.rate}</div>
                  <div className="text-slate-600 text-xs mt-1 italic font-medium">starting p.a</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-[#111827]/80 backdrop-blur-md border border-white/5 rounded-3xl p-12 text-center mb-24">
          <h3 className="text-2xl font-bold mb-4">Want more information?</h3>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto italic font-medium">
            Contact our relationship managers for customized rates on bulk deposits and premium loans.
          </p>
          <Link href="/support" className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-10 py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all inline-block">
            Talk to an Expert
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
