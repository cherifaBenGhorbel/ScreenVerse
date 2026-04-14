import { MediaType, TmdbMediaItem } from './tmdb';
import { WatchedItem } from './watch-history';

export interface ScoredRecommendation {
  item: TmdbMediaItem;
  score: number;
}

export interface PersonalizedRecommendations {
  items: TmdbMediaItem[];
  reason: string;
}

export interface RecommendationBatch {
  items: TmdbMediaItem[];
  sourceWeight: number;
  sourceType: 'seed' | 'genre' | 'language' | 'country' | 'keyword' | 'fallback';
  seedAgeDays?: number;
  originCountry?: string;
  genreId?: number;
  keywordId?: number;
}

export interface UserProfile {
  seedItems: WatchedItem[];
  topGenres: number[];
  topLanguages: string[];
  topCountries: string[];
  dominantType: MediaType;
}
