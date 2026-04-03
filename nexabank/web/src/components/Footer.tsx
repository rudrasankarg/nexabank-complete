'use client';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

const footerLinks = {
  'About Us': [
    { name: 'Company Overview', href: '/about/overview' },
    { name: 'Careers', href: '/about/overview' },
    { name: 'Investor Relations', href: '/about/overview' },
    { name: 'Leadership', href: '/about/overview' },
    { name: 'Newsroom', href: '/about/overview' },
    { name: 'Corporate Governance', href: '/about/overview' },
  ],
  'Useful Links': [
    { name: 'Account Types', href: '/nri' },
    { name: 'Rates & Fees', href: '/rates' },
    { name: 'Security Center', href: '/support' },
    { name: 'Forms & Documents', href: '/support' },
    { name: 'Branch Locator', href: 'https://www.google.com/maps/search/Bank+Branch+near+me' },
    { name: 'Sitemap', href: '#' },
  ],
  'Resources': [
    { name: 'Financial Tools', href: '/tools/emi' },
    { name: 'Blog', href: '/blog' },
    { name: 'Money Management', href: '/blog' },
    { name: 'Tax Center', href: '/blog' },
    { name: 'Help Center', href: '/support' },
  ],
  'Contact Us & Need Help': [
    { name: 'Customer Support', href: '/support' },
    { name: 'Report Fraud', href: '/support' },
    { name: 'Lost or Stolen Card', href: '/support' },
    { name: 'Live Chat', href: '/support' },
    { name: 'Schedule an Appointment', href: '/support' },
  ],
  'Others': [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/privacy' },
    { name: 'Cookie Policy', href: '/privacy' },
    { name: 'Accessibility', href: '/privacy' },
    { name: 'Legal Disclosures', href: '/privacy' },
  ]
};

const coreProducts = [
  'Personal Loan', 'Car Loan', 'Business Loan', 'Two Wheeler Loan', 'Gold Loan', 
  'Home Loan', 'Pre-Verified Properties', 'Savings Account', 'Salary Account'
];

export default function Footer() {
  return (
    <footer className="bg-[#111827] border-t border-blue-900/40 relative z-10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="space-y-4">
              <h4 className="text-white font-bold text-[17px] mb-6">{category}</h4>
              {links.map(link => (
                <p key={link.name}>
                  {link.href.startsWith('http') ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-slate-400 text-sm hover:text-white transition-colors block leading-snug">
                      {link.name}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-slate-400 text-sm hover:text-white transition-colors block leading-snug">
                      {link.name}
                    </Link>
                  )}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Core Products - Center Aligned as requested */}
      <div className="border-t border-white/5 bg-[#0a0f18] py-6">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-center gap-6">
          <span className="font-bold text-white whitespace-nowrap text-[15px]">Core Products</span>
          <div className="flex flex-wrap gap-2 text-[13px] text-slate-400 items-center justify-center">
            {coreProducts.map((product, idx, arr) => (
              <span key={product} className="flex items-center gap-2">
                <Link href="/rates" className="hover:text-white transition-colors">{product}</Link>
                {idx < arr.length - 1 && <span className="opacity-30">|</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
