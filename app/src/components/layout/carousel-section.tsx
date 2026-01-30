'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import type { MediaItem } from '@/lib/types';
import { MediaCard } from '@/components/media/media-card';
import { FilterPanel } from '@/components/layout/filter-panel';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselSectionProps {
  title: string;
  items: MediaItem[];
  section: 'movies' | 'shows' | 'books';
}

export function CarouselSection({ title, items, section }: CarouselSectionProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const itemWidth = 180 + 16; // width + gap
      const scrollAmount = itemWidth;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-2xl font-semibold">{title}</h2>
          <Link href={`/${section}/trending`}>
            <Button variant="outline" size="sm">
              Show More
            </Button>
          </Link>
        </div>

        {allGenres.length > 0 && (
          <FilterPanel
            genres={allGenres}
            selectedGenres={selectedGenres}
            onGenresChange={setSelectedGenres}
            section={section}
          />
        )}

        {filteredItems.length > 0 ? (
          <div className="relative">
            {/* Left scroll button */}
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Horizontal scroll container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-hidden scroll-smooth"
              style={{ scrollBehavior: 'smooth' }}
            >
              {filteredItems.map((item) => (
                <div key={item.id} className="flex-shrink-0 w-[180px]">
                  <MediaCard media={item} />
                </div>
              ))}
            </div>

            {/* Right scroll button */}
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              {items.length === 0
                ? `No trending ${section} available.`
                : `No ${section} match your filter selections.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
