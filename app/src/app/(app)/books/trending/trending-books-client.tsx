'use client';

import { useState, useMemo } from 'react';
import type { MediaItem } from '@/lib/types';
import { MediaCard } from '@/components/media/media-card';
import { FilterPanel } from '@/components/layout/filter-panel';

interface TrendingBooksContentProps {
  items: MediaItem[];
}

export function TrendingBooksContent({ items }: TrendingBooksContentProps) {
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
      return items.slice(0, 20);
    }

    return items.filter((item) => {
      if (!item.genres || !Array.isArray(item.genres)) {
        return false;
      }
      
      return selectedGenres.some((genre) =>
        item.genres?.includes(genre)
      );
    }).slice(0, 20);
  }, [items, selectedGenres]);

  return (
    <>
      {allGenres.length > 0 && (
        <FilterPanel
          genres={allGenres}
          selectedGenres={selectedGenres}
          onGenresChange={setSelectedGenres}
          section="books"
        />
      )}

      <div className="space-y-4">
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredItems.map((item) => (
              <MediaCard key={item.id} media={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              {items.length === 0
                ? 'No trending books available.'
                : 'No books match your filter selections.'}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
