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
- `WATCH_SITE_URL5`
- `WATCH_SITE_URL6`
- `WATCH_SITE_URL7`
- `WATCH_SITE_URL8`
- `WATCH_SITE_URL9`
- `WATCH_SITE_URL10`
- `WATCH_SITE_URL11`

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
- `npm run check-env` displays which environment variables are detected (for debugging).

## Netlify Deploy

1. Push the project to GitHub.
2. Import the repository in Netlify.
3. **⚠️ CRITICAL:** Before deploying, go to **Site Settings** → **Environment Variables** and add **all 6 critical variables** from your `.env` file:
   - `TMDB_API_KEY`
   - `TMDB_ACCESS_TOKEN`
   - `WATCH_SITE_URL1`, `WATCH_SITE_URL2`, `WATCH_SITE_URL3`, `WATCH_SITE_URL4`, `WATCH_SITE_URL5`, `WATCH_SITE_URL6`, `WATCH_SITE_URL7`, `WATCH_SITE_URL8`, `WATCH_SITE_URL9`, `WATCH_SITE_URL10`, `WATCH_SITE_URL11`

3. Use build command: `npm run build`
5. Publish directory: `dist/movie-platform/browser`
6. Click **Trigger Deploy** to start the build.

**⏱️ Build takes ~2 minutes. Look for "Environment validation passed" in the logs.**

### 🚑 If Build Fails with Missing Variables

If your build failed with "Missing required environment variables" error, **see [NETLIFY_FIX.md](NETLIFY_FIX.md)** — it's a 2-minute fix.

**📘 Complete Setup Guide:** [NETLIFY_SETUP.md](NETLIFY_SETUP.md)

Netlify serves the app shell with SPA fallback and exposes the server-side API routes through Netlify Functions.

## Notes

- Real secrets stay out of git. Generated environment files are ignored.
- Watch playback can still be blocked by provider-side rules or browser extensions; the app now falls back safely.
