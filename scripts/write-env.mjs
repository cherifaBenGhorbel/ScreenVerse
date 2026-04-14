import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const envDir = join(root, 'src', 'environments');

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

mkdirSync(envDir, { recursive: true });

const fromEnv = (name, fallback = '') => process.env[name] || fallback;

const config = {
  imageBase: fromEnv('TMDB_IMAGE_BASE', 'https://image.tmdb.org/t/p'),
  youtubeEmbed: fromEnv('TMDB_YOUTUBE_EMBED', 'https://www.youtube.com/embed/'),
  apiProxyBase: fromEnv('TMDB_PROXY_BASE', '/api/tmdb'),
  watchProxyBase: fromEnv('WATCH_PROXY_BASE', '/api/watch')
};

const ts = (isProduction) => `export const environment = {
  production: ${isProduction},
  tmdb: {
    imageBase: ${JSON.stringify(config.imageBase)},
    youtubeEmbed: ${JSON.stringify(config.youtubeEmbed)},
    apiProxyBase: ${JSON.stringify(config.apiProxyBase)},
    watchProxyBase: ${JSON.stringify(config.watchProxyBase)}
  }
};
`;

writeFileSync(join(envDir, 'environment.ts'), ts(false), 'utf8');
writeFileSync(join(envDir, 'environment.prod.ts'), ts(true), 'utf8');

console.log('Generated src/environments/environment.ts and environment.prod.ts');
