#!/usr/bin/env node

import { readFileSync } from 'fs';

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

async function testUrl(url, timeout = 5000) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    clearTimeout(id);
    return response.status;
  } catch (e) {
    return e.name === 'AbortError' ? 'TIMEOUT' : 'ERROR';
  }
}

async function main() {
  const tvId = 310430;
  const season = 1;
  const episode = 7;

  // Test new Server 11 (VidLink)
  const url11 = 'https://vidlink.pro/tv/' + tvId + '/' + season + '/' + episode;
  console.log('Testing Server 11 (VidLink)...');
  console.log('URL:', url11);
  
  const result = await testUrl(url11, 3000);
  
  if (result === 200) {
    console.log('✅ VidLink has this episode available!\n');
  } else if (result === 404) {
    console.log('❌ Episode not found on VidLink\n');
  } else if (result === 'TIMEOUT') {
    console.log('⏱️ VidLink timeout\n');
  } else {
    console.log('⚠️ VidLink status:', result, '\n');
  }
}

main();
