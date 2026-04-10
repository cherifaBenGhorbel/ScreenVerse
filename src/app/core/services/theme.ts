import { Injectable, signal } from '@angular/core';

export type AppTheme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class Theme {
  private readonly storageKey = 'screenverse_theme';
  private readonly themeState = signal<AppTheme>('dark');

  readonly currentTheme = this.themeState.asReadonly();

  constructor() {
    this.initialize();
  }

  toggleTheme(): void {
    const nextTheme: AppTheme = this.themeState() === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
  }

  isLightTheme(): boolean {
    return this.themeState() === 'light';
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem(this.storageKey) as AppTheme | null;
    const initial: AppTheme = stored === 'light' ? 'light' : 'dark';
    this.applyTheme(initial);
  }

  private applyTheme(theme: AppTheme): void {
    this.themeState.set(theme);

    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-theme', theme);
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(this.storageKey, theme);
    }
  }
}
