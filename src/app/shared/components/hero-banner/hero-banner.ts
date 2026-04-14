import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Tmdb } from '../../../core/services/tmdb';
import { MediaType } from '../../../models/tmdb';


@Component({
  selector: 'app-hero-banner',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule
  ],
  host: {
    '(document:keydown)': 'onDocumentKeydown($event)'
  },
  templateUrl: './hero-banner.html',
  styleUrl: './hero-banner.css'
})
export class HeroBanner {
  @Input() trending: any[] = [];
  @ViewChild('trailerModal') trailerModal?: ElementRef<HTMLElement>;
  
  showTrailerModal = signal<boolean>(false);
  trailerUrl = signal<SafeResourceUrl | null>(null);
  isLoadingTrailer = signal<boolean>(false);
  trailerError = signal<string>('');

  private lastFocusedElement: HTMLElement | null = null;

  constructor(
    private tmdb: Tmdb,
    private sanitizer: DomSanitizer
  ) {}

  get item(): any {
    return this.trending?.[0] ?? null;
  }

  getBackgroundImage(): string {
    const backdrop = this.item?.backdrop_path;
    if (backdrop) {
      return `https://image.tmdb.org/t/p/original${backdrop}`;
    }

    const poster = this.item?.poster_path;
    if (poster) {
      return `https://image.tmdb.org/t/p/w780${poster}`;
    }

    return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80';
  }

  onHeroImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1400&q=80';
  }

  getMediaType(): MediaType {
    if (!this.item) return 'movie';
    return (this.item.media_type || (this.item.title ? 'movie' : 'tv')) as MediaType;
  }

  getYear(): string {
    const date = this.item?.release_date || this.item?.first_air_date;
    return date ? date.substring(0, 4) : 'N/A';
  }

  getPoster(): string {
    const path = this.item?.poster_path || this.item?.backdrop_path;
    if (!path) return 'https://via.placeholder.com/220x330/1a1a1a/666?text=No+Poster';
    return `https://image.tmdb.org/t/p/w342${path}`;
  }

  async onPlayTrailer() {
    if (!this.item) return;

    this.lastFocusedElement = document.activeElement as HTMLElement;
    this.showTrailerModal.set(true);
    this.trailerError.set('');

    // Move focus inside the modal for keyboard users.
    setTimeout(() => {
      const firstFocusable = this.trailerModal?.nativeElement.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    });

    if (this.trailerUrl()) {
      return;
    }

    this.isLoadingTrailer.set(true);

    try {
      const videos = await this.tmdb.getVideos(this.getMediaType(), this.item.id);
      const trailer = videos?.results?.find(
        (video: any) =>
          video.site === 'YouTube' &&
          (video.type === 'Trailer' || video.type === 'Official Trailer')
      ) || videos?.results?.find((video: any) => video.site === 'YouTube');

      if (trailer) {
        const url = `https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1&showinfo=0`;
        this.trailerUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      } else {
        this.trailerError.set('No trailer is available for this title right now.');
      }
    } catch (error) {
      console.error('Error loading trailer:', error);
      this.trailerError.set('Failed to load trailer. Please try again later.');
    } finally {
      this.isLoadingTrailer.set(false);
    }
  }

  closeTrailerModal(): void {
    this.showTrailerModal.set(false);
    // Reset source to stop playback on close.
    this.trailerUrl.set(null);
    this.lastFocusedElement?.focus();
  }

  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.showTrailerModal()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeTrailerModal();
      return;
    }

    if (event.key !== 'Tab') return;

    const modal = this.trailerModal?.nativeElement;
    if (!modal) return;

    const focusableElements = Array.from(
      modal.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(element => !element.hasAttribute('disabled'));

    if (!focusableElements.length) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    const active = document.activeElement as HTMLElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}