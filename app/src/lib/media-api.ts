import type { ContentAvailability, ContentAvailabilityOutput, MediaItem, MediaType } from './types';
import { unstable_cache } from 'next/cache';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

// TMDB Genre mappings (IDs to names)
const TMDB_MOVIE_GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

const TMDB_TV_GENRES: Record<number, string> = {
  10759: 'Action & Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  10762: 'Kids',
  9648: 'Mystery',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
  37: 'Western',
};

type TmdbMovie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  runtime?: number;
  genres: { id: number; name: string }[];
  credits: {
    crew: { job: string; name: string }[];
  };
};

type TmdbTv = {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  first_air_date: string;
  vote_average: number;
  episode_run_time?: number[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  genres: { id: number; name: string }[];
  created_by: { name: string }[];
};

type TmdbSearchResult = {
    id: number;
    [key: string]: any;
};

type TmdbWatchProviderResult = {
    id: number;
    results: {
        [countryCode: string]: {
            link: string;
            flatrate?: { provider_name: string }[];
            rent?: { provider_name: string }[];
            buy?: { provider_name: string }[];
        }
    }
};

const transformTmdbMovie = (movie: TmdbMovie): MediaItem => {
    const releaseDate = movie.release_date;
    const isComingSoon = releaseDate ? new Date(releaseDate) > new Date() : false;
    return {
        id: `movie-${movie.id}`,
        title: movie.title,
        type: 'movie',
        coverImage: movie.poster_path ? `${TMDB_IMAGE_URL}${movie.poster_path}` : 'https://picsum.photos/seed/placeholder-movie/400/600',
        authorOrDirector: movie.credits?.crew.find(c => c.job === 'Director')?.name || 'N/A',
        description: movie.overview,
        genres: movie.genres?.map(g => g.name) || [],
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : 0,
        rating: movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : undefined,
        releaseDate,
        isComingSoon,
        episodeRuntime: movie.runtime,
    };
};

const transformTmdbTv = (tv: TmdbTv): MediaItem => {
    const releaseDate = tv.first_air_date;
    const isComingSoon = releaseDate ? new Date(releaseDate) > new Date() : false;
    return {
        id: `tv-${tv.id}`,
        title: tv.name,
        type: 'tv',
        coverImage: tv.poster_path ? `${TMDB_IMAGE_URL}${tv.poster_path}` : 'https://picsum.photos/seed/placeholder-tv/400/600',
        authorOrDirector: tv.created_by?.map(c => c.name).join(', ') || 'N/A',
        description: tv.overview,
        genres: tv.genres?.map(g => g.name) || [],
        year: tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : 0,
        rating: tv.vote_average ? Math.round(tv.vote_average * 10) / 10 : undefined,
        releaseDate,
        isComingSoon,
        episodeRuntime: tv.episode_run_time?.[0],
        totalEpisodes: tv.number_of_episodes,
        numberOfSeasons: tv.number_of_seasons,
    };
};

const transformTmdbSearchResult = (item: any, type: 'movie' | 'tv'): MediaItem => {
    const isMovie = type === 'movie';
    const releaseDate = isMovie ? item.release_date : item.first_air_date;
    const isComingSoon = releaseDate ? new Date(releaseDate) > new Date() : false;
    
    // Map genre IDs to genre names
    const genreMap = isMovie ? TMDB_MOVIE_GENRES : TMDB_TV_GENRES;
    const genres = item.genre_ids
        ? item.genre_ids.map((id: number) => genreMap[id]).filter(Boolean)
        : [];
    
    return {
        id: `${type}-${item.id}`,
        title: isMovie ? item.title : item.name,
        type: type,
        coverImage: item.poster_path ? `${TMDB_IMAGE_URL}${item.poster_path}` : `https://picsum.photos/seed/placeholder-${type}/400/600`,
        authorOrDirector: '',
        description: item.overview,
        genres: genres,
        year: releaseDate ? new Date(releaseDate).getFullYear() : 0,
        rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : undefined,
        releaseDate,
        isComingSoon,
    };
};

function extractTrailerUrl(videos: any[]): string | undefined {
    if (!videos || videos.length === 0) return undefined;
    
    // Look for official trailer first
    let trailer = videos.find(v => 
        v.site === 'YouTube' && 
        (v.type === 'Trailer' || v.type === 'Teaser') &&
        v.official === true
    );
    
    // If no official trailer, just look for any YouTube trailer
    if (!trailer) {
        trailer = videos.find(v => 
            v.site === 'YouTube' && 
            (v.type === 'Trailer' || v.type === 'Teaser')
        );
    }
    
    // If still no trailer, just get any YouTube video
    if (!trailer) {
        trailer = videos.find(v => v.site === 'YouTube');
    }
    
    if (trailer && trailer.key) {
        return `https://www.youtube.com/embed/${trailer.key}`;
    }
    
    return undefined;
}

async function searchTmdb(type: 'movie' | 'tv' | 'multi', query: string, page: number = 1): Promise<MediaItem[]> {
    if (!TMDB_API_KEY) {
        console.error("TMDB_API_KEY is not set.");
        return [];
    }
    const url = new URL(`${TMDB_API_URL}/search/${type}`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    url.searchParams.append('query', query);
    url.searchParams.append('page', String(page));
    url.searchParams.append('include_adult', 'true');

    try {
        const response = await fetch(url.toString());
        if (!response.ok) return [];
        const data = await response.json();
        
        const mediaItems = data.results.map((item: any) => {
            const itemType = item.media_type || type;
            if (itemType !== 'movie' && itemType !== 'tv') return null;
            // Only include items that have actual poster images (not placeholders)
            if (!item.poster_path) return null;
            return transformTmdbSearchResult(item, itemType);
        });

        return mediaItems.filter((item: MediaItem | null): item is MediaItem => item !== null);

    } catch (error) {
        console.error("Error searching TMDB:", error);
        return [];
    }
}


async function getTmdbDetails(type: 'movie' | 'tv', id: string): Promise<MediaItem | null> {
    if (!TMDB_API_KEY) return null;
    const url = new URL(`${TMDB_API_URL}/${type}/${id}`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    url.searchParams.append('append_to_response', 'credits,genres,videos');

    try {
        const response = await fetch(url.toString());
        if (!response.ok) return null;
        const data = await response.json();
        
        let mediaItem = type === 'movie' ? transformTmdbMovie(data) : transformTmdbTv(data);
        
        // Extract trailer URL from videos
        if (mediaItem && data.videos?.results) {
            const trailer = extractTrailerUrl(data.videos.results);
            if (trailer) {
                mediaItem.trailerUrl = trailer;
            }
        }
        
        // For TV shows, fetch detailed season information
        if (type === 'tv' && mediaItem) {
            const tmdbId = parseInt(id, 10);
            console.log('🎬 Fetching season details for TV show:', id, 'TMDB ID:', tmdbId);
            const episodesPerSeason = await getTvSeasonDetails(tmdbId);
            console.log('🎬 Episodes per season:', episodesPerSeason);
            if (episodesPerSeason) {
                mediaItem.episodesPerSeason = episodesPerSeason;
                console.log('🎬 Media item with episodes:', mediaItem);
            }
        }
        
        return mediaItem;
    } catch (error) {
        console.error(`Error fetching TMDB ${type} details:`, error);
        return null;
    }
}

async function getTvSeasonDetails(tmdbId: number): Promise<{ [season: number]: number } | null> {
  if (!TMDB_API_KEY) return null;
  
  try {
    // First get the TV show details to know how many seasons
    const tvUrl = new URL(`${TMDB_API_URL}/tv/${tmdbId}`);
    tvUrl.searchParams.append('api_key', TMDB_API_KEY);
    
    const tvResponse = await fetch(tvUrl.toString());
    if (!tvResponse.ok) return null;
    
    const tvData = await tvResponse.json();
    const numberOfSeasons = tvData.number_of_seasons || 0;
    console.log('🎬 TV Show has', numberOfSeasons, 'seasons');
    
    const episodesBySeason: { [season: number]: number } = {};
    
    // Fetch each season's details
    for (let season = 1; season <= numberOfSeasons; season++) {
      const seasonUrl = new URL(`${TMDB_API_URL}/tv/${tmdbId}/season/${season}`);
      seasonUrl.searchParams.append('api_key', TMDB_API_KEY);
      
      try {
        const seasonResponse = await fetch(seasonUrl.toString());
        if (seasonResponse.ok) {
          const seasonData = await seasonResponse.json();
          const episodeCount = seasonData.episodes?.length || 0;
          episodesBySeason[season] = episodeCount;
          console.log(`🎬 Season ${season}: ${episodeCount} episodes`);
        }
      } catch (error) {
        console.error(`Error fetching season ${season}:`, error);
      }
    }
    
    console.log('🎬 Final episodesBySeason:', episodesBySeason);
    return Object.keys(episodesBySeason).length > 0 ? episodesBySeason : null;
  } catch (error) {
    console.error('Error fetching TV season details:', error);
    return null;
  }
}

async function getTrendingTmdb(type: 'movie' | 'tv'): Promise<MediaItem[]> {
  if (!TMDB_API_KEY) return [];
  const url = new URL(`${TMDB_API_URL}/trending/${type}/week`);
  url.searchParams.append('api_key', TMDB_API_KEY);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) return [];
    const data = await response.json();
    return data.results.map((item: any) => transformTmdbSearchResult(item, type));
  } catch (error) {
    console.error(`Error fetching trending ${type}:`, error);
    return [];
  }
}

// Genre name to TMDB ID mapping
const GENRE_NAME_TO_MOVIE_ID: Record<string, number> = {
  'action': 28,
  'adventure': 12,
  'animation': 16,
  'comedy': 35,
  'crime': 80,
  'documentary': 99,
  'drama': 18,
  'family': 10751,
  'fantasy': 14,
  'history': 36,
  'historical': 36,
  'horror': 27,
  'music': 10402,
  'mystery': 9648,
  'romance': 10749,
  'science fiction': 878,
  'thriller': 53,
  'war': 10752,
  'western': 37,
};

const GENRE_NAME_TO_TV_ID: Record<string, number> = {
  'action': 10759,
  'adventure': 10759,
  'animation': 16,
  'comedy': 35,
  'crime': 80,
  'documentary': 99,
  'drama': 18,
  'family': 10751,
  'fantasy': 10765,
  'science fiction': 10765,
  'mystery': 9648,
  'war': 10768,
  'western': 37,
};

// Discover media by genre using TMDB's discover endpoint
export async function discoverByGenre(
  genres: string[], 
  type: 'movie' | 'tv' | 'all', 
  page: number = 1
): Promise<MediaItem[]> {
  if (!TMDB_API_KEY) return [];
  
  const genreMapping = type === 'tv' ? GENRE_NAME_TO_TV_ID : GENRE_NAME_TO_MOVIE_ID;
  const genreIds = genres
    .map(g => genreMapping[g.toLowerCase()])
    .filter(Boolean);
  
  if (genreIds.length === 0) return [];
  
  const results: MediaItem[] = [];
  
  const fetchDiscover = async (mediaType: 'movie' | 'tv') => {
    const mapping = mediaType === 'tv' ? GENRE_NAME_TO_TV_ID : GENRE_NAME_TO_MOVIE_ID;
    const ids = genres.map(g => mapping[g.toLowerCase()]).filter(Boolean);
    if (ids.length === 0) return [];
    
    const url = new URL(`${TMDB_API_URL}/discover/${mediaType}`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    url.searchParams.append('with_genres', ids.join(','));
    url.searchParams.append('sort_by', 'popularity.desc');
    url.searchParams.append('page', String(page));
    
    try {
      const response = await fetch(url.toString());
      if (!response.ok) return [];
      const data = await response.json();
      return data.results.map((item: any) => transformTmdbSearchResult(item, mediaType));
    } catch (error) {
      console.error(`Error discovering ${mediaType} by genre:`, error);
      return [];
    }
  };
  
  if (type === 'all') {
    const [movies, tvShows] = await Promise.all([
      fetchDiscover('movie'),
      fetchDiscover('tv')
    ]);
    // Interleave results
    const maxLen = Math.max(movies.length, tvShows.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < movies.length) results.push(movies[i]);
      if (i < tvShows.length) results.push(tvShows[i]);
    }
  } else {
    results.push(...await fetchDiscover(type));
  }
  
  return results;
}

// Map genre names to OpenLibrary subject slugs
const GENRE_TO_SUBJECT: Record<string, string> = {
  'romance': 'romance',
  'comedy': 'humor',
  'drama': 'drama',
  'adventure': 'adventure',
  'fantasy': 'fantasy',
  'science fiction': 'science_fiction',
  'horror': 'horror',
  'mystery': 'mystery',
  'thriller': 'thriller',
  'crime': 'crime',
  'historical': 'historical_fiction',
  'family': 'family',
  'fiction': 'fiction',
  'non-fiction': 'nonfiction',
  'young adult': 'young_adult',
  'children': 'juvenile_fiction',
  'self-help': 'self-help',
  'biography': 'biography',
  'history': 'history',
  'poetry': 'poetry',
  'classics': 'classics',
};

// Discover books by subject using OpenLibrary subjects API
export async function discoverBooksBySubject(
  genres: string[],
  page: number = 1,
  yearRange: string = 'any'
): Promise<MediaItem[]> {
  if (genres.length === 0) return [];
  
  // Get the subject slug for the first genre
  const genreKey = genres[0].toLowerCase().trim();
  const subject = GENRE_TO_SUBJECT[genreKey];
  if (!subject) {
    console.log(`[OpenLibrary] No subject mapping for "${genres[0]}" (key: "${genreKey}"). Available: ${Object.keys(GENRE_TO_SUBJECT).join(', ')}`);
    return [];
  }
  
  // Parse year range
  let startYear = 0;
  let endYear = 9999;
  if (yearRange !== 'any') {
    const [start, end] = yearRange.split('-').map(Number);
    startYear = start;
    endYear = end;
  }
  
  try {
    // Fetch more results so we have enough after year filtering
    const limit = yearRange === 'any' ? 25 : 100;
    const offset = (page - 1) * limit;
    const url = `https://openlibrary.org/subjects/${subject}.json?limit=${limit}&offset=${offset}`;
    
    console.log(`[OpenLibrary Subjects] Fetching ${subject} (page ${page}, years ${startYear}-${endYear})`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.error(`[OpenLibrary Subjects] Failed with status ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    console.log(`[OpenLibrary Subjects] Found ${data.work_count} total works`);
    
    if (!data.works || !Array.isArray(data.works)) {
      return [];
    }

    // If year filter is specified, filter results
    let works = data.works;
    if (yearRange !== 'any') {
      works = works.filter((work: any) => {
        if (!work.first_publish_year) return false;
        return work.first_publish_year >= startYear && work.first_publish_year <= endYear;
      }).slice(0, 25); // Take first 25 after filtering
    }
    
    const mediaItems = works.map((work: any) => {
      if (!work.key || !work.title) return null;
      
      const workId = work.key.replace('/works/', '');
      
      const authors = work.authors && work.authors.length > 0
        ? work.authors.map((a: any) => a.name).slice(0, 3).join(', ')
        : 'Unknown Author';
      
      const coverImage = work.cover_id
        ? `https://covers.openlibrary.org/b/id/${work.cover_id}-L.jpg`
        : undefined;
      
      return {
        id: `book-${workId}`,
        title: work.title,
        type: 'book' as MediaType,
        coverImage: coverImage || `https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop`,
        authorOrDirector: authors,
        year: work.first_publish_year || 0,
        description: '',
        genres: [genres[0]], // Use the searched genre
        isFavourite: false,
      };
    }).filter(Boolean);
    
    console.log(`[OpenLibrary Subjects] Returning ${mediaItems.length} books (year range: ${startYear}-${endYear})`);
    return mediaItems;
    
  } catch (error) {
    console.error('[OpenLibrary Subjects] Error:', error);
    return [];
  }
}

// Search OpenLibrary for books - much better than Gutendex for modern books
async function searchOpenLibraryBooks(query: string, page: number = 1): Promise<MediaItem[]> {
    try {
        const encodedQuery = encodeURIComponent(query);
        const limit = 25;
        const offset = (page - 1) * limit;
        
        // Use OpenLibrary search API with good defaults
        const url = `https://openlibrary.org/search.json?q=${encodedQuery}&limit=${limit}&offset=${offset}&fields=key,title,author_name,first_publish_year,cover_i,subject,ratings_average`;
        
        console.log(`[OpenLibrary Search] Searching for: "${query}" (page ${page})`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!response.ok) {
            console.error(`[OpenLibrary Search] Failed with status ${response.status}`);
            return [];
        }
        
        const data = await response.json();
        console.log(`[OpenLibrary Search] Found ${data.numFound} total, returned ${data.docs?.length || 0} results`);
        
        if (!data.docs || !Array.isArray(data.docs)) {
            return [];
        }

        const mediaItems = data.docs.map((book: any) => {
            if (!book.key || !book.title) return null;
            
            // Extract work ID from key (e.g., "/works/OL81631W" -> "OL81631W")
            const workId = book.key.replace('/works/', '');
            
            const authors = book.author_name && book.author_name.length > 0
                ? book.author_name.slice(0, 3).join(', ')
                : 'Unknown Author';
            
            // Get genres from subjects
            const genres = book.subject ? book.subject.slice(0, 5) : [];
            
            // Cover image from cover_i
            const coverImage = book.cover_i 
                ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
                : undefined;
            
            return {
                id: `book-${workId}`,
                title: book.title,
                type: 'book' as const,
                coverImage: coverImage || '/placeholder-book.png',
                authorOrDirector: authors,
                description: '',
                genres: genres,
                year: book.first_publish_year || 0,
                rating: book.ratings_average || undefined,
            };
        });

        const filtered = mediaItems.filter((item): item is MediaItem => item !== null && item.coverImage !== '/placeholder-book.png');
        console.log(`[OpenLibrary Search] Returned ${filtered.length} books with covers for "${query}"`);
        return filtered;

    } catch (error) {
        console.error("Error searching OpenLibrary:", error);
        return [];
    }
}

async function searchGutendexBooks(query: string, page: number = 1): Promise<MediaItem[]> {
    try {
        const encodedQuery = encodeURIComponent(query);
        
        const url = `https://gutendex.com/books?search=${encodedQuery}&page=${page}`;
        
        console.log(`[Gutendex Search] Searching for: "${query}" (page ${page}), URL: ${url}`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!response.ok) {
            console.error(`[Gutendex Search] Failed with status ${response.status}`);
            return [];
        }
        
        const data = await response.json();
        console.log(`[Gutendex Search] Found ${data.results?.length || 0} results for "${query}"`, data.results?.[0]);
        
        if (!data.results || !Array.isArray(data.results)) {
            console.warn(`[Gutendex Search] No results returned for query: "${query}"`);
            return [];
        }

        // Filter books and include fallback for missing covers
        const mediaItems = data.results.map((book: any) => {
            if (!book.id || !book.title) return null;
            
            const authors = book.authors && book.authors.length > 0
                ? book.authors.map((a: any) => a.name).join(', ')
                : 'Unknown Author';
            
            const genres = book.bookshelves ? book.bookshelves.slice(0, 5) : [];
            
            // Get cover image from formats["image/jpeg"]
            const coverImage = book.formats?.['image/jpeg'] || `https://picsum.photos/seed/book-${book.id}/400/600`;
            
            return {
                id: `book-${book.id}`,
                title: book.title,
                type: 'book' as const,
                coverImage: coverImage,
                authorOrDirector: authors,
                description: '',
                genres: genres,
                year: 0,
                rating: undefined,
            };
        });

        const filtered = mediaItems.filter((item): item is MediaItem => item !== null);
        console.log(`[Gutendex Search] Returned ${filtered.length} books with covers for "${query}"`);
        return filtered;

    } catch (error) {
        console.error("Error searching Gutendex:", error);
        return [];
    }
}

async function getOpenLibraryBookDetails(bookId: string): Promise<MediaItem | null> {
    try {
        // Extract OpenLibrary ID from book-{id} format (e.g., book-OL81631W -> OL81631W)
        const cleanId = bookId.replace(/^book-/g, '');
        const workUrl = `https://openlibrary.org/works/${cleanId}.json`;
        
        console.log(`[OpenLibrary] Fetching book details from: ${workUrl}`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(workUrl, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!response.ok) {
            console.error(`[OpenLibrary] Failed to fetch book details for ${bookId}: ${response.status} ${response.statusText}`);
            return null;
        }
        
        const work = await response.json();
        console.log(`[OpenLibrary] Book fetched successfully:`, work.title);
        
        // Fetch author names
        let authors = 'Unknown Author';
        if (work.authors && Array.isArray(work.authors) && work.authors.length > 0) {
            const authorPromises = work.authors.slice(0, 3).map(async (a: any) => {
                const authorKey = a.author?.key || a.key;
                if (authorKey) {
                    try {
                        const authorResponse = await fetch(`https://openlibrary.org${authorKey}.json`);
                        if (authorResponse.ok) {
                            const authorData = await authorResponse.json();
                            return authorData.name || null;
                        }
                    } catch {
                        return null;
                    }
                }
                return null;
            });
            const authorNames = (await Promise.all(authorPromises)).filter((name: string | null) => name !== null);
            if (authorNames.length > 0) {
                authors = authorNames.join(', ');
            }
        }
        
        // Get cover image
        let coverImage = '';
        let totalPages = 0;
        if (work.covers && work.covers.length > 0) {
            coverImage = `https://covers.openlibrary.org/b/id/${work.covers[0]}-L.jpg`;
        }
        
        // Try editions for cover and page count
        let yearFromEdition = 0;
        try {
            const editionsUrl = `https://openlibrary.org/works/${cleanId}/editions.json`;
            const editionsResponse = await fetch(editionsUrl);
            if (editionsResponse.ok) {
                const editionsData = await editionsResponse.json();
                if (editionsData.entries && editionsData.entries.length > 0) {
                    for (const edition of editionsData.entries.slice(0, 10)) {
                        // Get cover from edition if we don't have one yet
                        if (!coverImage && edition.covers && edition.covers.length > 0) {
                            coverImage = `https://covers.openlibrary.org/b/id/${edition.covers[0]}-L.jpg`;
                        }
                        // Get page count if available
                        if (!totalPages && edition.number_of_pages) {
                            totalPages = edition.number_of_pages;
                        }
                        // Get publish year if available and we haven't found one yet
                        if (yearFromEdition === 0 && edition.publish_date) {
                            yearFromEdition = parseInt(String(edition.publish_date).substring(0, 4)) || 0;
                        }
                        // If we have cover, pages, and year, break early
                        if (coverImage && totalPages && yearFromEdition > 0) break;
                    }
                }
            }
        } catch (e) {
            console.log('[OpenLibrary] Could not fetch editions for cover/pages');
        }
        
        if (!coverImage) {
            coverImage = `https://covers.openlibrary.org/w/id/${cleanId}-L.jpg`;
        }
        
        // Get description
        let description = '';
        if (work.description) {
            description = typeof work.description === 'string' 
                ? work.description 
                : work.description.value || '';
        }
        
        // Get genres from OpenLibrary subjects - extract readable genre info
        let genres: string[] = [];
        if (work.subjects && Array.isArray(work.subjects)) {
            const foundGenres = new Set<string>();
            
            for (const subject of work.subjects) {
                const lowerSubject = subject.toLowerCase();
                
                // Skip metadata that's not a genre
                if (lowerSubject.startsWith('serie:') ||
                    lowerSubject.startsWith('time:') ||
                    lowerSubject.startsWith('place:') ||
                    lowerSubject.startsWith('people:') ||
                    lowerSubject.includes('bestseller') ||
                    lowerSubject.includes('award') ||
                    /^\d+/.test(subject)) {
                    continue;
                }
                
                // Clean prefixes first (nyt:, lcsh:, etc)
                let genre = subject.replace(/^[a-z]+:\s*/i, '');
                
                // Extract the main genre part (before special characters or numbers)
                genre = genre
                    .split(/[=\-\d]/)[0] // Take everything before =, -, or digits
                    .trim();
                
                // Skip if empty or too long
                if (!genre || genre.length < 2 || genre.length > 50) {
                    continue;
                }
                
                // Skip generic terms and non-genres
                if (/^(hardcover|paperback|e.?book|american|fiction|by author|children|juvenile)$/i.test(genre)) {
                    continue;
                }
                
                foundGenres.add(genre);
            }
            
            genres = Array.from(foundGenres).slice(0, 5);
        }
        
        // Get first publish year - try multiple fields
        let year = 0;
        if (work.first_published_date) {
            year = parseInt(work.first_published_date.substring(0, 4)) || 0;
        } else if (work.first_publish_year) {
            year = work.first_publish_year;
        } else if (work.publish_date) {
            year = parseInt(String(work.publish_date).substring(0, 4)) || 0;
        }
        
        // If still no year, use year from editions
        if (year === 0 && yearFromEdition > 0) {
            year = yearFromEdition;
        }
        
        // If still no year, try to extract from the first edition if available in work
        if (year === 0 && Array.isArray(work.editions) && work.editions.length > 0) {
            for (const edition of work.editions) {
                if (edition.publish_date) {
                    year = parseInt(String(edition.publish_date).substring(0, 4)) || 0;
                    if (year > 0) break;
                }
            }
        }
        
        return {
            id: `book-${cleanId}`,
            title: work.title || 'Unknown',
            type: 'book' as const,
            coverImage,
            authorOrDirector: authors,
            description: description,
            genres: genres,
            year: year,
            rating: undefined,
            totalPages: totalPages || undefined,
        };
    } catch (error) {
        console.error("Error fetching OpenLibrary book details:", error);
        return null;
    }
}

async function getGutendexBookDetails(bookId: string): Promise<MediaItem | null> {
    try {
        // Extract numeric ID from book-{id} format
        const cleanId = bookId.replace(/^book-/g, '');
        const url = `https://gutendex.com/books/${cleanId}`;
        
        console.log(`[Gutendex] Fetching book details from: ${url}`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!response.ok) {
            console.error(`[Gutendex] Failed to fetch book details for ${bookId}: ${response.status} ${response.statusText}`);
            return null;
        }
        
        const book = await response.json();
        console.log(`[Gutendex] Book fetched successfully:`, book.title);
        
        const authors = book.authors && book.authors.length > 0
            ? book.authors.map((a: any) => a.name).join(', ')
            : 'Unknown Author';
        
        const coverImage = book.formats?.['image/jpeg'] || `https://picsum.photos/seed/book-${cleanId}/400/600`;
        const genres = book.bookshelves ? book.bookshelves.slice(0, 5) : [];
        
        return {
            id: `book-${cleanId}`,
            title: book.title || 'Unknown',
            type: 'book' as const,
            coverImage,
            authorOrDirector: authors,
            description: '',
            genres: genres,
            year: 0,
            rating: undefined,
        };
    } catch (error) {
        console.error("Error fetching Gutendex book details:", error);
        return null;
    }
}

async function getHardcoverDetails(slug: string): Promise<MediaItem | null> {
     if (!HARDCOVER_API_KEY) return null;
     const url = `https://api.hardcover.app/v1/books/${slug}`;
     try {
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${HARDCOVER_API_KEY}` } });
        if (!response.ok) {
            console.error(`[Hardcover Details] Failed with status ${response.status}`);
            return null;
        }
        const book = await response.json();
        return {
            id: `book-${book.slug}`,
            title: book.title,
            type: 'book',
            coverImage: book.image || 'https://picsum.photos/seed/placeholder-book/400/600',
            authorOrDirector: book.authors?.map((a: any) => a.name).join(', ') || 'N/A',
            description: book.description || 'No description available.',
            genres: book.categoryList || [],
            year: book.publishedYear || 0,
            rating: book.averageRating ? Math.round(book.averageRating * 2) : undefined,
        };
     } catch (error) {
         console.error("Error fetching Hardcover details:", error);
         return null;
     }
}

export async function searchMedia(query: string, type: MediaType | 'all' = 'all', page: number = 1): Promise<MediaItem[]> {
    if (type === 'movie') {
        return searchTmdb('movie', query, page);
    }
    if (type === 'tv') {
        return searchTmdb('tv', query, page);
    }
    if (type === 'book') {
        return searchOpenLibraryBooks(query, page);
    }
    
    // For 'all', fetch movies, TV shows, and books separately to get better combined results
    const [movies, tvShows, books] = await Promise.all([
        searchTmdb('movie', query, page),
        searchTmdb('tv', query, page),
        searchOpenLibraryBooks(query, page)
    ]);
    
    // Interleave movies, TV shows, and books for a better mix
    const combined: MediaItem[] = [];
    const maxLen = Math.max(movies.length, tvShows.length, books.length);
    for (let i = 0; i < maxLen; i++) {
        if (i < movies.length) combined.push(movies[i]);
        if (i < tvShows.length) combined.push(tvShows[i]);
        if (i < books.length) combined.push(books[i]);
    }
    
    return combined;
}


export async function getMediaDetails(id: string, type: MediaType): Promise<MediaItem | null> {
    const [idType, apiId] = id.split(/-(.+)/);
    if (type !== idType) return null;

    switch (type) {
        case 'movie':
        case 'tv':
            return getTmdbDetails(type, apiId);
        case 'book':
            return getOpenLibraryBookDetails(id);
        default:
            return null;
    }
}

export async function getTrendingMovies(): Promise<MediaItem[]> {
    return getCachedTrendingMovies();
}

export async function getTrendingShows(): Promise<MediaItem[]> {
    return getCachedTrendingShows();
}

export async function getTrendingBooks(): Promise<MediaItem[]> {
    return getCachedTrendingBooks();
}

// Cached versions with 60 second revalidation (1 hour for production)
const getCachedTrendingMovies = unstable_cache(
  async () => getTrendingTmdb('movie'),
  ['trending-movies'],
  { revalidate: 60 }
);

const getCachedTrendingShows = unstable_cache(
  async () => getTrendingTmdb('tv'),
  ['trending-shows'],
  { revalidate: 60 }
);

async function fetchTrendingBooksData(): Promise<MediaItem[]> {
    try {
        console.log('[Books API] Starting fetch from OpenLibrary trending (weekly)...');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        // Use weekly trending instead of "now" - "now" just shows random books people are adding at this moment
        // Weekly gives a better picture of actually popular/trending books
        const response = await fetch('https://openlibrary.org/trending/weekly.json?limit=50', { signal: controller.signal });
        clearTimeout(timeout);

        console.log(`[Books API] Response status: ${response.status}`);
        if (!response.ok) {
            console.warn(`[Books API] OpenLibrary trending failed`);
            return [];
        }

        const data = await response.json();
        console.log(`[Books API] Received data, results count: ${data.works?.length || 0}`);

        if (!data.works || !Array.isArray(data.works)) {
            console.warn("[Books API] Unexpected response format");
            return [];
        }

        // Transform books and fetch cover data for those missing it
        const books: MediaItem[] = [];
        for (const book of data.works.slice(0, 50)) {
            const transformed = await transformOpenLibraryBook(book);
            if (transformed) {
                books.push(transformed);
            }
        }

        console.log(`[Books API] Total books processed: ${books.length}`);
        
        return books;
    } catch (error) {
        console.error("[Books API] Error fetching trending books:", error);
        return [];
    }
}

async function fetchPopularBooksAsAlternative(): Promise<MediaItem[]> {
    try {
        console.log('[Books API] Fetching popular books from OpenLibrary...');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch('https://openlibrary.org/search.json?sort=rating&has_fulltext=true&limit=50', { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
            console.warn('[Books API] Failed to fetch alternative books');
            return [];
        }

        const data = await response.json();
        if (!data.docs || !Array.isArray(data.docs)) {
            return [];
        }

        const books: MediaItem[] = [];
        for (const book of data.docs.slice(0, 50)) {
            const transformed = await transformOpenLibraryBook(book);
            if (transformed) {
                books.push(transformed);
            }
        }

        console.log(`[Books API] Alternative: fetched ${books.length} popular books`);
        return books;
    } catch (error) {
        console.error('[Books API] Error fetching popular books:', error);
        return [];
    }
}

function transformGutendexBook(book: any): MediaItem | null {
    if (!book || !book.id || !book.title) {
        console.log('[Books API] Skipping book - missing id or title');
        return null;
    }

    // Extract author names
    const authors = (book.authors && Array.isArray(book.authors) && book.authors.length > 0)
        ? book.authors.map((a: any) => a.name).join(', ')
        : 'Unknown Author';

    // Get cover image from formats["image/jpeg"]
    const coverImage = book.formats?.['image/jpeg'] || `https://picsum.photos/seed/book-${book.id}/400/600`;

    // Get genres/shelves from bookshelves
    const genres = (book.bookshelves && Array.isArray(book.bookshelves) && book.bookshelves.length > 0)
        ? book.bookshelves.slice(0, 5)
        : [];

    const transformedBook = {
        id: `book-${book.id}`,
        title: book.title,
        type: 'book' as const,
        coverImage: coverImage,
        authorOrDirector: authors,
        description: '',
        genres: genres,
        year: 0,
        rating: undefined,
    };

    console.log('[Books API] Book:', transformedBook.title, 'Genres:', genres.length > 0 ? genres : 'none');

    return transformedBook;
}

async function transformOpenLibraryBook(book: any): Promise<MediaItem | null> {
    if (!book || !book.key || !book.title) {
        console.log('[Books API] Skipping book - missing key or title');
        return null;
    }

    // Extract just the ID from key (e.g., "/works/OL17795654W" -> "OL17795654W")
    const keyId = book.key.split('/').pop() || book.key;

    // Extract author names - OpenLibrary trending API returns author_name array
    let authors = 'Unknown Author';
    
    if (book.author_name && Array.isArray(book.author_name) && book.author_name.length > 0) {
        authors = book.author_name.join(', ');
    } else if (book.authors && Array.isArray(book.authors) && book.authors.length > 0) {
        authors = book.authors.map((a: any) => a.name || a).join(', ');
    }

    // Get cover image - try multiple approaches
    let coverImage = '';
    
    // Try cover_id first (from search API)
    if (book.cover_id) {
        coverImage = `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`;
        console.log('[Books API]', book.title, '- using cover_id');
    } 
    // Try cover_edition_key (from trending API)
    else if (book.cover_edition_key) {
        coverImage = `https://covers.openlibrary.org/b/olid/${book.cover_edition_key}-M.jpg`;
        console.log('[Books API]', book.title, '- using cover_edition_key');
    }
    // Try edition_key as fallback
    else if (book.edition_key && book.edition_key.length > 0) {
        coverImage = `https://covers.openlibrary.org/b/olid/${book.edition_key[0]}-M.jpg`;
        console.log('[Books API]', book.title, '- using edition_key');
    }
    // If no cover info, fetch editions for this work to get cover ID
    else if (keyId && keyId.startsWith('OL')) {
        try {
            const editionsUrl = `https://openlibrary.org${book.key}/editions.json`;
            const editionsResponse = await fetch(editionsUrl);
            if (editionsResponse.ok) {
                const editionsData = await editionsResponse.json();
                if (editionsData.entries && editionsData.entries.length > 0) {
                    // Try multiple editions to find one with a cover
                    for (const edition of editionsData.entries.slice(0, 5)) {
                        if (edition.covers && edition.covers.length > 0) {
                            coverImage = `https://covers.openlibrary.org/b/id/${edition.covers[0]}-M.jpg`;
                            console.log('[Books API]', book.title, '- got cover from editions API');
                            break;
                        }
                    }
                }
            }
        } catch (e) {
            console.log('[Books API] Could not fetch editions for', book.title);
        }
        
        // Fallback to work ID cover URL (this endpoint always returns something)
        if (!coverImage) {
            coverImage = `https://covers.openlibrary.org/w/id/${keyId}-M.jpg`;
            console.log('[Books API]', book.title, '- using work ID fallback');
        }
    }

    // Last resort: if keyId doesn't start with OL, construct from ISBN if available
    if (!coverImage && book.isbn) {
        const isbn = Array.isArray(book.isbn) ? book.isbn[0] : book.isbn;
        coverImage = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
        console.log('[Books API]', book.title, '- using ISBN');
    }

    // Ultimate fallback: use Unsplash random image with book tag
    if (!coverImage) {
        const hash = book.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const seed = Math.abs(hash) % 1000;
        // Use Unsplash API with book query and seed for consistent images
        coverImage = `https://images.unsplash.com/photo-1507842217343-583f20270319?w=300&h=450&fit=crop&crop=faces&q=60&seed=${seed}`;
        console.log('[Books API]', book.title, '- using Unsplash fallback');
    }

    // Get genres/subjects from the book - try multiple fields
    let genres: string[] = [];
    
    if (book.subject && Array.isArray(book.subject) && book.subject.length > 0) {
        genres = book.subject.slice(0, 5);
    } else if (book.subjects && Array.isArray(book.subjects) && book.subjects.length > 0) {
        genres = book.subjects.map((s: any) => typeof s === 'string' ? s : s.name).slice(0, 5);
    }
    
    // If no genres, try to fetch from the work details
    if (genres.length === 0 && keyId && keyId.startsWith('OL')) {
        try {
            const workUrl = `https://openlibrary.org/works/${keyId}.json`;
            const workResponse = await fetch(workUrl);
            if (workResponse.ok) {
                const workData = await workResponse.json();
                if (workData.subjects && Array.isArray(workData.subjects)) {
                    // Clean up subject names (remove "fiction" prefix patterns, capitalize nicely)
                    genres = workData.subjects
                        .slice(0, 8)
                        .map((s: string) => {
                            // Clean up common prefixes and make it readable
                            return s.replace(/^(Fiction|Juvenile fiction|Young adult fiction),?\s*/i, '')
                                    .split(',')[0]
                                    .trim();
                        })
                        .filter((s: string) => s.length > 0 && s.length < 30)
                        .slice(0, 5);
                    console.log('[Books API]', book.title, '- fetched genres:', genres);
                }
            }
        } catch (e) {
            console.log('[Books API] Could not fetch genres for', book.title);
        }
    }

    const transformedBook = {
        id: `book-${keyId}`,
        title: book.title,
        type: 'book' as const,
        coverImage: coverImage,
        authorOrDirector: authors,
        description: book.description || '',
        genres: genres,
        year: book.first_publish_year || 0,
        rating: book.ratings_average || undefined,
    };

    console.log('[Books API] Transformed:', book.title, 'Authors:', authors);
    return transformedBook;
}

const getCachedTrendingBooks = unstable_cache(
  async () => fetchTrendingBooksData(),
  ['trending-books-openlibrary-weekly-v2-with-genres'],
  { revalidate: 3600 } // Revalidate hourly since weekly data doesn't change as often
);


async function getTmdbWatchProviders(type: 'movie' | 'tv', id: number): Promise<ContentAvailability[]> {
    if (!TMDB_API_KEY) {
        return [];
    }
    const url = new URL(`${TMDB_API_URL}/${type}/${id}/watch/providers`);
    url.searchParams.append('api_key', TMDB_API_KEY);

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            return [];
        }
        const data: TmdbWatchProviderResult = await response.json();
        const usProviders = data.results?.US;

        if (!usProviders) return [];

        const availability: ContentAvailability[] = [];
        const baseUrl = usProviders.link || `https://www.themoviedb.org/${type}/${id}/watch?locale=US`;

        const providers = [
            ...(usProviders.flatrate || []),
            ...(usProviders.rent || []),
            ...(usProviders.buy || []),
        ];

        const uniqueProviderNames = [...new Set(providers.map(p => p.provider_name))];

        uniqueProviderNames.forEach(providerName => {
            availability.push({
                platform: providerName,
                url: baseUrl,
            });
        });

        return availability;
    } catch (error) {
        console.error("Error fetching TMDB watch providers:", error);
        return [];
    }
}


function getBookAvailability(title: string): ContentAvailability[] {
    const encodedTitle = encodeURIComponent(title);
    return [
        { platform: "Amazon", url: `https://www.amazon.com/s?k=${encodedTitle}&i=stripbooks` },
        { platform: "Gutendex", url: `https://gutendex.com/books?search=${encodedTitle}` },
        { platform: "Google Books", url: `https://books.google.com/books?q=${encodedTitle}` }
    ];
}

export async function getMediaAvailability(
  input: { title: string; type: MediaType; year?: number, id?: string }
): Promise<ContentAvailabilityOutput> {
  const { type, title, year, id } = input;

  if (type === 'book') {
    const availability = getBookAvailability(title);
    return { availability };
  }

  if ((type === 'movie' || type === 'tv') && id) {
     const [idType, apiId] = id.split(/-(.+)/);
     if (type !== idType) return { availability: [] };
     
     const numericId = parseInt(apiId, 10);
     if (numericId) {
        const availability = await getTmdbWatchProviders(type, numericId);
        return { availability };
     }
  }

  return { availability: [] };
}
