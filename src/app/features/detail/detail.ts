import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FavoriteMediaType, Favorites } from '../../core/services/favorites';
import { Tmdb } from '../../core/services/tmdb';

interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface WatchRegion {
  link?: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detail.html',
  styleUrl: './detail.css'
})
export class Detail implements OnInit {

  media = signal<any>(null);
  trailerUrl = signal<SafeResourceUrl | null>(null);
  trailerWatchUrl = signal<string>('');
  mediaType = signal<FavoriteMediaType>('movie');
  watchRegion = signal<WatchRegion | null>(null);
  watchRegionCode = signal<string>('US');
  watchLink = signal<string>('');
  errorMessage = signal<string>('');
  isLoading = signal(true);
  currentId = signal<number>(0);
  currentType = signal<FavoriteMediaType>('movie');

  constructor(
    private route: ActivatedRoute,
    private tmdb: Tmdb,
    private sanitizer: DomSanitizer,
    private favorites: Favorites
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const type = params['type'];
      const id = +params['id'];
      this.currentType.set(type === 'tv' ? 'tv' : 'movie');
      this.currentId.set(id);
      this.loadDetail(type, id);
    });
  }

  async loadDetail(type: string, id: number) {
    try {
      if ((type !== 'movie' && type !== 'tv') || !Number.isFinite(id) || id <= 0) {
        this.media.set(null);
        this.trailerUrl.set(null);
        this.errorMessage.set('Invalid title requested.');
        return;
      }

      this.isLoading.set(true);
      this.errorMessage.set('');
      this.mediaType.set(type);
      this.trailerUrl.set(null);
      this.trailerWatchUrl.set('');
      this.watchRegion.set(null);
      this.watchRegionCode.set('US');
      this.watchLink.set('');
      
      // Get main details
      const details = await this.tmdb.getDetails(type, id);
      if (!details) {
        this.media.set(null);
        this.errorMessage.set('Unable to load this title. You might be offline.');
        return;
      }
      this.media.set(details);

      const [videos, providersData] = await Promise.all([
        this.tmdb.getVideos(type, id),
        this.tmdb.getWatchProviders(type, id)
      ]);
      
      const trailer = videos.results?.find((v: any) => 
        v.site === 'YouTube' && 
        (v.type === 'Trailer' || v.type === 'Official Trailer')
      ) || videos.results?.find((v: any) => v.site === 'YouTube');

      if (trailer) {
        this.trailerUrl.set(
          this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://www.youtube.com/embed/${trailer.key}?autoplay=0&modestbranding=1`
          )
        );
        this.trailerWatchUrl.set(`https://www.youtube.com/watch?v=${trailer.key}`);
      }

      const providerResults = providersData?.results || {};
      const prioritizedRegions = ['US', 'GB', 'CA', 'AU', ...Object.keys(providerResults)];
      const pickedRegion = prioritizedRegions.find(region => {
        const data = providerResults[region];
        return data && (data.flatrate?.length || data.rent?.length || data.buy?.length);
      });

      if (pickedRegion) {
        this.watchRegionCode.set(pickedRegion);
        this.watchRegion.set(providerResults[pickedRegion]);
        this.watchLink.set(providerResults[pickedRegion]?.link || '');
      }
    } catch (error) {
      console.error('Error loading detail:', error);
      this.errorMessage.set('We could not load this title right now. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  getTitle(): string {
    return this.media()?.title || this.media()?.name || 'Untitled';
  }

  getReleaseYear(): string {
    const date = this.media()?.release_date || this.media()?.first_air_date;
    return date ? date.substring(0, 4) : 'N/A';
  }

  getRuntimeOrSeasons(): string {
    if (this.mediaType() === 'movie') {
      return this.media()?.runtime ? `${this.media().runtime} min` : 'Runtime unavailable';
    }

    const seasons = this.media()?.number_of_seasons;
    if (!seasons) return 'Season count unavailable';
    return `${seasons} season${seasons > 1 ? 's' : ''}`;
  }

  getEpisodeCount(): string {
    const episodes = this.media()?.number_of_episodes;
    return Number.isFinite(episodes) && episodes > 0 ? String(episodes) : 'N/A';
  }

  getDateRange(): string {
    if (this.mediaType() === 'movie') {
      return this.media()?.release_date || 'N/A';
    }

    const first = this.media()?.first_air_date;
    const last = this.media()?.last_air_date;
    if (!first && !last) return 'N/A';
    return `${first || 'N/A'} → ${last || 'Present'}`;
  }

  getCountries(): string {
    if (this.mediaType() === 'movie') {
      const countries = this.media()?.production_countries?.map((country: any) => country.name).filter(Boolean) || [];
      return countries.length ? countries.join(', ') : 'N/A';
    }

    const countries = this.media()?.origin_country || [];
    return countries.length ? countries.join(', ') : 'N/A';
  }

  getLanguages(): string {
    const spoken = this.media()?.spoken_languages?.map((lang: any) => lang.english_name || lang.name).filter(Boolean) || [];
    return spoken.length ? spoken.slice(0, 4).join(', ') : 'N/A';
  }

  getStudios(): string {
    const companies = this.media()?.production_companies?.map((company: any) => company.name).filter(Boolean) || [];
    return companies.length ? companies.slice(0, 4).join(', ') : 'N/A';
  }

  getNetworks(): string {
    const networks = this.media()?.networks?.map((network: any) => network.name).filter(Boolean) || [];
    return networks.length ? networks.slice(0, 4).join(', ') : 'N/A';
  }

  getTopCast(): string[] {
    const cast = this.media()?.credits?.cast || [];
    return cast.slice(0, 8).map((person: any) => person.name).filter(Boolean);
  }

  formatMoney(value: number | undefined): string {
    if (!Number.isFinite(value) || !value) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  imdbUrl(): string {
    const imdbId = this.media()?.external_ids?.imdb_id;
    return imdbId ? `https://www.imdb.com/title/${imdbId}` : '';
  }

  providerLogo(path: string | undefined): string {
    if (!path) return '';
    return `https://image.tmdb.org/t/p/w92${path}`;
  }

  uniqueProviders(providers: WatchProvider[] | undefined): WatchProvider[] {
    if (!providers?.length) return [];
    const seen = new Set<number>();
    return providers.filter(provider => {
      if (seen.has(provider.provider_id)) return false;
      seen.add(provider.provider_id);
      return true;
    });
  }

  isFavorite(): boolean {
    const item = this.media();
    return this.favorites.isFavorite(item?.id, this.mediaType());
  }

  toggleFavorite(): void {
    this.favorites.toggle(this.media(), this.mediaType());
  }

  retryLoad(): void {
    this.loadDetail(this.currentType(), this.currentId());
  }
}