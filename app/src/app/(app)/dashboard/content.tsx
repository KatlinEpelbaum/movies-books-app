'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { MediaItem } from "@/lib/types";
import { TrendingSection } from "@/components/layout/trending-section";
import { Play, BookOpen, ChevronLeft, ChevronRight, Bookmark, Tv, Sparkles } from "lucide-react";

interface DashboardContentProps {
  userName: string;
  activeItems: MediaItem[];
  trendingMovies: MediaItem[];
  trendingShows: MediaItem[];
  trendingBooks: MediaItem[];
}

export function DashboardContent({
  userName,
  activeItems = [],
  trendingMovies,
  trendingShows,
  trendingBooks,
}: DashboardContentProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [randomProgress, setRandomProgress] = useState<Record<string, number>>({});

  const itemsPerPage = 2;
  const totalPages = Math.ceil(activeItems.length / itemsPerPage);

  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  // Generate random progress values only on client
  useEffect(() => {
    const newRandomProgress: Record<string, number> = {};
    activeItems.forEach(item => {
      if (item.type === 'movie') {
        newRandomProgress[item.id] = 50 + Math.random() * 40;
      } else if (item.type === 'show' && (!item.currentEpisode || !item.totalEpisodes)) {
        newRandomProgress[item.id] = 30 + Math.random() * 40;
      }
    });
    setRandomProgress(newRandomProgress);
  }, [activeItems]);

  const goToPage = (page: number) => {
    if (isAnimating || page === currentPage) return;
    setIsAnimating(true);
    setCurrentPage(page);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToPrev = () => {
    if (canGoPrev) goToPage(currentPage - 1);
  };

  const goToNext = () => {
    if (canGoNext) goToPage(currentPage + 1);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, isAnimating]);

  return (
    <div className="min-h-screen pb-24 bg-white selection:bg-rose-100">
      <div className="max-w-[1500px] mx-auto px-8 pt-8 space-y-24">
        
        <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-600/5 border border-yellow-600/10 text-[10px] uppercase tracking-[0.2em] font-bold text-yellow-600/70">
              Welcome back
            </div>
            <h1 className="text-6xl md:text-4xl font-headline font-medium">
              Hello, <span className="">{userName}</span>
            </h1>
            <p className="text-muted-foreground font-light max-w-md">
              Your evening curation of cinema, stories, and style is ready.
            </p>
          </div>
        </header>

        {/* --- CAROUSEL ACTIVE ITEMS SECTION --- */}
        {activeItems.length > 0 && (
          <section className="relative">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-rose-100/80">
                  <Play size={14} className="text-rose-500 ml-0.5" />
                </div>
                <div>
                  <h2 className="text-sm font-headline font-semibold text-slate-800">
                    Continue Where You Left Off
                  </h2>
                  <p className="text-[11px] text-slate-400">Pick up your current stories</p>
                </div>
              </div>
              
              {/* Navigation Controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-3">
                  {/* Dots Indicator */}
                  <div className="flex items-center gap-2 mr-4">
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => goToPage(idx)}
                        className={`transition-all duration-300 rounded-full ${
                          idx === currentPage 
                            ? 'w-6 h-1.5 bg-rose-300' 
                            : 'w-1.5 h-1.5 bg-slate-200 hover:bg-slate-300'
                        }`}
                        aria-label={`Go to page ${idx + 1}`}
                      />
                    ))}
                  </div>
                  
                  {/* Arrow Buttons */}
                  <button
                    onClick={goToPrev}
                    disabled={!canGoPrev}
                    className={`p-2 rounded-full border transition-all duration-300 ${
                      canGoPrev 
                        ? 'border-rose-200 text-rose-400 hover:bg-rose-50 hover:border-rose-300' 
                        : 'border-slate-100 text-slate-200 cursor-not-allowed'
                    }`}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={goToNext}
                    disabled={!canGoNext}
                    className={`p-2 rounded-full border transition-all duration-300 ${
                      canGoNext 
                        ? 'border-rose-200 text-rose-400 hover:bg-rose-50 hover:border-rose-300' 
                        : 'border-slate-100 text-slate-200 cursor-not-allowed'
                    }`}
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Carousel Container */}
            <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentPage * 100}%)` }}
              >
                {/* Render pages */}
                {Array.from({ length: totalPages }).map((_, pageIdx) => (
                  <div 
                    key={pageIdx} 
                    className="w-full flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-6"
                    style={{ 
                      opacity: pageIdx === currentPage ? 1 : 0.3, 
                      transition: 'opacity 0.5s ease' 
                    }}
                  >
                    {activeItems
                      .slice(pageIdx * itemsPerPage, (pageIdx + 1) * itemsPerPage)
                      .map((item) => {
                        const isBook = item.type === 'book';
                        let progress = 0;
                        let displayText = '';

                        if (isBook) {
                          // Books: use actual page progress
                          progress = item.currentPage && item.totalPages ? (item.currentPage / item.totalPages) * 100 : 0;
                          displayText = `Page ${item.currentPage || 0} of ${item.totalPages || '?'}`;
                        } else if (item.type === 'movie') {
                          // Movies: use pre-generated random progress
                          progress = randomProgress[item.id] ?? 70;
                          displayText = `Watching`;
                        } else if (item.type === 'show') {
                          // TV Shows: use episode progress if available, otherwise use pre-generated random
                          if (item.currentEpisode && item.totalEpisodes) {
                            progress = (item.currentEpisode / item.totalEpisodes) * 100;
                            displayText = `Episode ${item.currentEpisode} of ${item.totalEpisodes}`;
                          } else {
                            progress = randomProgress[item.id] ?? 50;
                            displayText = `Watching`;
                          }
                        }

                        return (
                          <Link 
                            key={item.id}
                            href={`/media/${item.id}`}
                          >
                            <div 
                              className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white/80 via-white/60 to-rose-50/30 backdrop-blur-md border border-rose-100/40 p-6 transition-all duration-700 hover:bg-white/70 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-rose-200/50 cursor-pointer h-full"
                            >
                            {/* Decorative corner accent */}
                            <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden">
                              <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-rose-100/40 to-transparent rounded-full" />
                            </div>

                            {/* Type badge */}
                            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/60 border border-rose-100/30 shadow-sm">
                              {isBook ? (
                                <Bookmark size={10} className="text-rose-300" />
                              ) : (
                                <Tv size={10} className="text-rose-300" />
                              )}
                              <span className="text-[8px] uppercase tracking-[0.15em] font-bold text-rose-400/70">
                                {isBook ? 'Reading' : 'Watching'}
                              </span>
                            </div>

                            <div className="flex items-center gap-6 relative z-10">
                              
                              {/* Cover with enhanced styling */}
                              <div className="relative h-36 w-24 flex-shrink-0">
                                {/* Shadow layer */}
                                <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-sm bg-rose-200/20 blur-sm" />
                                
                                {/* Main cover */}
                                <div className="relative h-full w-full overflow-hidden rounded-sm shadow-[8px_8px_24px_rgba(0,0,0,0.12)] bg-[#FDFCFB] transition-transform duration-700 group-hover:-rotate-2 group-hover:scale-105">
                                  {item.coverImage ? (
                                    <img src={item.coverImage} alt={item.title} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-rose-50 text-rose-200">
                                      {isBook ? <BookOpen size={28} /> : <Play size={28} />}
                                    </div>
                                  )}
                                  {/* Book spine effect */}
                                  <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-r from-black/10 to-transparent" />
                                  {/* Subtle shine on hover */}
                                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 flex flex-col justify-center space-y-4 pt-4">
                                <div className="space-y-1.5">
                                  <h3 className="text-xl font-headline font-medium tracking-tight text-slate-800 truncate leading-tight">
                                    {item.title}
                                  </h3>
                                  <p className="text-[11px] uppercase tracking-[0.1em] text-slate-400 font-medium truncate">
                                    {item.authorOrDirector}
                                  </p>
                                </div>

                                {/* Progress section with more detail */}
                                <div className="space-y-3 pt-2">
                                  <div className="flex justify-between items-center">
                                    <p className="text-[10px] text-slate-400">
                                      {displayText}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-semibold text-rose-400">
                                        {Math.round(progress)}%
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Enhanced progress bar */}
                                  <div className="relative h-1.5 w-full bg-slate-100/80 rounded-full overflow-hidden">
                                    <div 
                                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-rose-200 via-rose-300 to-rose-400 transition-all duration-1000 rounded-full" 
                                      style={{ width: `${progress}%` }} 
                                    />
                                    {/* Animated shimmer */}
                                    <div 
                                      className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                                      style={{ 
                                        transform: 'translateX(-100%)',
                                        animation: 'shimmer 2s infinite',
                                      }} 
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Background Glows */}
                            <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-rose-100/40 blur-[80px] rounded-full -z-10 group-hover:bg-rose-100/60 transition-colors duration-700" />
                            <div className="absolute -top-8 -left-8 w-24 h-24 bg-amber-50/30 blur-[40px] rounded-full -z-10" />
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>

            {/* Swipe hint for mobile */}
            {totalPages > 1 && (
              <p className="text-center text-[10px] uppercase tracking-[0.2em] text-slate-300 mt-6 md:hidden">
                Swipe to explore
              </p>
            )}
          </section>
        )}

        {/* --- Curated Content Sections --- */}
        <main className="space-y-32">
          <section className="relative">
            <TrendingSection title="Trending Movies" description='wifnwifnwifw' items={trendingMovies} section="movies" />
          </section>

          <section className="relative">
            <TrendingSection title="Trending TV Shows" description='wifnwifnwifw' items={trendingShows} section="shows" />
          </section>

          <section className="relative">
            <TrendingSection title="Trending Books" description='wifnwifnwifw' items={trendingBooks} section="books" />
          </section>
        </main>

        <footer className="pt-16 pb-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-8 h-px bg-slate-200" />
              <Sparkles size={14} />
              <div className="w-8 h-px bg-slate-200" />
            </div>
            <p className="text-sm text-slate-400 font-light">
              Curated with care, just for you.
            </p>
          </div>
        </footer>
      </div>

      {/* Shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}