'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { User as UserIcon, Settings, Shield, Book, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  updated_at: string;
  language: string;
  description: string;
}
const getLanguageColor = (language: string | null) => {
  switch (language?.toLowerCase()) {
    case 'javascript': return 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]';
    case 'typescript': return 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]';
    case 'python': return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]';
    case 'html': return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]';
    case 'css': return 'bg-blue-300 shadow-[0_0_8px_rgba(147,197,253,0.6)]';
    case 'java': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
    case 'c++': return 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]';
    case 'c#': return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
    case 'php': return 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]';
    case 'ruby': return 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.6)]';
    case 'go': return 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]';
    case 'rust': return 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]';
    case 'vue': return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]';
    case 'swift': return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]';
    case 'kotlin': return 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]';
    case 'dart': return 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]';
    case 'shell': return 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]';
    default: return 'bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.6)]';
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [repos, setRepos] = useState<Repository[]>([]);
  const [isReposLoading, setIsReposLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const [showOnboardingPopup, setShowOnboardingPopup] = useState(false);
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Client-side pagination and filtering
  const filteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const reposPerPage = 10;
  const totalPages = Math.ceil(filteredRepos.length / reposPerPage) || 1;
  const paginatedRepos = filteredRepos.slice((page - 1) * reposPerPage, page * reposPerPage);

  useEffect(() => {
    const fetchUserAndConfig = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      setUser(session.user);

      // Check if user has AI config set
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/config`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        });
        if (res.ok) {
          const config = await res.json();
          // config can be null if the user hasn't synced yet or doesn't exist
          if (!config || !config.openRouterKey) {
            setShowOnboardingPopup(true);
          }
        } else {
          // If the request fails, it might be because the user doesn't have a config yet.
          setShowOnboardingPopup(true);
        }
      } catch (err) {
        console.error('Failed to fetch AI config:', err);
        // Fallback to showing it if we can't determine
        setShowOnboardingPopup(true);
      }

      setIsLoading(false);
    };
    
    fetchUserAndConfig();
  }, [router]);

  useEffect(() => {
    const fetchRepos = async () => {
      if (!user) return;
      
      const token = localStorage.getItem('github_provider_token');
      if (!token) return;

      setIsReposLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/github/repos?per_page=100&page=1`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setRepos(data);
        } else {
          console.error('Failed to fetch repositories', await res.text());
        }
      } catch (err) {
        console.error('Error fetching repos:', err);
      } finally {
        setIsReposLoading(false);
      }
    };

    fetchRepos();
  }, [user]);

  // Reset page when search query changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#30363d] border-t-[#58a6ff] rounded-full animate-spin" />
      </div>
    );
  }

  const handleSaveOnboarding = async () => {
    if (!openRouterKey.trim()) return;
    setIsSavingConfig(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          openRouterKey,
          aiModel: selectedModel,
        }),
      });
      
      if (res.ok) {
        setShowOnboardingPopup(false);
      } else {
        alert('Failed to save AI configuration. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving configuration.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <>
      {showOnboardingPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-indigo-950/90 border border-indigo-500/30 rounded-2xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-4">Welcome to CodeGuard AI</h2>
              <p className="text-slate-300 mb-6 text-sm leading-relaxed">
                To start scanning your repositories for security vulnerabilities, you need to configure your AI model and API key. 
                CodeGuard uses OpenRouter to provide access to various LLMs.
              </p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-indigo-200">OpenRouter API Key</label>
                  <input 
                    type="password" 
                    placeholder="sk-or-v1-..."
                    value={openRouterKey}
                    onChange={(e) => setOpenRouterKey(e.target.value)}
                    className="w-full bg-[#050505]/50 border border-indigo-500/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-white placeholder:text-slate-500"
                  />
                  <p className="text-xs text-indigo-300/70 mt-2">
                    Get your key from <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">openrouter.ai/keys</a>. For free models, check <a href="https://openrouter.ai/collections/free-models" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">free-models</a>.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-indigo-200">Language Model</label>
                  <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-[#050505]/50 border border-indigo-500/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-white appearance-none"
                  >
                    <option className="bg-[#050505]" value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option className="bg-[#050505]" value="google/gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option className="bg-[#050505]" value="openai/gpt-4o-mini">GPT-4o Mini</option>
                    <option className="bg-[#050505]" value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                  </select>
                  <p className="text-xs text-indigo-300/70 mt-2">
                    You can always change these settings later in the <span className="font-semibold text-indigo-300">AI Configuration</span> section of your Profile tab.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowOnboardingPopup(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleSaveOnboarding}
                  disabled={!openRouterKey.trim() || isSavingConfig}
                  className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                >
                  {isSavingConfig && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                  Save & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <AppLayout user={user}>
        <div className="max-w-7xl mx-auto py-2 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Dashboard Area */}
          <div className="col-span-1 lg:col-span-3 space-y-8">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Dashboard
              </h2>
            </div>

            {/* Repositories */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase hidden sm:block">Your Repositories</h3>
                
                {/* Search Input */}
                <div className="flex-1 w-full md:max-w-sm md:mx-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-indigo-500/10 blur rounded-full group-focus-within:bg-indigo-500/20 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search repositories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full relative bg-white/[0.02] border border-white/10 rounded-full pl-4 pr-4 py-1.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-slate-200 placeholder:text-slate-500 transition-all backdrop-blur-md"
                    />
                  </div>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-center sm:justify-start gap-3 bg-white/[0.02] border border-white/10 rounded-full px-3 py-1 backdrop-blur-md self-start sm:self-auto">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isReposLoading}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-slate-300 font-medium">Page {page}</span>
                  <button 
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages || isReposLoading}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl overflow-hidden min-h-[400px] transition-all">
                {isReposLoading ? (
                  <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                    <p className="text-sm text-slate-400 font-medium animate-pulse">Syncing repositories...</p>
                  </div>
                ) : paginatedRepos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
                      <Book className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-sm font-medium">
                      {searchQuery ? 'No repositories match your search.' : 'No repositories found.'}
                    </p>
                  </div>
                ) : (
                  paginatedRepos.map((repo) => (
                    <div 
                      key={repo.id} 
                      onClick={() => router.push(`/dashboard/repo/${repo.full_name}`)}
                      className="flex items-center justify-between p-5 border-b border-white/5 last:border-b-0 hover:bg-white/[0.04] transition-all duration-300 group cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 p-2 bg-white/5 rounded-xl border border-white/5 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 transition-colors">
                          <Book className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-200 font-semibold text-lg group-hover:text-indigo-400 transition-colors truncate max-w-sm sm:max-w-md">
                              {repo.full_name}
                            </span>
                            <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider">
                              {repo.private ? 'Private' : 'Public'}
                            </span>
                          </div>
                          {repo.description && (
                           <p className="text-sm text-slate-400 mt-1.5 max-w-xl line-clamp-1 group-hover:text-slate-300 transition-colors">{repo.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-5 text-xs text-slate-500 mt-3 font-medium">
                            {repo.language && (
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${getLanguageColor(repo.language)}`} />
                                {repo.language}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-slate-600" />
                              Updated {new Date(repo.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button 
                          className="text-xs font-semibold bg-white/5 hover:bg-indigo-500 hover:text-white text-slate-300 py-2 px-4 rounded-xl border border-white/10 hover:border-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all duration-300"
                        >
                          Configure Scan
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Recent Scans */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">Latest Security Scans</h3>
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl backdrop-blur-xl p-6 shadow-xl">
                <div className="flex flex-col items-center justify-center text-center py-10">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3 border border-white/10">
                    <Shield className="w-6 h-6 text-emerald-400/70" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">No security issues detected recently.</p>
                  <p className="text-slate-500 text-xs mt-1">Your connected repositories are secure.</p>
                </div>
              </div>
            </div>

          </div>
          
          {/* Sidebar */}
          <div className="col-span-1 space-y-6 lg:mt-[52px]">
            
            {/* Account Status Card */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden shadow-xl relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="p-5 border-b border-white/5 relative z-10">
                <h3 className="text-sm font-semibold tracking-wider text-slate-300 uppercase">Account Status</h3>
              </div>
              <div className="p-5 space-y-5 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500">
                      <div className="w-full h-full rounded-full border-2 border-[#050505] overflow-hidden bg-[#0d1117]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={user?.user_metadata?.avatar_url || 'https://github.com/identicons/default.png'}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#050505] rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">{user?.user_metadata?.user_name || 'User'}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{user?.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-emerald-400/90 font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                  <Shield className="w-4 h-4" />
                  Synced & Secure
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
