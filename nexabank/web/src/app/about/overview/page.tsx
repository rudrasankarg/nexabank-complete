'use client';
import Link from 'next/link';
import { Building2, ChevronDown, Rocket, Users, Target, ShieldCheck } from 'lucide-react';
import Footer from '@/components/Footer';

export default function AboutOverview() {
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
          <h1 className="text-5xl lg:text-6xl font-bold font-display mb-6">Banking Reimagined</h1>
          <p className="text-slate-400 text-xl max-w-3xl mx-auto leading-relaxed">
            NexaBank is India's fastest growing digital-first bank, built on the pillars of transparency, 
            innovation, and customer-centricity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
          <div>
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              To provide a seamless, secure, and smart banking experience to every Indian. 
              We leverage cutting-edge technology to break down barriers and make premium banking 
              services accessible to all.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[#111827] p-6 rounded-2xl border border-white/5">
                <Rocket className="text-blue-500 mb-3" />
                <h4 className="font-bold mb-1 italic">Fastest</h4>
                <p className="text-slate-500 text-sm">Account opening in &lt; 3 mins</p>
              </div>
              <div className="bg-[#111827] p-6 rounded-2xl border border-white/5">
                <ShieldCheck className="text-blue-500 mb-3" />
                <h4 className="font-bold mb-1 italic">Secure</h4>
                <p className="text-slate-500 text-sm">Military-grade encryption</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-navy-900 rounded-3xl border border-white/10 flex items-center justify-center p-10 overflow-hidden shadow-2xl">
               <Building2 size={120} className="text-blue-500/20 absolute -right-10 -bottom-10" />
               <div className="text-center">
                 <h3 className="text-6xl font-bold text-blue-500 mb-2">10M+</h3>
                 <p className="text-slate-300 font-medium">Trusted Customers</p>
               </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-32">
          {[
            { icon: Users, title: 'Involved', desc: 'A team of 5000+ experts working day and night for you.' },
            { icon: Target, title: 'Focused', desc: 'Targeting the next generation of digital-first users.' },
            { icon: ShieldCheck, title: 'Reliable', desc: 'RBI regulated and fully compliant with Indian laws.' }
          ].map((item, i) => (
            <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-8 hover:bg-[#151f32] transition-colors">
              <item.icon className="text-blue-500 mb-4" size={28} />
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-slate-400 text-[15px] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
