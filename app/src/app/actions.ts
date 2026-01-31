"use server";

import { revalidatePath } from "next/cache";
import { getMediaAvailability, searchMedia, discoverByGenre, discoverBooksBySubject } from "@/lib/media-api";
import type { ContentAvailabilityInput, ContentAvailabilityOutput, MediaItem, MediaStatus, MediaType, Stats } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";


export async function checkAvailabilityAction(input: ContentAvailabilityInput): Promise<ContentAvailabilityOutput> {
  try {
    const result = await getMediaAvailability(input);
    return result;
  } catch (error) {
    console.error("Error checking availability:", error);
    return { availability: [] };
  }
}

export async function searchMediaAction(query: string, mediaType: MediaType | 'all', page: number = 1): Promise<MediaItem[]> {
    const results = await searchMedia(query, mediaType, page);
    return enrichWithFavouriteStatus(results);
}

export async function discoverByGenreAction(genres: string[], mediaType: 'movie' | 'tv' | 'all', page: number = 1): Promise<MediaItem[]> {
    const results = await discoverByGenre(genres, mediaType, page);
    return enrichWithFavouriteStatus(results);
}

export async function discoverBooksBySubjectAction(genres: string[], page: number = 1, yearRange: string = 'any'): Promise<MediaItem[]> {
    const results = await discoverBooksBySubject(genres, page, yearRange);
    return enrichWithFavouriteStatus(results);
}

// Helper to enrich media items with user's favourite status
async function enrichWithFavouriteStatus(items: MediaItem[]): Promise<MediaItem[]> {
    if (items.length === 0) return items;
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return items;
    
    const mediaIds = items.map(item => item.id);
    const { data: userMediaData } = await supabase
        .from('user_media')
        .select('media_id, is_favourite')
        .eq('user_id', user.id)
        .in('media_id', mediaIds);
    
    if (!userMediaData || userMediaData.length === 0) return items;
    
    const favouriteMap = new Map(
        userMediaData.map(um => [um.media_id, um.is_favourite])
    );
    
    return items.map(item => ({
        ...item,
        isFavourite: favouriteMap.get(item.id) || false
    }));
}

// Enhanced manageUserLibraryAction with detailed logging
// Add this to your actions.ts file or replace the existing function

export async function manageUserLibraryAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  console.log('🔐 User:', user?.id);

  if (!user) {
    console.error('❌ No user logged in');
    return { error: "You must be logged in." };
  }

  const mediaId = formData.get("mediaId") as string;
  const mediaType = formData.get("mediaType") as MediaType;
  const title = formData.get("title") as string;
  const coverImage = formData.get("coverImage") as string;
  const authorOrDirector = formData.get("authorOrDirector") as string;
  const year = Number(formData.get("year"));
  const genres = formData.getAll("genres") as string[];
  const episodeRuntime = formData.get("episodeRuntime") ? Number(formData.get("episodeRuntime")) : null;
  const totalEpisodes = formData.get("totalEpisodes") ? Number(formData.get("totalEpisodes")) : null;
  const numberOfSeasons = formData.get("numberOfSeasons") ? Number(formData.get("numberOfSeasons")) : null;
  const episodesPerSeasonStr = formData.get("episodesPerSeason") as string | null;
  const episodesPerSeason = episodesPerSeasonStr ? JSON.parse(episodesPerSeasonStr) : null;

  const status = formData.get("status") as MediaStatus | null;
  const rating = formData.get("rating") ? Number(formData.get("rating")) : null;
  const isFavourite = formData.get("isFavourite") ? formData.get("isFavourite") === 'true' : null;
  const currentEpisode = formData.get("currentEpisode") ? Number(formData.get("currentEpisode")) : null;
  const currentSeason = formData.get("currentSeason") ? Number(formData.get("currentSeason")) : null;
  const currentPage = formData.get("currentPage") ? Number(formData.get("currentPage")) : null;
  const totalPages = formData.get("totalPages") ? Number(formData.get("totalPages")) : null;

  console.log('📊 Form data received:', {
    mediaId,
    mediaType,
    title,
    status,
    rating,
    isFavourite,
    currentEpisode,
    currentSeason,
    currentPage,
    totalPages,
    genres
  });

  // Upsert the media item details into the media_items table first
  console.log('💾 Upserting media item...');
  const { error: mediaItemError } = await supabase
    .from('media_items')
    .upsert({
        id: mediaId,
        type: mediaType,
        title,
        cover_image: coverImage,
        author_or_director: authorOrDirector,
        year,
        genres,
        runtime: mediaType === 'movie' ? episodeRuntime : null,
        episode_runtime: mediaType === 'tv' ? episodeRuntime : null,
        number_of_episodes: mediaType === 'tv' ? totalEpisodes : null,
        number_of_seasons: mediaType === 'tv' ? numberOfSeasons : null,
        episodes_per_season: mediaType === 'tv' ? episodesPerSeason : null,
        total_pages: mediaType === 'book' ? totalPages : null,
    }, { onConflict: 'id' });

  if (mediaItemError) {
      console.error("❌ Error upserting media item:", mediaItemError);
      return { error: "Failed to save media details." };
  }
  console.log('✅ Media item upserted successfully');
  
  // Check for existing entry
  console.log('🔍 Checking for existing user_media entry...');
  const { data: existingEntry, error: fetchError } = await supabase
    .from('user_media')
    .select('id, completed_at, status, rating, is_wishlisted')
    .eq('user_id', user.id)
    .eq('media_id', mediaId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('❌ Error fetching library entry:', fetchError);
    return { error: 'Database error.' };
  }

  console.log('📋 Existing entry:', existingEntry);

  const updates: any = {};
  if (status) updates.status = status;
  if (rating !== null && rating > 0 && (status || existingEntry?.status)) {
    // Only save rating if there's a status (either new or existing)
    updates.rating = rating;
  }
  if (isFavourite !== null) updates.is_favourite = isFavourite;
  if (currentEpisode !== null && mediaType === 'tv') updates.current_episode = currentEpisode;
  if (currentSeason !== null && mediaType === 'tv') updates.current_season = currentSeason;
  if (currentPage !== null && mediaType === 'book') updates.current_page = currentPage;
  if (status === 'completed' && !existingEntry?.completed_at) {
    updates.completed_at = new Date().toISOString();
  }

  console.log('📝 Updates to apply:', updates);

  // Only proceed if there are meaningful updates or if entry exists
  if (Object.keys(updates).length === 0 && !existingEntry) {
    console.log('⏭️ No meaningful updates, skipping...');
    return { success: true };
  }

  // If there's an existing entry, UPDATE it. Otherwise, INSERT a new one (only if we have a status or other required field).
  if (existingEntry) {
    console.log('🔄 Updating existing entry...');
    const { error: updateError } = await supabase
      .from('user_media')
      .update(updates)
      .eq('id', existingEntry.id);

    if (updateError) {
      console.error("❌ Update error:", updateError);
      return { error: "Failed to update your library." };
    }
    console.log('✅ User media updated successfully');
  } else if (updates.status || updates.is_favourite) {
    // Create a new entry if we have a status OR are setting favourite
    console.log('➕ Creating new entry...');
    const { error: insertError, data: insertData } = await supabase
      .from('user_media')
      .insert({
        user_id: user.id,
        media_id: mediaId,
        ...updates
      })
      .select();

    if (insertError) {
      console.error("❌ Insert error:", insertError);
      return { error: "Failed to add to your library." };
    }
    console.log('✅ User media inserted successfully:', insertData);
  }

  revalidatePath(`/media/${mediaId}`);
  revalidatePath('/stats');
  revalidatePath('/list');
  
  return { success: true };
}

export async function createCustomListAction(listName: string, emoji?: string, description?: string, isPublic?: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('❌ No user logged in');
    return { error: "You must be logged in." };
  }

  if (!listName.trim()) {
    return { error: "List name cannot be empty." };
  }

  console.log('📝 Creating custom list:', listName, 'emoji:', emoji, 'isPublic:', isPublic);
  
  const { data, error } = await supabase
    .from('custom_lists')
    .insert({
      user_id: user.id,
      name: listName.trim(),
      emoji: emoji || null,
      description: description || null,
      is_public: isPublic || false,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating list:', error);
    if (error.code === '23505') {
      return { error: "A list with this name already exists." };
    }
    return { error: "Failed to create list." };
  }

  console.log('✅ List created successfully:', data);
  revalidatePath('/media');
  revalidatePath('/list');
  
  return { success: true, listId: data.id };
}

export async function getUserCustomLists() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('custom_lists')
    .select('id, name, emoji, description, is_public, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error fetching custom lists:', error);
    return [];
  }

  return data || [];
}

export async function updateCustomListAction(
  listId: string, 
  name: string, 
  description?: string,
  emoji?: string,
  isPublic?: boolean
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const updates: any = { name };
  if (description !== undefined) {
    updates.description = description;
  }
  if (emoji !== undefined) {
    updates.emoji = emoji;
  }
  if (isPublic !== undefined) {
    updates.is_public = isPublic;
  }

  const { error } = await supabase
    .from('custom_lists')
    .update(updates)
    .eq('id', listId)
    .eq('user_id', user.id);

  if (error) {
    console.error('❌ Error updating list:', error);
    return { error: "Failed to update list." };
  }

  revalidatePath('/list');
  return { success: true };
}

export async function deleteCustomListAction(listId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const { error } = await supabase
    .from('custom_lists')
    .delete()
    .eq('id', listId)
    .eq('user_id', user.id);

  if (error) {
    console.error('❌ Error deleting list:', error);
    return { error: "Failed to delete list." };
  }

  revalidatePath('/list');
  return { success: true };
}

export async function getUserPublicCollections(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('custom_lists')
    .select('id, name, emoji, description, is_public, created_at, user_id')
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching public collections:', error);
    return [];
  }

  return data || [];
}

export async function getCollectionItemsAction(collectionId: string) {
  const supabase = await createClient();

  console.log('📦 Fetching items for collection:', collectionId);

  const { data, error } = await supabase
    .from('user_media_custom_lists')
    .select(`
      id,
      custom_list_id,
      media_id,
      media_items:media_id(id, title, type, cover_image, author_or_director, year, description, genres)
    `)
    .eq('custom_list_id', collectionId);

  console.log('📦 Items fetch result:', { error, dataCount: data?.length });

  if (error) {
    console.error('❌ Error fetching collection items:', error);
    return [];
  }

  if (!data || data.length === 0) {
    console.log('📭 No items in collection');
    return [];
  }

  return data.map((item: any) => {
    const mediaItem = Array.isArray(item.media_items) ? item.media_items[0] : item.media_items;
    return {
      id: mediaItem?.id || item.media_id,
      title: mediaItem?.title || 'Unknown',
      type: mediaItem?.type || 'book',
      coverImage: mediaItem?.cover_image,
      authorOrDirector: mediaItem?.author_or_director,
      year: mediaItem?.year,
      description: mediaItem?.description,
      genres: mediaItem?.genres || [],
    };
  });
}

export async function addMediaToListAction(mediaId: string, listId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const { error } = await supabase
    .from('user_media_custom_lists')
    .insert({
      user_id: user.id,
      media_id: mediaId,
      custom_list_id: listId,
    });

  if (error) {
    console.error('❌ Error adding media to list:', error);
    if (error.code === '23505') {
      // Media is already in this list - this is not an error, just silently succeed
      console.log('ℹ️ Media already in list, skipping');
      revalidatePath('/media');
      revalidatePath('/list');
      return { success: true };
    }
    return { error: "Failed to add media to list." };
  }

  revalidatePath('/media');
  revalidatePath('/list');
  return { success: true };
}

export async function removeMediaFromListAction(mediaId: string, listId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const { error } = await supabase
    .from('user_media_custom_lists')
    .delete()
    .eq('custom_list_id', listId)
    .eq('media_id', mediaId)
    .eq('user_id', user.id);

  if (error) {
    console.error('❌ Error removing media from list:', error);
    return { error: "Failed to remove media from list." };
  }

  revalidatePath('/media');
  revalidatePath('/list');
  return { success: true };
}

export async function getListItemsAction(listId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { items: [], list: null };
  }

  console.log('📦 getListItemsAction - listId:', listId);

  // Get the list
  const { data: list } = await supabase
    .from('custom_lists')
    .select('*')
    .eq('id', listId)
    .eq('user_id', user.id)
    .single();

  console.log('📦 List found:', list);

  // Get items in the list - first get the junction records
  const { data: junctionData, error: junctionError } = await supabase
    .from('user_media_custom_lists')
    .select('media_id')
    .eq('custom_list_id', listId)
    .eq('user_id', user.id);

  console.log('📦 Junction records:', { junctionData, junctionError });

  let items: any[] = [];

  if (junctionData && junctionData.length > 0) {
    const mediaIds = junctionData.map(j => j.media_id);
    
    // Now fetch the media items
    const { data: mediaData, error: mediaError } = await supabase
      .from('media_items')
      .select('*')
      .in('id', mediaIds);

    console.log('📦 Media items result:', { mediaData, mediaError });

    // Fetch favourite status for all these media items
    const { data: userMediaData } = await supabase
      .from('user_media')
      .select('media_id, is_favourite')
      .eq('user_id', user.id)
      .in('media_id', mediaIds);

    const favouriteMap = new Map(
      (userMediaData || []).map(um => [um.media_id, um.is_favourite])
    );

    items = mediaData?.map((item: any) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      coverImage: item.cover_image,
      authorOrDirector: item.author_or_director,
      year: item.year,
      isFavourite: favouriteMap.get(item.id) || false,
      description: '',
      genres: item.genres || [],
    })) || [];
  }

  console.log('📦 Mapped items:', items);

  return { items, list };
}

export async function getUserStats(): Promise<Stats> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const emptyStats: Stats = {
    totalCompleted: 0,
    averageRating: 0,
    genreDistribution: [],
    completedOverTime: Array(12).fill(0).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (11 - i));
        return { name: d.toLocaleString('default', { month: 'short' }), total: 0 };
    }),
    totalWatchHours: 0,
    totalWatchMinutes: 0,
    watchHoursByMonth: [],
    movieStats: { completed: 0, watchHours: 0, avgRating: 0 },
    tvStats: { completed: 0, watchHours: 0, episodesWatched: 0, avgRating: 0 },
    bookStats: { completed: 0, pagesRead: 0, avgRating: 0 },
  };

  if (!user) {
    return emptyStats;
  }

  try {
    // Fetch ALL items from user_media table (for activity chart with all statuses)
    const { data: allItemsData, error: allItemsError } = await supabase
      .from('user_media')
      .select(`
        *,
        media_items:media_id(*)
      `)
      .eq('user_id', user.id);

    // Fetch ALL completed items from user_media table joined with media_items
    const { data: completedData, error: completedError } = await supabase
      .from('user_media')
      .select(`
        *,
        media_items:media_id(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed');

    // Also fetch reading/watching items for books and TV shows
    const { data: readingWatchingData, error: readingError } = await supabase
      .from('user_media')
      .select(`
        *,
        media_items:media_id(*)
      `)
      .eq('user_id', user.id)
      .in('status', ['reading', 'watching']);

    console.log('📊 All items query - error:', allItemsError, 'count:', allItemsData?.length);
    console.log('📊 Completed media query - error:', completedError, 'count:', completedData?.length);
    console.log('📊 Reading/watching query - error:', readingError, 'count:', readingWatchingData?.length);

    const allItems = allItemsData || [];
    const completed = completedData || [];
    const readingWatching = readingWatchingData || [];
    
    // Separate by media type (for completed items)
    const completedBooks = completed.filter((item: any) => item.media_items?.type === 'book');
    const completedMovies = completed.filter((item: any) => item.media_items?.type === 'movie');
    const completedShows = completed.filter((item: any) => item.media_items?.type === 'tv');
    
    // Separate ALL items by media type (for activity charts with all statuses)
    const allBooks = allItems.filter((item: any) => item.media_items?.type === 'book');
    const allMovies = allItems.filter((item: any) => item.media_items?.type === 'movie');
    const allShows = allItems.filter((item: any) => item.media_items?.type === 'tv');
    
    const readingBooks = readingWatching.filter((item: any) => item.media_items?.type === 'book' && item.status === 'reading');
    const watchingShows = readingWatching.filter((item: any) => item.media_items?.type === 'tv' && item.status === 'watching');

    console.log('📊 Separated - completed books:', completedBooks.length, 'movies:', completedMovies.length, 'shows:', completedShows.length);
    console.log('📊 All items by type - books:', allBooks.length, 'movies:', allMovies.length, 'shows:', allShows.length);
    console.log('📊 Reading/watching - reading books:', readingBooks.length, 'watching shows:', watchingShows.length);

    // Total completed
    const totalCompleted = completed.length;

    // Average ratings - only from completed items
    const bookRatings = completedBooks.filter(b => b.rating && b.rating > 0).map(b => b.rating);
    const movieRatings = completedMovies.filter(m => m.rating && m.rating > 0).map(m => m.rating);
    const showRatings = completedShows.filter(s => s.rating && s.rating > 0).map(s => s.rating);
    const allRatings = [...bookRatings, ...movieRatings, ...showRatings];
    
    const averageRating = allRatings.length > 0
      ? parseFloat((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1))
      : 0;

    // Genre distribution - from media_items genres field (only completed)
    const genreCounts = new Map<string, number>();
    completed.forEach((item: any) => {
      if (item.media_items?.genres) {
        let genreList: string[] = [];
        const genres = item.media_items.genres;
        
        // Handle both array and comma-separated string formats
        if (Array.isArray(genres)) {
          genreList = genres;
        } else if (typeof genres === 'string') {
          // Split by comma if it's a string
          genreList = genres.split(',').map((g: string) => g.trim()).filter((g: string) => g.length > 0);
        }
        
        genreList.forEach((g: string) => {
          const genre = g.trim ? g.trim() : g;
          if (genre) genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
        });
      }
    });
    const genreDistribution = [...genreCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    // Book stats - use actual total_pages from media_items for completed books
    // + current_page for reading books
    let totalBookPages = 0;
    let totalBookLength = 0; // Sum of all book page counts (not averaged)
    
    completedBooks.forEach((b: any) => {
      const bookPages = b.media_items?.total_pages || 0;
      totalBookPages += bookPages;
      totalBookLength += bookPages;
    });
    readingBooks.forEach((b: any) => {
      const bookPages = b.media_items?.total_pages || 0;
      totalBookPages += b.current_page || 0;
      totalBookLength += bookPages;
    });
    
    const bookStats = {
      completed: completedBooks.length,
      pagesRead: totalBookPages,
      avgRating: bookRatings.length > 0
        ? parseFloat((bookRatings.reduce((a, b) => a + b, 0) / bookRatings.length).toFixed(1))
        : 0,
      avgBookLength: totalBookLength, // Total pages from all books (not averaged)
    };

    // Movie stats - use actual runtime from media_items for each movie
    let totalMovieMinutes = 0;
    completedMovies.forEach((m: any) => {
      totalMovieMinutes += m.media_items?.runtime || 120;
    });
    const movieStats = {
      completed: completedMovies.length,
      watchHours: Math.round(totalMovieMinutes / 60),
      avgRating: movieRatings.length > 0
        ? parseFloat((movieRatings.reduce((a, b) => a + b, 0) / movieRatings.length).toFixed(1))
        : 0,
    };

    // TV stats - use actual episode_runtime and episode counts
    let totalTVMinutes = 0;
    let totalEpisodesWatched = 0;
    
    completedShows.forEach((show: any) => {
      const episodeRuntime = show.media_items?.episode_runtime || 45;
      const totalEpisodes = show.media_items?.number_of_episodes || 100;
      totalTVMinutes += totalEpisodes * episodeRuntime;
      totalEpisodesWatched += totalEpisodes;
    });
    
    watchingShows.forEach((show: any) => {
      const episodeRuntime = show.media_items?.episode_runtime || 45;
      // For watching shows, estimate episodes watched from current season/episode
      const currentSeason = show.current_season || 1;
      const currentEpisode = show.current_episode || 1;
      const episodesPerSeason = show.media_items?.episodes_per_season || {};
      
      let episodesWatched = 0;
      for (let s = 1; s < currentSeason; s++) {
        episodesWatched += episodesPerSeason[s] || 10;
      }
      episodesWatched += currentEpisode;
      
      totalTVMinutes += episodesWatched * episodeRuntime;
      totalEpisodesWatched += episodesWatched;
    });
    
    const tvStats = {
      completed: completedShows.length,
      watchHours: Math.round(totalTVMinutes / 60),
      episodesWatched: totalEpisodesWatched,
      avgRating: showRatings.length > 0
        ? parseFloat((showRatings.reduce((a, b) => a + b, 0) / showRatings.length).toFixed(1))
        : 0,
    };

    const totalWatchHours = movieStats.watchHours + tvStats.watchHours;

    // Helper function to calculate genre distribution for a specific media type
    const getGenreDistribution = (items: any[]) => {
      const genreCounts = new Map<string, number>();
      items.forEach((item: any) => {
        if (item.media_items?.genres) {
          let genreList: string[] = [];
          const genres = item.media_items.genres;
          
          // Handle both array and comma-separated string formats
          if (Array.isArray(genres)) {
            genreList = genres;
          } else if (typeof genres === 'string') {
            // Split by comma if it's a string
            genreList = genres.split(',').map((g: string) => g.trim()).filter((g: string) => g.length > 0);
          }
          
          genreList.forEach((g: string) => {
            const genre = g.trim ? g.trim() : g;
            if (genre) genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
          });
        }
      });
      return [...genreCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));
    };

    // Helper function to calculate activity over time with status breakdown
    const getActivityOverTimeWithStatus = (items: any[]) => {
      const template: any[] = Array(12).fill(0).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (11 - i));
        return { 
          name: d.toLocaleString('default', { month: 'short' }), 
          total: 0,
          completed: 0,
          watching: 0,
          plan_to_watch: 0,
          on_hold: 0,
          dropped: 0,
        };
      });
      
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

      items.forEach((item: any) => {
        const dateField = item.created_at;
        if (dateField) {
          const date = new Date(dateField);
          if (date >= oneYearAgo) {
            const month = date.toLocaleString('default', { month: 'short' });
            const entry = template.find(e => e.name === month);
            if (entry) {
              entry.total = (entry.total || 0) + 1;
              const status = item.status || 'plan_to_watch';
              entry[status] = (entry[status] || 0) + 1;
            }
          }
        }
      });
      return template;
    };

    // Helper function to calculate activity for completed items only (for filtered views)
    const getActivityByType = (items: any[]) => {
      const template = Array(12).fill(0).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (11 - i));
        return { name: d.toLocaleString('default', { month: 'short' }), total: 0, completed: 0 };
      });
      
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

      items.forEach((item: any) => {
        const dateField = item.created_at;
        if (dateField) {
          const date = new Date(dateField);
          if (date >= oneYearAgo) {
            const month = date.toLocaleString('default', { month: 'short' });
            const entry = template.find(e => e.name === month);
            if (entry) {
              entry.total = (entry.total || 0) + 1;
              entry.completed = (entry.completed || 0) + 1;
            }
          }
        }
      });
      return template;
    };

    // Genre distributions by type
    const allGenres = getGenreDistribution(completed);
    const movieGenres = getGenreDistribution(completedMovies);
    const bookGenres = getGenreDistribution(completedBooks);
    const tvGenres = getGenreDistribution(completedShows);

    // Activity over time by type - use ALL items for each tab so it shows all statuses
    const allActivity = getActivityOverTimeWithStatus(allItems);
    const movieActivity = getActivityOverTimeWithStatus(allMovies);
    const bookActivity = getActivityOverTimeWithStatus(allBooks);
    const tvActivity = getActivityOverTimeWithStatus(allShows);

    return {
      totalCompleted,
      averageRating,
      genreDistribution: allGenres,
      completedOverTime: allActivity,
      totalWatchHours,
      totalWatchMinutes: 0,
      watchHoursByMonth: [],
      movieStats: {
        ...movieStats,
        genreDistribution: movieGenres,
        activityOverTime: movieActivity,
      },
      tvStats: {
        ...tvStats,
        genreDistribution: tvGenres,
        activityOverTime: tvActivity,
      },
      bookStats: {
        ...bookStats,
        genreDistribution: bookGenres,
        activityOverTime: bookActivity,
      },
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    return emptyStats;
  }
}


export async function updateUserProfileAction(
  prevState: { message: string; error?: string } | undefined,
  formData: FormData
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { message: "", error: "You must be logged in to update your profile." };
  }

  const username = formData.get("username") as string;
  const display_name = formData.get("display_name") as string;
  const bio = formData.get("bio") as string;
  const profile_picture_url = formData.get("profile_picture_url") as string;
  const banner_url = formData.get("banner_url") as string;

  // Validate username
  if (!username || username.trim().length < 2) {
    return { message: "", error: "Username must be at least 2 characters." };
  }

  try {
    // Check if user already has a profile and if they can change username
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("username, last_username_change")
      .eq("id", user.id)
      .single();

    if (existingProfile) {
      // Username is being changed
      if (existingProfile.username !== username.toLowerCase()) {
        // Check cooldown (5 days = 432000000 milliseconds)
        if (existingProfile.last_username_change) {
          const lastChange = new Date(existingProfile.last_username_change).getTime();
          const now = Date.now();
          const daysSinceChange = (now - lastChange) / (1000 * 60 * 60 * 24);
          
          if (daysSinceChange < 5) {
            const daysRemaining = (5 - daysSinceChange).toFixed(1);
            return { 
              message: "", 
              error: `You can change your username again in ${daysRemaining} days` 
            };
          }
        }
      }
    }

    // Update user_profiles table
    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        id: user.id,
        username: username.toLowerCase(),
        display_name: display_name || null,
        bio: bio || null,
        profile_picture_url: profile_picture_url || null,
        banner_url: banner_url || null,
        is_public: true,
        last_username_change: existingProfile && existingProfile.username !== username.toLowerCase() 
          ? new Date().toISOString() 
          : existingProfile?.last_username_change || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Profile update error:", profileError);
      return { message: "", error: `Failed to update profile: ${profileError.message}` };
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath(`/profile/${username}`);
    return { message: "Profile updated successfully!", error: undefined };
  } catch (error: any) {
    console.error("Profile update error:", error);
    return { message: "", error: error.message || "Failed to update profile." };
  }
}

export async function getMediaListsAction(mediaId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('user_media_custom_lists')
    .select('custom_list_id')
    .eq('media_id', mediaId)
    .eq('user_id', user.id);

  if (error) {
    console.error('❌ Error fetching media lists:', error);
    return [];
  }

  return data ? data.map(d => d.custom_list_id) : [];
}

export async function changePasswordAction(
  prevState: { message: string; error?: string } | undefined,
  formData: FormData
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { message: "", error: "You must be logged in to change your password." };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { message: "", error: "All fields are required." };
  }

  if (newPassword !== confirmPassword) {
    return { message: "", error: "New passwords do not match." };
  }

  if (newPassword.length < 6) {
    return { message: "", error: "Password must be at least 6 characters long." };
  }

  // Verify current password by attempting to re-authenticate
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });

  if (signInError) {
    console.error("❌ Current password verification failed:", signInError);
    return { message: "", error: "Current password is incorrect." };
  }

  // Current password is correct, now update to new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error("❌ Password change error:", updateError);
    return { message: "", error: updateError.message || "Failed to change password." };
  }

  return { message: "Password changed successfully!", error: undefined };
}

// PROFILE ACTIONS - Get user profile
export async function getUserProfileAction(username: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  if (error) {
    console.error("Profile fetch error:", error);
    return null;
  }

  return data;
}

// REVIEW ACTIONS
export async function createReviewAction(mediaId: string, rating: number, text: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Not authenticated" };

  const { error, data } = await supabase
    .from('reviews')
    .upsert({
      user_id: user.id,
      media_id: mediaId,
      rating,
      text,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,media_id' })
    .select()
    .single();

  if (error) {
    console.error("Review creation error:", error);
    return { error: error.message };
  }

  return { success: true, review: data };
}

export async function deleteReviewAction(reviewId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', user.id);

  if (error) {
    console.error("Review delete error:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function getMediaReviewsAction(mediaId: string) {
  const supabase = await createClient();

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('id, user_id, rating, text, created_at, updated_at')
    .eq('media_id', mediaId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Reviews fetch error:", error);
    return [];
  }

  // Enrich with user profiles and like counts
  const enrichedReviews = await Promise.all(
    reviews.map(async (review) => {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('username, display_name, profile_picture_url')
        .eq('id', review.user_id)
        .single();

      const { count: likeCount } = await supabase
        .from('review_likes')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', review.id);

      return {
        ...review,
        user: profile,
        likeCount: likeCount || 0,
      };
    })
  );

  return enrichedReviews;
}

export async function likeReviewAction(reviewId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from('review_likes')
    .insert({
      user_id: user.id,
      review_id: reviewId,
    });

  if (error?.code === 'P0001' || error?.message?.includes('unique')) {
    // Already liked, try to delete
    const { error: deleteError } = await supabase
      .from('review_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('review_id', reviewId);

    if (deleteError) return { error: deleteError.message };
    return { success: true, liked: false };
  }

  if (error) {
    console.error("Like error:", error);
    return { error: error.message };
  }

  return { success: true, liked: true };
}

// REVIEW COMMENTS ACTIONS
export async function createCommentAction(reviewId: string, text: string, parentCommentId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Not authenticated" };

  const { error, data } = await supabase
    .from('review_comments')
    .insert({
      user_id: user.id,
      review_id: reviewId,
      text,
      parent_comment_id: parentCommentId || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Comment creation error:", error);
    return { error: error.message };
  }

  return { success: true, comment: data };
}

export async function getReviewCommentsAction(reviewId: string) {
  const supabase = await createClient();

  console.log('🔍 Fetching comments for review:', reviewId);

  const { data: comments, error } = await supabase
    .from('review_comments')
    .select('id, user_id, text, created_at, updated_at, parent_comment_id, review_id')
    .eq('review_id', reviewId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Comments fetch error:", error);
    return [];
  }

  console.log('📋 Raw comments fetched:', comments);

  // Enrich with user profiles and like counts
  const enrichedComments = await Promise.all(
    comments.map(async (comment) => {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('username, display_name, profile_picture_url')
        .eq('id', comment.user_id)
        .single();

      const { count: likeCount } = await supabase
        .from('comment_likes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', comment.id);

      return {
        ...comment,
        user: profile,
        likeCount: likeCount || 0,
      };
    })
  );

  console.log('✅ Enriched comments:', enrichedComments);

  // Organize comments into parent-reply structure
  const parentComments = enrichedComments.filter(c => !c.parent_comment_id);
  const replies = enrichedComments.filter(c => c.parent_comment_id);

  const commentsWithReplies = parentComments.map(parent => ({
    ...parent,
    replies: replies.filter(reply => reply.parent_comment_id === parent.id),
  }));

  console.log('🎯 Final comments with replies:', commentsWithReplies);
  return commentsWithReplies;
}

export async function deleteCommentAction(commentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from('review_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id);

  if (error) {
    console.error("Comment delete error:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function likeCommentAction(commentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from('comment_likes')
    .insert({
      user_id: user.id,
      comment_id: commentId,
    });

  if (error?.code === 'P0001' || error?.message?.includes('unique')) {
    // Already liked, try to delete
    const { error: deleteError } = await supabase
      .from('comment_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('comment_id', commentId);

    if (deleteError) return { error: deleteError.message };
    return { success: true, liked: false };
  }

  if (error) {
    console.error("Like error:", error);
    return { error: error.message };
  }

  return { success: true, liked: true };
}

// FOLLOW ACTIONS
export async function followUserAction(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Not authenticated" };
  if (user.id === targetUserId) return { error: "Cannot follow yourself" };

  const { error } = await supabase
    .from('user_follows')
    .insert({
      follower_id: user.id,
      following_id: targetUserId,
    });

  if (error?.code === 'P0001' || error?.message?.includes('unique')) {
    // Already following, try to delete
    const { error: deleteError } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId);

    if (deleteError) return { error: deleteError.message };
    return { success: true, following: false };
  }

  if (error) {
    console.error("Follow error:", error);
    return { error: error.message };
  }

  return { success: true, following: true };
}

export async function getUserStatsAction(userId: string) {
  const supabase = await createClient();

  // Get review count and average rating
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('user_id', userId);

  const reviewCount = reviews?.length || 0;
  const avgRating = reviews && reviews.length > 0
    ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : 0;

  // Get total watch time - count items and estimate based on type
  const { data: userMedia } = await supabase
    .from('user_media')
    .select('media_type')
    .eq('user_id', userId)
    .eq('status', 'completed');

  // Rough estimate: movies ~2.5 hours, TV episodes ~45 min, books ~6 hours
  let totalHours = 0;
  if (userMedia) {
    for (const media of userMedia) {
      if (media.media_type === 'movie') {
        totalHours += 2.5;
      } else if (media.media_type === 'tv') {
        totalHours += 0.75; // One episode average
      } else if (media.media_type === 'book') {
        totalHours += 6;
      }
    }
  }
  totalHours = Math.round(totalHours);

  // Get follower count
  const { count: followerCount } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  // Get following count
  const { count: followingCount } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  return {
    reviewCount,
    avgRating,
    totalHours,
    followerCount: followerCount || 0,
    followingCount: followingCount || 0,
  };
}

