import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col font-sans relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-500/15 via-purple-500/5 to-transparent pointer-events-none" />
      <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-3/4 -left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 group">
          <div className="p-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">CodeGuard</span>
        </div>
        <Link 
          href="/login"
          className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-4 py-2 hover:bg-white/5 rounded-xl"
        >
          Sign in
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 relative z-10">
        <div className="max-w-3xl text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-200 to-slate-500">
            Secure Your Codebase
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            A state-of-the-art platform to analyze, review, and monitor your code. Connect with GitHub to get started instantly.
          </p>

          <div className="pt-8">
            <Link 
              href="/login"
              className="inline-flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-100 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 group"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
