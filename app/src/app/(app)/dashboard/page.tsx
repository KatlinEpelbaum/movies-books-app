import { MediaCard } from "@/components/media/media-card";
import type { MediaItem } from "@/lib/types";
import { getTrendingMovies, getTrendingShows, getTrendingBooks } from "@/lib/media-api";
import { createClient } from "@/utils/supabase/server";
import { DashboardContent } from "./content";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Single database query to get both wishlist and favorites
  const dbUserMediaData = user ? await supabase
    .from('user_media')
    .select(`
      *,
      media_items:media_id(*)
    `)
    .eq('user_id', user.id) : { data: null };

  const [trendingMovies, trendingShows, trendingBooks] = await Promise.all([
    getTrendingMovies(),
    getTrendingShows(),
    getTrendingBooks(),
  ]);

  // Create a map of favourite items for quick lookup from single query
  const favouriteMap = new Map<string, boolean>();
  if (dbUserMediaData.data) {
    dbUserMediaData.data.forEach((item: any) => {
      if (item.is_favourite) {
        favouriteMap.set(item.media_id, true);
      }
    });
  }

  // Extract wishlist items from the same query
  const wishlistData = {
    data: dbUserMediaData.data?.filter((item: any) => item.status === 'plan_to_watch').slice(0, 5) || null
  };

  // Add favourite status to trending items
  const trendingMoviesWithStatus = trendingMovies.map((item) => ({
    ...item,
    isFavourite: favouriteMap.has(item.id) || false
  }));

  const trendingShowsWithStatus = trendingShows.map((item) => ({
    ...item,
    isFavourite: favouriteMap.has(item.id) || false
  }));

  const trendingBooksWithStatus = trendingBooks.map((item) => ({
    ...item,
    isFavourite: favouriteMap.has(item.id) || false
  }));

  const wishlistItems: MediaItem[] = wishlistData.data ? wishlistData.data.map((item: any) => ({
    id: item.media_items?.id || item.media_id,
    title: item.media_items?.title || 'Unknown',
    type: item.media_items?.type || 'book',
    coverImage: item.media_items?.cover_image,
    authorOrDirector: item.media_items?.author_or_director,
    year: item.media_items?.year,
    isFavourite: item.is_favourite || false,
    description: '',
    genres: item.media_items?.genres || [],
  })) : [];

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0];

  return (
    <DashboardContent
      userName={userName}
      trendingMovies={trendingMoviesWithStatus}
      trendingShows={trendingShowsWithStatus}
      trendingBooks={trendingBooksWithStatus}
    />
  );
}
