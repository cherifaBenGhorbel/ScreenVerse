import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DiscoverFilters, MediaType, TmdbKeyword, TmdbMediaItem, TmdbPaginatedResponse } from '../../models/tmdb';

@Injectable({
  providedIn: 'root'
})
export class Tmdb {

  private apiProxyBase = environment.tmdb.apiProxyBase || '/api/tmdb';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  private readonly tmdbLanguage = 'en';
  private readonly watchRegion = 'US';

  constructor(private http: HttpClient) { }

  private async request<T>(endpoint: string, fallback: T): Promise<T> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return fallback;
    }

    const separator = endpoint.includes('?') ? '&' : '?';
    const endpointWithLanguage = `${endpoint}${separator}language=${encodeURIComponent(this.tmdbLanguage)}`;
    const targetUrl = `${this.apiProxyBase}${endpointWithLanguage}`;

    try {
      return await firstValueFrom(this.http.get<T>(targetUrl, { headers: this.headers }));
    } catch (error) {
      return fallback;
    }
  }

  // Trending (All)
  getTrending() {
    return this.request<TmdbPaginatedResponse<TmdbMediaItem>>('/trending/all/day', { results: [], page: 1, total_pages: 1 });
  }

  // Popular Movies
  getPopularMovies(page = 1) {
    return this.request<TmdbPaginatedResponse<TmdbMediaItem>>(`/movie/popular?page=${page}`, { results: [], page: 1, total_pages: 1 });
  }

  // Popular TV Shows
  getPopularTv(page = 1) {
    return this.request<TmdbPaginatedResponse<TmdbMediaItem>>(`/tv/popular?page=${page}`, { results: [], page: 1, total_pages: 1 });
  }

  // Top Anime (Japanese Animation)
  getTopAnime(page = 1) {
    return this.request<TmdbPaginatedResponse<TmdbMediaItem>>(`/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=${page}`, { results: [], page: 1, total_pages: 1 });
  }

  // Get Details (Movie or TV)
  getDetails(type: MediaType, id: number) {
    return this.request<any>(`/${type}/${id}?append_to_response=credits,external_ids`, null);
  }

  // Get Videos/Trailers
  getVideos(type: MediaType, id: number) {
    return this.request<any>(`/${type}/${id}/videos`, { results: [] });
  }

  // Similar picks based on a title
  getRecommendations(type: MediaType, id: number, page = 1) {
    return this.request<TmdbPaginatedResponse<TmdbMediaItem>>(`/${type}/${id}/recommendations?page=${page}`, { results: [], page: 1, total_pages: 1 });
  }

  // Keywords for topic-level similarity (e.g., doctor/medical/legal)
  async getKeywords(type: MediaType, id: number): Promise<TmdbKeyword[]> {
    const response = await this.request<{ keywords?: TmdbKeyword[]; results?: TmdbKeyword[] }>(`/${type}/${id}/keywords`, { keywords: [], results: [] });
    return response?.keywords || response?.results || [];
  }

  // Get TV Season Details (episodes)
  getSeasonDetails(tvId: number, seasonNumber: number) {
    return this.request<any>(`/tv/${tvId}/season/${seasonNumber}`, { episodes: [] });
  }

  // Where to Watch providers by region
  getWatchProviders(type: MediaType, id: number) {
    return this.request<any>(`/${type}/${id}/watch/providers`, { results: {} }).then(response => {
      // Filter results by the user's watch region
      if (response?.results) {
        return {
          ...response,
          results: { [this.watchRegion]: response.results[this.watchRegion] }
        };
      }
      return response;
    });
  }

  // Search
  searchMulti(query: string) {
    return this.request<TmdbPaginatedResponse<TmdbMediaItem>>(`/search/multi?query=${encodeURIComponent(query)}`, { results: [], page: 1, total_pages: 1 });
  }

  // Mood-based recommendations
  getDiscover(type: MediaType, filtersOrGenreId?: number | DiscoverFilters, page = 1) {
    const params = new URLSearchParams({
      sort_by: 'popularity.desc',
      include_adult: 'false'
    });

    if (typeof filtersOrGenreId === 'number') {
      params.set('with_genres', String(filtersOrGenreId));
    } else if (filtersOrGenreId) {
      if (filtersOrGenreId.genreId) {
        params.set('with_genres', String(filtersOrGenreId.genreId));
      }

      if (filtersOrGenreId.originalLanguage) {
        params.set('with_original_language', filtersOrGenreId.originalLanguage);
      }

      if (filtersOrGenreId.originCountry) {
        params.set('with_origin_country', filtersOrGenreId.originCountry);
      }

      if (filtersOrGenreId.keywordId) {
        params.set('with_keywords', String(filtersOrGenreId.keywordId));
      }

      if (typeof filtersOrGenreId.minRating === 'number') {
        params.set('vote_average.gte', String(filtersOrGenreId.minRating));
      }

      page = filtersOrGenreId.page || page;
    }

    params.set('page', String(page));
    return this.request<TmdbPaginatedResponse<TmdbMediaItem>>(`/discover/${type}?${params.toString()}`, { results: [], page: 1, total_pages: 1 });
  }
}