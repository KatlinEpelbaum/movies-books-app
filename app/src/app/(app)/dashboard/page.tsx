import { getTrendingMovies, getTrendingShows, getTrendingBooks } from "@/lib/media-api";
import { createClient } from "@/utils/supabase/server";
import { DashboardContent } from "./content";
import type { MediaItem } from "@/lib/types";

// Cache dashboard for 1 hour, revalidate in background
export const revalidate = 3600;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch trending data, user media, and profile in parallel
  const [trendingMovies, trendingShows, trendingBooks, dbUserMediaData, userProfile] = await Promise.all([
    getTrendingMovies(),
    getTrendingShows(),
    getTrendingBooks(),
    user 
      ? supabase
          .from('user_media')
          .select(`*, media_items:media_id(*)`)
          .eq('user_id', user.id)
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from('user_profiles')
          .select('display_name, username, banner_url, profile_picture_url')
          .eq('id', user.id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  // Extract active items (Currently Reading/Watching)
  const activeItems: MediaItem[] = dbUserMediaData.data 
    ? dbUserMediaData.data
        .filter((item: any) => item.status === 'watching' || item.status === 'reading')
        .map((item: any) => ({
          id: item.media_items?.id || item.media_id,
          title: item.media_items?.title || 'Unknown',
          type: item.media_items?.type || 'movie',
          coverImage: item.media_items?.cover_image,
          authorOrDirector: item.media_items?.author_or_director,
          year: item.media_items?.year,
          isFavourite: item.is_favourite || false,
          currentEpisode: item.current_episode,
          currentSeason: item.current_season,
          currentPage: item.current_page,
          totalPages: item.media_items?.total_pages,
          totalEpisodes: item.media_items?.total_episodes,
          description: '',
          genres: item.media_items?.genres || [],
        })) 
    : [];

  // Create map for quick favourite lookup
  const favouriteMap = new Map(
    dbUserMediaData.data?.filter((i: any) => i.is_favourite).map((i: any) => [i.media_id, true]) || []
  );

  // Add favourite status to trending items
  const trendingMoviesWithStatus = trendingMovies.map(i => ({ ...i, isFavourite: favouriteMap.has(i.id) }));
  const trendingShowsWithStatus = trendingShows.map(i => ({ ...i, isFavourite: favouriteMap.has(i.id) }));
  const trendingBooksWithStatus = trendingBooks.map(i => ({ ...i, isFavourite: favouriteMap.has(i.id) }));

  const userName = userProfile.data?.display_name 
    || userProfile.data?.username 
    || user?.user_metadata?.full_name 
    || user?.email?.split('@')[0] 
    || 'User';
  
  const bannerUrl = userProfile.data?.banner_url || null;
  const avatarUrl = userProfile.data?.profile_picture_url || user?.user_metadata?.avatar_url || null;

  return (
    <DashboardContent
      userName={userName}
      bannerUrl={bannerUrl}
      avatarUrl={avatarUrl}
      activeItems={activeItems}
      trendingMovies={trendingMoviesWithStatus}
      trendingShows={trendingShowsWithStatus}
      trendingBooks={trendingBooksWithStatus}
    />
  );
}