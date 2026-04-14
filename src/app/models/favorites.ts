export type FavoriteMediaType = 'movie' | 'tv';

export interface FavoriteItem {
  id: number;
  media_type: FavoriteMediaType;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}
