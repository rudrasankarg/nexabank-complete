'use client';
import Link from 'next/link';
import { Search, Bell, ChevronDown, Building2, Info, ArrowRight, UserCircle, Landmark, CreditCard, Home } from 'lucide-react';
import { useState } from 'react';
import { useChatStore } from '@/store/chatStore';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

const dropdownData = {
  Products: {
    Accounts: ['Open New Account', 'Account Statement', 'Upgrade Account'],
    Cards: ['Premium Credit Card', 'Travel Credit Card', 'Debit Card'],
    Loans: ['Personal Loan', 'Home Loan', 'Instant Car Loan']
  },
  Services: {
    Payments: ['Utility Bill Payment', 'Credit Card Bill', 'Tax Payment'],
    Requests: ['Order Cheque Book', 'Stop Payment', 'Update KYC']
  }
};

const tabData: Record<string, any> = {
  Trending: {
    title: 'Banking Solutions tailor-made for you',
    subtitle: '',
    cards: [
      { 
        title: 'Cardless EASYEMI', 
        desc: 'A little magic for your summer upgrades!', 
        btn: 'Check Offer', 
        btnClass: 'bg-blue-500 hover:bg-blue-600 text-white' 
      },
      { 
        title: 'Salary Account', 
        desc: 'Manage your earnings, your way.', 
        btn: 'Open Instantly', 
        btnClass: 'bg-blue-500 hover:bg-blue-600 text-white', 
        secondaryBtn: 'Know More', 
        secondaryClass: '' 
      },
      { 
        title: 'Personal Loan', 
        desc: 'Get funds in 10 seconds. No documentation.', 
        btn: 'Apply Now', 
        btnClass: 'bg-blue-500 hover:bg-blue-600 text-white' 
      },
      {
        title: 'Nexa Platinum Card',
        desc: 'Complimentary lounge access & 5x rewards.',
        btn: 'Apply Now',
        btnClass: 'bg-blue-500 hover:bg-blue-600 text-white'
      }
    ]
  },
  Accounts: {
    title: 'Accounts that work for you',
    subtitle: "From high-yield savings to premium current accounts, we've got you covered.",
    icon: Landmark,
    cards: [
      { title: 'Premium Savings', desc: 'Enjoy industry-leading interest rates and exclusive lifestyle benefits.', btn: 'Open Account →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' },
      { title: 'Salary Account', desc: 'Enjoy industry-leading interest rates and exclusive lifestyle benefits.', btn: 'Open Account →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' },
      { title: 'Current Account', desc: 'Enjoy industry-leading interest rates and exclusive lifestyle benefits.', btn: 'Open Account →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' },
      { title: 'Student Account', desc: 'Enjoy industry-leading interest rates and exclusive lifestyle benefits.', btn: 'Open Account →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' }
    ]
  },
  Deposits: {
    title: 'Secure your future',
    subtitle: 'High-yield deposits with assured returns and flexible tenures.',
    icon: Landmark,
    cards: [
      { title: 'Fixed Deposit (FD)', desc: 'Up to 7.5% p.a. interest rates for senior citizens. Premature withdrawal allowed.', btn: 'Invest Now →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' },
      { title: 'Recurring Deposit (RD)', desc: 'Up to 7.5% p.a. interest rates for senior citizens. Premature withdrawal allowed.', btn: 'Invest Now →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' },
      { title: 'Tax Saver FD (5 Years)', desc: 'Up to 7.5% p.a. interest rates for senior citizens. Premature withdrawal allowed.', btn: 'Invest Now →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' },
      { title: 'Senior Citizen Savings', desc: 'Assured 8.2% p.a. returns with quarterly interest payouts and tax benefits.', btn: 'Invest Now →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' }
    ]
  },
  Cards: {
    title: 'Cards designed for your lifestyle',
    subtitle: 'Earn unlimited rewards, lounge access, and exclusive privileges.',
    icon: CreditCard,
    cards: [
      { title: 'Premium Travel Card', desc: 'Enjoy 5x reward points on online spends and comprehensive travel insurance.', btn: 'Apply Now →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' },
      { title: 'Cashback Credit Card', desc: 'Enjoy 5x reward points on online spends and comprehensive travel insurance.', btn: 'Apply Now →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' },
      { title: 'Lifetime Free Debit Card', desc: 'Enjoy 5x reward points on online spends and comprehensive travel insurance.', btn: 'Apply Now →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' },
      { title: 'Business Forex Card', desc: 'Enjoy 5x reward points on online spends and comprehensive travel insurance.', btn: 'Apply Now →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' }
    ]
  },
  Loans: {
    title: 'Explore Our Loan Products',
    subtitle: 'Get instant approvals and competitive rates, with zero documentation for pre-approved customers.',
    icon: Home,
    cards: [
      { title: 'Personal Loan', desc: 'Flexible tenures tailored exactly to your needs. Zero prepay penalty.', btn: 'Login to Apply →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' },
      { title: 'Home Loan', desc: 'Flexible tenures tailored exactly to your needs. Zero prepay penalty.', btn: 'Login to Apply →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' },
      { title: 'Auto Loan', desc: 'Flexible tenures tailored exactly to your needs. Zero prepay penalty.', btn: 'Login to Apply →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' },
      { title: 'Education Loan', desc: 'Flexible tenures tailored exactly to your needs. Zero prepay penalty.', btn: 'Login to Apply →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' },
      { title: 'Business Loan', desc: 'Flexible tenures tailored exactly to your needs. Zero prepay penalty.', btn: 'Login to Apply →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' },
      { title: 'Two Wheeler Loan', desc: 'Flexible tenures tailored exactly to your needs. Zero prepay penalty.', btn: 'Login to Apply →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' },
      { title: 'Doctor Loan', desc: 'Flexible tenures tailored exactly to your needs. Zero prepay penalty.', btn: 'Login to Apply →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' },
      { title: 'Loan Against Property', desc: 'Flexible tenures tailored exactly to your needs. Zero prepay penalty.', btn: 'Login to Apply →', btnClass: 'bg-[#3b82f6] hover:bg-blue-500 text-white w-full text-center block' }
    ]
  }
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('Trending');
  const [activeType, setActiveType] = useState<'Products' | 'Services'>('Products');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const { openChat } = useChatStore();

  // When type changes (Products/Services), reset the category and option
  const handleTypeChange = (type: 'Products' | 'Services') => {
    setActiveType(type);
    setSelectedCategory('');
    setSelectedOption('');
  };

  const categories = Object.keys(dropdownData[activeType]);
  const options = selectedCategory ? dropdownData[activeType][selectedCategory as keyof typeof dropdownData[typeof activeType]] : [];

  return (
    <div className="min-h-screen bg-[#070e1c] text-slate-200 font-sans selection:bg-blue-500/30">
      
      <Navbar />

      {/* ── Hero Section ─────────────────────────── */}
      <section className="relative min-h-[550px] flex items-center border-b border-white/5 py-12 lg:py-0">
        {/* Subtle mesh background element */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1226] via-[#101b38] to-[#0a1020] opacity-90 z-0"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent pointer-events-none z-0"></div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-10 items-center">
          
          {/* Hero Content */}
          <div>
            <h1 className="text-5xl lg:text-7xl font-bold font-display tracking-tight leading-[1.1] mb-6 drop-shadow-md">
              <span className="text-white">Experience</span><br/>
              <span className="text-blue-500">NexaBank</span><br/>
              <span className="text-white">Differently</span>
            </h1>
            
            <p className="text-slate-300 text-lg lg:text-xl font-medium mb-8 max-w-lg leading-relaxed">
              Introducing the New<br/>
              NexaBank App | NetBanking | Website
            </p>
            
            <div className="flex">
              <Link href="/auth/login" className="bg-[#1f2937] hover:bg-[#374151] border border-white/10 text-white font-medium text-sm px-6 py-3 rounded flex items-center gap-3 transition-colors shadow-lg">
                NetBanking <ArrowRight size={16} className="text-red-400" />
              </Link>
            </div>
          </div>

          {/* Hero Action Card */}
          <div className="flex justify-center flex-grow lg:justify-end">
            <div className="bg-[#111827]/90 backdrop-blur-md rounded-[20px] p-8 mt-20 sm:mt-0 w-[420px] shadow-2xl shadow-blue-900/50 border border-blue-500/30 lg:-mr-12 animate-fade-up">
              
              <div className="flex gap-6 mb-8 font-medium">
                <label className="flex items-center gap-2 cursor-pointer group" onClick={() => handleTypeChange('Products')}>
                  <div className={`w-4 h-4 rounded-full border-4 ${activeType === 'Products' ? 'border-blue-500 bg-white' : 'border-slate-500 bg-transparent'} transition-colors group-hover:border-blue-400`}></div>
                  <span className={activeType === 'Products' ? 'text-blue-400' : 'text-slate-400'}>Products</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group" onClick={() => handleTypeChange('Services')}>
                  <div className={`w-4 h-4 rounded-full border-4 ${activeType === 'Services' ? 'border-blue-500 bg-white' : 'border-slate-500 bg-transparent'} transition-colors group-hover:border-blue-400`}></div>
                  <span className={activeType === 'Services' ? 'text-blue-400' : 'text-slate-400'}>Services</span>
                </label>
              </div>

              <div className="space-y-4 mb-8">
                <div className="relative">
                  <select 
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedOption(''); // reset option when category changes
                    }}
                    className="appearance-none w-full bg-[#1f2937] border border-white/10 text-white rounded-md px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                  >
                    <option value="" disabled hidden>Select Type...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
                
                <div className="relative">
                  <select 
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="appearance-none w-full bg-[#1f2937] border border-white/10 text-white rounded-md px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                  >
                    <option value="" disabled hidden>Select Option...</option>
                    {options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <Link href="/auth/register" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-8 rounded shadow-lg shadow-blue-500/20 transition-colors">
                  Apply Now
                </Link>
                <Link href="#features" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                  Know More
                </Link>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── Trending Section ───────────────────────── */}
      <section className="py-24 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold font-display text-white mb-4">
            {tabData[activeTab].title}
          </h2>
          {tabData[activeTab].subtitle && (
            <p className="text-slate-400 text-lg leading-relaxed">
              {tabData[activeTab].subtitle}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-6 md:gap-10 border-b border-white/10 mb-12 overflow-x-auto pb-[1px] no-scrollbar">
          {Object.keys(tabData).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-2 font-semibold text-[15px] whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab 
                  ? 'text-blue-500 border-blue-500' 
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {tabData[activeTab].cards.map((card: any, index: number) => {
            const Icon = tabData[activeTab].icon;
            return (
              <div key={index} className="bg-[#111827] border border-white/5 rounded-[20px] p-8 hover:bg-[#1a2333] transition-all duration-300 relative group overflow-hidden flex flex-col h-full shadow-xl">
                <div className="relative z-10 flex flex-col h-full items-start w-full">
                  {Icon && (
                    <Icon className="text-blue-500 mb-5" size={26} strokeWidth={1.5} />
                  )}
                  <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{card.title}</h3>
                  <p className="text-slate-400 text-[15.5px] mb-10 leading-relaxed flex-grow">{card.desc}</p>
                  
                  <div className={card.secondaryBtn ? "mt-auto grid grid-cols-2 gap-2 w-full" : "mt-auto flex justify-center w-full"}>
                    <Link 
                      href="/auth/login"
                      className={`${card.secondaryBtn ? "w-full" : "w-[85%]"} font-bold py-3.5 px-3 rounded-xl shadow-lg transition-all duration-300 text-[13px] active:scale-[0.98] flex items-center justify-center whitespace-nowrap ${card.btnClass.replace('flex-1', '').replace('text-center', '').replace('py-3', '')}`}
                    >
                      {card.btn}
                    </Link>
                    {card.secondaryBtn && (
                      <Link 
                        href="/rates"
                        className="w-full font-bold py-3.5 px-3 rounded-xl border border-white/10 bg-transparent text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-300 text-[13px] active:scale-[0.98] flex items-center justify-center whitespace-nowrap"
                      >
                        {card.secondaryBtn}
                      </Link>
                    )}
                  </div>
                </div>
                
                {/* Glow effect on hover */}
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/0 rounded-full blur-[40px] group-hover:bg-blue-500/[0.07] transition-all duration-500 pointer-events-none"></div>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}
