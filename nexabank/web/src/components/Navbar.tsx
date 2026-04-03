'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bell, ChevronDown, Building2, Info, UserCircle, X, Sparkles, Megaphone, Shield } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useRouter } from 'next/navigation';

const productCategories = {
  'Accounts': [
    { name: 'Savings Account', href: '/rates' },
    { name: 'Salary Account', href: '/rates' },
    { name: 'Fixed Deposits', href: '/rates' },
    { name: 'NRI Accounts', href: '/nri' }
  ],
  'Loans': [
    { name: 'Personal Loan', href: '/rates' },
    { name: 'Home Loan', href: '/rates' },
    { name: 'Car Loan', href: '/rates' },
    { name: 'Education Loan', href: '/rates' }
  ],
  'Investments': [
    { name: 'Mutual Funds', href: '/blog' },
    { name: 'Gold Bonds', href: '/blog' },
    { name: 'Insurance', href: '/blog' }
  ]
};

const notifications = [
  { icon: Sparkles, title: 'Exclusive Offer!', desc: 'Get 8.5% interest on Savings for the first 3 months.', color: 'text-yellow-400' },
  { icon: Megaphone, title: 'New Feature', desc: 'Use our EMI calculator to plan your dream home.', color: 'text-blue-400' },
  { icon: Shield, title: 'Security Alert', desc: 'Remember to update your transaction password every 90 days.', color: 'text-green-400' }
];

export default function Navbar() {
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { openChat } = useChatStore();
  const router = useRouter();
  
  const searchRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const notifsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchOpen(false);
      if (productsRef.current && !productsRef.current.contains(event.target as Node)) setIsProductsOpen(false);
      if (notifsRef.current && !notifsRef.current.contains(event.target as Node)) setIsNotifsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase();
    if (query.includes('loan') || query.includes('emi') || query.includes('rate')) router.push('/rates');
    else if (query.includes('about') || query.includes('company')) router.push('/about/overview');
    else if (query.includes('help') || query.includes('support')) router.push('/support');
    else if (query.includes('nri') || query.includes('global')) router.push('/nri');
    else router.push('/about/overview');
    setIsSearchOpen(false);
  };

  return (
    <div className="w-full relative">
      {/* ── Top Utility Bar ──────────────────────── */}
      <div className="w-full bg-[#040810] border-b border-white/5 py-2 hidden lg:block">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex justify-between items-center text-[12px] font-medium text-slate-400">
          <div className="flex gap-6">
            <Link href="/" className="text-white font-semibold cursor-pointer border-b border-transparent hover:border-white transition-colors pb-0.5">Personal</Link>
            <Link href="/nri" className="cursor-pointer hover:text-white transition-colors">NRI (International)</Link>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/about/overview" className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">About Us <ChevronDown size={14} className="opacity-70" /></Link>
            <span className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">English <ChevronDown size={14} className="opacity-70" /></span>
            <Search size={14} className="cursor-pointer hover:text-white transition-colors" onClick={() => setIsSearchOpen(!isSearchOpen)} />
            
            {/* Notification Icon */}
            <div className="relative" ref={notifsRef}>
              <Bell 
                size={14} 
                className="cursor-pointer hover:text-white transition-colors" 
                onClick={() => setIsNotifsOpen(!isNotifsOpen)} 
              />
              {isNotifsOpen && (
                <div className="absolute right-0 top-6 w-80 bg-[#111827] border border-white/10 rounded-2xl shadow-2xl p-4 z-[100] animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                    <span className="font-bold text-white text-sm">Notifications</span>
                    <span className="text-[10px] text-blue-500 cursor-pointer hover:underline">Mark all as read</span>
                  </div>
                  <div className="space-y-4">
                    {notifications.map((n, i) => (
                      <div key={i} className="flex gap-3 items-start group cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <div className={`p-2 rounded-lg bg-white/5 ${n.color}`}><n.icon size={16} /></div>
                        <div>
                          <h5 className="text-white text-xs font-bold leading-[1] mb-1">{n.title}</h5>
                          <p className="text-slate-500 text-[10px] leading-tight">{n.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Navigation Bar ──────────────────── */}
      <nav className="w-full bg-[#111827] sticky top-0 z-50 shadow-md">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#ef4444] flex items-center justify-center shadow-lg shadow-red-500/20">
              <Building2 size={22} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-white hidden sm:block">NexaBank</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-8 font-semibold text-[15px] text-slate-100">
            {/* Discover Products Dropdown */}
            <div className="relative" ref={productsRef}>
              <span 
                className="flex items-center gap-1.5 cursor-pointer hover:text-blue-400 transition-colors"
                onClick={() => setIsProductsOpen(!isProductsOpen)}
              >
                Discover Products <ChevronDown size={16} className={`opacity-50 transition-transform ${isProductsOpen ? 'rotate-180' : ''}`} />
              </span>
              {isProductsOpen && (
                <div className="absolute left-0 top-12 w-[600px] bg-[#111827] border border-white/10 rounded-2xl shadow-2xl p-8 z-[100] grid grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-2">
                  {Object.entries(productCategories).map(([cat, items]) => (
                    <div key={cat}>
                      <h4 className="text-blue-500 text-xs font-black uppercase tracking-widest mb-4 italic">{cat}</h4>
                      <ul className="space-y-3">
                        {items.map(item => (
                          <li key={item.name}>
                            <Link href={item.href} className="text-slate-300 hover:text-white text-sm font-medium transition-colors block" onClick={() => setIsProductsOpen(false)}>
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link href="/support" className="flex items-center gap-1.5 cursor-pointer hover:text-blue-400 transition-colors">
              Need Help <ChevronDown size={16} className="opacity-50" />
            </Link>
            <Link href="/about/overview" className="flex items-center group cursor-pointer">
              <span className="text-slate-100 group-hover:text-blue-400 transition-colors">Better</span>
              <span className="mx-1 bg-blue-900/40 px-1.5 py-0.5 rounded leading-none text-blue-400 group-hover:bg-blue-900 transition-all font-black italic">Money</span>
              <span className="text-slate-100 group-hover:text-blue-400 transition-colors">Choices</span>
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <div 
              onClick={openChat}
              className="hidden md:flex items-center bg-[#1f2937] hover:bg-[#374151] transition-colors rounded-full border border-white/10 px-4 py-2 flex-grow max-w-[200px] cursor-text"
            >
              <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center mr-2 pointer-events-none">
                <Info size={12} className="text-blue-400" />
              </div>
              <input 
                type="text" 
                placeholder="Ask Nexie..." 
                readOnly
                className="bg-transparent border-none text-sm text-slate-300 placeholder-slate-500 focus:outline-none w-full pointer-events-none"
              />
            </div>
            
            <Link href="/auth/login" className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-sm px-6 py-2.5 rounded shadow-lg shadow-red-500/20 transition-all flex items-center gap-2">
              LOGIN <ChevronDown size={16} />
            </Link>
          </div>
        </div>

        {/* Global Search Overlay */}
        {isSearchOpen && (
          <div className="absolute top-20 left-0 w-full bg-[#0a0f18]/95 backdrop-blur-xl border-b border-white/10 p-6 z-[100] animate-in slide-in-from-top fill-mode-forwards" ref={searchRef}>
            <form onSubmit={handleSearch} className="max-w-[800px] mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
              <input 
                autoFocus
                type="text" 
                placeholder="Where can we take you today? (e.g. 'loans', 'nri', 'about')" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-14 text-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <X 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer hover:text-white" 
                size={24} 
                onClick={() => setIsSearchOpen(false)}
              />
            </form>
          </div>
        )}
      </nav>
    </div>
  );
}
