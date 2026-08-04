'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { ChevronLeft, ExternalLink, GitBranch, Shield, Loader2, Search, X } from 'lucide-react';
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
  const [scanReport, setScanReport] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleCancelScan = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsScanning(false);
    setScanError('Scanning was cancelled by the user.');
  };

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

  const handleStartScan = async () => {
    if (!selectedBranch) return;
    setIsScanning(true);
    setScanComplete(false);
    setScanError(null);
    setScanReport(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const githubToken = localStorage.getItem('github_provider_token');
      
      if (!session || !githubToken) throw new Error('Not authenticated');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/github/repos/${owner}/${repo}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          branch: selectedBranch,
          githubToken,
        }),
      });

      if (!res.ok) {
        const errObj = await res.json().catch(() => ({}));
        throw new Error(errObj.error || 'Failed to start scan');
      }

      const { reportId } = await res.json();
      
      // Poll for completion
      pollIntervalRef.current = setInterval(async () => {
        try {
          const checkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/reports/${reportId}`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            }
          });
          if (checkRes.ok) {
            const reportData = await checkRes.json();
            if (reportData.status === 'completed' || reportData.status === 'failed') {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
              setIsScanning(false);
              setScanComplete(true);
              setScanReport(reportData);
            }
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
        }
      }, 5000); // Check every 5 seconds
      
    } catch (err: any) {
      console.error(err);
      setScanError(err.message || 'An error occurred while starting the scan');
      setIsScanning(false);
    }
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
              
              {scanError && (
                <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                  {scanError}
                </div>
              )}
            </div>

            {scanComplete && scanReport && (
              <div className={`border rounded-2xl p-6 ${scanReport.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 font-semibold">
                    <Shield className="w-5 h-5" />
                    {scanReport.status === 'completed' ? 'Analysis Finished' : 'Analysis Failed'}
                  </div>
                  {scanReport.status === 'completed' && (
                    <div className="text-sm font-bold bg-emerald-500/20 px-3 py-1 rounded-full">Score: {scanReport.score}/100</div>
                  )}
                </div>
                
                {scanReport.status === 'completed' ? (
                  <>
                    <p className="text-sm text-emerald-400/80 mb-4">{scanReport.summary || 'The repository has been successfully scanned.'}</p>
                    {scanReport.issuesFound > 0 ? (
                      <div className="mt-4 space-y-3">
                        <h4 className="font-semibold text-emerald-300">Issues Found ({scanReport.issuesFound})</h4>
                        {(scanReport.details as any[])?.map((issue, idx) => (
                          <div key={idx} className="bg-[#050505]/50 border border-emerald-500/20 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-emerald-300">{issue.title}</span>
                              <div className="flex gap-2">
                                {issue.category && <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">{issue.category}</span>}
                                <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-emerald-500/20">{issue.severity}</span>
                              </div>
                            </div>
                            <p className="text-sm text-emerald-400/80">{issue.description}</p>
                            {issue.file && (
                              <p className="text-xs text-emerald-400/60 mt-2 font-mono">File: {issue.file} {issue.line ? `(Line ${issue.line})` : ''}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-emerald-400/80">No issues found in this repository!</p>
                    )}
                    <div className="mt-6 pt-4 border-t border-emerald-500/20 flex items-center justify-between">
                      <p className="text-sm text-emerald-400/80">For more info go to:</p>
                      <button 
                        onClick={() => router.push(`/reports/${scanReport.id}`)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      >
                        View Full Report
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-red-400/80">An error occurred during analysis. Please try again later.</p>
                )}
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
    </>
  );
}
