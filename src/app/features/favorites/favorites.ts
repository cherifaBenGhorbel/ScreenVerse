import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Favorites } from '../../core/services/favorites';
import { FavoriteItem } from '../../models/favorites';
import { MovieCard } from '../../shared/components/movie-card/movie-card';

@Component({
  selector: 'app-favorites',
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
