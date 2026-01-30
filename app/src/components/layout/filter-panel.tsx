'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

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
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="gap-2">
          <span>Filter by Genre</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <span>Filter by Genre</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Genres</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {genres.length > 0 ? (
            <>
              {genres.slice(0, 15).map((genre) => (
                <DropdownMenuCheckboxItem
                  key={genre}
                  checked={selectedGenres.includes(genre)}
                  onCheckedChange={() => handleGenreToggle(genre)}
                >
                  {genre}
                </DropdownMenuCheckboxItem>
              ))}
              {genres.length > 15 && (
                <DropdownMenuCheckboxItem disabled>
                  +{genres.length - 15} more
                </DropdownMenuCheckboxItem>
              )}
            </>
          ) : (
            <DropdownMenuItem disabled>No genres available</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-8 px-2 text-xs"
        >
          Clear filters
        </Button>
      )}

      {selectedGenres.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {selectedGenres.map((genre) => (
            <Badge
              key={genre}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => handleGenreToggle(genre)}
            >
              {genre}
              <span className="ml-1 text-xs">✕</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
