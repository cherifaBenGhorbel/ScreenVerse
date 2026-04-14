# ScreenVerse

ScreenVerse is an Angular movie and TV discovery app powered by TMDB data. It includes browsing, details, watch-provider routing, favorites, theme switching, watch recommendations, and a local development setup that mirrors Netlify.

## Tech Stack

- Angular 21
- TypeScript
- Angular Material
- TMDB API
- Netlify Functions

## Local Setup

1. Install dependencies.

```bash
npm install
```

2. Create a local `.env` file from [.env.example](.env.example) and fill in the real values.

Required variables:

- `TMDB_API_KEY`
- `TMDB_ACCESS_TOKEN`
- `WATCH_SITE_URL1`
- `WATCH_SITE_URL2`
- `WATCH_SITE_URL3`
- `WATCH_SITE_URL4`

Optional overrides:

- `TMDB_BASE_URL`
- `TMDB_IMAGE_BASE`
- `TMDB_YOUTUBE_EMBED`

3. Start the local app.

```bash
npm start
```

The dev server runs Angular on `http://localhost:4300` and Netlify Functions on `http://localhost:9999`, with `/api/tmdb/*` and `/api/watch/*` proxied locally.

## Scripts

- `npm start` starts the local Angular + Netlify workflow.
- `npm run build` validates environment variables and creates the production build.
- `npm test` runs the Angular test suite.

## Netlify Deploy

1. Push the project to GitHub.
2. Import the repository in Netlify.
3. Use the settings from [netlify.toml](netlify.toml): build command `npm run build`, publish directory `dist/movie-platform/browser`.
4. Add the required environment variables in Netlify site settings.
5. Deploy.

Netlify serves the app shell with SPA fallback and exposes the server-side API routes through Netlify Functions.

## Notes

- Real secrets stay out of git. Generated environment files are ignored.
- Watch playback can still be blocked by provider-side rules or browser extensions; the app now falls back safely.
