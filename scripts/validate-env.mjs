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

loadDotEnvFile('.env');
loadDotEnvFile('.env.local');

const required = [
  'TMDB_API_KEY',
  'TMDB_ACCESS_TOKEN',
  'WATCH_SITE_URL1',
  'WATCH_SITE_URL2',
  'WATCH_SITE_URL3',
  'WATCH_SITE_URL4'
];

const invalidMarkers = ['REPLACE_ME', 'YOUR_'];
const missing = required.filter((name) => {
  const value = (process.env[name] || '').trim();
  if (!value) return true;
  return invalidMarkers.some((marker) => value.includes(marker));
});

if (missing.length > 0) {
  console.error('Missing required environment variables:');
  for (const name of missing) {
    console.error(`- ${name}`);
  }
  console.error('Set these in .env/.env.local (local) or provider env settings (production).');
  process.exit(1);
}

const urlVars = ['WATCH_SITE_URL1', 'WATCH_SITE_URL2', 'WATCH_SITE_URL3', 'WATCH_SITE_URL4', 'TMDB_BASE_URL'];
for (const name of urlVars) {
  const value = (process.env[name] || '').trim();
  if (!value) continue;
  try {
    const parsed = new URL(value);
    if (!/^https?:$/.test(parsed.protocol)) {
      throw new Error('Unsupported URL protocol');
    }
  } catch {
    console.error(`Invalid URL in ${name}: ${value}`);
    process.exit(1);
  }
}

console.log('Environment validation passed.');
