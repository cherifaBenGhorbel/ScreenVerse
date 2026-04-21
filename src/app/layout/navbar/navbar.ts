import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { Favorites } from '../../core/services/favorites';
import { Theme } from '../../core/services/theme';
import { Tmdb } from '../../core/services/tmdb';

@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  host: {
    '(window:scroll)': 'onWindowScroll()'
  },
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  searchQuery = signal<string>('');
  searchResults = signal<any[]>([]);
  isSearching = signal<boolean>(false);
  isScrolled = signal<boolean>(false);
  isSearchFocused = signal<boolean>(false);

  private readonly destroyRef = inject(DestroyRef);
  private searchTimeout?: ReturnType<typeof setTimeout>;
  private keepDropdownOpenOnBlur = false;

  constructor(
    private tmdb: Tmdb,
    private router: Router,
    private favorites: Favorites,
    private theme: Theme
  ) {}

  ngOnInit(): void {
    this.syncSearchQueryFromUrl(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(event => {
        this.searchResults.set([]);
        this.isSearching.set(false);
        this.isSearchFocused.set(false);
        this.syncSearchQueryFromUrl(event.urlAfterRedirects);
      });
  }

  onWindowScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.isScrolled.set(scrollTop > 50);
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    const query = value.trim();
    if (query.length >= 2) {
      this.searchTimeout = setTimeout(() => void this.runSearch(query), 250);
    } else {
      this.searchResults.set([]);
      this.isSearching.set(false);
    }
  }

  async performSearch() {
    const query = this.searchQuery().trim();
    if (!query) return;

    this.searchQuery.set(query);
    this.searchResults.set([]);
    this.isSearchFocused.set(false);
    await this.router.navigate(['/search'], {
      queryParams: { q: query }
    });
  }

  clearSearch() {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.isSearching.set(false);

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (this.router.url.startsWith('/search')) {
      this.router.navigate(['/search']);
    }
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

  openSearchPage(): void {
    const query = this.searchQuery().trim();
    if (!query) return;

    this.searchResults.set([]);
    this.isSearchFocused.set(false);
    void this.router.navigate(['/search'], {
      queryParams: { q: query }
    });
  }

  goToDetail(item: any): void {
    if (!item) return;

    const type = item.media_type;
    this.clearSearch();
    void this.router.navigate(['/detail', type, item.id]);
  }

  mediaLabel(result: any): string {
    return result?.media_type === 'movie' ? 'Movie' : 'TV Show';
  }

  onSearchFocus(): void {
    this.isSearchFocused.set(true);
  }

  onSearchBlur(): void {
    setTimeout(() => {
      if (this.keepDropdownOpenOnBlur) {
        this.keepDropdownOpenOnBlur = false;
        return;
      }

      this.isSearchFocused.set(false);
    }, 0);
  }

  onDropdownMouseDown(): void {
    this.keepDropdownOpenOnBlur = true;
  }

  closeSearchDropdown(): void {
    this.isSearchFocused.set(false);
  }

  private syncSearchQueryFromUrl(url: string): void {
    if (!url.startsWith('/search')) {
      return;
    }

    const queryString = url.split('?')[1] ?? '';
    const params = new URLSearchParams(queryString);
    this.searchQuery.set((params.get('q') ?? '').trim());

    if (!this.searchQuery()) {
      this.searchResults.set([]);
      this.isSearching.set(false);
    }
  }

  private async runSearch(query: string): Promise<void> {
    this.isSearching.set(true);

    try {
      const response = await this.tmdb.searchMulti(query);
      const normalizedQuery = query.toLowerCase();

      const results = (response?.results || [])
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .filter((item: any) => {
          const title = (item.title || item.name || '').trim().toLowerCase();
          return title.startsWith(normalizedQuery);
        })
        .slice(0, 6);

      this.searchResults.set(results);
    } catch (error) {
      console.error('Search failed:', error);
      this.searchResults.set([]);
    } finally {
      this.isSearching.set(false);
    }
  }
}