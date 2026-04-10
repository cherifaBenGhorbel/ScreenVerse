import { Injectable, signal } from '@angular/core';

export type AppLanguage = 'en' | 'fr';

type TranslationMap = Record<string, string>;

@Injectable({
  providedIn: 'root'
})
export class Language {
  private readonly storageKey = 'screenverse_language';
  private readonly languageState = signal<AppLanguage>('en');

  readonly currentLanguage = this.languageState.asReadonly();

  private readonly translations: Record<AppLanguage, TranslationMap> = {
    en: {
      'nav.home': 'Home',
      'nav.movies': 'Movies',
      'nav.tvShows': 'TV Shows',
      'nav.favorites': 'Favorites',
      'nav.searchPlaceholder': 'Search by title or need...',
      'nav.searchAria': 'Search movies and TV shows',
      'nav.clearSearch': 'Clear search',
      'nav.searching': 'Searching...',
      'nav.noResults': 'No results found for',
      'nav.tryAgain': 'Try a different title or a quick category like K-drama or Turkish series',
      'nav.quickNeed': 'Quick needs',
      'nav.kdrama': 'K-drama',
      'nav.turkish': 'Turkish series',
      'nav.chinese': 'Chinese series',
      'nav.tunisian': 'Tunisian titles',
      'nav.arabic': 'Arabic titles',
      'nav.switchToFrench': 'FR',
      'nav.switchToEnglish': 'EN',
      'nav.switchToFrenchAria': 'Switch to French',
      'nav.switchToEnglishAria': 'Switch to English',
      'nav.lightTheme': 'Use light theme',
      'nav.darkTheme': 'Use dark theme',
      'home.loading': 'Loading home content...',
      'home.retry': 'Retry',
      'home.findYourVibe': 'Find Your Vibe',
      'home.moodHint': 'Choose a mood and discover your next favorite',
      'home.trending': 'Trending Now',
      'home.trendingHint': 'What everyone\'s watching this week',
      'home.popularMovies': 'Popular Movies',
      'home.popularMoviesHint': 'Top-rated films from around the world',
      'home.popularTv': 'Popular TV Shows',
      'home.popularTvHint': 'Binge-worthy series everyone\'s talking about',
      'home.topAnime': 'Top Anime',
      'home.topAnimeHint': 'Best Japanese animation picks',
      'detail.watchNow': 'Watch now',
      'detail.openFavorites': 'Open Favorites',
      'detail.officialTrailer': 'Official Trailer',
      'detail.whereToWatch': 'Where to Watch',
      'detail.subscription': 'Subscription',
      'detail.rent': 'Rent',
      'detail.buy': 'Buy',
      'detail.topCast': 'Top Cast',
      'detail.titleFacts': 'Title Facts',
      'detail.episodes': 'Episodes',
      'detail.networks': 'Networks',
      'detail.studios': 'Studios',
      'detail.back': 'Back to Home',
      'watch.videoArea': 'Video Area',
      'watch.controls': 'Watch Controls',
      'watch.season': 'Season',
      'watch.episodePreview': 'Episode Preview',
      'watch.whereToWatch': 'Where to Watch',
      'watch.subscription': 'Subscription',
      'watch.rent': 'Rent',
      'watch.buy': 'Buy',
      'watch.openProvider': 'Open watch page',
      'watch.selectEpisode': 'Select a season and episode to generate the watch URL.',
      'watch.movieUrl': 'URL format: siteUrl/watch/movie/id',
      'watch.tvUrl': 'URL format: siteUrl/watch/tv/id/season/episode',
      'watch.backToDetails': 'Back to details',
      'footer.tagline': 'Your cross-device movie and TV companion for discovering what to watch next.',
      'footer.explore': 'Explore',
      'footer.important': 'Important',
      'footer.disclaimer': 'Streaming availability may vary by region and can change over time.',
      'footer.dataSource': 'Metadata and posters are powered by The Movie Database (TMDB).',
      'footer.rights': 'All rights reserved.'
    },
    fr: {
      'nav.home': 'Accueil',
      'nav.movies': 'Films',
      'nav.tvShows': 'Séries TV',
      'nav.favorites': 'Favoris',
      'nav.searchPlaceholder': 'Rechercher par titre ou besoin...',
      'nav.searchAria': 'Rechercher des films et des séries',
      'nav.clearSearch': 'Effacer la recherche',
      'nav.searching': 'Recherche...',
      'nav.noResults': 'Aucun résultat pour',
      'nav.tryAgain': 'Essayez un autre titre ou une catégorie rapide comme K-drama ou série turque',
      'nav.quickNeed': 'Accès rapide',
      'nav.kdrama': 'K-drama',
      'nav.turkish': 'Série turque',
      'nav.chinese': 'Série chinoise',
      'nav.tunisian': 'Titres tunisiens',
      'nav.arabic': 'Titres arabes',
      'nav.switchToFrench': 'FR',
      'nav.switchToEnglish': 'EN',
      'nav.switchToFrenchAria': 'Passer en français',
      'nav.switchToEnglishAria': 'Passer en anglais',
      'nav.lightTheme': 'Utiliser le thème clair',
      'nav.darkTheme': 'Utiliser le thème sombre',
      'home.loading': 'Chargement du contenu...',
      'home.retry': 'Réessayer',
      'home.findYourVibe': 'Trouvez votre ambiance',
      'home.moodHint': 'Choisissez une ambiance et découvrez votre prochain coup de cœur',
      'home.trending': 'Tendances',
      'home.trendingHint': 'Ce que tout le monde regarde cette semaine',
      'home.popularMovies': 'Films populaires',
      'home.popularMoviesHint': 'Les meilleurs films du monde entier',
      'home.popularTv': 'Séries TV populaires',
      'home.popularTvHint': 'Les séries dont tout le monde parle',
      'home.topAnime': 'Top Anime',
      'home.topAnimeHint': 'Les meilleurs animes japonais',
      'detail.watchNow': 'Regarder',
      'detail.openFavorites': 'Ouvrir les favoris',
      'detail.officialTrailer': 'Bande-annonce officielle',
      'detail.whereToWatch': 'Où regarder',
      'detail.subscription': 'Abonnement',
      'detail.rent': 'Location',
      'detail.buy': 'Achat',
      'detail.topCast': 'Distribution principale',
      'detail.titleFacts': 'Informations',
      'detail.episodes': 'Épisodes',
      'detail.networks': 'Chaînes',
      'detail.studios': 'Studios',
      'detail.back': 'Retour à l’accueil',
      'watch.videoArea': 'Zone vidéo',
      'watch.controls': 'Contrôles de lecture',
      'watch.season': 'Saison',
      'watch.episodePreview': 'Aperçu de l’épisode',
      'watch.whereToWatch': 'Où regarder',
      'watch.subscription': 'Abonnement',
      'watch.rent': 'Location',
      'watch.buy': 'Achat',
      'watch.openProvider': 'Ouvrir la page de lecture',
      'watch.selectEpisode': 'Choisissez une saison et un épisode pour générer l’URL.',
      'watch.movieUrl': 'Format : siteUrl/watch/movie/id',
      'watch.tvUrl': 'Format : siteUrl/watch/tv/id/saison/épisode',
      'watch.backToDetails': 'Retour aux détails',
      'footer.tagline': 'Votre compagnon films et séries multi-appareils pour trouver quoi regarder ensuite.',
      'footer.explore': 'Explorer',
      'footer.important': 'Important',
      'footer.disclaimer': 'La disponibilité du streaming varie selon les régions et peut changer avec le temps.',
      'footer.dataSource': 'Les métadonnées et affiches sont fournies par The Movie Database (TMDB).',
      'footer.rights': 'Tous droits réservés.'
    }
  };

  constructor() {
    this.initialize();
  }

  t(key: string): string {
    return this.translations[this.languageState()][key] || this.translations.en[key] || key;
  }

  isFrench(): boolean {
    return this.languageState() === 'fr';
  }

  setLanguage(language: AppLanguage): void {
    this.applyLanguage(language);
  }

  toggleLanguage(): void {
    this.applyLanguage(this.languageState() === 'en' ? 'fr' : 'en');
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem(this.storageKey) as AppLanguage | null;
    const browserLanguage = window.navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
    const initial: AppLanguage = stored === 'fr' || stored === 'en' ? stored : browserLanguage;
    this.applyLanguage(initial);
  }

  private applyLanguage(language: AppLanguage): void {
    this.languageState.set(language);

    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(this.storageKey, language);
    }
  }
}