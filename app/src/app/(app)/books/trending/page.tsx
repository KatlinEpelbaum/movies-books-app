import { getTrendingBooks } from "@/lib/media-api";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TrendingBooksContent } from "./trending-books-client";

export default async function TrendingBooksPage() {
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

  const trendingBooks = await getTrendingBooks();
  const trendingBooksWithStatus = trendingBooks.map((item) => ({
    ...item,
    isFavourite: favouriteMap.has(item.id) || false
  }));

  return (
    <div className="w-full px-4 md:px-10 py-12 space-y-16 animate-in fade-in duration-700">
      
      {/* Header: Clean & Sophisticated */}
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
              Literature <span className="italic font-light">& Art</span>
            </h1>
            <p className="text-slate-400 font-light text-lg">
              Curated titles from Open Library for the refined reader.
            </p>
          </div>
        </div>
        
        <div className="hidden md:block text-right">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-rose-300">Library</p>
          <p className="text-2xl font-headline font-medium">{trendingBooksWithStatus.length}</p>
        </div>
      </header>

      {/* Main Grid: Clean & Airy */}
      <main className="min-h-[60vh]">
        <TrendingBooksContent items={trendingBooksWithStatus} />
      </main>
      
      {/* The Lune Sign-off */}
      <footer className="pt-20 text-center pb-12">
        <div className="h-px w-24 bg-rose-200 mx-auto mb-6" />
        <p className="font-headline text-[10px] uppercase tracking-[0.5em] text-slate-300">
          Curated by Lune
        </p>
      </footer>
    </div>
  );
}