const functionsPort = process.env.NETLIFY_FUNCTIONS_PORT || '9999';

module.exports = {
  '/api/tmdb': {
    target: `http://127.0.0.1:${functionsPort}`,
    secure: false,
    changeOrigin: true,
    pathRewrite: {
      '^/api/tmdb': '/.netlify/functions/tmdb'
    }
  },
  '/api/watch': {
    target: `http://127.0.0.1:${functionsPort}`,
    secure: false,
    changeOrigin: true,
    pathRewrite: {
      '^/api/watch': '/.netlify/functions/watch'
    }
  }
};