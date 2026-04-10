import { CommonModule } from '@angular/common';
import { Component, HostListener, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Favorites } from '../../core/services/favorites';
import { Language } from '../../core/services/language';
import { Theme } from '../../core/services/theme';

import { Tmdb } from '../../core/services/tmdb';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  searchQuery = signal<string>('');
  searchResults = signal<any[]>([]);
  isSearching = signal<boolean>(false);
  isScrolled = signal<boolean>(false);

  private searchTimeout: any;

  constructor(
    private tmdb: Tmdb,
    private router: Router,
    private favorites: Favorites,
    private theme: Theme,
    public language: Language
  ) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.isScrolled.set(scrollTop > 50);
  }

  async onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value.trim();
    this.searchQuery.set(value);

    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    if (value.length >= 2) {
      this.searchTimeout = setTimeout(() => this.runSearch(value), 300);
    } else {
      this.searchResults.set([]);
      this.isSearching.set(false);
    }
  }

  async performSearch() {
    const query = this.searchQuery().trim();
    if (query.length < 2) return;

    // There is no dedicated search route; open the best matching result.
    if (!this.searchResults().length) {
      await this.runSearch(query);
    }

    const firstResult = this.searchResults()[0];
    if (firstResult) {
      this.goToDetail(firstResult);
    }
  }

  goToDetail(item: any) {
    if (!item) return;
    const type = item.media_type;
    this.router.navigate(['/detail', type, item.id]);
    this.clearSearch();
  }

  clearSearch() {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.isSearching.set(false);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  }

  toggleLanguage(): void {
    this.language.toggleLanguage();
  }

  getPoster(item: any): string {
    const path = item?.poster_path || item?.backdrop_path;
    if (!path) {
      return 'https://via.placeholder.com/48x72/2a2a2a/666?text=No+Image';
    }
    return `https://image.tmdb.org/t/p/w185${path}`;
  }

  getFavoritesCount(): number {
    return this.favorites.count();
  }

  isLightTheme(): boolean {
    return this.theme.isLightTheme();
  }

  toggleTheme(): void {
    this.theme.toggleTheme();
  }

  isFrench(): boolean {
    return this.language.isFrench();
  }

  private async runSearch(query: string): Promise<void> {
    this.isSearching.set(true);

    try {
      const response = await this.tmdb.searchMulti(query);

      const textResults = (response?.results || [])
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .slice(0, 8);

      this.searchResults.set(textResults);
    } catch (error) {
      console.error('Search failed:', error);
      this.searchResults.set([]);
    } finally {
      this.isSearching.set(false);
    }
  }

  mediaLabel(result: any): string {
    return result?.media_type === 'movie' ? this.language.t('nav.movies') : this.language.t('nav.tvShows');
  }
}