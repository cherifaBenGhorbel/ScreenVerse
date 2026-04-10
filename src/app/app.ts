import { Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Language } from './core/services/language';

import { Footer } from './layout/footer/footer';
import { Navbar } from './layout/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Navbar,
    Footer
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App { 
  title = 'ScreenVerse';
  isOffline = signal<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  constructor(public language: Language) {}

  @HostListener('window:offline')
  onOffline(): void {
    this.isOffline.set(true);
  }

  @HostListener('window:online')
  onOnline(): void {
    this.isOffline.set(false);
  }
}