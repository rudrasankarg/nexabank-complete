'use client';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, MessageSquare, Building2, ChevronDown } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function SupportPage() {
  const { openChat } = useChatStore();
  return (
    <div className="min-h-screen bg-[#070e1c] text-white flex flex-col font-sans">
      
      <Navbar />

      {/* ── Main Content ────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10 w-full max-w-[1200px] mx-auto animate-fade-up">
        
        <div className="text-center max-w-2xl mx-auto mb-16 mt-8">
          <h1 className="text-4xl lg:text-5xl font-bold font-display mb-6">How can we help you?</h1>
          <p className="text-slate-400 text-lg">
            We're here to help and answer any question you might have. We look forward to hearing from you.
          </p>
        </div>

        {/* Support Blocks */}
        <div className="grid md:grid-cols-3 gap-6 w-full mb-8">
          
          {/* Call Box */}
          <div className="bg-[#111827]/80 backdrop-blur-md border border-white/5 rounded-2xl p-10 flex flex-col items-center text-center hover:bg-[#151f32] transition-colors relative group">
            <div className="w-16 h-16 rounded-full bg-[#1e293b] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Phone className="text-blue-500" size={24} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Call Now</h3>
            <p className="text-slate-400 text-sm mb-4">Toll Free 24/7 Support</p>
            <a href="tel:18001234567" className="text-blue-500 font-bold text-2xl tracking-wide mb-6 hover:text-blue-400 transition-colors">
              1-800-123-4567
            </a>
            <div className="mt-auto flex items-center gap-1.5 text-xs text-slate-500">
              <Clock size={12} /> Average wait time: 2 mins
            </div>
          </div>

          {/* Email Box */}
          <div className="bg-[#111827]/80 backdrop-blur-md border border-white/5 rounded-2xl p-10 flex flex-col items-center text-center hover:bg-[#151f32] transition-colors relative group">
            <div className="w-16 h-16 rounded-full bg-[#1e293b] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Mail className="text-blue-500" size={24} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Email Us</h3>
            <p className="text-slate-400 text-sm mb-4">For general inquiries</p>
            <a href="mailto:supportnexabank@gmail.com" className="text-blue-500 font-bold text-[17px] mb-6 hover:text-blue-400 transition-colors">
              supportnexabank@gmail.com
            </a>
            <div className="mt-auto flex items-center gap-1.5 text-xs text-slate-500">
              <Clock size={12} /> Response within 24 hours
            </div>
          </div>

          {/* Visit Box */}
          <div className="bg-[#111827]/80 backdrop-blur-md border border-white/5 rounded-2xl p-10 flex flex-col items-center text-center hover:bg-[#151f32] transition-colors relative group">
            <div className="w-16 h-16 rounded-full bg-[#1e293b] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MapPin className="text-blue-500" size={24} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Visit Us</h3>
            <p className="text-slate-400 text-sm mb-8 px-4">Visit your nearest NexaBank ATM/Branch</p>
            <a 
              href="https://www.google.com/maps/search/Bank+Branch+near+me" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2.5 rounded shadow transition-colors mt-auto w-full text-center block"
            >
              Find Nearest Branch
            </a>
          </div>

        </div>

        {/* Prefer to Type Banner */}
        <div className="w-full bg-[#111827]/80 backdrop-blur-md border border-white/5 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-[#151f32] transition-colors mb-20">
          <div>
            <h3 className="text-2xl font-bold mb-2">Prefer to type?</h3>
            <p className="text-slate-400 text-sm">Nexie, our virtual assistant, is available 24/7 to solve your queries instantly.</p>
          </div>
          <button onClick={openChat} className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-8 py-3.5 rounded shadow-lg transition-colors flex items-center gap-2 whitespace-nowrap">
            Chat With Nexie <MessageSquare size={18} />
          </button>
        </div>

      </main>

      <Footer />
    </div>
  );
}
