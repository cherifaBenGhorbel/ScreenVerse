import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export type MediaType = 'movie' | 'tv';

export interface DiscoverFilters {
  genreId?: number;
  originalLanguage?: string;
  originCountry?: string;
  minRating?: number;
  page?: number;
}

@Injectable({
  providedIn: 'root'
})
export class Tmdb {

  private apiUrl = environment.tmdb.baseUrl;
  private headers = new HttpHeaders({
    'Authorization': `Bearer ${environment.tmdb.accessToken}`,
    'Content-Type': 'application/json'
  });

  constructor(private http: HttpClient) { }

  private async request<T>(endpoint: string, fallback: T): Promise<T> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return fallback;
    }

    try {
      return await firstValueFrom(this.http.get<T>(`${this.apiUrl}${endpoint}`, { headers: this.headers }));
    } catch (error) {
      console.error('TMDB request failed:', endpoint, error);
      return fallback;
    }
  }

  // Trending (All)
  getTrending() {
    return this.request<any>('/trending/all/day', { results: [] });
  }

  // Popular Movies
  getPopularMovies(page = 1) {
    return this.request<any>(`/movie/popular?page=${page}`, { results: [], page: 1, total_pages: 1 });
  }

  // Popular TV Shows
  getPopularTv(page = 1) {
    return this.request<any>(`/tv/popular?page=${page}`, { results: [], page: 1, total_pages: 1 });
  }

  // Top Anime (Japanese Animation)
  getTopAnime(page = 1) {
    return this.request<any>(`/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=${page}`, { results: [], page: 1, total_pages: 1 });
  }

  // Get Details (Movie or TV)
  getDetails(type: MediaType, id: number) {
    return this.request<any>(`/${type}/${id}?append_to_response=credits,external_ids`, null);
  }

  // Get Videos/Trailers
  getVideos(type: MediaType, id: number) {
    return this.request<any>(`/${type}/${id}/videos`, { results: [] });
  }

  // Get TV Season Details (episodes)
  getSeasonDetails(tvId: number, seasonNumber: number) {
    return this.request<any>(`/tv/${tvId}/season/${seasonNumber}`, { episodes: [] });
  }

  // Where to Watch providers by region
  getWatchProviders(type: MediaType, id: number) {
    return this.request<any>(`/${type}/${id}/watch/providers`, { results: {} });
  }

  // Search
  searchMulti(query: string) {
    return this.request<any>(`/search/multi?query=${encodeURIComponent(query)}`, { results: [] });
  }

    // Mood-based recommendations
    getDiscover(type: MediaType, filtersOrGenreId?: number | DiscoverFilters, page = 1) {
      let url = `${this.apiUrl}/discover/${type}?sort_by=popularity.desc&include_adult=false`;

      if (typeof filtersOrGenreId === 'number') {
        url += `&with_genres=${filtersOrGenreId}`;
      } else if (filtersOrGenreId) {
        if (filtersOrGenreId.genreId) {
          url += `&with_genres=${filtersOrGenreId.genreId}`;
        }

        if (filtersOrGenreId.originalLanguage) {
          url += `&with_original_language=${filtersOrGenreId.originalLanguage}`;
        }

        if (filtersOrGenreId.originCountry) {
          url += `&with_origin_country=${filtersOrGenreId.originCountry}`;
        }

        if (typeof filtersOrGenreId.minRating === 'number') {
          url += `&vote_average.gte=${filtersOrGenreId.minRating}`;
        }

        page = filtersOrGenreId.page || page;
    }

    url += `&page=${page}`;

    return this.request<any>(url.replace(this.apiUrl, ''), { results: [], page: 1, total_pages: 1 });
  }
}