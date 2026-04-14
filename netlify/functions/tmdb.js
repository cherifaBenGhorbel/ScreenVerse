const DEFAULT_TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const getSplat = (event) => {
  const pathSplat = event.pathParameters && event.pathParameters.splat;
  if (pathSplat) return pathSplat;

  const candidates = [event.rawPath, event.path, event.rawUrl];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const index = candidate.indexOf('/tmdb/');
    if (index >= 0) {
      return candidate.slice(index + '/tmdb/'.length);
    }
  }

  return '';
};

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const tmdbApiKey = process.env.TMDB_API_KEY;
    const tmdbAccessToken = process.env.TMDB_ACCESS_TOKEN;

    if (!tmdbApiKey || !tmdbAccessToken) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Server environment not configured' }) };
    }

    const splat = getSplat(event);
    const cleanPath = `/${String(splat).replace(/^\/+/, '')}`;

    if (!cleanPath || cleanPath === '/') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing TMDB endpoint path' }) };
    }

    if (cleanPath.includes('..') || cleanPath.includes('://')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid TMDB path' }) };
    }

    const baseUrl = process.env.TMDB_BASE_URL || DEFAULT_TMDB_BASE_URL;
    const url = new URL(baseUrl.replace(/\/+$/, '') + cleanPath);

    const incomingParams = event.queryStringParameters || {};
    for (const [key, value] of Object.entries(incomingParams)) {
      if (typeof value === 'string' && value.length > 0) {
        url.searchParams.set(key, value);
      }
    }

    if (!url.searchParams.has('language')) {
      url.searchParams.set('language', 'en');
    }

    if (!url.searchParams.has('api_key')) {
      url.searchParams.set('api_key', tmdbApiKey);
    }

    const upstream = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${tmdbAccessToken}`
      }
    });

    const body = await upstream.text();
    return {
      statusCode: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=60'
      },
      body
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'TMDB proxy failed', details: String(error && error.message ? error.message : error) })
    };
  }
};
