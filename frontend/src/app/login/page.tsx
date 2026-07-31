'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkUser();
  }, [router]);

  const handleGithubLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'repo read:user user:email',
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      console.error('Error logging in:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-slate-200 font-sans px-4 relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-500/15 via-purple-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm mb-8 text-center relative z-10">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)] relative group">
          <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-2xl font-bold text-white tracking-tighter z-10">CG</span>
        </div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          Sign in to CodeGuard
        </h1>
        <p className="text-slate-400 mt-2 text-sm font-medium">Your AI-powered security companion</p>
      </div>

      <div className="w-full max-w-sm p-8 bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl relative z-10">
        <button
          onClick={handleGithubLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] text-base group"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          ) : (
            <GithubIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
          )}
          Sign in with GitHub
        </button>
      </div>

      <div className="mt-8 text-center text-xs text-slate-500 max-w-sm w-full relative z-10 bg-white/[0.01] border border-white/5 rounded-2xl px-6 py-4 backdrop-blur-sm">
        By continuing, you agree to our{' '}
        <span className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors cursor-pointer">Terms of Service</span> and{' '}
        <span className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors cursor-pointer">Privacy Policy</span>.
      </div>
    </div>
  );
}
