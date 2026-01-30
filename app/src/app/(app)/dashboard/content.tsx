'use client';

import { useState } from 'react';
import type { MediaItem } from "@/lib/types";
import { SearchBar } from "@/components/layout/search-bar";
import { TrendingSection } from "@/components/layout/trending-section";

interface DashboardContentProps {
  userName: string;
  trendingMovies: MediaItem[];
  trendingShows: MediaItem[];
  trendingBooks: MediaItem[];
}

export function DashboardContent({
  userName,
  trendingMovies,
  trendingShows,
  trendingBooks,
}: DashboardContentProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="font-headline text-3xl font-bold">
            Welcome back, {userName}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s popular right now.
          </p>
        </div>
        <SearchBar placeholder="Search movies, TV shows, books..." navigateToSearch={true} />
      </div>

      <TrendingSection
        title="Trending Movies"
        items={trendingMovies}
        section="movies"
      />

      <TrendingSection
        title="Trending TV Shows"
        items={trendingShows}
        section="shows"
      />

      <TrendingSection
        title="Trending Books"
        items={trendingBooks}
        section="books"
      />
    </div>
  );
}
