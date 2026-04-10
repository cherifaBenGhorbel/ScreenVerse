import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { MediaType, Tmdb } from '../../../core/services/tmdb';

@Component({
  selector: 'app-trailer-player',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule, 
    MatProgressSpinnerModule,
    RouterLink
  ],
  templateUrl: './trailer-player.html',
  styleUrl: './trailer-player.css',
})
export class TrailerPlayer implements OnInit, OnDestroy {
  @Input() item: any;
  @Input() type: MediaType = 'movie';
  close = output<void>();
  
  trailerUrl: SafeResourceUrl | null = null;
  loading = true;
  
  constructor(
    private tmdb: Tmdb,
    private sanitizer: DomSanitizer
  ) {}
  
  async ngOnInit() {
    if (this.item && this.item.id) {
      await this.loadTrailer();
    }
  }
  
  ngOnDestroy() {
    // Cleanup
  }
  
  async loadTrailer() {
    try {
      const videos = await this.tmdb.getVideos(this.type, this.item.id);
      const trailer = videos?.results?.find(
        (video: any) => video.type === 'Trailer' && video.site === 'YouTube'
      );
      
      if (trailer) {
        const url = `https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1`;
        this.trailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      }
    } catch (error) {
      console.error('Error loading trailer:', error);
    } finally {
      this.loading = false;
    }
  }
}