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
  private readonly directFunctionBase = '/.netlify/functions/tmdb';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  private readonly tmdbLanguage = 'en';
  private readonly watchRegion = 'US';

  constructor(private http: HttpClient) { }

  private isHtmlPayload(payload: string): boolean {
    const normalized = payload.trimStart().toLowerCase();
    return normalized.startsWith('<!doctype html') || normalized.startsWith('<html');
  }

  private getFallbackProxyBase(primaryBase: string): string | null {
    if (primaryBase === this.directFunctionBase) {
      return null;
    }

    if (primaryBase.startsWith('/api/tmdb')) {
      return this.directFunctionBase + primaryBase.slice('/api/tmdb'.length);
    }

    return this.directFunctionBase;
  }

  private async fetchJson<T>(url: string): Promise<T | null> {
    try {
      const raw = await firstValueFrom(this.http.get(url, {
        headers: this.headers,
        responseType: 'text'
      }));

      if (typeof raw !== 'string' || !raw.trim()) {
        return null;
      }

      if (this.isHtmlPayload(raw)) {
        return null;
      }

      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private async request<T>(endpoint: string, fallback: T): Promise<T> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return fallback;
    }

    const separator = endpoint.includes('?') ? '&' : '?';
    const endpointWithLanguage = `${endpoint}${separator}language=${encodeURIComponent(this.tmdbLanguage)}`;
    const primaryUrl = `${this.apiProxyBase}${endpointWithLanguage}`;
    const primaryResponse = await this.fetchJson<T>(primaryUrl);
    if (primaryResponse) {
      return primaryResponse;
    }

    const fallbackBase = this.getFallbackProxyBase(this.apiProxyBase);
    if (!fallbackBase) {
      return fallback;
    }

    const fallbackUrl = `${fallbackBase}${endpointWithLanguage}`;
    const fallbackResponse = await this.fetchJson<T>(fallbackUrl);
    return fallbackResponse || fallback;
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