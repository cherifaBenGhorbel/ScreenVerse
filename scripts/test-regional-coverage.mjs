#!/usr/bin/env node

import { readFileSync } from 'node:fs';

function loadEnv(filePath) {
  const env = {};
  const text = readFileSync(filePath, 'utf8');
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    env[line.slice(0, eq)] = line.slice(eq + 1);
  }
  return env;
}

const env = loadEnv('.env');
const servers = [
  { id: 1, name: 'Cinezo', base: env.WATCH_SITE_URL1 },
  { id: 2, name: '111Movies', base: env.WATCH_SITE_URL2 },
  { id: 3, name: 'VidZen', base: env.WATCH_SITE_URL3 },
  { id: 4, name: 'VidFast', base: env.WATCH_SITE_URL4 },
  { id: 5, name: '2Embed', base: env.WATCH_SITE_URL5 },
  { id: 6, name: 'VidSrc ICU', base: env.WATCH_SITE_URL6 },
  { id: 7, name: 'VidSrc TO', base: env.WATCH_SITE_URL7 },
  { id: 8, name: 'CineSrc', base: env.WATCH_SITE_URL8 },
  { id: 9, name: 'Embtaku', base: env.WATCH_SITE_URL9 },
  { id: 10, name: 'EmbedMaster', base: env.WATCH_SITE_URL10 },
  { id: 11, name: 'VidSrc XYZ', base: env.WATCH_SITE_URL11 }
];

const samples = [
  { category: 'Turkey', title: 'Ayla: The Daughter of War', mediaType: 'movie', id: 472454 },
  { category: 'Turkey', title: 'Kurulus Osman S1E1', mediaType: 'tv', id: 95603, season: 1, episode: 1 },
  { category: 'Tunisia/Arabic', title: 'Dachra', mediaType: 'movie', id: 540009 },
  { category: 'K-Drama', title: 'Crash Landing on You S1E1', mediaType: 'tv', id: 94796, season: 1, episode: 1 },
  { category: 'Chinese', title: 'The Untamed S1E1', mediaType: 'tv', id: 90761, season: 1, episode: 1 },
  { category: 'Chinese', title: 'Wolf Warrior', mediaType: 'movie', id: 335462 }
];

function buildUrl(serverId, baseUrl, sample) {
  const base = (baseUrl || '').replace(/\/+$/, '');
  if (!base) return '';

  if (sample.mediaType === 'movie') {
    if (serverId === 5 || serverId === 6 || serverId === 7 || serverId === 8) {
      return `${base}/embed/movie/${sample.id}`;
    }
    return `${base}/movie/${sample.id}`;
  }

  const s = sample.season;
  const e = sample.episode;

  if (serverId === 5) {
    return `${base}/embed/tv?tmdb=${sample.id}&season=${s}&episode=${e}`;
  }
  if (serverId === 6 || serverId === 7) {
    return `${base}/embed/tv/${sample.id}/${s}/${e}`;
  }
  if (serverId === 8) {
    return `${base}/embed/tv/${sample.id}?s=${s}&e=${e}`;
  }
  return `${base}/tv/${sample.id}/${s}/${e}`;
}

async function fetchStatus(url, timeoutMs = 7000) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    clearTimeout(timeout);
    return response.status;
  } catch (err) {
    return err && err.name === 'AbortError' ? 'TIMEOUT' : 'ERROR';
  }
}

function statusBucket(status) {
  if (status === 200) return 'hit';
  if (status === 404) return 'miss';
  if (status === 429) return 'rate_limited';
  if (status === 'TIMEOUT') return 'timeout';
  if (status === 403) return 'blocked';
  return 'other';
}

async function main() {
  console.log('\nRegional Coverage Benchmark (TMDB IDs)');
  console.log('Samples:', samples.length);

  const serverStats = new Map();
  const categoryStats = new Map();

  for (const server of servers) {
    serverStats.set(server.id, {
      id: server.id,
      name: server.name,
      base: server.base,
      tested: 0,
      hit: 0,
      miss: 0,
      blocked: 0,
      rate_limited: 0,
      timeout: 0,
      other: 0
    });
  }

  for (const sample of samples) {
    if (!categoryStats.has(sample.category)) {
      categoryStats.set(sample.category, { total: 0, hitsByServer: new Map() });
    }

    for (const server of servers) {
      const url = buildUrl(server.id, server.base, sample);
      if (!url) continue;

      const status = await fetchStatus(url);
      const bucket = statusBucket(status);

      const st = serverStats.get(server.id);
      st.tested += 1;
      st[bucket] += 1;

      const cat = categoryStats.get(sample.category);
      cat.total += 1;
      cat.hitsByServer.set(server.id, (cat.hitsByServer.get(server.id) || 0) + (status === 200 ? 1 : 0));

      console.log(`S${server.id} ${server.name.padEnd(12)} | ${sample.category.padEnd(14)} | ${sample.title.padEnd(28)} | ${String(status).padEnd(7)} | ${url}`);
    }
  }

  const ranked = [...serverStats.values()]
    .map((s) => ({
      ...s,
      score: s.tested ? (s.hit / s.tested) * 100 : 0
    }))
    .sort((a, b) => b.score - a.score || a.timeout - b.timeout || a.rate_limited - b.rate_limited || a.id - b.id);

  console.log('\n=== Server Ranking (by regional hit rate) ===');
  for (const s of ranked) {
    console.log(
      `#${s.id.toString().padStart(2, '0')} ${s.name.padEnd(12)} | score ${s.score.toFixed(1).padStart(5)}% | hit ${String(s.hit).padStart(2)}/${String(s.tested).padEnd(2)} | 404 ${s.miss} | 429 ${s.rate_limited} | 403 ${s.blocked} | timeout ${s.timeout}`
    );
  }

  console.log('\n=== Category Snapshot ===');
  for (const [category, data] of categoryStats.entries()) {
    const best = ranked
      .map((s) => ({ id: s.id, name: s.name, hits: data.hitsByServer.get(s.id) || 0 }))
      .sort((a, b) => b.hits - a.hits || a.id - b.id)
      .slice(0, 3);
    console.log(`${category}: top -> ${best.map((b) => `S${b.id}(${b.name} ${b.hits})`).join(', ')}`);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
