const getServerMap = () => ({
  1: process.env.WATCH_SITE_URL1,
  2: process.env.WATCH_SITE_URL2,
  3: process.env.WATCH_SITE_URL3,
  4: process.env.WATCH_SITE_URL4,
  5: process.env.WATCH_SITE_URL5,
  6: process.env.WATCH_SITE_URL6,
  7: process.env.WATCH_SITE_URL7
});

const forwardedWatchParams = new Set([
  'title',
  'poster',
  'autoPlay',
  'startAt',
  'theme',
  'nextButton',
  'autoNext',
  'tmdb',
  'season',
  'episode',
  'server',
  'providerServer',
  'hideServer',
  'fullscreenButton',
  'chromecast',
  'sub'
]);

const getSplat = (event) => {
  const pathSplat = event.pathParameters && event.pathParameters.splat;
  if (pathSplat) return pathSplat;

  const candidates = [event.rawPath, event.path, event.rawUrl];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const index = candidate.indexOf('/watch/');
    if (index >= 0) {
      return candidate.slice(index + '/watch/'.length);
    }
  }

  return '';
};

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const serverMap = getServerMap();
    if (!serverMap[1] || !serverMap[2] || !serverMap[3] || !serverMap[4] || !serverMap[5] || !serverMap[6] || !serverMap[7]) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Watch servers are not configured' }) };
    }

    const splat = getSplat(event);
    const cleanPath = String(splat).replace(/^\/+/, '');

    if (!cleanPath || cleanPath.includes('..') || cleanPath.includes('://')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid watch path' }) };
    }

    const queryParams = event.queryStringParameters || {};
    const serverRaw = String(queryParams.proxyServer || queryParams.server || '1').trim();
    const serverNumber = Number(serverRaw);
    if (!Number.isInteger(serverNumber) || serverNumber < 1 || serverNumber > 7) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid server number' }) };
    }

    const base = String(serverMap[serverNumber] || '').replace(/\/+$/, '');
    const targetParams = new URLSearchParams();

    for (const [key, value] of Object.entries(queryParams)) {
      if (!forwardedWatchParams.has(key)) continue;
      if (typeof value !== 'string' || !value.trim()) continue;

      if (key === 'server' && serverNumber !== 4) {
        continue;
      }

      if (key === 'providerServer' && !targetParams.has('server')) {
        targetParams.set('server', value.trim());
      } else if (key !== 'providerServer') {
        targetParams.set(key, value.trim());
      }
    }

    const query = targetParams.toString();
    const targetUrl = query ? `${base}/${cleanPath}?${query}` : `${base}/${cleanPath}`;

    return {
      statusCode: 302,
      headers: {
        Location: targetUrl,
        'Cache-Control': 'no-store'
      },
      body: ''
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Watch proxy failed', details: String(error && error.message ? error.message : error) })
    };
  }
};
