import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { DiscoverFilters, Tmdb } from '../../core/services/tmdb';
import { MovieCard } from '../../shared/components/movie-card/movie-card';

@Component({
  selector: 'app-tv-shows',
  standalone: true,
  imports: [CommonModule, MovieCard],
  templateUrl: './tv-shows.html',
  styleUrl: './tv-shows.css',
})
export class TvShows implements OnInit {
  shows = signal<any[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  currentPage = signal(1);
  totalPages = signal(1);
  readonly maxPageWindow = 5;

  selectedGenre = signal('');
  selectedCountry = signal('');
  selectedRating = signal('');

  readonly genreOptions = [
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
    { label: 'Sci-Fi & Fantasy', value: '10765' }
  ];

  readonly countryOptions = [
    { label: 'All countries', value: '' },
    { label: 'United States', value: 'US' },
    { label: 'France', value: 'FR' },
    { label: 'Turkey', value: 'TR' },
    { label: 'China', value: 'CN' },
    { label: 'Japan', value: 'JP' },
    { label: 'South Korea', value: 'KR' },
    { label: 'Tunisia', value: 'TN' },
    { label: 'India', value: 'IN' },
    { label: 'United Kingdom', value: 'GB' },
    { label: 'Egypt', value: 'EG' }
  ];

  readonly ratingOptions = [
    { label: 'Any rating', value: '' },
    { label: '6+', value: '6' },
    { label: '7+', value: '7' },
    { label: '8+', value: '8' }
  ];

  constructor(private tmdb: Tmdb) {}

  ngOnInit(): void {
    this.loadTvShows();
  }

  async loadTvShows(page = this.currentPage()): Promise<void> {
    if (page < 1) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const data = await this.tmdb.getDiscover('tv', this.buildFilters(page));
      const shows = data?.results || [];
      const total = Number(data?.total_pages) || 1;

      this.currentPage.set(page);
      this.totalPages.set(Math.max(1, Math.min(total, 500)));
      this.shows.set(shows);

      if (!shows.length) {
        this.errorMessage.set(
          navigator.onLine
            ? 'No TV shows are available right now. Please try again.'
            : 'You are offline. Reconnect and retry to load TV shows.'
        );
      }
    } catch (error) {
      console.error('Error loading TV shows:', error);
      this.shows.set([]);
      this.errorMessage.set(
        navigator.onLine
          ? 'Could not load TV shows. Please try again.'
          : 'You are offline. Reconnect and retry to load TV shows.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  retryLoad(): void {
    this.loadTvShows();
  }

  applyFilters(): void {
    this.loadTvShows(1);
  }

  resetFilters(): void {
    this.selectedGenre.set('');
    this.selectedCountry.set('');
    this.selectedRating.set('');
    this.loadTvShows(1);
  }

  hasActiveFilters(): boolean {
    return !!this.selectedGenre() || !!this.selectedCountry() || !!this.selectedRating();
  }

  prevPage(): void {
    if (this.currentPage() <= 1 || this.isLoading()) return;
    this.loadTvShows(this.currentPage() - 1);
  }

  nextPage(): void {
    if (this.currentPage() >= this.totalPages() || this.isLoading()) return;
    this.loadTvShows(this.currentPage() + 1);
  }

  goToPage(page: number): void {
    if (page === this.currentPage() || this.isLoading()) return;
    this.loadTvShows(page);
  }

  pageWindow(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const half = Math.floor(this.maxPageWindow / 2);
    const start = Math.max(1, Math.min(current - half, total - this.maxPageWindow + 1));
    const end = Math.min(total, start + this.maxPageWindow - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  private buildFilters(page: number): DiscoverFilters {
    return {
      page,
      genreId: this.selectedGenre() ? Number(this.selectedGenre()) : undefined,
      originCountry: this.selectedCountry() || undefined,
      minRating: this.selectedRating() ? Number(this.selectedRating()) : undefined
    };
  }
}
