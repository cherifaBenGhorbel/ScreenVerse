import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { MediaType, Tmdb } from '../../core/services/tmdb';

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

interface TvEpisode {
  episode_number: number;
  name: string;
  overview?: string;
  runtime?: number;
  air_date?: string;
  still_path?: string;
}

@Component({
  selector: 'app-watch',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './watch.html',
  styleUrl: './watch.css'
})
export class Watch implements OnInit {
  media = signal<any>(null);
  mediaType = signal<MediaType>('movie');
  mediaId = signal<number>(0);
  isLoading = signal(true);
  errorMessage = signal('');
  selectedServer = signal(1);

  watchUrl = signal<SafeResourceUrl | null>(null);
  watchRegion = signal<WatchRegion | null>(null);
  watchRegionCode = signal('US');
  watchLink = signal('');

  seasons = signal<any[]>([]);
  selectedSeason = signal<number | null>(null);
  episodes = signal<TvEpisode[]>([]);
  selectedEpisode = signal<TvEpisode | null>(null);

  private siteUrl = environment.tmdb.siteUrl1.replace(/\/+$/, '');

  constructor(
    private route: ActivatedRoute,
    private tmdb: Tmdb,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const type = params['type'] as string;
      const id = Number(params['id']);
      this.loadWatchPage(type, id);
    });
  }

  async loadWatchPage(type: string, id: number): Promise<void> {
    if ((type !== 'movie' && type !== 'tv') || !Number.isFinite(id) || id <= 0) {
      this.errorMessage.set('Invalid watch request.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.mediaType.set(type);
    this.mediaId.set(id);
    this.media.set(null);
    this.watchUrl.set(null);
    this.watchRegion.set(null);
    this.watchRegionCode.set('US');
    this.watchLink.set('');
    this.selectedServer.set(1);
    this.seasons.set([]);
    this.selectedSeason.set(null);
    this.episodes.set([]);
    this.selectedEpisode.set(null);

    try {
      const [details, providers] = await Promise.all([
        this.tmdb.getDetails(type, id),
        this.tmdb.getWatchProviders(type as MediaType, id)
      ]);

      if (!details) {
        this.errorMessage.set('Unable to load watch details. You may be offline.');
        return;
      }

      this.media.set(details);
      this.pickRegion((providers as any)?.results || {});

      if (type === 'movie') {
        this.updateWatchUrl(this.buildMovieWatchUrl(id, this.selectedServer()));
      }

      if (type === 'tv') {
        this.watchLink.set('');
        const usableSeasons = (details?.seasons || []).filter((season: any) => Number(season?.season_number) >= 1);
        this.seasons.set(usableSeasons);
        if (usableSeasons.length > 0) {
          await this.changeSeason(Number(usableSeasons[0].season_number));
        }
      }
    } catch (error) {
      console.error('Failed to load watch page:', error);
      this.errorMessage.set('Could not load watch page right now. Please retry.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private pickRegion(providerResults: Record<string, WatchRegion>): void {
    const preferred = ['US', 'GB', 'CA', 'AU', ...Object.keys(providerResults)];
    const region = preferred.find(code => {
      const row = providerResults[code];
      return row && (row.flatrate?.length || row.rent?.length || row.buy?.length || row.link);
    });

    if (!region) return;

    this.watchRegionCode.set(region);
    this.watchRegion.set(providerResults[region]);
    this.watchLink.set(providerResults[region]?.link || '');
  }

  async changeSeason(seasonNumber: number): Promise<void> {
    if (this.mediaType() !== 'tv' || !seasonNumber) return;

    this.selectedSeason.set(seasonNumber);
    this.episodes.set([]);
    this.selectedEpisode.set(null);

    try {
      const season = await this.tmdb.getSeasonDetails(this.mediaId(), seasonNumber);
      const episodes = (season?.episodes || []) as TvEpisode[];
      this.episodes.set(episodes);
      if (episodes.length > 0) {
        this.selectedEpisode.set(episodes[0]);
        this.updateWatchUrl(this.buildTvWatchUrl(this.mediaId(), seasonNumber, episodes[0].episode_number, this.selectedServer()));
      } else {
        this.updateWatchUrl('');
      }
    } catch (error) {
      console.error('Failed to load season episodes:', error);
      this.episodes.set([]);
      this.updateWatchUrl('');
    }
  }

  chooseEpisode(episode: TvEpisode): void {
    this.selectedEpisode.set(episode);
    if (this.mediaType() === 'tv' && this.selectedSeason()) {
      this.updateWatchUrl(this.buildTvWatchUrl(this.mediaId(), this.selectedSeason()!, episode.episode_number, this.selectedServer()));
    }
  }

  selectServer(serverNumber: number): void {
    if (serverNumber < 1 || serverNumber > 4 || this.selectedServer() === serverNumber) return;

    this.selectedServer.set(serverNumber);
    this.refreshWatchUrl();
  }

  providerLogo(path: string | undefined): string {
    return path ? `https://image.tmdb.org/t/p/w92${path}` : '';
  }

  episodeImage(path: string | undefined): string {
    return path ? `https://image.tmdb.org/t/p/w780${path}` : '';
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

  title(): string {
    return this.media()?.title || this.media()?.name || 'Untitled';
  }

  private buildMovieWatchUrl(movieId: number, serverNumber: number): string {
    return `${this.getServerBaseUrl(serverNumber)}/movie/${movieId}`;
  }

  private buildTvWatchUrl(tvId: number, seasonNumber: number, episodeNumber: number, serverNumber: number): string {
    return `${this.getServerBaseUrl(serverNumber)}/tv/${tvId}/${seasonNumber}/${episodeNumber}`;
  }

  private getServerBaseUrl(serverNumber: number): string {
    const serverMap: Record<number, string> = {
      1: environment.tmdb.siteUrl1,
      2: environment.tmdb.siteUrl2,
      3: environment.tmdb.siteUrl3,
      4: environment.tmdb.siteUrl4
    };

    return (serverMap[serverNumber] || this.siteUrl).replace(/\/+$/, '');
  }

  private refreshWatchUrl(): void {
    if (this.mediaType() === 'movie') {
      this.updateWatchUrl(this.buildMovieWatchUrl(this.mediaId(), this.selectedServer()));
      return;
    }

    if (this.mediaType() === 'tv' && this.selectedSeason() && this.selectedEpisode()) {
      this.updateWatchUrl(
        this.buildTvWatchUrl(
          this.mediaId(),
          this.selectedSeason()!,
          this.selectedEpisode()!.episode_number,
          this.selectedServer()
        )
      );
      return;
    }

    this.updateWatchUrl('');
  }

  private updateWatchUrl(url: string): void {
    this.watchUrl.set(
      url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null
    );
  }
}
