'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AppLayout from '@/components/AppLayout';
import { ChevronLeft, Shield, AlertTriangle, CheckCircle, FileCode, AlertOctagon, Info } from 'lucide-react';

export default function ReportDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndReport = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      setUser(session.user);
      
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/reports/${id}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setReport(data);
        } else {
          setError('Failed to load report details.');
        }
      } catch (err) {
        console.error(err);
        setError('An error occurred while fetching the report.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserAndReport();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#30363d] border-t-[#58a6ff] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <AppLayout user={user}>
        <div className="max-w-4xl mx-auto py-12 px-4 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Report Not Found</h2>
          <p className="text-slate-400 mb-6">{error || 'The requested report could not be found.'}</p>
          <button 
            onClick={() => router.push('/reports')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl transition-colors"
          >
            Back to Reports
          </button>
        </div>
      </AppLayout>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch(severity?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'HIGH': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'LOW': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch(severity?.toUpperCase()) {
      case 'CRITICAL': return <AlertOctagon className="w-4 h-4" />;
      case 'HIGH': return <AlertTriangle className="w-4 h-4" />;
      case 'MEDIUM': return <AlertTriangle className="w-4 h-4" />;
      case 'LOW': return <Info className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <AppLayout user={user}>
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Navigation */}
        <button 
          onClick={() => router.push('/reports')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <div className="bg-white/5 p-1 rounded-lg group-hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Back to Reports</span>
        </button>

        {/* Report Header */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{report.repositoryName}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                <span>Branch: <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-slate-300">{report.branchName}</span></span>
                <span>•</span>
                <span>{new Date(report.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-slate-300 text-lg leading-relaxed max-w-3xl">
                {report.summary || 'Scan completed successfully.'}
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-2 bg-[#050505]/50 p-4 rounded-xl border border-white/5 min-w-[150px]">
              <span className="text-sm font-medium text-slate-400">Security Score</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-bold ${report.score >= 80 ? 'text-emerald-400' : report.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {report.score}
                </span>
                <span className="text-slate-500">/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-indigo-400" />
            <h2 className="text-2xl font-bold text-white">Vulnerabilities & Issues</h2>
            <span className="bg-indigo-500/20 text-indigo-400 py-1 px-3 rounded-full text-sm font-bold ml-2">
              {report.issuesFound} Found
            </span>
          </div>

          {report.issuesFound === 0 ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-emerald-300 mb-2">Clean Codebase!</h3>
              <p className="text-emerald-400/80">No critical issues or vulnerabilities were found in this repository branch.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {(report.details as any[])?.map((issue, idx) => (
                <div key={idx} className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-lg transition-all hover:border-white/20">
                  
                  {/* Issue Header */}
                  <div className="p-6 border-b border-white/5 bg-[#050505]/30">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                      <h3 className="text-xl font-semibold text-slate-200">{issue.title}</h3>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getSeverityColor(issue.severity)}`}>
                        {getSeverityIcon(issue.severity)}
                        {issue.severity}
                      </div>
                    </div>
                    
                    {issue.file && (
                      <div className="flex items-center gap-2 text-sm text-slate-400 font-mono bg-white/5 inline-flex px-3 py-1.5 rounded-lg border border-white/10 mt-2">
                        <FileCode className="w-4 h-4 text-slate-500" />
                        {issue.file}
                        {issue.line && <span className="text-slate-500">:{issue.line}</span>}
                      </div>
                    )}
                  </div>
                  
                  {/* Issue Body */}
                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                      <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                        {issue.description}
                      </p>
                    </div>

                    {/* Code Examples */}
                    {(issue.vulnerableCode || issue.fixExample) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                        
                        {issue.vulnerableCode && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-red-400/80 uppercase tracking-wider flex items-center gap-2">
                              <AlertOctagon className="w-4 h-4" />
                              Vulnerable Code
                            </h4>
                            <div className="bg-[#0d1117] border border-red-500/20 rounded-xl p-4 overflow-x-auto relative group">
                              <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
                              <pre className="text-xs sm:text-sm text-slate-300 font-mono relative z-10 whitespace-pre-wrap break-all">
                                <code>{issue.vulnerableCode}</code>
                              </pre>
                            </div>
                          </div>
                        )}

                        {issue.fixExample && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-emerald-400/80 uppercase tracking-wider flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Recommended Fix
                            </h4>
                            <div className="bg-[#0d1117] border border-emerald-500/20 rounded-xl p-4 overflow-x-auto relative group">
                              <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
                              <pre className="text-xs sm:text-sm text-slate-300 font-mono relative z-10 whitespace-pre-wrap break-all">
                                <code>{issue.fixExample}</code>
                              </pre>
                            </div>
                          </div>
                        )}

                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
