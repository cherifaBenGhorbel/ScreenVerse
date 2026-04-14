import { CommonModule } from '@angular/common';
import { Component, Input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Favorites } from '../../../core/services/favorites';
import { FavoriteMediaType } from '../../../models/favorites';

@Component({
  selector: 'app-movie-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './movie-card.html',
  styleUrl: './movie-card.css'
})
export class MovieCard {
  @Input() item: any;
  @Input() type: FavoriteMediaType = 'movie';
  
  hoverStart = output<MouseEvent>();
  hoverEnd = output<void>();

  constructor(private favorites: Favorites) {}

  getPoster(): string {
    const path = this.item?.poster_path;
    if (!path) return 'https://via.placeholder.com/300x450/1a1a1a/666?text=No+Poster';
    return `https://image.tmdb.org/t/p/w342${path}`;
  }

  getTitle(): string {
    return this.item?.title || this.item?.name || 'Untitled';
  }

  getRating(): string {
    const rating = this.item?.vote_average;
    if (!rating) return 'N/A';
    return rating.toFixed(1);
  }

  getYear(): string {
    const date = this.item?.release_date || this.item?.first_air_date;
    if (!date) return 'N/A';
    return date.substring(0, 4);
  }

  onMouseEnter(event: MouseEvent) {
    this.hoverStart.emit(event);
  }

  onMouseLeave() {
    this.hoverEnd.emit();
  }

  isFavorite(): boolean {
    return this.favorites.isFavorite(this.item?.id, this.type);
  }

  toggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favorites.toggle(this.item, this.type);
  }
}