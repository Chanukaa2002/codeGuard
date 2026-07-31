'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface AppLayoutProps {
  children: ReactNode;
  user: User | null;
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  const router = useRouter();

  useEffect(() => {
    // Listen for auth changes (e.g. logging out from another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="flex h-screen bg-[#050505] text-slate-200 font-sans overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-500/15 via-purple-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <Sidebar />
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <Navbar user={user} />
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
