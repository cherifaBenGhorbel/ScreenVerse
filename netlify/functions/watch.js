const getServerMap = () => ({
  1: process.env.WATCH_SITE_URL1,
  2: process.env.WATCH_SITE_URL2,
  3: process.env.WATCH_SITE_URL3,
  4: process.env.WATCH_SITE_URL4
});

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
    if (!serverMap[1] || !serverMap[2] || !serverMap[3] || !serverMap[4]) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Watch servers are not configured' }) };
    }

    const splat = getSplat(event);
    const cleanPath = String(splat).replace(/^\/+/, '');

    if (!cleanPath || cleanPath.includes('..') || cleanPath.includes('://')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid watch path' }) };
    }

    const serverRaw = ((event.queryStringParameters || {}).server || '1').trim();
    const serverNumber = Number(serverRaw);
    if (!Number.isInteger(serverNumber) || serverNumber < 1 || serverNumber > 4) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid server number' }) };
    }

    const base = String(serverMap[serverNumber] || '').replace(/\/+$/, '');
    const targetUrl = `${base}/${cleanPath}`;

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
