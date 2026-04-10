# ScreenVerse (Movie Platform)

ScreenVerse is a modern Angular movie and TV discovery platform powered by TMDB data.

It includes rich content browsing, detail pages, watch-provider data, a watch page with server switching, favorites, bilingual UI (English/French), dark/light themes, and responsive layouts designed for desktop, tablet, and mobile.

## Tech Stack

- Angular 21 (standalone components, lazy routes)
- TypeScript
- Angular Material (icons/spinner/buttons)
- TMDB API
- Signal-based state management

## Main Features

- Home page with curated sections and hero content
- Movies and TV Shows pages with:
	- genre filter
	- rating filter
	- country filter
	- pagination
- Detail page with trailers, metadata, cast, and provider info
- Watch page:
	- movie and TV watch URL generation
	- TV season and episode selection
	- 4 server buttons (Server 1-4)
- Favorites management
- Theme toggle (dark/light)
- Language toggle (EN/FR)
- Offline banner and resilient loading/error states

## Project Structure

```text
src/
	app/
		core/services/
			tmdb.ts
			favorites.ts
			theme.ts
			language.ts
		features/
			home/
			movies/
			tv-shows/
			detail/
			watch/
			favorites/
		layout/
			navbar/
			footer/
		shared/
			components/
			pipes/
		models/
	environments/
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment files

Environment files are ignored by git for security.

Create these files from the example:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

You can copy from `src/environments/environment.example.ts` and fill in your real values:

- `tmdb.apiKey`
- `tmdb.accessToken`
- `tmdb.siteUrl1`
- `tmdb.siteUrl2`
- `tmdb.siteUrl3`
- `tmdb.siteUrl4`

### 3. Start development server

```bash
npm start
```

Open: `http://localhost:4200`

## Available Scripts

- `npm start` -> run development server
- `npm test` -> run unit tests
- `npm run build` -> create production build

## Build for Production

```bash
npm run build
```

Build output is generated in `dist/`.

## Notes

- TMDB content and poster metadata are provided by The Movie Database (TMDB).
- Streaming availability depends on region and provider availability.
- Keep real API keys/tokens out of git (already enforced via `.gitignore`).

## Repository

Git remote configured for this project:

`https://github.com/cherifaghorbel/movie-platform.git`
