export type MediaType = 'movie' | 'tv';

export interface TmdbGenre {
  id: number;
  name?: string;
}

export interface TmdbMediaItem {
  id: number;
  media_type?: MediaType;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  popularity?: number;
  genre_ids?: number[];
  original_language?: string;
  release_date?: string;
  first_air_date?: string;
}

export interface TmdbKeyword {
  id: number;
  name?: string;
}

export interface TmdbPaginatedResponse<T> {
  results: T[];
  page: number;
  total_pages: number;
}

export interface DiscoverFilters {
  genreId?: number;
  originalLanguage?: string;
  originCountry?: string;
  keywordId?: number;
  minRating?: number;
  page?: number;
}
