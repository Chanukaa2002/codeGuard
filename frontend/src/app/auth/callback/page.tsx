'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for URL errors first
        const errorParam = searchParams.get('error');
        const errorDesc = searchParams.get('error_description');
        
        if (errorParam || errorDesc) {
          setError(errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, ' ')) : 'Authentication failed from provider');
          return; // Stop execution, don't throw to avoid Next.js overlay
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setError(sessionError.message);
          return;
        }
        
        if (session) {
          // Sync with our backend
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/sync`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Failed to sync user with backend');
          }

          // Save provider token to access GitHub API
          if (session.provider_token) {
            localStorage.setItem('github_provider_token', session.provider_token);
          }

          // Redirect to dashboard on success
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      } catch (err: unknown) {
        console.error('Callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An error occurred during authentication';
        setError(errorMessage);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d1117] text-[#c9d1d9] font-sans">
      {error ? (
        <div className="bg-[#da3633]/10 border border-[#f85149] text-[#ff7b72] p-6 rounded-md max-w-md text-center shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-6 px-4 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[rgba(240,246,252,0.1)] rounded-md transition-colors text-sm font-semibold text-[#c9d1d9] shadow-sm"
          >
            Back to login
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#58a6ff] mb-4" />
          <p className="text-[#8b949e] font-medium text-sm">Authenticating your account...</p>
        </div>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <Loader2 className="w-8 h-8 animate-spin text-[#58a6ff]" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
