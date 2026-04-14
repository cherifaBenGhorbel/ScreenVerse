import { Injectable, computed, signal } from '@angular/core';
import { MediaType } from '../../models/tmdb';
import { WatchedItem } from '../../models/watch-history';

@Injectable({
  providedIn: 'root'
})
export class WatchHistory {
  private readonly storageKey = 'screenverse_watch_history';
  private readonly maxItems = 100;

  private readonly historyState = signal<WatchedItem[]>(this.readHistory());

  readonly history = computed(() => this.historyState());

  record(media: any, mediaType: MediaType): void {
    const id = Number(media?.id);
    if (!Number.isFinite(id) || id <= 0) return;

    const normalized: WatchedItem = {
      id,
      media_type: mediaType,
      title: media?.title,
      name: media?.name,
      genres: Array.isArray(media?.genres)
        ? media.genres
            .map((genre: any) => Number(genre?.id))
            .filter((genreId: number) => Number.isFinite(genreId) && genreId > 0)
        : [],
      origin_countries: this.extractOriginCountries(media),
      original_language: typeof media?.original_language === 'string' ? media.original_language : undefined,
      vote_average: Number.isFinite(media?.vote_average) ? Number(media.vote_average) : undefined,
      watched_at: Date.now()
    };

    const existing = this.historyState().filter(item => !(item.id === normalized.id && item.media_type === normalized.media_type));
    const next = [normalized, ...existing].slice(0, this.maxItems);
    this.persist(next);
  }

  getRecent(limit = 12): WatchedItem[] {
    return this.historyState().slice(0, Math.max(1, limit));
  }

  private readHistory(): WatchedItem[] {
    if (typeof localStorage === 'undefined') return [];

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter(item => item && Number.isFinite(item.id) && (item.media_type === 'movie' || item.media_type === 'tv'))
        .map(item => ({
          id: Number(item.id),
          media_type: item.media_type as MediaType,
          title: item.title,
          name: item.name,
          genres: Array.isArray(item.genres)
            ? item.genres
                .map((genreId: any) => Number(genreId))
                .filter((genreId: number) => Number.isFinite(genreId) && genreId > 0)
            : [],
          origin_countries: Array.isArray(item.origin_countries)
            ? item.origin_countries
                .map((country: any) => typeof country === 'string' ? country.trim().toUpperCase() : '')
                .filter((country: string) => /^[A-Z]{2}$/.test(country))
            : [],
          original_language: typeof item.original_language === 'string' ? item.original_language : undefined,
          vote_average: Number.isFinite(item.vote_average) ? Number(item.vote_average) : undefined,
          watched_at: Number.isFinite(item.watched_at) ? Number(item.watched_at) : Date.now()
        }))
        .sort((a, b) => b.watched_at - a.watched_at)
        .slice(0, this.maxItems);
    } catch {
      return [];
    }
  }

  private persist(items: WatchedItem[]): void {
    this.historyState.set(items);
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch {
      // Ignore persistence errors (private mode/quota) and keep in-memory state.
    }
  }

  private extractOriginCountries(media: any): string[] {
    const fromTv = Array.isArray(media?.origin_country)
      ? media.origin_country
      : [];

    const fromMovie = Array.isArray(media?.production_countries)
      ? media.production_countries.map((country: any) => country?.iso_3166_1)
      : [];

    const countries = [...fromTv, ...fromMovie]
      .map((country: any) => typeof country === 'string' ? country.trim().toUpperCase() : '')
      .filter((country: string) => /^[A-Z]{2}$/.test(country));

    return Array.from(new Set(countries));
  }
}