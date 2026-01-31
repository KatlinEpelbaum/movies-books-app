import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';
import AuthForm from '@/components/auth/auth-form';

export default function AuthPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#FDFCFB] px-4 overflow-hidden">
      
      {/* 1. CLEAN GRADIENT MESH */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl -z-10">
        <div className="absolute top-[-10%] left-[10%] w-[40%] h-[40%] bg-rose-100/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-indigo-100/30 blur-[120px] rounded-full" />
      </div>

      {/* 2. TOP NAVIGATION (Minimalist) */}
      <nav className="absolute top-12 left-0 right-0 px-12 flex justify-between items-center">
        <Link href="/" className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300 hover:text-indigo-600 transition-all">
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
          Back
        </Link>
        <div className="flex items-center gap-2 font-serif italic text-lg text-slate-900 opacity-40">
           Lune
        </div>
      </nav>

      {/* 3. THE CENTERPIECE */}
      <div className="w-full max-w-[380px] space-y-12">
        
        {/* Header: Just Text & Space */}
        <header className="text-center space-y-4">
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-50 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-slate-900">
            Welcome to <span className="font-serif italic font-light text-indigo-400">Lune.</span>
          </h1>
          <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-400">
            Archive Membership
          </p>
        </header>

        {/* 4. THE FORM (Assuming AuthForm handles inputs) */}
        <div className="bg-white/40 backdrop-blur-sm p-2 rounded-[2.5rem] border border-white/60 shadow-2xl shadow-slate-200/20">
            <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-50">
                <AuthForm />
            </div>
        </div>

        {/* 5. DAINTY FOOTER NOTE */}
        <footer className="text-center space-y-4">
          <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">
            Curate with intention
          </p>
          <div className="flex justify-center gap-1">
             {[...Array(3)].map((_, i) => (
               <div key={i} className="w-1 h-1 rounded-full bg-indigo-100" />
             ))}
          </div>
        </footer>

      </div>

      {/* Subtle Grain (Keep this for the boutique feel) */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}