import { MediaCard } from "@/components/media/media-card";
import type { MediaItem } from "@/lib/types";
import { getTrendingMovies, getTrendingShows, getTrendingBooks } from "@/lib/media-api";
import { createClient } from "@/utils/supabase/server";
import { DashboardContent } from "./content";

// Cache dashboard for 1 hour, revalidate in background
export const revalidate = 3600;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch trending data in parallel (with caching at API level)
  const [trendingMovies, trendingShows, trendingBooks] = await Promise.all([
    getTrendingMovies(),
    getTrendingShows(),
    getTrendingBooks(),
  ]);

  // Only fetch user's data if logged in
  let userBooks: any[] = [];
  let userMovies: any[] = [];
  let userShows: any[] = [];

  if (user) {
    try {
      const [books, movies, shows] = await Promise.all([
        supabase.from('Book').select('id').eq('userId', user.id).limit(100),
        supabase.from('Movie').select('id').eq('userId', user.id).limit(100),
        supabase.from('TVShow').select('id').eq('userId', user.id).limit(100),
      ]);

      userBooks = books.data || [];
      userMovies = movies.data || [];
      userShows = shows.data || [];
    } catch (error) {
      console.error('Failed to fetch user media:', error);
    }
  }

  // Create maps for quick lookup
  const userBookIds = new Set(userBooks.map((b: any) => b.id));
  const userMovieIds = new Set(userMovies.map((m: any) => m.id));
  const userShowIds = new Set(userShows.map((s: any) => s.id));

  // Add favourite status to trending items
  const trendingMoviesWithStatus = trendingMovies.map((item) => ({
    ...item,
    isFavourite: userMovieIds.has(item.id) || false
  }));

  const trendingShowsWithStatus = trendingShows.map((item) => ({
    ...item,
    isFavourite: userShowIds.has(item.id) || false
  }));

  const trendingBooksWithStatus = trendingBooks.map((item) => ({
    ...item,
    isFavourite: userBookIds.has(item.id) || false
  }));

  const userName = user?.email?.split('@')[0] || 'User';

  return (
    <DashboardContent
      userName={userName}
      trendingMovies={trendingMoviesWithStatus}
      trendingShows={trendingShowsWithStatus}
      trendingBooks={trendingBooksWithStatus}
    />
  );
}
