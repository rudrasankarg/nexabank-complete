'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Building2, Calendar, Clock, ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function BlogPage() {
  const posts = [
    {
      title: 'Digital Banking: The Future is Here',
      excerpt: 'How NexaBank is leading the charge in biometric and AI-driven banking in India.',
      date: 'Oct 12, 2023',
      readTime: '5 min read',
      category: 'Innovation'
    },
    {
      title: 'Mastering Your Savings in 2024',
      excerpt: 'Top 5 strategies to maximize your returns with NexaBank high-yield accounts.',
      date: 'Oct 08, 2023',
      readTime: '8 min read',
      category: 'Finance'
    },
    {
      title: 'Protecting Yourself from Digital Fraud',
      excerpt: 'Essential tips to keep your NexaBank account secure and your data private.',
      date: 'Oct 05, 2023',
      readTime: '12 min read',
      category: 'Security'
    }
  ];

  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#070e1c] text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-24 animate-fade-up">
        <div className="text-center mb-20">
          <h1 className="text-5xl lg:text-6xl font-bold font-display mb-6">NexaBank Blog</h1>
          <p className="text-slate-400 text-xl max-w-3xl mx-auto leading-relaxed">
            Stay updated with the latest in banking, technology, and financial wisdom.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
          {posts.map((post, i) => (
            <div key={i} className="bg-[#111827] border border-white/5 rounded-3xl overflow-hidden hover:border-blue-500/30 transition-all group">
              <div className="aspect-video bg-gradient-to-br from-blue-600/10 to-transparent p-10 flex items-center justify-center">
                <Building2 size={60} className="text-blue-500/20 group-hover:scale-110 transition-transform" />
              </div>
              <div className="p-8">
                <div className="flex items-center gap-4 text-xs font-bold text-blue-500 uppercase tracking-widest mb-4">
                  {post.category}
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-400 transition-colors">{post.title}</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed italic">{post.excerpt}</p>
                <div className="flex items-center justify-between text-slate-500 text-xs pt-6 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
                  </div>
                  <ArrowRight size={16} className="text-blue-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-600 rounded-[2.5rem] p-12 lg:p-20 text-center relative overflow-hidden mb-24 transition-all duration-500">
          <Building2 size={200} className="text-white/10 absolute -right-20 -bottom-20 rotate-12" />
          <h2 className="text-3xl lg:text-5xl font-black mb-6 italic">Never miss an update.</h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto opacity-80">
            Subscribe to our newsletter to receive the best financial tips and product updates directly in your inbox.
          </p>
          
          {!isSubscribed ? (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto relative z-10">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email" 
                className="bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-white placeholder-white/50 w-full focus:outline-none focus:ring-2 focus:ring-white/30" 
              />
              <button type="submit" className="bg-white text-blue-600 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-all active:scale-95 whitespace-nowrap shadow-xl">
                Subscribe Now
              </button>
            </form>
          ) : (
            <div className="bg-white/10 border border-white/20 rounded-2xl p-8 max-w-lg mx-auto animate-in zoom-in duration-300 relative z-10">
              <h4 className="text-2xl font-bold text-white mb-2 italic">You're on the list! 🎉</h4>
              <p className="text-blue-100 opacity-80">We've sent a welcome bonus to your inbox.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
