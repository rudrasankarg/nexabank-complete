import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '../styles/globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';
import Chatbot from '@/components/Chatbot';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#020817',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: { default: 'NexaBank – Banking Reimagined', template: '%s | NexaBank' },
  description: 'NexaBank – India\'s most trusted digital banking platform. Secure, fast, and beautiful.',
  keywords: ['banking', 'digital bank', 'online banking', 'UPI', 'savings account'],
  authors: [{ name: 'NexaBank' }],
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  openGraph: {
    type: 'website',
    siteName: 'NexaBank',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="bg-navy-950 text-slate-200 antialiased">
        <Providers>
          {children}
          <Chatbot />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#112259',
                color: '#e2e8f0',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#020817' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#020817' } },
              duration: 4000,
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
