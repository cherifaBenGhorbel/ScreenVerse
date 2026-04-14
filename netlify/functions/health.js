exports.handler = async (event) => {
  try {
    const tmdbKey = process.env.TMDB_API_KEY;
    const tmdbToken = process.env.TMDB_ACCESS_TOKEN;
    const watch1 = process.env.WATCH_SITE_URL1;

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'Functions working!',
        environment: {
          TMDB_API_KEY: tmdbKey ? '✓ Set' : '✗ Missing',
          TMDB_ACCESS_TOKEN: tmdbToken ? '✓ Set' : '✗ Missing',
          WATCH_SITE_URL1: watch1 ? '✓ Set' : '✗ Missing'
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
