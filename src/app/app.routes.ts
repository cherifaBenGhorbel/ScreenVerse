import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home')
      .then(m => m.Home)
  },
  {
    path: 'movies',
    loadComponent: () => import('./features/movies/movies')
      .then(m => m.Movies)
  },
  {
    path: 'tv-shows',
    loadComponent: () => import('./features/tv-shows/tv-shows')
      .then(m => m.TvShows)
  },
  {
    path: 'favorites',
    loadComponent: () => import('./features/favorites/favorites')
      .then(m => m.FavoritesPage)
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search')
      .then(m => m.SearchResultsPage)
  },
  {
    path: 'detail/:type/:id',
    loadComponent: () => import('./features/detail/detail')
      .then(m => m.Detail)
  },
  {
    path: 'watch/:type/:id',
    loadComponent: () => import('./features/watch/watch')
      .then(m => m.Watch)
  },
  {
    path: '**',
    redirectTo: ''
  }
];