#!/usr/bin/env node

/**
 * Debug script to check which environment variables are available
 * Run: node scripts/check-env.mjs
 * 
 * This helps you verify that your Netlify environment variables are being
 * picked up during the build process.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const loadDotEnvFile = (fileName) => {
  const filePath = join(root, fileName);
  if (!existsSync(filePath)) return {};

  const vars = {};
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

    vars[key] = value;
  }
  return vars;
};

const required = [
  'TMDB_API_KEY',
  'TMDB_ACCESS_TOKEN',
  'TMDB_BASE_URL',
  'TMDB_IMAGE_BASE',
  'TMDB_YOUTUBE_EMBED',
  'WATCH_SITE_URL1',
  'WATCH_SITE_URL2',
  'WATCH_SITE_URL3',
  'WATCH_SITE_URL4'
];

console.log('\n========== Environment Variables Check ==========\n');

console.log('📂 .env file:', existsSync(join(root, '.env')) ? '✓ Found' : '✗ Not found (expected on Netlify)');
console.log('📂 .env.local file:', existsSync(join(root, '.env.local')) ? '✓ Found' : '✗ Not found\n');

const fromFile = { ...loadDotEnvFile('.env'), ...loadDotEnvFile('.env.local') };

console.log('Required Variables:');
console.log('─'.repeat(70));

let allPresent = true;
for (const key of required) {
  const fileValue = fromFile[key];
  const envValue = process.env[key];
  const source = envValue ? 'process.env (Netlify/CI)' : fileValue ? '.env file (Local)' : 'MISSING ⚠️';
  const value = envValue || fileValue || '[NOT SET]';
  
  // Mask sensitive values
  let display = value;
  if (key.includes('KEY') || key.includes('TOKEN') || key.includes('URL')) {
    if (value.length > 20) {
      display = value.substring(0, 10) + '...' + value.substring(value.length - 10);
    }
  }

  const status = value === '[NOT SET]' ? '✗' : '✓';
  const color = value === '[NOT SET]' ? '\x1b[31m' : '\x1b[32m';
  
  console.log(`${color}${status}\x1b[0m ${key.padEnd(20)} | ${source.padEnd(25)} | ${display}`);
  
  if (value === '[NOT SET]') allPresent = false;
}

console.log('─'.repeat(70));

if (allPresent) {
  console.log('\n✓ All required environment variables are set!\n');
  console.log('Next steps:');
  console.log('  1. Run: npm run build');
  console.log('  2. Verify build succeeds with "Environment validation passed"');
} else {
  console.log('\n✗ Some environment variables are missing!\n');
  console.log('On LOCAL: Add them to .env file');
  console.log('On NETLIFY: Add them via Site Settings → Environment Variables\n');
  process.exit(1);
}
