import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Recommendations } from '../../core/services/recommendations';
import { Tmdb } from '../../core/services/tmdb';
import { WatchHistory } from '../../core/services/watch-history';
import { MediaType, TmdbMediaItem } from '../../models/tmdb';

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
  imports: [CommonModule, RouterLink],
  templateUrl: './watch.html',
  styleUrl: './watch.css'
})
export class Watch implements OnInit, OnDestroy {
  media = signal<any>(null);
  mediaType = signal<MediaType>('movie');
  mediaId = signal<number>(0);
  isLoading = signal(true);
  errorMessage = signal('');
  selectedServer = signal(1);

  watchUrl = signal<SafeResourceUrl | null>(null);
  watchPageUrl = signal('');
  watchPlaybackState = signal<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  watchPlaybackMessage = signal('');

  seasons = signal<any[]>([]);
  selectedSeason = signal<number | null>(null);
  episodes = signal<TvEpisode[]>([]);
  selectedEpisode = signal<TvEpisode | null>(null);

  watchRecommendations = signal<TmdbMediaItem[]>([]);
  recommendationReason = signal('');
  recommendationLoading = signal(false);
  recommendationError = signal('');

  private playbackTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly playbackTimeoutMs = 15000;

  constructor(
    private route: ActivatedRoute,
    private tmdb: Tmdb,
    private sanitizer: DomSanitizer,
    private watchHistory: WatchHistory,
    private recommendations: Recommendations
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const type = params['type'] as string;
      const id = Number(params['id']);
      this.loadWatchPage(type, id);
    });
  }

  ngOnDestroy(): void {
    this.clearPlaybackWatchdog();
  }

  async loadWatchPage(type: string, id: number): Promise<void> {
    if ((type !== 'movie' && type !== 'tv') || !Number.isFinite(id) || id <= 0) {
      this.errorMessage.set('Invalid watch request.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.mediaType.set(type as MediaType);
    this.mediaId.set(id);
    this.media.set(null);
    this.watchUrl.set(null);
    this.watchPageUrl.set('');
    this.watchPlaybackState.set('idle');
    this.watchPlaybackMessage.set('');
    this.selectedServer.set(1);
    this.seasons.set([]);
    this.selectedSeason.set(null);
    this.episodes.set([]);
    this.selectedEpisode.set(null);
    this.watchRecommendations.set([]);
    this.recommendationReason.set('');
    this.recommendationError.set('');
    this.recommendationLoading.set(true);

    try {
      const details = await this.tmdb.getDetails(type as MediaType, id);

      if (!details) {
        this.errorMessage.set('Unable to load watch details. You may be offline.');
        return;
      }

      this.media.set(details);
      this.watchHistory.record(details, type as MediaType);
      await this.loadWatchRecommendations(type as MediaType, id);

      if (type === 'movie') {
        this.updateWatchUrl(this.buildMovieWatchUrl(id, this.selectedServer()));
      }

      if (type === 'tv') {
        const usableSeasons = (details?.seasons || []).filter((season: any) => Number(season?.season_number) >= 1);
        this.seasons.set(usableSeasons);
        if (usableSeasons.length > 0) {
          await this.changeSeason(Number(usableSeasons[0].season_number));
        }
      }
    } catch {
      this.errorMessage.set('Could not load watch page right now. Please retry.');
      this.recommendationError.set('Could not load up-next recommendations right now.');
    } finally {
      this.recommendationLoading.set(false);
      this.isLoading.set(false);
    }
  }

  async retryRecommendations(): Promise<void> {
    await this.loadWatchRecommendations(this.mediaType(), this.mediaId());
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
    } catch {
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

  episodeImage(path: string | undefined): string {
    return path ? `https://image.tmdb.org/t/p/w780${path}` : '';
  }

  title(): string {
    return this.media()?.title || this.media()?.name || 'Untitled';
  }

  recommendationTitle(item: TmdbMediaItem): string {
    return item?.title || item?.name || 'Untitled';
  }

  recommendationYear(item: TmdbMediaItem): string {
    const date = item?.release_date || item?.first_air_date;
    return date ? date.substring(0, 4) : 'N/A';
  }

  recommendationPoster(item: TmdbMediaItem): string {
    const path = (item as any)?.poster_path;
    return path ? `https://image.tmdb.org/t/p/w342${path}` : 'https://via.placeholder.com/300x450/1a1a1a/666?text=No+Poster';
  }

  private buildMovieWatchUrl(movieId: number, serverNumber: number): string {
    return `/api/watch/movie/${movieId}?server=${serverNumber}`;
  }

  private buildTvWatchUrl(tvId: number, seasonNumber: number, episodeNumber: number, serverNumber: number): string {
    return `/api/watch/tv/${tvId}/${seasonNumber}/${episodeNumber}?server=${serverNumber}`;
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
    this.clearPlaybackWatchdog();
    this.watchPageUrl.set(url);
    this.watchUrl.set(url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null);

    if (url) {
      this.watchPlaybackState.set('loading');
      this.watchPlaybackMessage.set('Loading provider...');
      this.playbackTimeoutId = setTimeout(() => {
        if (this.watchPlaybackState() === 'loading') {
          this.watchPlaybackState.set('failed');
          this.watchPlaybackMessage.set('This provider may be blocking embedded playback. Open it in a new tab or try another server.');
        }
      }, this.playbackTimeoutMs);
    } else {
      this.watchPlaybackState.set('idle');
      this.watchPlaybackMessage.set('');
    }
  }

  onWatchFrameLoad(): void {
    if (!this.watchPageUrl()) return;
    this.clearPlaybackWatchdog();
    this.watchPlaybackState.set('ready');
    this.watchPlaybackMessage.set('');
  }

  onWatchFrameError(): void {
    if (!this.watchPageUrl()) return;
    this.clearPlaybackWatchdog();
    this.watchPlaybackState.set('failed');
    this.watchPlaybackMessage.set('The embedded player could not load. Open the stream in a new tab or switch servers.');
  }

  private clearPlaybackWatchdog(): void {
    if (this.playbackTimeoutId !== null) {
      clearTimeout(this.playbackTimeoutId);
      this.playbackTimeoutId = null;
    }
  }

  private async loadWatchRecommendations(type: MediaType, id: number): Promise<void> {
    this.recommendationLoading.set(true);
    this.recommendationError.set('');

    try {
      const result = await this.recommendations.getWatchRecommendations(type, id, 10);
      this.watchRecommendations.set(result.items || []);
      this.recommendationReason.set(result.reason || 'Suggested from your watch profile.');
      if (!(result.items || []).length) {
        this.recommendationError.set('No up-next recommendations yet. Watch more titles to improve matching.');
      }
    } catch {
      this.watchRecommendations.set([]);
      this.recommendationReason.set('');
      this.recommendationError.set('Could not load up-next recommendations right now.');
    } finally {
      this.recommendationLoading.set(false);
    }
  }
}
