'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { MediaItem } from '@/lib/types';
import { MediaCard } from '@/components/media/media-card';
import { FilterPanel } from '@/components/layout/filter-panel';
import { Button } from '@/components/ui/button';

interface TrendingSectionProps {
  title: string;
  items: MediaItem[];
  section: 'movies' | 'shows' | 'books';
}

export function TrendingSection({ title, items, section }: TrendingSectionProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

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
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-2xl font-semibold">{title}</h2>
          <Link href={`/${section}/trending`}>
            <Button>Show More</Button>
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredItems.slice(0, 5).map((item) => (
              <MediaCard key={item.id} media={item} />
            ))}
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
