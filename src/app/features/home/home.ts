import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroBanner } from './../../shared/components/hero-banner/hero-banner';

import { Recommendations } from '../../core/services/recommendations';
import { Tmdb } from '../../core/services/tmdb';
import { TmdbMediaItem } from '../../models/tmdb';
import { MovieCard } from '../../shared/components/movie-card/movie-card';

interface MoodOption {
  name: string;
  genreId: number;
  type: 'movie' | 'tv';
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, MovieCard, HeroBanner],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  trending = signal<TmdbMediaItem[]>([]);
  popularMovies = signal<TmdbMediaItem[]>([]);
  popularTv = signal<TmdbMediaItem[]>([]);
  topAnime = signal<TmdbMediaItem[]>([]);
  isLoading = signal(true);
  loadError = signal('');

  moods: MoodOption[] = [
    { name: 'Comedy', genreId: 35, type: 'movie' },
    { name: 'Action', genreId: 28, type: 'movie' },
    { name: 'Romance', genreId: 10749, type: 'movie' },
    { name: 'Thriller', genreId: 53, type: 'movie' },
    { name: 'Drama', genreId: 18, type: 'tv' },
    { name: 'Animation', genreId: 16, type: 'tv' }
  ];

  selectedMood = signal<MoodOption | null>(null);
  moodRecommendations = signal<TmdbMediaItem[]>([]);
  moodLoading = signal(false);
  moodError = signal('');

  personalizedRecommendations = signal<TmdbMediaItem[]>([]);
  personalizedReason = signal('');
  personalizedHint = signal('');
  personalizedLoading = signal(false);
  personalizedError = signal('');

  constructor(
    private tmdbService: Tmdb,
    private recommendations: Recommendations
  ) {
  }

  ngOnInit(): void {
    this.loadHomeData();
  }

  async loadHomeData() {
    this.isLoading.set(true);
    this.loadError.set('');

    try {
      const [trendingData, moviesData, tvData, animeData] = await Promise.all([
        this.tmdbService.getTrending(),
        this.tmdbService.getPopularMovies(),
        this.tmdbService.getPopularTv(),
        this.tmdbService.getTopAnime()
      ]);

      const trending = trendingData?.results?.slice(0, 12) || [];
      const movies = moviesData?.results?.slice(0, 12) || [];
      const shows = tvData?.results?.slice(0, 12) || [];
      const anime = animeData?.results?.slice(0, 12) || [];

      this.trending.set(trending);
      this.popularMovies.set(movies);
      this.popularTv.set(shows);
      this.topAnime.set(anime);
      await this.loadPersonalizedRecommendations();

      if (!trending.length && !movies.length && !shows.length && !anime.length) {
        this.loadError.set(
          navigator.onLine
            ? 'No content is available right now. Please try again.'
            : 'You are offline. Reconnect and retry to load home content.'
        );
      }
    } catch (error) {
      console.error('Error loading home data:', error);
      this.loadError.set(
        navigator.onLine
          ? 'Could not load home content. Please try again.'
          : 'You are offline. Reconnect and retry to load home content.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  async selectMood(mood: MoodOption) {
    this.selectedMood.set(mood);
    this.moodLoading.set(true);
    this.moodError.set('');

    try {
      const data = await this.tmdbService.getDiscover(mood.type, mood.genreId);
      const recommendations = data?.results?.slice(0, 10) || [];
      this.moodRecommendations.set(recommendations);

      if (!recommendations.length) {
        this.moodError.set(
          navigator.onLine
            ? `No ${mood.name.toLowerCase()} picks found right now.`
            : 'You are offline. Reconnect and retry this mood.'
        );
      }
    } catch (error) {
      console.error('Error loading mood recommendations:', error);
      this.moodError.set(
        navigator.onLine
          ? `Could not load ${mood.name.toLowerCase()} picks. Please try again.`
          : 'You are offline. Reconnect and retry this mood.'
      );
    } finally {
      this.moodLoading.set(false);
    }
  }

  retryHomeLoad(): void {
    this.loadHomeData();
  }

  retryMoodLoad(): void {
    const mood = this.selectedMood();
    if (!mood) return;
    this.selectMood(mood);
  }

  async loadPersonalizedRecommendations(): Promise<void> {
    this.personalizedLoading.set(true);
    this.personalizedHint.set('');
    this.personalizedError.set('');

    try {
      const result = await this.recommendations.getHomeRecommendations(10);
      this.personalizedRecommendations.set(result.items || []);
      this.personalizedReason.set(result.reason || 'Suggested from your watch activity.');

      if (!(result.items || []).length) {
        this.personalizedHint.set('Start watching from any detail page and we will generate recommendations here.');
      }
    } catch (error) {
      console.error('Error loading personalized recommendations:', error);
      this.personalizedRecommendations.set([]);
      this.personalizedReason.set('');
      this.personalizedError.set(
        navigator.onLine
          ? 'Could not load personalized recommendations right now.'
          : 'You are offline. Reconnect to load personalized recommendations.'
      );
    } finally {
      this.personalizedLoading.set(false);
    }
  }

  retryPersonalizedLoad(): void {
    this.loadPersonalizedRecommendations();
  }

  scrollCarousel(direction: 'prev' | 'next', carouselWrapper: HTMLElement): void {
    const scrollAmount = Math.max(220, Math.floor(carouselWrapper.clientWidth * 0.65));
    const delta = direction === 'next' ? scrollAmount : -scrollAmount;
    carouselWrapper.scrollBy({ left: delta, behavior: 'smooth' });
  }

}