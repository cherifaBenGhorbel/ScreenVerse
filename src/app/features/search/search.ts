import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Tmdb } from '../../core/services/tmdb';
import { MediaType, TmdbMediaItem } from '../../models/tmdb';
import { MovieCard } from '../../shared/components/movie-card/movie-card';

type SearchContentType = 'all' | 'movie' | 'tv';

interface SearchGenreOption {
  label: string;
  value: string;
}

interface SearchResultItem extends TmdbMediaItem {
  media_type: MediaType;
}

@Component({
  selector: 'app-search-results-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MovieCard],
  templateUrl: './search.html',
  styleUrl: './search.css'
})
export class SearchResultsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly tmdb = inject(Tmdb);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchQuery = signal('');
  readonly contentType = signal<SearchContentType>('all');
  readonly selectedGenre = signal('');
  readonly selectedYear = signal('');
  readonly selectedRating = signal('');
  readonly searchResults = signal<SearchResultItem[]>([]);
  readonly isLoading = signal(false);
  readonly searchError = signal('');

  readonly movieGenreOptions: SearchGenreOption[] = [
    { label: 'All genres', value: '' },
    { label: 'Action', value: '28' },
    { label: 'Adventure', value: '12' },
    { label: 'Animation', value: '16' },
    { label: 'Comedy', value: '35' },
    { label: 'Crime', value: '80' },
    { label: 'Drama', value: '18' },
    { label: 'Family', value: '10751' },
    { label: 'Fantasy', value: '14' },
    { label: 'History', value: '36' },
    { label: 'Horror', value: '27' },
    { label: 'Romance', value: '10749' },
    { label: 'Sci-Fi', value: '878' },
    { label: 'Thriller', value: '53' }
  ];

  readonly tvGenreOptions: SearchGenreOption[] = [
    { label: 'All genres', value: '' },
    { label: 'Action & Adventure', value: '10759' },
    { label: 'Animation', value: '16' },
    { label: 'Comedy', value: '35' },
    { label: 'Crime', value: '80' },
    { label: 'Documentary', value: '99' },
    { label: 'Drama', value: '18' },
    { label: 'Family', value: '10751' },
    { label: 'Kids', value: '10762' },
    { label: 'Mystery', value: '9648' },
    { label: 'Sci-Fi & Fantasy', value: '10765' },
    { label: 'War & Politics', value: '10768' }
  ];

  readonly genreOptions = computed<SearchGenreOption[]>(() => {
    if (this.contentType() === 'movie') {
      return this.movieGenreOptions;
    }

    if (this.contentType() === 'tv') {
      return this.tvGenreOptions;
    }

    const merged = new Map<string, SearchGenreOption>();

    for (const option of [...this.movieGenreOptions, ...this.tvGenreOptions]) {
      if (!option.value) {
        continue;
      }

      if (!merged.has(option.value)) {
        merged.set(option.value, option);
      }
    }

    return [
      { label: 'All genres', value: '' },
      ...Array.from(merged.values()).sort((a, b) => a.label.localeCompare(b.label))
    ];
  });

  readonly ratingOptions: SearchGenreOption[] = [
    { label: 'Any rating', value: '' },
    { label: '6+', value: '6' },
    { label: '7+', value: '7' },
    { label: '8+', value: '8' },
    { label: '9+', value: '9' }
  ];

  readonly filteredResults = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const contentType = this.contentType();
    const genreId = this.selectedGenre();
    const year = this.selectedYear().trim();
    const rating = this.selectedRating();

    return this.searchResults().filter(item => {
      if (contentType !== 'all' && item.media_type !== contentType) {
        return false;
      }

      const title = this.getTitle(item).trim().toLowerCase();
      if (query && !title.startsWith(query)) {
        return false;
      }

      if (genreId) {
        const numericGenreId = Number(genreId);
        if (!item.genre_ids?.includes(numericGenreId)) {
          return false;
        }
      }

      if (year && this.getYear(item) !== year) {
        return false;
      }

      if (rating && (item.vote_average ?? 0) < Number(rating)) {
        return false;
      }

      return true;
    });
  });

  readonly hasActiveFilters = computed(() => {
    return this.contentType() !== 'all'
      || !!this.selectedGenre()
      || !!this.selectedYear()
      || !!this.selectedRating();
  });

  readonly moviesCount = computed(() => this.searchResults().filter(item => item.media_type === 'movie').length);
  readonly tvShowsCount = computed(() => this.searchResults().filter(item => item.media_type === 'tv').length);

  readonly hasUnfilteredResults = computed(() => this.searchResults().length > 0);
  readonly hasFilterOnlyNoMatch = computed(() => {
    return this.hasUnfilteredResults() && this.filteredResults().length === 0 && this.hasActiveFilters();
  });

  private searchRequestId = 0;

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const query = (params.get('q') ?? '').trim();
        void this.loadSearch(query);
      });
  }

  async loadSearch(query: string): Promise<void> {
    const requestId = ++this.searchRequestId;

    this.searchQuery.set(query);
    this.resetFilters();

    if (!query) {
      this.searchResults.set([]);
      this.searchError.set('');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.searchError.set('');

    try {
      const response = await this.tmdb.searchMulti(query);

      if (requestId !== this.searchRequestId) {
        return;
      }

      const normalizedQuery = query.toLowerCase();
      const results = (response?.results || [])
        .filter((item): item is SearchResultItem => item.media_type === 'movie' || item.media_type === 'tv')
        .filter(item => this.getTitle(item).trim().toLowerCase().startsWith(normalizedQuery));

      this.searchResults.set(results);
    } catch (error) {
      console.error('Search failed:', error);

      if (requestId !== this.searchRequestId) {
        return;
      }

      this.searchResults.set([]);
      this.searchError.set(
        navigator.onLine
          ? 'Could not load search results. Please try again.'
          : 'You are offline. Reconnect and retry the search.'
      );
    } finally {
      if (requestId === this.searchRequestId) {
        this.isLoading.set(false);
      }
    }
  }

  setContentType(value: string): void {
    this.contentType.set(value === 'movie' || value === 'tv' ? value : 'all');
    this.selectedGenre.set('');
  }

  setGenre(value: string): void {
    this.selectedGenre.set(value);
  }

  setYear(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    this.selectedYear.set(digits);
  }

  setRating(value: string): void {
    this.selectedRating.set(value);
  }

  resetFilters(): void {
    this.contentType.set('all');
    this.selectedGenre.set('');
    this.selectedYear.set('');
    this.selectedRating.set('');
  }

  clearFiltersOnly(): void {
    this.resetFilters();
  }

  retrySearch(): void {
    void this.loadSearch(this.searchQuery());
  }

  getTitle(item: SearchResultItem): string {
    return item.title || item.name || 'Untitled';
  }

  getYear(item: SearchResultItem): string {
    const date = item.release_date || item.first_air_date || '';
    return date ? date.substring(0, 4) : '';
  }

  getRating(item: SearchResultItem): string {
    const rating = item.vote_average;
    return typeof rating === 'number' && rating > 0 ? rating.toFixed(1) : 'N/A';
  }

}