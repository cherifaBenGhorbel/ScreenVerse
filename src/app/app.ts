import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Footer } from './layout/footer/footer';
import { Navbar } from './layout/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Navbar,
    Footer
  ],
  host: {
    '(window:offline)': 'onOffline()',
    '(window:online)': 'onOnline()'
  },
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App { 
  isOffline = signal<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  onOffline(): void {
    this.isOffline.set(true);
  }

  onOnline(): void {
    this.isOffline.set(false);
  }
}