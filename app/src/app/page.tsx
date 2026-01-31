import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server'; // Adjust this path to your Supabase config
import { 
  Play, 
  BookOpen, 
  Search, 
  Sparkles, 
  Heart, 
  Star, 
  ArrowUpRight, 
  Smile, 
  Bookmark, 
  Moon, 
  Coffee, 
  Instagram, 
  Twitter,
  Film
} from "lucide-react";

export default async function HomePage() {
  // --- AUTH REDIRECT LOGIC ---
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is logged in, skip the landing page and go to dashboard
  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen bg-[#FDFCFB] text-[#1A1C1E] selection:bg-rose-100 relative overflow-x-hidden">
      
      {/* 1. LAYERED AMBIENCE & TEXTURE */}
      {/* The grain overlay makes white space feel like expensive paper */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* Background Soft Glows */}
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-rose-100/40 blur-[120px] rounded-full -z-10 animate-pulse" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-amber-50/50 blur-[100px] rounded-full -z-10" />
      <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] bg-indigo-50/40 blur-[120px] rounded-full -z-10" />

      {/* 2. REFINED NAV */}
      <nav className="fixed top-8 left-0 right-0 z-50 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between bg-white/60 backdrop-blur-xl border border-white/80 rounded-full px-8 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-2 font-serif italic text-xl tracking-tight text-indigo-900">
            <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            Lune
          </div>
          <div className="hidden md:flex gap-10 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
            <a href="#cinema" className="hover:text-indigo-600 transition-colors">Cinema</a>
            <a href="#library" className="hover:text-indigo-600 transition-colors">Library</a>
            <a href="#moods" className="hover:text-indigo-600 transition-colors">Moods</a>
          </div>
          <a href="/auth" className="bg-indigo-600 text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
            Join
          </a>
        </div>
      </nav>

      {/* 3. HERO SECTION */}
      <section className="relative pt-64 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-100 bg-rose-50/50 text-rose-600 text-[9px] font-black uppercase tracking-[0.2em] mb-10 shadow-sm">
            <Heart className="w-3 h-3 fill-rose-600" /> New: The 2026 Collection
          </div>

          <h1 className="text-7xl md:text-[100px] font-bold tracking-tighter leading-[0.85] mb-10 text-slate-900">
            Digital <span className="font-serif italic font-light text-indigo-400">keepsakes</span> <br />
            for the <span className="relative inline-block">
              curious.
              <svg className="absolute -bottom-4 left-0 w-full opacity-30" height="8" viewBox="0 0 100 8" fill="none" preserveAspectRatio="none">
                <path d="M1 7C20 2 40 2 99 7" stroke="#6366F1" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>
          
          <p className="max-w-md mx-auto text-slate-400 text-lg font-light leading-relaxed mb-14 italic">
            "A dainty home for your cinema obsessions, late-night reads, and the moods in between."
          </p>

          <div className="relative max-w-lg mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-rose-100 to-indigo-100 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative flex items-center bg-white border border-white p-2 rounded-full shadow-xl shadow-indigo-900/5">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                 <Search className="w-4 h-4" />
              </div>
              <input type="text" placeholder="Search a story..." className="bg-transparent border-none focus:ring-0 text-sm w-full px-4 text-slate-600 italic placeholder:text-slate-300" />
              <a href="/auth" className="bg-indigo-600 text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all">Track</a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE GALLERY & FEATURES GRID */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Cinema Card */}
        <div id="cinema" className="group relative">
          <div className="absolute -top-4 -right-4 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-xl rotate-6 border border-rose-50">
            <Play className="w-4 h-4 text-rose-400 fill-rose-400" />
          </div>
          <div className="relative w-full aspect-[3/4] rounded-[3.5rem] overflow-hidden bg-white p-3 shadow-xl shadow-slate-200/40 border border-white transition-all duration-700 group-hover:-translate-y-4 group-hover:shadow-2xl">
            <img src="https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800" className="w-full h-full object-cover rounded-[2.8rem] transition-transform duration-1000 group-hover:scale-110" />
          </div>
          <div className="mt-8 text-center">
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-slate-300">Archive 01</p>
            <h3 className="mt-2 text-2xl font-serif italic text-indigo-900">Cinematic Nights</h3>
          </div>
        </div>

        {/* Library Tracker */}
        <div id="library" className="bg-white rounded-[4rem] p-12 border border-white shadow-xl shadow-indigo-900/5 flex flex-col justify-between relative overflow-hidden group">
           <div className="flex justify-between items-start">
             <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
               <BookOpen className="w-6 h-6 text-indigo-500" />
             </div>
             <div className="text-[9px] font-black text-indigo-300 uppercase tracking-widest bg-indigo-50/50 px-3 py-1 rounded-full">Current</div>
           </div>
           <div className="mt-12">
             <h4 className="text-4xl font-serif italic text-slate-800 leading-tight">Normal <br /> People</h4>
             <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-400 mt-4">Page 142 / 280</p>
             <div className="mt-6 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-indigo-400 rounded-full transition-all group-hover:w-2/3 duration-1000" />
             </div>
           </div>
           <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl group-hover:bg-indigo-100 transition-colors" />
        </div>

        {/* Mood Card */}
        <div id="moods" className="bg-[#1A1C1E] rounded-[4rem] p-12 flex flex-col justify-between text-white relative overflow-hidden group">
          <div className="flex justify-between items-start z-10">
             <Moon className="w-6 h-6 text-rose-200 fill-rose-200" />
             <div className="flex gap-1">
                {[...Array(3)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20" />)}
             </div>
          </div>
          <div className="z-10">
            <h4 className="text-3xl font-serif italic mb-6 leading-tight">Daily Mood <br />Journal</h4>
            <div className="flex flex-wrap gap-2">
              {['Melancholy', 'Soft', 'Grateful'].map(mood => (
                <span key={mood} className="text-[9px] uppercase font-bold tracking-widest px-3 py-1.5 border border-white/10 rounded-full group-hover:bg-white group-hover:text-black transition-all">
                  {mood}
                </span>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
        </div>
      </section>

      {/* 5. THE NOOK FEATURE */}
      <section className="max-w-7xl mx-auto px-6 py-40 flex flex-col md:flex-row items-center gap-20">
        <div className="flex-1 space-y-8">
           <div className="flex items-center gap-4">
             <div className="h-[1px] w-12 bg-indigo-200" />
             <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-400">The Experience</span>
           </div>
           <h2 className="text-5xl md:text-6xl font-bold tracking-tighter text-slate-900 leading-[0.9]">
             Every story <br /> needs a <span className="font-serif italic font-light text-rose-400">cushion.</span>
           </h2>
           <p className="text-slate-400 font-light text-lg leading-relaxed italic max-w-sm">
             Log your favorite quotes, track your progress with aesthetic charts, and share your library with a like-minded community.
           </p>
           <a href="/auth" className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] group">
             Learn More <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all"><ArrowUpRight className="w-4 h-4" /></div>
           </a>
        </div>
        <div className="flex-1 relative">
           <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-50 rounded-full blur-2xl -z-10" />
           <div className="relative z-10 bg-white p-4 rounded-[4rem] shadow-2xl rotate-2 border border-white">
              <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1000" className="rounded-[3rem] grayscale-[20%] hover:grayscale-0 transition-all duration-700 shadow-inner" alt="aesthetic books" />
              <div className="absolute bottom-12 -right-6 bg-white p-6 rounded-3xl shadow-xl border border-slate-50 flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 shadow-sm">
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Reading Nook</p>
                   <p className="text-[10px] text-slate-400 italic">Curated Space</p>
                </div>
              </div>
           </div>
        </div>
      </section>

      {/* 6. DAINTY FOOTER */}
      <footer className="bg-white border-t border-slate-50 py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-16">
          <div className="space-y-6">
            <div className="flex items-center gap-2 font-serif italic text-2xl tracking-tight text-indigo-900">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Lune
            </div>
            <p className="text-slate-400 text-sm max-w-xs font-light italic">
              A private digital sanctuary for the collectors of beautiful stories and moments.
            </p>
            <div className="flex gap-4">
               <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"><Instagram className="w-4 h-4" /></div>
               <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"><Twitter className="w-4 h-4" /></div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Platform</p>
              <ul className="space-y-2 text-sm text-slate-400 font-light italic">
                <li className="hover:text-indigo-600 cursor-pointer transition-colors">Cinema</li>
                <li className="hover:text-indigo-600 cursor-pointer transition-colors">Library</li>
                <li className="hover:text-indigo-600 cursor-pointer transition-colors">Journal</li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Support</p>
              <ul className="space-y-2 text-sm text-slate-400 font-light italic">
                <li className="hover:text-indigo-600 cursor-pointer transition-colors">Privacy</li>
                <li className="hover:text-indigo-600 cursor-pointer transition-colors">Terms</li>
                <li className="hover:text-indigo-600 cursor-pointer transition-colors">Help</li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Newsletter</p>
              <div className="relative">
                <input type="text" placeholder="Your email..." className="w-full bg-slate-50 border-none rounded-full px-6 py-3 text-sm italic placeholder:text-slate-300 focus:ring-1 focus:ring-indigo-100" />
                <button className="absolute right-2 top-1.5 bg-white shadow-sm p-1.5 rounded-full hover:scale-110 transition-transform"><ArrowUpRight className="w-4 h-4 text-indigo-400" /></button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-slate-50 flex justify-between items-center text-[9px] font-bold uppercase tracking-[0.3em] text-slate-300">
           <p>© 2026 Lune Archive Studio</p>
           <p>Designed with Love</p>
        </div>
      </footer>
    </main>
  );
}