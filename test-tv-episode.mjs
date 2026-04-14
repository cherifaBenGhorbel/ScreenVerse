#!/usr/bin/env node

import { readFileSync } from 'fs';

// Load environment variables
const envFile = readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      env[trimmed.substring(0, eqIndex)] = trimmed.substring(eqIndex + 1);
    }
  }
});

// TV show test data
const tvId = 310430;
const season = 1;
const episode = 7;

// Build URLs following the exact same logic as watch.ts buildWatchTarget()
function buildTvUrl(serverNum, baseUrl, tvId, season, episode) {
  const base = baseUrl.replace(/\/+$/, ''); // Remove trailing slashes

  switch (serverNum) {
    case 5: // 2embed.cc - Query params pattern
      return `${base}/embed/tv?tmdb=${tvId}&season=${season}&episode=${episode}`;
    
    case 6:
    case 7: // VidSrc variants - Path pattern
      return `${base}/embed/tv/${tvId}/${season}/${episode}`;
    
    case 8: // CineSrc - Query pattern with s= and e=
      return `${base}/embed/tv/${tvId}?s=${season}&e=${episode}`;
    
    default: // Generic pattern for servers 1-4, 9, 10, 11
      return `${base}/tv/${tvId}/${season}/${episode}`;
  }
}

const servers = [
  { num: 1, name: 'Cinezo', url: env.WATCH_SITE_URL1 },
  { num: 2, name: '111Movies', url: env.WATCH_SITE_URL2 },
  { num: 3, name: 'VidZen', url: env.WATCH_SITE_URL3 },
  { num: 4, name: 'VidFast', url: env.WATCH_SITE_URL4 },
  { num: 5, name: '2Embed', url: env.WATCH_SITE_URL5 },
  { num: 6, name: 'VidSrc ICU', url: env.WATCH_SITE_URL6 },
  { num: 7, name: 'VidSrc TO', url: env.WATCH_SITE_URL7 },
  { num: 8, name: 'CineSrc', url: env.WATCH_SITE_URL8 },
  { num: 9, name: 'Embtaku', url: env.WATCH_SITE_URL9 },
  { num: 10, name: 'EmbedMaster', url: env.WATCH_SITE_URL10 },
  { num: 11, name: 'DrivePlayer', url: env.WATCH_SITE_URL11 }
];

const testUrl = async (url, name) => {
  try {
    const response = await Promise.race([
      fetch(url, { 
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 8000))
    ]);
    
    const status = response.status;
    const hasContent = response.headers.get('content-length') > 0 || response.status === 200;
    
    if (status === 200 && hasContent) {
      return { name, status: 'AVAILABLE ✓', statusCode: status };
    } else if (status === 404) {
      return { name, status: 'NOT_FOUND', statusCode: status };
    } else if (status === 403) {
      return { name, status: 'BLOCKED', statusCode: status };
    } else {
      return { name, status: `HTTP_${status}`, statusCode: status };
    }
  } catch (e) {
    if (e.message === 'TIMEOUT') {
      return { name, status: 'TIMEOUT', statusCode: 0 };
    }
    return { name, status: 'OFFLINE', statusCode: 0 };
  }
};

async function main() {
  console.log(`\n📺 Testing TV Episode URLs\nShow ID: ${tvId} | Season: ${season} | Episode: ${episode}\n`);
  console.log('Server | Provider        | Generated URL                                          | Status');
  console.log('-------|-----------------|--------------------------------------------------------|------------');

  const results = [];
  for (const s of servers) {
    const tvUrl = buildTvUrl(s.num, s.url, tvId, season, episode);
    const result = await testUrl(tvUrl, s.name);
    results.push({ ...result, url: tvUrl });
    
    const displayUrl = tvUrl.length > 55 ? tvUrl.substring(0, 52) + '...' : tvUrl.padEnd(55);
    const statusDisplay = result.status === 'AVAILABLE ✓' ? '✅ ' + result.status : 
                         result.status === 'NOT_FOUND' ? '❌ ' + result.status :
                         result.status === 'TIMEOUT' ? '⏱️ ' + result.status :
                         result.status === 'OFFLINE' ? '🔌 ' + result.status :
                         '⚠️ ' + result.status;
    
    console.log(`${s.num}      | ${s.name.padEnd(15)}| ${displayUrl} | ${statusDisplay}`);
  }

  console.log('-------|-----------------|--------------------------------------------------------|------------\n');

  const working = results.filter(r => r.status === 'AVAILABLE ✓').length;
  const notFound = results.filter(r => r.status === 'NOT_FOUND').length;
  const offline = results.filter(r => r.status.includes('OFFLINE') || r.status.includes('TIMEOUT')).length;

  console.log(`📊 Summary: ${working} available | ${notFound} not found | ${offline} offline/timeout\n`);

  console.log('📝 URL Patterns Used:\n');
  console.log('  Server 5 (2Embed):      /embed/tv?tmdb=ID&season=S&episode=E');
  console.log('  Servers 6-7 (VidSrc):   /embed/tv/ID/S/E');
  console.log('  Server 8 (CineSrc):     /embed/tv/ID?s=S&e=E');
  console.log('  Others (1-4,9-11):      /tv/ID/S/E\n');
}

main();
