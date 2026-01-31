export type MediaType = 'book' | 'movie' | 'tv';

export type MediaStatus = 'completed' | 'watching' | 'plan_to_watch' | 'on_hold' | 'dropped';

export type ListType = 'favourite' | 'want-to-watch' | 'watched' | 'watching' | 'custom';

export interface CustomList {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  coverImage: string;
  authorOrDirector: string;
  description: string;
  genres: string[];
  year: number;
  rating?: number;
  userStatus?: MediaStatus;
  userRating?: number;
  isFavourite?: boolean;
  currentEpisode?: number;
  currentSeason?: number;
  totalEpisodes?: number;
  numberOfSeasons?: number;
  episodeRuntime?: number;
  episodesPerSeason?: { [season: number]: number };
  releaseDate?: string;
  isComingSoon?: boolean;
  userLists?: string[];
  trailerUrl?: string;
  // Book-specific fields
  currentPage?: number;
  totalPages?: number;
}

export interface Review {
  id: string;
  user: User;
  rating: number;
  text: string;
  createdAt: string;
  isPublic: boolean;
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  bio?: string;
}

export interface Stats {
  totalCompleted: number;
  averageRating: number;
  genreDistribution: { name: string; value: number }[];
  completedOverTime: { name: string; total: number; completed?: number; watching?: number; plan_to_watch?: number; on_hold?: number; dropped?: number }[];
  totalWatchHours: number;
  totalWatchMinutes: number;
  watchHoursByMonth?: { month: string; hours: number }[];
  // New fields for media type breakdown
  movieStats: {
    completed: number;
    watchHours: number;
    avgRating: number;
    genreDistribution?: { name: string; value: number }[];
    activityOverTime?: { name: string; total: number }[];
  };
  tvStats: {
    completed: number;
    watchHours: number;
    episodesWatched: number;
    avgRating: number;
    genreDistribution?: { name: string; value: number }[];
    activityOverTime?: { name: string; total: number }[];
  };
  bookStats: {
    completed: number;
    pagesRead: number;
    avgRating: number;
    avgBookLength?: number;
    genreDistribution?: { name: string; value: number }[];
    activityOverTime?: { name: string; total: number }[];
  };
}

export type ContentAvailabilityInput = {
  id: string;
  title: string;
  type: MediaType;
  year?: number;
};

export type ContentAvailability = {
  platform: string;
  url: string;
};

export type ContentAvailabilityOutput = {
  availability: ContentAvailability[];
  error?: string;
};
