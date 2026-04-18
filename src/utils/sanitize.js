const { URL } = require('url');

const DIRECTORY_HOSTS = new Set([
  'apa.org',
  'www.apa.org',
  'betterhelp.com',
  'www.betterhelp.com',
  'yelp.com',
  'www.yelp.com',
  'psychologytoday.com',
  'www.psychologytoday.com'
]);

function stripTrackingParams(urlStr) {
  try {
    const u = new URL(urlStr);
    const drop = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
    for (const k of drop) u.searchParams.delete(k);
    let out = u.toString();
    if (out.endsWith('/') && u.pathname !== '/') {
      out = out.slice(0, -1);
    }
    return out;
  } catch {
    return urlStr;
  }
}

function normalizeUrlString(urlStr) {
  let s = (urlStr || '').trim();
  if (!s) return s;
  if (!/^https?:\/\//i.test(s)) {
    s = `https://${s}`;
  }
  s = stripTrackingParams(s);
  return s;
}

function extractDomain(urlStr) {
  try {
    const u = new URL(normalizeUrlString(urlStr));
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function isDirectoryHost(hostname) {
  const h = (hostname || '').replace(/^www\./, '').toLowerCase();
  return DIRECTORY_HOSTS.has(h) || DIRECTORY_HOSTS.has(`www.${h}`);
}

/**
 * @param {string} urlStr
 * @param {{ tryHttpFallback?: boolean, fetchFn?: (url: string) => Promise<{ ok: boolean }> }} [opts]
 * @returns {Promise<string>}
 */
async function resolveLandingUrl(urlStr, opts = {}) {
  const normalized = normalizeUrlString(urlStr);
  const tryHttpFallback = opts.tryHttpFallback !== false;

  if (opts.fetchFn) {
    try {
      const headLike = await opts.fetchFn(normalized);
      if (headLike && headLike.ok) return stripTrailingSlashOnly(normalized);
    } catch (_) {}

    if (tryHttpFallback && normalized.startsWith('https://')) {
      const httpUrl = normalized.replace(/^https:/i, 'http:');
      try {
        const r = await opts.fetchFn(httpUrl);
        if (r && r.ok) return stripTrailingSlashOnly(httpUrl);
      } catch (_) {}
    }
    return stripTrailingSlashOnly(normalized);
  }

  return stripTrailingSlashOnly(normalized);
}

function stripTrailingSlashOnly(urlStr) {
  try {
    const u = new URL(urlStr);
    if (u.pathname !== '/' && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return urlStr;
  }
}

module.exports = {
  normalizeUrlString,
  stripTrackingParams,
  extractDomain,
  isDirectoryHost,
  resolveLandingUrl,
  DIRECTORY_HOSTS
};
