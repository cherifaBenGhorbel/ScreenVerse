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

const servers = [
  { num: 1, name: 'Cinezo', url: env.WATCH_SITE_URL1 },
  { num: 2, name: '111Movies', url: env.WATCH_SITE_URL2 },
  { num: 3, name: 'VidZen', url: env.WATCH_SITE_URL3 },
  { num: 4, name: 'VidFast', url: env.WATCH_SITE_URL4 },
  { num: 5, name: 'VidSrc Embed', url: env.WATCH_SITE_URL5 },
  { num: 6, name: 'VidSrc ICU', url: env.WATCH_SITE_URL6 },
  { num: 7, name: 'VidSrc TO', url: env.WATCH_SITE_URL7 },
  { num: 8, name: 'CineSrc', url: env.WATCH_SITE_URL8 },
  { num: 9, name: 'MegaEmbed', url: env.WATCH_SITE_URL9 },
  { num: 10, name: 'EmbedMaster', url: env.WATCH_SITE_URL10 },
  { num: 11, name: 'VSEmbed', url: env.WATCH_SITE_URL11 }
];

const testApi = async (url, name) => {
  if (!url) return { name, status: 'NOT_CONFIGURED' };
  
  try {
    const response = await Promise.race([
      fetch(url, { method: 'HEAD' }).catch(() => fetch(url, { method: 'GET' })),
      new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 5000))
    ]);
    
    return { name, url, status: response.ok ? 'OK' : `HTTP_${response.status}`, time: 'responsive' };
  } catch (e) {
    const msg = e.message;
    if (msg === 'TIMEOUT') return { name, url, status: 'TIMEOUT' };
    if (msg.includes('fetch')) return { name, url, status: 'OFFLINE' };
    return { name, url, status: 'ERROR: ' + msg };
  }
};

async function main() {
  console.log('\n📡 Testing Watch Server APIs\n');
  
  const results = await Promise.all(
    servers.map(s => testApi(s.url, s.name))
  );

  servers.forEach((s, i) => {
    const result = results[i];
    const marker = result.status === 'OK' ? '✅' : 
                  result.status === 'NOT_CONFIGURED' ? '⚠️' : '❌';
    console.log(`${marker} Server ${s.num} (${s.name}): ${result.status}`);
    if (result.url) console.log(`   URL: ${result.url}`);
  });

  const working = results.filter(r => r.status === 'OK').length;
  console.log(`\n📊 Summary: ${working}/${servers.length} servers working\n`);
}

main();
