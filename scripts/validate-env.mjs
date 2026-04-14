import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const loadDotEnvFile = (fileName) => {
  const filePath = join(root, fileName);
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const idx = line.indexOf('=');
    if (idx <= 0) continue;

    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
      process.env[key] = value;
    }
  }
};

// Try loading from .env/.env.local (local dev) or process.env (CI/Netlify)
loadDotEnvFile('.env');
loadDotEnvFile('.env.local');

// Variables with defaults (optional, but good to override if needed)
const defaults = {
  TMDB_BASE_URL: 'https://api.themoviedb.org/3',
  TMDB_IMAGE_BASE: 'https://image.tmdb.org/t/p',
  TMDB_YOUTUBE_EMBED: 'https://www.youtube.com/embed/'
};

// Apply defaults if not set
for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

// CRITICAL: These must be set or build fails
const required = [
  'TMDB_API_KEY',
  'TMDB_ACCESS_TOKEN',
  'WATCH_SITE_URL1',
  'WATCH_SITE_URL2',
  'WATCH_SITE_URL3',
  'WATCH_SITE_URL4',
  'WATCH_SITE_URL5',
  'WATCH_SITE_URL6',
  'WATCH_SITE_URL7',
  'WATCH_SITE_URL8',
  'WATCH_SITE_URL9',
  'WATCH_SITE_URL10',
  'WATCH_SITE_URL11'
];

const invalidMarkers = ['REPLACE_ME', 'YOUR_', 'EXAMPLE'];
const missing = required.filter((name) => {
  const value = (process.env[name] || '').trim();
  if (!value) return true;
  return invalidMarkers.some((marker) => value.includes(marker));
});

if (missing.length > 0) {
  console.error('\n❌ Missing required environment variables:');
  for (const name of missing) {
    console.error(`   - ${name}`);
  }
  console.error('\n📍 LOCAL: Set these in .env or .env.local');
  console.error('📍 NETLIFY: Set these via Site Settings → Environment Variables');
  console.error('   (https://app.netlify.com/sites/YOUR_SITE/settings/env)\n');
  process.exit(1);
}

// Validate that WATCH_SITE_URLs are valid HTTP(S) URLs
const urlVars = [
  'WATCH_SITE_URL1',
  'WATCH_SITE_URL2',
  'WATCH_SITE_URL3',
  'WATCH_SITE_URL4',
  'WATCH_SITE_URL5',
  'WATCH_SITE_URL6',
  'WATCH_SITE_URL7',
  'WATCH_SITE_URL8',
  'WATCH_SITE_URL9',
  'WATCH_SITE_URL10',
  'WATCH_SITE_URL11'
];
for (const name of urlVars) {
  const value = (process.env[name] || '').trim();
  if (!value) continue;
  try {
    const parsed = new URL(value);
    if (!/^https?:$/.test(parsed.protocol)) {
      throw new Error('Unsupported URL protocol');
    }
  } catch {
    console.error(`❌ Invalid URL in ${name}: ${value}`);
    process.exit(1);
  }
}

console.log('Environment validation passed.')
