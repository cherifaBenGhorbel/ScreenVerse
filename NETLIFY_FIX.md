# Netlify Build Failure: Missing Environment Variables

Your Netlify build failed because the environment variables weren't found. This is the most common issue when deploying to Netlify.

## ✅ Quick Fix (2 minutes)

1. **Go to Netlify:**
   ```
   https://app.netlify.com/sites/YOUR_SITE_NAME/settings/env
   ```
   (Replace `YOUR_SITE_NAME` with your actual Netlify site name)

2. **Add These 6 Variables** (click "Add a variable" for each one):

   | Key | Value | Copy From |
   |-----|-------|-----------|
   | `TMDB_API_KEY` | Your API key | Your `.env` file line 1 |
   | `TMDB_ACCESS_TOKEN` | Your bearer token | Your `.env` file line 2 |
   | `WATCH_SITE_URL1` | Watch server URL | Your `.env` file line 7 |
   | `WATCH_SITE_URL2` | Watch server URL | Your `.env` file line 8 |
   | `WATCH_SITE_URL3` | Watch server URL | Your `.env` file line 9 |
   | `WATCH_SITE_URL4` | Watch server URL | Your `.env` file line 10 |

3. **Trigger a New Deploy:**
   - Click **Deploys** (top of Netlify page)
   - Click **Trigger Deploy** → **Deploy site**
   - Wait ~2 minutes for build to complete
   - ✅ Build should now pass!

## 🚀 Expected Output on Success

When the build succeeds, you should see:
```
> npm run build
> movie-platform@0.0.0 prebuild
> node scripts/validate-env.mjs && node scripts/write-env.mjs

Environment validation passed.
✓ Generating optimized production build...
```

## ❓ Still Not Working?

### Symptom: Build still shows "Missing required environment variables"

**Check:**
1. Did you add ALL 6 variables? (Missing even one will fail)
2. Are the variable **names** exactly correct? (Case-sensitive! Use exact spelling: `TMDB_API_KEY` not `TMDB_api_key`)
3. Did you **save** the variables? (Look for a green checkmark or confirmation)
4. Did you trigger a **new deploy** after adding variables?

### Symptom: Build passes but app says "Server not configured"

This means the functions received the env vars but the watch URLs are invalid.

**Check:**
- Test your `WATCH_SITE_URL1` in browser (should load a page, not error)
- Make sure URLs end with `/` (e.g., `https://api.cinezo.net/`)
- Use the exact URLs from your `.env` file

## 🔍 Debug Steps

**To verify environment variables are set on Netlify:**

Run locally first to ensure it works:
```bash
npm run check-env
```

You should see green ✓ checkmarks for all required variables.

Then in Netlify:
1. Click **Deploys** 
2. Click your latest deploy
3. Scroll to the build logs
4. Search for "Environment validation passed" — if you see it, your variables are correct!

## Still Stuck?

Check [NETLIFY_SETUP.md](NETLIFY_SETUP.md) for the complete troubleshooting guide.
