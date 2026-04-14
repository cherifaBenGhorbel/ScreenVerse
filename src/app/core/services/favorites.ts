import { Injectable, computed, signal } from '@angular/core';
import { FavoriteItem, FavoriteMediaType } from '../../models/favorites';

@Injectable({
  providedIn: 'root'
})
export class Favorites {
  private readonly cookieName = 'screenverse_favorites';
  private readonly maxAgeSeconds = 60 * 60 * 24 * 365;
  private readonly maxItems = 60;

  private readonly favoritesState = signal<FavoriteItem[]>(this.readFavorites());

  readonly favorites = computed(() => this.favoritesState());
  readonly count = computed(() => this.favoritesState().length);

  isFavorite(id: number | undefined, mediaType: FavoriteMediaType): boolean {
    if (!id) return false;
    return this.favoritesState().some(item => item.id === id && item.media_type === mediaType);
  }

  add(item: FavoriteItem): void {
    if (!item?.id) return;

    const normalized = this.normalize(item);
    const current = this.favoritesState();

    if (current.some(existing => existing.id === normalized.id && existing.media_type === normalized.media_type)) {
      return;
    }

    const next = [normalized, ...current].slice(0, this.maxItems);
    this.persist(next);
  }

  remove(id: number, mediaType: FavoriteMediaType): void {
    const next = this.favoritesState().filter(item => !(item.id === id && item.media_type === mediaType));
    this.persist(next);
  }

  toggle(item: Partial<FavoriteItem> | null | undefined, mediaType: FavoriteMediaType): void {
    if (!item?.id) return;

    if (this.isFavorite(item.id, mediaType)) {
      this.remove(item.id, mediaType);
      return;
    }

    this.add({
      id: item.id,
      media_type: mediaType,
      title: item.title,
      name: item.name,
      poster_path: item.poster_path ?? null,
      backdrop_path: item.backdrop_path ?? null,
      vote_average: item.vote_average,
      release_date: item.release_date,
      first_air_date: item.first_air_date
    });
  }

  private normalize(item: FavoriteItem): FavoriteItem {
    return {
      id: item.id,
      media_type: item.media_type,
      title: item.title,
      name: item.name,
      poster_path: item.poster_path ?? null,
      backdrop_path: item.backdrop_path ?? null,
      vote_average: item.vote_average,
      release_date: item.release_date,
      first_air_date: item.first_air_date
    };
  }

  private readFavorites(): FavoriteItem[] {
    if (typeof document === 'undefined') return [];

    const rawCookie = document.cookie
      .split('; ')
      .find(cookie => cookie.startsWith(`${this.cookieName}=`));

    if (!rawCookie) return [];

    const encodedValue = rawCookie.substring(this.cookieName.length + 1);
    try {
      const parsed = JSON.parse(decodeURIComponent(encodedValue));
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter(item => item && typeof item.id === 'number' && (item.media_type === 'movie' || item.media_type === 'tv'))
        .map(item => this.normalize(item as FavoriteItem));
    } catch {
      return [];
    }
  }

  private persist(items: FavoriteItem[]): void {
    this.favoritesState.set(items);
    if (typeof document === 'undefined') return;

    const value = encodeURIComponent(JSON.stringify(items));
    document.cookie = `${this.cookieName}=${value}; Max-Age=${this.maxAgeSeconds}; Path=/; SameSite=Lax`;
  }
}
