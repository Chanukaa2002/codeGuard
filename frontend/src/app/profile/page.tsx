'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import AppLayout from '@/components/AppLayout';
import { User as UserIcon, Cpu } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'public' | 'ai'>('public');
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash');
  const [customModel, setCustomModel] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      setUser(session.user);
      
      // Fetch user AI config
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/config`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        });
        if (res.ok) {
          const config = await res.json();
          if (config.openRouterKey) setOpenRouterKey(config.openRouterKey);
          if (config.aiModel) {
            const predefinedModels = [
              'anthropic/claude-3.5-sonnet', 'anthropic/claude-3-opus', 
              'openai/gpt-4o', 'openai/gpt-4o-mini', 'google/gemini-1.5-pro', 
              'google/gemini-2.5-flash', 'meta-llama/llama-3-70b-instruct'
            ];
            if (predefinedModels.includes(config.aiModel)) {
              setSelectedModel(config.aiModel);
            } else {
              setSelectedModel('custom');
              setCustomModel(config.aiModel);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch AI config:', err);
      }

      setIsLoading(false);
    };
    
    fetchUser();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#30363d] border-t-[#58a6ff] rounded-full animate-spin" />
      </div>
    );
  }

  const handleSaveAIConfig = async () => {
    setIsSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const finalModel = selectedModel === 'custom' ? customModel : selectedModel;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          openRouterKey,
          aiModel: finalModel,
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to save config');
      }
      alert('AI Configuration saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Error saving configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout user={user}>
      <div className="max-w-7xl mx-auto py-2 w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Settings Sidebar */}
          <div className="col-span-1">
            <nav className="flex flex-col gap-2">
              <button 
                onClick={() => setActiveTab('public')}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                  activeTab === 'public' 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                    : 'hover:bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <UserIcon className={`w-4 h-4 ${activeTab === 'public' ? 'text-indigo-400' : ''}`} />
                Public profile
              </button>
              <button 
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                  activeTab === 'ai' 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                    : 'hover:bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Cpu className={`w-4 h-4 ${activeTab === 'ai' ? 'text-indigo-400' : ''}`} />
                AI Configuration
              </button>
            </nav>
          </div>

          {/* Settings Content */}
          <div className="col-span-1 md:col-span-3 space-y-8 bg-white/[0.02] border border-white/10 rounded-2xl backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden min-h-[500px]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-50 pointer-events-none" />
            
            {/* Header */}
            <div className="border-b border-white/10 pb-4 relative z-10">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                {activeTab === 'public' ? 'Public profile' : 'AI Configuration'}
              </h2>
            </div>

            {/* Content Area */}
            {activeTab === 'public' ? (
              <div className="flex flex-col-reverse lg:flex-row gap-10 relative z-10">
                {/* Form Fields */}
                <div className="flex-1 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-300">Name</label>
                    <input 
                      type="text" 
                      defaultValue={user?.user_metadata?.full_name || ''}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-slate-200 transition-all shadow-inner"
                    />
                    <p className="text-xs text-slate-500 mt-2 font-medium">
                      Your name may appear around CodeGuard where you contribute or are mentioned. You can remove it at any time.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-300">Public email</label>
                    <select className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-slate-200 transition-all shadow-inner appearance-none cursor-pointer">
                      <option className="bg-[#050505]">{user?.email}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-300">Bio</label>
                    <textarea 
                      rows={4}
                      placeholder="Tell us a little bit about yourself"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-slate-200 transition-all shadow-inner resize-none placeholder:text-slate-600"
                    ></textarea>
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <button className="bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 px-6 rounded-xl transition-all duration-300 text-sm font-semibold shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                      Update profile
                    </button>
                  </div>
                </div>

                {/* Avatar Section */}
                <div className="flex flex-col items-center lg:items-start gap-4">
                  <label className="block text-sm font-semibold mb-1 text-slate-300">Profile picture</label>
                  <div className="relative group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur opacity-40 group-hover:opacity-70 transition-opacity" />
                    <div className="w-48 h-48 rounded-full p-[3px] bg-gradient-to-tr from-indigo-500 to-purple-500 relative z-10">
                      <div className="w-full h-full rounded-full border-4 border-[#050505] overflow-hidden bg-[#0d1117] relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={user?.user_metadata?.avatar_url || 'https://github.com/identicons/default.png'}
                          alt="Profile"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-[#050505]/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                          <span className="text-sm font-semibold text-white bg-white/10 px-4 py-2 rounded-full border border-white/20">Edit Avatar</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 relative z-10">
                <p className="text-sm text-slate-400 font-medium">
                  Configure your LLM integration using OpenRouter. This powers the AI analysis engine within CodeGuard.
                </p>

                <div className="space-y-6 max-w-2xl relative">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-300">OpenRouter API Key</label>
                    <input 
                      type="password" 
                      placeholder="sk-or-v1-..."
                      value={openRouterKey}
                      onChange={(e) => setOpenRouterKey(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-slate-200 transition-all shadow-inner font-mono placeholder:font-sans"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-semibold mb-2 text-slate-300">Language Model</label>
                    <select 
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-slate-200 transition-all shadow-inner appearance-none cursor-pointer"
                    >
                      <option className="bg-[#050505]" value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                      <option className="bg-[#050505]" value="anthropic/claude-3-opus">Claude 3 Opus</option>
                      <option className="bg-[#050505]" value="openai/gpt-4o">GPT-4o</option>
                      <option className="bg-[#050505]" value="openai/gpt-4o-mini">GPT-4o Mini</option>
                      <option className="bg-[#050505]" value="google/gemini-1.5-pro">Gemini 1.5 Pro</option>
                      <option className="bg-[#050505]" value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                      <option className="bg-[#050505]" value="meta-llama/llama-3-70b-instruct">Llama 3 70B</option>
                      <option className="bg-[#050505]" value="custom">Custom...</option>
                    </select>

                    {/* Custom Model Popup */}
                    {selectedModel === 'custom' && (
                      <div className="absolute top-full left-0 right-0 mt-3 p-4 bg-[#111111] border border-indigo-500/30 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-20 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-semibold mb-2 text-indigo-400">Custom Model ID</label>
                        <input 
                          type="text" 
                          value={customModel}
                          onChange={(e) => setCustomModel(e.target.value)}
                          placeholder="e.g., mistralai/mixtral-8x7b-instruct"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-slate-200 transition-all shadow-inner"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>

                  <div className={`pt-6 border-t border-white/10 transition-all ${selectedModel === 'custom' ? 'mt-28' : ''}`}>
                    <button 
                      onClick={handleSaveAIConfig}
                      disabled={isSaving}
                      className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white py-2.5 px-6 rounded-xl transition-all duration-300 text-sm font-semibold shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center gap-2"
                    >
                      {isSaving && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                      {isSaving ? 'Saving...' : 'Save AI Configuration'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
