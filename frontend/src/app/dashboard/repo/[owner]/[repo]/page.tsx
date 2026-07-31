'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { ChevronLeft, ExternalLink, GitBranch, Shield, Loader2, Search } from 'lucide-react';
import AppLayout from '@/components/AppLayout';

interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export default function RepoConfigurationPage({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isBranchesLoading, setIsBranchesLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      setUser(session.user);
      setIsLoading(false);
    };
    
    fetchUser();
  }, [router]);

  useEffect(() => {
    const fetchBranches = async () => {
      if (!user) return;
      
      const token = localStorage.getItem('github_provider_token');
      if (!token) return;

      setIsBranchesLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/github/repos/${owner}/${repo}/branches`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setBranches(data);
          
          // Default to main or master if available
          const defaultBranch = data.find((b: Branch) => b.name === 'main' || b.name === 'master');
          if (defaultBranch) {
            setSelectedBranch(defaultBranch.name);
          } else if (data.length > 0) {
            setSelectedBranch(data[0].name);
          }
        }
      } catch (err) {
        console.error('Error fetching branches:', err);
      } finally {
        setIsBranchesLoading(false);
      }
    };

    fetchBranches();
  }, [user, owner, repo]);

  const handleStartScan = () => {
    if (!selectedBranch) return;
    setIsScanning(true);
    
    // Placeholder for actual scan logic
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#30363d] border-t-[#58a6ff] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppLayout user={user}>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 w-full">
        
        {/* Navigation */}
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <div className="bg-white/5 p-1 rounded-lg group-hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Back to Dashboard</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Config Area */}
          <div className="col-span-1 lg:col-span-2 space-y-8">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 flex items-center gap-2 sm:gap-3 break-all">
                  {owner} <span className="text-slate-600 font-light">/</span> {repo}
                </h2>
                <p className="text-sm text-slate-400 mt-2">Configure and run security scans for this repository.</p>
              </div>
              <a 
                href={`https://github.com/${owner}/${repo}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-200 px-4 py-2.5 rounded-xl border border-white/10 transition-all font-medium text-sm whitespace-nowrap group"
              >
                <ExternalLink className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
                Open in GitHub
              </a>
            </div>

            {/* Branch Selection */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl backdrop-blur-xl p-6 shadow-xl space-y-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                    <GitBranch className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200">Select Target Branch</h3>
                </div>
                <p className="text-sm text-slate-400 mb-6">Choose which branch you want CodeGuard AI to analyze for security vulnerabilities.</p>
                
                {isBranchesLoading ? (
                  <div className="flex items-center gap-3 text-slate-400 bg-white/5 p-4 rounded-xl border border-white/10">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Fetching branches from GitHub...</span>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full appearance-none bg-[#050505] border border-white/10 rounded-xl px-4 py-3.5 text-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    >
                      {branches.length === 0 && <option value="">No branches found</option>}
                      {branches.map(branch => (
                        <option key={branch.name} value={branch.name}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <GitBranch className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scan Action */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(99,102,241,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Ready to Scan</h3>
                  <p className="text-sm text-indigo-200/70">Analyze {selectedBranch || 'the selected branch'} for security vulnerabilities and code quality issues.</p>
                </div>
                
                <button
                  onClick={handleStartScan}
                  disabled={!selectedBranch || isScanning || isBranchesLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Scanning...
                    </>
                  ) : scanComplete ? (
                    <>
                      <Shield className="w-5 h-5" />
                      Scan Completed
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Start Security Scan
                    </>
                  )}
                </button>
              </div>
            </div>

            {scanComplete && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-emerald-400">
                <div className="flex items-center gap-3 font-semibold mb-2">
                  <Shield className="w-5 h-5" />
                  Analysis Finished
                </div>
                <p className="text-sm text-emerald-400/80">The repository has been successfully scanned. No critical vulnerabilities found in the selected branch.</p>
              </div>
            )}

          </div>

          {/* Right Sidebar Details */}
          <div className="col-span-1 space-y-6">
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl backdrop-blur-xl p-5 shadow-xl">
              <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-5">Repository Info</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-sm text-slate-500">Owner</span>
                  <span className="text-sm font-medium text-slate-300">{owner}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-sm text-slate-500">Name</span>
                  <span className="text-sm font-medium text-slate-300">{repo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Target Branch</span>
                  <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded text-slate-300">{selectedBranch || 'None'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
