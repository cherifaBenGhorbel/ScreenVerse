import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FavoriteItem, Favorites } from '../../core/services/favorites';
import { MovieCard } from '../../shared/components/movie-card/movie-card';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, MovieCard],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css'
})
export class FavoritesPage {
  constructor(private favoritesService: Favorites) {}

  favorites() {
    return this.favoritesService.favorites();
  }

  remove(item: FavoriteItem): void {
    this.favoritesService.remove(item.id, item.media_type);
  }
}
