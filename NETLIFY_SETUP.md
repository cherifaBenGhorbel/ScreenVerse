# ScreenVerse Netlify Deployment Guide

## Environment Variables Setup

Netlify **cannot read `.env` files** (they're in `.gitignore`). You must set all environment variables in Netlify's **Site Settings**.

### Step-by-Step:

1. **Go to Netlify Admin:**
   - Visit your site: `https://app.netlify.com/sites/YOUR_SITE`
   - Click **Site Settings** (top navigation)
   - Click **Environment Variables** (left sidebar, under Build & deploy)

2. **Add Each Variable:**
   
   Click **Add a variable** and enter these **exactly**:

   | Key | Value | Source |
   |-----|-------|--------|
   | `TMDB_API_KEY` | Your TMDB API Key | [tmdb.org/settings/api](https://www.themoviedb.org/settings/api) |
   | `TMDB_ACCESS_TOKEN` | Your TMDB Bearer Token | [tmdb.org/settings/api](https://www.themoviedb.org/settings/api) |
   | `TMDB_BASE_URL` | `https://api.themoviedb.org/3` | Fixed |
   | `TMDB_IMAGE_BASE` | `https://image.tmdb.org/t/p` | Fixed |
   | `TMDB_YOUTUBE_EMBED` | `https://www.youtube.com/embed/` | Fixed |
   | `WATCH_SITE_URL1` | Your watch provider URL 1 | Your provider |
   | `WATCH_SITE_URL2` | Your watch provider URL 2 | Your provider |
   | `WATCH_SITE_URL3` | Your watch provider URL 3 | Your provider |
   | `WATCH_SITE_URL4` | Your watch provider URL 4 | Your provider |

3. **Verify Variables Are Set:**
   - After adding all variables, click **Deploys** → **Trigger Deploy** → **Deploy site**
   - Wait for the build to complete
   - Check the build log for ✓ "Environment validation passed"

4. **If Build Still Fails:**
   - Click the failed deploy
   - Scroll to the build logs
   - Look for error messages mentioning missing variables
   - Copy the exact error and check variable names (case-sensitive!)

## How It Works

**Local Development:**
- Your `.env` file is loaded by `scripts/validate-env.mjs`
- Angular dev server runs with `/api` proxy to local functions

**Netlify Production:**
- Site Settings env vars are loaded by the build process
- Functions receive env vars at runtime
- Frontend makes requests to `/api/tmdb/*` and `/api/watch/*`
- Netlify Functions handle the actual API calls with secrets

## Build Process Flow

```
1. Install dependencies: npm install
2. Validate env vars: scripts/validate-env.mjs (checks for missing vars)
3. Generate environment files: scripts/write-env.mjs (only public URLs)
4. Build Angular: ng build --configuration production
5. Output: dist/movie-platform/browser
```

## What NOT to Do

❌ Don't commit `.env` to git
❌ Don't hardcode API keys in code
❌ Don't set variables only in the browser (they're public!)
❌ Don't forget the `WATCH_SITE_URL*` variables (functions need them)

## Debugging

If the app builds but doesn't work:

1. **Check browser console** (F12) for errors
2. **Check network tab** for failed API requests
3. **Check Netlify function logs:**
   - Visit site in browser
   - Open DevTools Console
   - Look for network errors on `/api/tmdb/*` or `/api/watch/*` calls
   - Go to Netlify Admin → Functions → Inspect the function logs

4. **Test an API endpoint directly:**
   - Visit `https://YOUR_SITE/.netlify/functions/tmdb/trending/all/day?language=en`
   - Should return JSON (not an error)

## Common Issues

| Issue | Solution |
|-------|----------|
| "Environment not configured" error | Missing one or more env vars in Netlify Site Settings |
| Build succeeds but API calls fail | Check variable values are correct (e.g., WATCH_SITE_URL1) |
| 404 on `/api/*` routes | Netlify redirects might not be configured (check `netlify.toml`) |
| Functions return 500 | Check Netlify Functions logs for server-side errors |

## Need Help?

1. Check build logs in Netlify Admin
2. Verify all 9 env variables are set in Site Settings
3. Trigger a manual deploy after setting variables
4. Check browser DevTools Network tab for failed requests
