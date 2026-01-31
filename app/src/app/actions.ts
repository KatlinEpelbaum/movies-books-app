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

export async function createCustomListAction(listName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('❌ No user logged in');
    return { error: "You must be logged in." };
  }

  if (!listName.trim()) {
    return { error: "List name cannot be empty." };
  }

  console.log('📝 Creating custom list:', listName);
  
  const { data, error } = await supabase
    .from('custom_lists')
    .insert({
      user_id: user.id,
      name: listName.trim(),
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
    .select('id, name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error fetching custom lists:', error);
    return [];
  }

  return data || [];
}

export async function updateCustomListAction(listId: string, name: string, description?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const updates: any = { name };
  if (description !== undefined) {
    updates.description = description;
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
    console.log('📊 No user found, returning empty stats');
    return emptyStats;
  }

  // Fetch completed media
  const { data: completedMedia, error: completedError } = await supabase
    .from('user_media')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'completed');

  if (completedError) {
    console.error("❌ Error fetching completed media:", completedError);
    return emptyStats;
  }

  // Fetch currently watching media for partial watch hours and genre distribution
  const { data: watchingMedia, error: watchingError } = await supabase
    .from('user_media')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'watching');

  if (watchingError) {
    console.error("❌ Error fetching watching media:", watchingError);
  }

  // Fetch ALL user library entries for activity chart
  const { data: allLibraryEntries, error: allError } = await supabase
    .from('user_media')
    .select('*')
    .eq('user_id', user.id);

  if (allError) {
    console.error("❌ Error fetching all library entries:", allError);
  }

  const completedList = completedMedia || [];
  const watchingList = watchingMedia || [];
  const allEntries = allLibraryEntries || [];

  console.log('📊 Found completed media count:', completedList.length);
  console.log('📊 Found watching media count:', watchingList.length);
  console.log('📊 Found total library entries:', allEntries.length);
  
  if (allEntries.length > 0) {
    const statusCounts = new Map<string, number>();
    allEntries.forEach(entry => {
      const status = entry.status || 'unknown';
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    });
    console.log('📊 Status breakdown:', Object.fromEntries(statusCounts));
  }

  // Get media details for all media IDs
  const mediaIds = new Set([...completedList, ...watchingList].map(item => item.media_id));
  const { data: mediaItems, error: mediaError } = await supabase
    .from('media_items')
    .select('id, genres, type, runtime, episode_runtime, number_of_episodes, number_of_seasons, episodes_per_season')
    .in('id', Array.from(mediaIds));

  if (mediaError) {
    console.error("❌ Error fetching media items:", mediaError);
    return emptyStats;
  }

  const mediaMap = new Map(mediaItems?.map(item => [item.id, item]) || []);

  // Total Completed
  const totalCompleted = completedList.length;

  // Average Rating (only from completed items)
  const ratedMedia = completedList.filter(item => item.rating !== null && item.rating > 0);
  const avgRating = ratedMedia.length > 0
    ? ratedMedia.reduce((sum, item) => sum + item.rating, 0) / ratedMedia.length
    : 0;
  const averageRating = parseFloat(avgRating.toFixed(1));

  console.log('📊 Average rating:', averageRating, 'from', ratedMedia.length, 'rated items');

  // Genre Distribution (from completed + currently watching)
  const genreCounts = new Map<string, number>();
  [...completedList, ...watchingList].forEach(item => {
    const media = mediaMap.get(item.media_id);
    media?.genres?.forEach((genre: string) => {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
    });
  });
  const genreDistribution = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  console.log('📊 Genre distribution:', genreDistribution);

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  oneYearAgo.setDate(1);
  oneYearAgo.setHours(0,0,0,0);

  // Initialize activity tracking by status
  const completedOverTime = emptyStats.completedOverTime.map(m => ({
    ...m,
    completed: 0,
    watching: 0,
    plan_to_watch: 0,
    on_hold: 0,
    dropped: 0,
  }));
  const watchHoursByMonth = new Map<string, number>();
  
  let totalWatchMinutes = 0;

  // Stats by media type
  let movieWatchMinutes = 0;
  let movieCompletedCount = 0;
  let movieRatingSum = 0;
  let movieRatedCount = 0;

  let tvWatchMinutes = 0;
  let tvCompletedCount = 0;
  let tvEpisodesWatched = 0;
  let tvRatingSum = 0;
  let tvRatedCount = 0;

  let bookPagesRead = 0;
  let bookCompletedCount = 0;
  let bookRatingSum = 0;
  let bookRatedCount = 0;

  // Calculate watch hours from completed media
  completedList.forEach(item => {
    const media = mediaMap.get(item.media_id);
    if (!media) return;

    let runtimeMinutes = 0;
    
    if (media.type === 'movie') {
      runtimeMinutes = media.runtime || 120;
      movieWatchMinutes += runtimeMinutes;
      movieCompletedCount++;
      if (item.rating && item.rating > 0) {
        movieRatingSum += item.rating;
        movieRatedCount++;
      }
    } else if (media.type === 'tv') {
      const episodeRuntime = media.episode_runtime || 45;
      const totalEpisodes = media.number_of_episodes || 0;
      runtimeMinutes = episodeRuntime * totalEpisodes;
      tvWatchMinutes += runtimeMinutes;
      tvCompletedCount++;
      tvEpisodesWatched += totalEpisodes;
      if (item.rating && item.rating > 0) {
        tvRatingSum += item.rating;
        tvRatedCount++;
      }
    } else if (media.type === 'book') {
      bookCompletedCount++;
      // For completed books, count total pages from media_items if available
      const totalPages = (media as any).total_pages || item.current_page || 300;
      bookPagesRead += totalPages;
      if (item.rating && item.rating > 0) {
        bookRatingSum += item.rating;
        bookRatedCount++;
      }
    }
    
    totalWatchMinutes += runtimeMinutes;
    
    if (item.completed_at) {
      const completedDate = new Date(item.completed_at);
      if (completedDate >= oneYearAgo) {
          const month = completedDate.toLocaleString('default', { month: 'short' });
          const hours = runtimeMinutes / 60;
          watchHoursByMonth.set(month, (watchHoursByMonth.get(month) || 0) + hours);
      }
    }
  });

  // Calculate watch hours from currently watching media (based on progress)
  watchingList.forEach(item => {
    const media = mediaMap.get(item.media_id);
    if (!media) return;

    let runtimeMinutes = 0;
    
    if (media.type === 'movie') {
      // For movies being watched, count full runtime
      runtimeMinutes = media.runtime || 120;
      movieWatchMinutes += runtimeMinutes;
    } else if (media.type === 'tv') {
      // For TV shows, count from season 1 to current season/episode
      const episodeRuntime = media.episode_runtime || 45;
      const currentSeason = item.current_season || 1;
      const currentEpisode = item.current_episode || 1;
      const episodesPerSeason = media.episodes_per_season || {};

      // Count all episodes from season 1 to (current season - 1)
      let totalMinutes = 0;
      let episodeCount = 0;
      for (let s = 1; s < currentSeason; s++) {
        const episodesInSeason = episodesPerSeason[s] || 10;
        totalMinutes += episodesInSeason * episodeRuntime;
        episodeCount += episodesInSeason;
      }
      // Add episodes up to current episode in current season
      totalMinutes += currentEpisode * episodeRuntime;
      episodeCount += currentEpisode;
      
      runtimeMinutes = totalMinutes;
      tvWatchMinutes += runtimeMinutes;
      tvEpisodesWatched += episodeCount;
    } else if (media.type === 'book') {
      // For books being read, count current page progress
      bookPagesRead += item.current_page || 0;
    }
    
    totalWatchMinutes += runtimeMinutes;
  });

  // Activity chart - count ALL library entries by status
  // For completed: count in their completion month
  // For others: count as added today (if created_at is null)
  console.log('📊 Activity calculation - allEntries:', allEntries.length);
  const activityByStatus = new Map<string, number>();
  
  allEntries.forEach(item => {
    let monthToCount = null;
    const status = item.status || 'unknown';
    
    if (item.status === 'completed' && item.completed_at) {
      const completedDate = new Date(item.completed_at);
      if (completedDate >= oneYearAgo) {
        monthToCount = completedDate.toLocaleString('default', { month: 'short' });
        console.log('📊 Completed item counted in', monthToCount);
      }
    } else {
      // For non-completed items, count them if created_at exists, otherwise assume recent
      if (item.created_at) {
        const createdDate = new Date(item.created_at);
        if (createdDate >= oneYearAgo) {
          monthToCount = createdDate.toLocaleString('default', { month: 'short' });
          console.log('📊 Item status', item.status, 'counted in', monthToCount);
        }
      } else {
        // If no created_at, count as today/current month
        const now = new Date();
        monthToCount = now.toLocaleString('default', { month: 'short' });
        console.log('📊 Item status', item.status, 'counted in current month (no created_at)');
      }
    }
    
    if (monthToCount) {
      const monthEntry = completedOverTime.find(m => m.name === monthToCount);
      if (monthEntry) {
        // Increment the count for this status
        const statusKey = status as keyof typeof monthEntry;
        if (statusKey in monthEntry && typeof monthEntry[statusKey] === 'number') {
          monthEntry[statusKey] = (monthEntry[statusKey] as number) + 1;
        }
        // Also increment total for the chart
        monthEntry.total++;
        activityByStatus.set(status, (activityByStatus.get(status) || 0) + 1);
      }
    }
  });
  
  console.log('📊 Activity by status:', Object.fromEntries(activityByStatus));

  const totalWatchHours = Math.floor(totalWatchMinutes / 60);
  const remainingMinutes = totalWatchMinutes % 60;

  console.log('📊 Total watch time:', totalWatchHours, 'hours', remainingMinutes, 'minutes');

  return {
    totalCompleted,
    averageRating,
    genreDistribution,
    completedOverTime,
    totalWatchHours,
    totalWatchMinutes: remainingMinutes,
    watchHoursByMonth: completedOverTime.map(m => ({
        month: m.name,
        hours: Math.round(watchHoursByMonth.get(m.name) || 0)
    })),
    movieStats: {
      completed: movieCompletedCount,
      watchHours: Math.floor(movieWatchMinutes / 60),
      avgRating: movieRatedCount > 0 ? parseFloat((movieRatingSum / movieRatedCount).toFixed(1)) : 0,
    },
    tvStats: {
      completed: tvCompletedCount,
      watchHours: Math.floor(tvWatchMinutes / 60),
      episodesWatched: tvEpisodesWatched,
      avgRating: tvRatedCount > 0 ? parseFloat((tvRatingSum / tvRatedCount).toFixed(1)) : 0,
    },
    bookStats: {
      completed: bookCompletedCount,
      pagesRead: bookPagesRead,
      avgRating: bookRatedCount > 0 ? parseFloat((bookRatingSum / bookRatedCount).toFixed(1)) : 0,
    },
  };
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
export async function createCommentAction(reviewId: string, text: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Not authenticated" };

  const { error, data } = await supabase
    .from('review_comments')
    .insert({
      user_id: user.id,
      review_id: reviewId,
      text,
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

  const { data: comments, error } = await supabase
    .from('review_comments')
    .select('id, user_id, text, created_at, updated_at')
    .eq('review_id', reviewId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Comments fetch error:", error);
    return [];
  }

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

  return enrichedComments;
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

