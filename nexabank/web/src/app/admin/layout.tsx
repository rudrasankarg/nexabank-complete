'use client';
import { useState, useEffect } from 'react';
import '@/styles/globals.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, CreditCard, ArrowLeftRight,
  Building2, FileText, Shield, Settings, LogOut,
  Menu, X, Bell, ChevronRight, AlertTriangle,
  UserCheck, PiggyBank, BarChart3, Search
} from 'lucide-react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';



export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const navGroups = [
    {
      label: 'Overview',
      items: [
        { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
      ]
    },
    {
      label: 'Customer Management',
      items: [
        { href: '/admin/users', icon: Users, label: 'All Users' },
        { href: '/admin/kyc', icon: UserCheck, label: 'KYC Review' },
        { href: '/admin/accounts', icon: Building2, label: 'Accounts' },
      ]
    },
    {
      label: 'Transactions',
      items: [
        { href: '/admin/transactions', icon: ArrowLeftRight, label: 'Transactions' },
        { href: '/admin/flagged', icon: AlertTriangle, label: 'Flagged', badge: stats?.flagged_transactions > 0 ? stats.flagged_transactions.toString() : null },
      ]
    },
    {
      label: 'Products',
      items: [
        { href: '/admin/cards', icon: CreditCard, label: 'Cards', badge: stats?.pending_cards > 0 ? stats.pending_cards.toString() : null },
        { href: '/admin/loans', icon: PiggyBank, label: 'Loans', badge: stats?.pending_loans > 0 ? stats.pending_loans.toString() : null },
        { href: '/admin/branches', icon: Building2, label: 'Branches' },
      ]
    },
    {
      label: 'System',
      items: [
        { href: '/admin/reports', icon: FileText, label: 'Reports' },
        { href: '/admin/audit', icon: Shield, label: 'Audit Log' },
        { href: '/admin/admins', icon: Users, label: 'Admin Users' },
        { href: '/admin/settings', icon: Settings, label: 'Settings' },
      ]
    }
  ];

  useEffect(() => {
    adminApi.get('/admin/auth/me').then(r => setAdmin(r.data.admin)).catch(() => {
      router.push('/admin/login');
    });
    adminApi.get('/admin/stats').then(r => setStats(r.data)).catch(() => null);
    adminApi.get('/admin/notifications').then(r => setNotifications(r.data.notifications)).catch(() => []);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        adminApi.get(`/admin/search?q=${searchQuery}`).then(r => {
          setSearchResults(r.data.results);
          setSearchOpen(true);
        }).catch(() => setSearchResults([]));
      } else {
        setSearchResults([]);
        setSearchOpen(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = () => {
    Cookies.remove('admin_access_token');
    toast.success('Admin logged out');
    router.push('/admin/login');
  };

  const NavItem = ({ href, icon: Icon, label, badge }: any) => {
    const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href));
    return (
      <Link href={href} onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
          ${active ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1">{label}</span>
        {badge && <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{badge}</span>}
        {active && <ChevronRight className="w-3 h-3" />}
      </Link>
    );
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">N</span>
        </div>
        <div>
          <p className="text-white font-semibold text-sm">NexaBank</p>
          <p className="text-slate-500 text-xs">Admin Portal</p>
        </div>
        <span className="ml-auto text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">v1.0</span>
      </div>

      {/* Admin info */}
      {admin && (
        <div className="mx-4 mt-4 p-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600/20 rounded-full flex items-center justify-center text-brand-400 font-semibold text-sm">
              {admin.full_name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{admin.full_name}</p>
              <p className="text-slate-500 text-xs capitalize">{admin.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="text-slate-600 text-xs uppercase tracking-widest font-medium px-3 mb-2">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(item => <NavItem key={item.href} {...item} />)}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800 shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/70 z-40 lg:hidden" />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50 lg:hidden shadow-2xl">
              <Sidebar />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Admin header */}
        <header className="bg-slate-900 border-b border-slate-800 px-4 lg:px-6 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 relative max-w-sm hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              placeholder="Search users, customer IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setSearchOpen(true)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 placeholder-slate-500 text-sm focus:border-brand-500 transition-all" 
            />

            <AnimatePresence>
              {searchOpen && searchResults.length > 0 && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setSearchOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-30 overflow-hidden"
                  >
                    <div className="p-2 space-y-0.5">
                      {searchResults.map((res) => (
                        <Link 
                          key={res.id}
                          href={`/admin/users?search=${res.customer_id}`}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all group"
                        >
                          <div className="w-9 h-9 bg-brand-600/10 rounded-full flex items-center justify-center text-brand-400 text-xs font-bold border border-brand-500/20">
                            {res.full_name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-white text-sm font-medium truncate group-hover:text-brand-400 transition-colors">{res.full_name}</p>
                            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-tighter">{res.customer_id}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-2 ml-auto relative">
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
            >
              <Bell className="w-5 h-5" />
              {notifications.some(n => !n.is_read) && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </button>

            <AnimatePresence>
              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-20 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
                      <h3 className="text-sm font-bold text-white">Marketing Notifications</h3>
                      <span className="text-[10px] bg-brand-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">NexaBank</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-xs">No notifications</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="p-4 hover:bg-white/5 transition-colors group cursor-pointer text-left">
                            <div className="flex items-center gap-2 mb-1">
                              {n.type === 'info' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                              {n.type === 'success' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                              {n.type === 'warning' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                              <p className="text-white text-xs font-bold leading-tight truncate">{n.title}</p>
                            </div>
                            <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">{n.message}</p>
                            <p className="text-slate-600 text-[9px] mt-2 font-bold uppercase tracking-tighter">
                              {new Date(n.created_at).toLocaleDateString()} · NexaBank Marketing
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 bg-slate-900/50 border-t border-white/5 text-center">
                      <button className="text-[10px] font-bold text-brand-400 hover:text-brand-300 uppercase tracking-widest transition-colors">Clear All</button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <div className="w-8 h-8 bg-brand-600/20 rounded-full flex items-center justify-center text-brand-400 text-sm font-semibold">
              {admin?.full_name?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-950">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
