'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import AppLayout from '@/components/AppLayout';
import { FileText, Search, Plus } from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [reports, setReports] = useState<any[]>([]);
  const [isReportsLoading, setIsReportsLoading] = useState(false);

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
    const fetchReports = async () => {
      if (!user) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setIsReportsLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/reports`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            Accept: 'application/json',
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setReports(data);
        } else {
          console.error('Failed to fetch reports', await res.text());
        }
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setIsReportsLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#30363d] border-t-[#58a6ff] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppLayout user={user}>
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Analysis Reports
            </h2>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 relative group">
              <div className="absolute inset-0 bg-indigo-500/10 blur rounded-xl group-focus-within:bg-indigo-500/20 transition-colors" />
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Find a report..."
                className="w-full relative bg-white/[0.02] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-slate-200 placeholder:text-slate-500 transition-all backdrop-blur-md shadow-xl"
              />
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl overflow-hidden min-h-[400px]">
            {isReportsLoading ? (
              <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                <div className="w-6 h-6 border-2 border-[#30363d] border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-sm text-slate-400 font-medium animate-pulse">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
                  <FileText className="w-8 h-8 text-indigo-400/50" />
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No Analysis Reports Yet</h3>
                <p className="text-sm text-center max-w-md">
                  You haven't run any security scans yet. Go to the dashboard and configure a scan for one of your repositories to see the detailed report here.
                </p>
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="flex items-start justify-between p-6 border-b border-white/5 last:border-b-0 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 bg-white/5 rounded-xl border border-white/5 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 transition-colors">
                      <FileText className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-slate-200 font-semibold text-xl group-hover:text-indigo-400 transition-colors truncate max-w-sm sm:max-w-md">
                        {report.repositoryName}
                      </h3>
                      <p className="text-sm text-slate-400 mt-2 mb-4 group-hover:text-slate-300 transition-colors">
                        Analyzed branch: <span className="font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded break-all">{report.branchName}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${report.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'}`} />
                          <span className="capitalize">{report.status}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-slate-600" />
                          {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-slate-600" />
                          Score: {report.score}/100
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-bold text-slate-200">{report.issuesFound}</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Issues</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
