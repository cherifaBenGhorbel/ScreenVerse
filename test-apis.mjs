#!/usr/bin/env node

import { readFileSync } from 'fs';

// Load environment variables
const loadEnv = () => {
  const envFile = readFileSync('.env', 'utf8');
  const env = {};
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.trim().split('=');
    if (key && valueParts.length) {
      env[key] = valueParts.join('=');
    }
  });
  return env;
};

const env = loadEnv();
const watchServers = [
  env.WATCH_SITE_URL1,
  env.WATCH_SITE_URL2,
  env.WATCH_SITE_URL3,
  env.WATCH_SITE_URL4,
  env.WATCH_SITE_URL5,
  env.WATCH_SITE_URL6,
  env.WATCH_SITE_URL7,
  env.WATCH_SITE_URL8,
  env.WATCH_SITE_URL9,
  env.WATCH_SITE_URL10,
  env.WATCH_SITE_URL11
];

const serverNames = [
  'Cinezo',
  '111Movies',
  'VidZen',
  'VidFast',
  'VidSrc Embed',
  'VidSrc ICU',
  'VidSrc TO',
  'CineSrc',
  'MegaEmbed',
  'EmbedMaster',
  'VSEmbed'
];

const testApi = async (url, name, serverNum) => {
  if (!url) {
    return { server: serverNum, name, url, status: '❌ NOT CONFIGURED', time: 'N/A' };
  }

  const startTime = Date.now();
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      // Some servers don't allow HEAD requests, so we'll try GET with a timeout
      signal: AbortSignal.timeout(5000)
    }).catch(async () => {
      // If HEAD fails, try GET
      return fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
    });

    const time = Date.now() - startTime;
    const status = response.ok ? '✅ OK' : `⚠️ ${response.status}`;
    return { server: serverNum, name, url, status, time: `${time}ms` };
  } catch (error) {
    const time = Date.now() - startTime;
    let status = '❌ FAILED';
    if (error.name === 'AbortError') {
      status = '⏱️ TIMEOUT';
    } else if (error instanceof TypeError) {
      status = '❌ OFFLINE';
    }
    return { server: serverNum, name, url, status, time: `${time}ms` };
  }
};

const runTests = async () => {
  console.log('\n🧪 Testing Watch Server APIs...\n');
  console.log('Server | Provider        | URL                                | Status        | Response Time');
  console.log('-------|-----------------|------------------------------------|---------+-----------');

  const results = [];
  for (let i = 0; i < watchServers.length; i++) {
    const result = await testApi(watchServers[i], serverNames[i], i + 1);
    results.push(result);
    console.log(`${result.server.toString().padEnd(6)}| ${result.name.padEnd(15)}| ${(result.url || 'N/A').substring(0, 34).padEnd(35)}| ${result.status.padEnd(13)}| ${result.time}`);
  }

  console.log('-------|-----------------|------------------------------------|---------+-----------\n');

  const working = results.filter(r => r.status === '✅ OK').length;
  const total = results.filter(r => r.url).length;

  console.log(`Summary: ${working}/${total} servers online\n`);

  // Detailed results
  console.log('📊 Detailed Results:\n');
  const working_servers = results.filter(r => r.status === '✅ OK');
  const failed_servers = results.filter(r => r.status !== '✅ OK' && r.status !== '⚠️ ' + r.status.substring(2));
  
  if (working_servers.length > 0) {
    console.log('✅ Working Servers:');
    working_servers.forEach(s => console.log(`   Server ${s.server}: ${s.name} - ${s.url}`));
  }

  if (failed_servers.length > 0) {
    console.log('\n❌ Failed/Offline Servers:');
    failed_servers.forEach(s => console.log(`   Server ${s.server}: ${s.name} - ${s.status}`));
  }

  console.log('\n');
};

runTests().catch(console.error);
