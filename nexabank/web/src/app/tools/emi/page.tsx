'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, ChevronDown, Calculator, IndianRupee } from 'lucide-react';
import Footer from '@/components/Footer';

export default function EMICalculator() {
  const [loanAmount, setLoanAmount] = useState(1000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(10);
  const [emi, setEmi] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);

  useEffect(() => {
    const principal = loanAmount;
    const ratePerMonth = interestRate / (12 * 100);
    const months = loanTenure * 12;

    const emiCalc = principal * ratePerMonth * (Math.pow(1 + ratePerMonth, months) / (Math.pow(1 + ratePerMonth, months) - 1));
    const totalPay = emiCalc * months;
    const totalInt = totalPay - principal;

    setEmi(Math.round(emiCalc));
    setTotalPayment(Math.round(totalPay));
    setTotalInterest(Math.round(totalInt));
  }, [loanAmount, interestRate, loanTenure]);

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
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold font-display mb-4">EMI Calculator</h1>
          <p className="text-slate-400 text-lg">Calculate your monthly loan installments instantly.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start bg-[#111827] border border-white/5 rounded-3xl p-10 shadow-2xl">
          <div className="space-y-10">
            <div>
              <div className="flex justify-between mb-4">
                <label className="font-semibold text-slate-300">Loan Amount</label>
                <div className="text-blue-500 font-bold flex items-center gap-1">
                  <IndianRupee size={16} /> {loanAmount.toLocaleString('en-IN')}
                </div>
              </div>
              <input 
                type="range" min="100000" max="10000000" step="50000"
                value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between mb-4">
                <label className="font-semibold text-slate-300">Interest Rate (%)</label>
                <div className="text-blue-500 font-bold">{interestRate}%</div>
              </div>
              <input 
                type="range" min="5" max="25" step="0.1"
                value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between mb-4">
                <label className="font-semibold text-slate-300">Tenure (Years)</label>
                <div className="text-blue-500 font-bold">{loanTenure} Years</div>
              </div>
              <input 
                type="range" min="1" max="30" step="1"
                value={loanTenure} onChange={(e) => setLoanTenure(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          <div className="bg-[#1f2937]/50 rounded-2xl p-8 border border-white/5">
            <div className="text-center mb-8 pb-8 border-b border-white/5">
              <p className="text-slate-400 text-sm mb-2 uppercase tracking-widest font-bold">Your Monthly EMI</p>
              <div className="text-5xl font-black text-white flex items-center justify-center gap-2">
                <IndianRupee size={32} className="text-blue-500" /> {emi.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 italic">Principal Amount</span>
                <span className="font-bold">₹ {loanAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 italic">Total Interest</span>
                <span className="font-bold text-blue-500">₹ {totalInterest.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <span className="text-white font-bold">Total Payment</span>
                <span className="text-2xl font-black">₹ {totalPayment.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <Link href="/rates" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl mt-10 block text-center shadow-lg shadow-blue-500/20 transition-all">
              Apply Now at 8.5%*
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
