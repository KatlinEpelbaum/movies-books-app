import { getTrendingMovies } from "@/lib/media-api";
import { MediaCard } from "@/components/media/media-card";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function TrendingMoviesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const dbUserMediaData = user ? await supabase
    .from('user_media')
    .select('*')
    .eq('user_id', user.id) : { data: null };

  const favouriteMap = new Map<string, boolean>();
  if (dbUserMediaData.data) {
    dbUserMediaData.data.forEach((item: any) => {
      if (item.is_favourite) {
        favouriteMap.set(item.media_id, true);
      }
    });
  }

  const trendingMovies = await getTrendingMovies();
  const trendingMoviesWithStatus = trendingMovies.map((item) => ({
    ...item,
    isFavourite: favouriteMap.has(item.id) || false
  }));

  return (
    <div className="w-full px-4 md:px-10 py-12 space-y-16 animate-in fade-in duration-700">
      
      {/* Header: Editorial & Minimalist */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-12">
        <div className="space-y-4">
          <Link 
            href="/dashboard" 
            className="group flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-bold text-slate-400 hover:text-rose-400 transition-colors"
          >
            <ChevronLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
          <div className="space-y-1">
            <h1 className="text-5xl md:text-6xl font-headline font-semibold tracking-tight text-slate-900">
              Trending <span className="italic font-light">Cinema</span>
            </h1>
            <p className="text-slate-400 font-light text-lg">
              The world's most compelling stories, updated live.
            </p>
          </div>
        </div>
        
        <div className="hidden md:block text-right">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-rose-300">Catalogue</p>
          <p className="text-2xl font-headline font-medium">{trendingMoviesWithStatus.length}</p>
        </div>
      </header>

      {/* Grid: Clean & Airy */}
      {trendingMoviesWithStatus.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {trendingMoviesWithStatus.slice(0, 24).map((item) => (
            <div key={item.id} className="transition-transform duration-500 hover:-translate-y-2">
              <MediaCard media={item} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-[40vh] items-center justify-center rounded-[3rem] bg-slate-50 border border-slate-100">
          <p className="font-headline text-slate-400 italic">No cinema found in the current rotation.</p>
        </div>
      )}
      
      {/* Subtle Footer for the refined eye */}
      <footer className="pt-20 text-center">
        <div className="h-px w-24 bg-rose-200 mx-auto mb-6" />
        <p className="font-headline text-[10px] uppercase tracking-[0.5em] text-slate-300">
          Curated by Lune
        </p>
      </footer>
    </div>
  );
}