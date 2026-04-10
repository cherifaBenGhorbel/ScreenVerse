import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'tmdbImage', standalone: true })
export class TmdbImagePipe implements PipeTransform {
  transform(path: string | null | undefined, size: string = 'w500'): string {
    if (!path) return 'https://via.placeholder.com/220x330/222/fff?text=No+Image';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }
}