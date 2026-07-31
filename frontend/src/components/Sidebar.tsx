'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, LayoutDashboard, FileText, Settings, LogOut, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('github_provider_token');
    router.push('/');
  };

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Reports', href: '/reports', icon: FileText },
  ];

  return (
    <aside className="w-64 border-r border-white/10 bg-white/[0.02] backdrop-blur-xl hidden md:flex flex-col z-20">
      <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="p-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">CodeGuard</span>
        </Link>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Menu</div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
          
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${
                isActive
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="font-medium text-sm">{link.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10 flex flex-col gap-2 shrink-0">
        <Link href="/profile" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300 group">
          <User className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
          <span className="font-medium text-sm">Profile</span>
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-300 group w-full text-left">
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium text-sm">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
