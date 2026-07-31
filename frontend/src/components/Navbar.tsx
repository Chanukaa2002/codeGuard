'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav className="bg-white/[0.02] border-b border-white/10 backdrop-blur-xl relative z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end h-16">

          
          <div className="flex items-center gap-3">

            
            <Link href="/profile" className="ml-2 relative group block">
              <div className="absolute inset-0 bg-indigo-500 rounded-full blur opacity-40 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 to-purple-500">
                <div className="w-full h-full rounded-full border border-[#050505] overflow-hidden bg-[#0d1117]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user?.user_metadata?.avatar_url || 'https://github.com/identicons/default.png'}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
