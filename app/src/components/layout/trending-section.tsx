'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { MediaItem } from '@/lib/types';
import { MediaCard } from '@/components/media/media-card';
import { FilterPanel } from '@/components/layout/filter-panel';
import { ChevronRight, TrendingUp } from 'lucide-react';

interface TrendingSectionProps {
  title: string;
  items: MediaItem[];
  description?: string;
  section: 'movies' | 'shows' | 'books';
}

const sectionConfig = {
  movies: {
    emoji: '🎬',
    gradient: 'from-amber-100 to-orange-100',
    defaultDescription: "This week's most popular films",
  },
  shows: {
    emoji: '📺',
    gradient: 'from-violet-100 to-purple-100',
    defaultDescription: "Series everyone's talking about",
  },
  books: {
    emoji: '📚',
    gradient: 'from-rose-100 to-pink-100',
    defaultDescription: 'Must-read titles of the moment',
  },
};

export function TrendingSection({ title, items, section, description }: TrendingSectionProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const config = sectionConfig[section];

  // Get all unique genres from items
  const allGenres = useMemo(() => {
    const genreSet = new Set<string>();
    items.forEach((item) => {
      if (item.genres && Array.isArray(item.genres)) {
        item.genres.forEach((genre) => {
          if (genre && typeof genre === 'string') {
            genreSet.add(genre);
          }
        });
      }
    });
    return Array.from(genreSet).sort();
  }, [items]);

  // Filter items based on genres
  const filteredItems = useMemo(() => {
    if (selectedGenres.length === 0) {
      return items;
    }

    return items.filter((item) => {
      if (!item.genres || !Array.isArray(item.genres)) {
        return false;
      }
      
      return selectedGenres.some((genre) =>
        item.genres?.includes(genre)
      );
    });
  }, [items, selectedGenres]);

  return (
    <div className="space-y-6">
      {/* Section Header - All in one row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br ${config.gradient}`}>
            <span className="text-lg">{config.emoji}</span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-headline font-semibold text-slate-800">{title}</h2>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                <TrendingUp size={10} className="text-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Hot</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {description || config.defaultDescription}
            </p>
          </div>
        </div>

        {/* Right: Filter + View All */}
        <div className="flex items-center gap-3 sm:ml-auto">
          {allGenres.length > 0 && (
            <FilterPanel
              genres={allGenres}
              selectedGenres={selectedGenres}
              onGenresChange={setSelectedGenres}
              section={section}
            />
          )}
          
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          
          <Link 
            href={`/${section}/trending`}
            className="group inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors rounded-full hover:bg-slate-100 whitespace-nowrap"
          >
            <span className="hidden sm:inline">View all</span>
            <span className="sm:hidden">More</span>
            <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Selected Genre Pills - Show below when filters active */}
      {selectedGenres.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap -mt-2">
          <span className="text-[11px] text-slate-400">Filtered by:</span>
          {selectedGenres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenres(selectedGenres.filter(g => g !== genre))}
              className="group inline-flex items-center gap-1 h-6 pl-2.5 pr-1.5 rounded-full bg-rose-50 text-rose-600 text-[11px] font-medium hover:bg-rose-100 transition-colors"
            >
              <span>{genre}</span>
              <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-rose-200/50 group-hover:bg-rose-200 transition-colors text-[10px]">
                ✕
              </span>
            </button>
          ))}
          <button 
            onClick={() => setSelectedGenres([])}
            className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Media Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredItems.slice(0, 5).map((item) => (
            <MediaCard key={item.id} media={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
          <p className="text-sm text-slate-400">
            {items.length === 0
              ? `No trending ${section} available.`
              : `No ${section} match your filter selections.`}
          </p>
        </div>
      )}
    </div>
  );
}