import { MediaType } from './tmdb';

export interface WatchedItem {
  id: number;
  media_type: MediaType;
  title?: string;
  name?: string;
  genres: number[];
  origin_countries: string[];
  original_language?: string;
  vote_average?: number;
  watched_at: number;
}
