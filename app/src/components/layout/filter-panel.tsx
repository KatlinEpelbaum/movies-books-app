'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface FilterPanelProps {
  genres: string[];
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
  section: 'movies' | 'shows' | 'books';
}

export function FilterPanel({
  genres,
  selectedGenres,
  onGenresChange,
  section,
}: FilterPanelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGenreToggle = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onGenresChange(selectedGenres.filter((g) => g !== genre));
    } else {
      onGenresChange([...selectedGenres, genre]);
    }
  };

  const handleClearFilters = () => {
    onGenresChange([]);
  };

  const hasActiveFilters = selectedGenres.length > 0;

  // Don't render dropdown until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="h-8 px-3 rounded-full bg-slate-100 animate-pulse w-24" />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`
          group inline-flex items-center gap-2 h-8 px-3 rounded-full text-xs font-medium transition-all duration-200
          ${hasActiveFilters 
            ? 'bg-slate-900 text-white hover:bg-slate-800' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }
        `}>
          <SlidersHorizontal size={12} />
          <span>Genres</span>
          {hasActiveFilters && (
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-[9px] font-bold">
              {selectedGenres.length}
            </span>
          )}
          <ChevronDown size={12} className="opacity-50 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-56 p-2 rounded-xl border-slate-200 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-1.5 mb-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Filter by genre
          </span>
          {hasActiveFilters && (
            <button 
              onClick={handleClearFilters}
              className="text-[10px] font-medium text-rose-500 hover:text-rose-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="bg-slate-100" />
        
        {/* Genre List */}
        <div className="max-h-56 overflow-y-auto py-1">
          {genres.length > 0 ? (
            <>
              {genres.slice(0, 20).map((genre) => (
                <DropdownMenuCheckboxItem
                  key={genre}
                  checked={selectedGenres.includes(genre)}
                  onCheckedChange={() => handleGenreToggle(genre)}
                  className="rounded-lg cursor-pointer my-0.5 text-sm"
                >
                  {genre}
                </DropdownMenuCheckboxItem>
              ))}
              {genres.length > 20 && (
                <div className="px-2 py-2 text-[10px] text-slate-400 text-center border-t border-slate-100 mt-1">
                  +{genres.length - 20} more
                </div>
              )}
            </>
          ) : (
            <div className="px-2 py-3 text-xs text-slate-400 text-center">
              No genres available
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}