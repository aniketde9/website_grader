const axios = require('axios');
const { withRetry } = require('../utils/retry');
const { logger } = require('../utils/logger');

/**
 * @param {string} url
 * @returns {Promise<{ score: number, mobileScore: number, raw: object, audits: object, loadingExperience: object }>}
 */
async function fetchPageSpeed(url) {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) {
    return {
      score: 0,
      mobileScore: 0,
      raw: {},
      audits: {},
      loadingExperience: {},
      error: 'no_api_key'
    };
  }

  const endpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

  const run = async () => {
    const response = await axios.get(endpoint, {
      params: {
        url,
        strategy: 'mobile',
        key: apiKey,
        category: 'performance'
      },
      timeout: 30000
    });
    return response.data;
  };

  let data;
  try {
    data = await withRetry(run, 3, 5000);
  } catch (e) {
    logger.warn('PageSpeed request failed', { url, message: e.message });
    return {
      score: 0,
      mobileScore: 0,
      raw: {},
      audits: {},
      loadingExperience: {},
      error: e.message
    };
  }

  const metrics = data?.lighthouseResult?.audits || {};
  const loadingExperience = data?.loadingExperience || {};
  const crux = loadingExperience?.metrics;

  const lcpRaw =
    crux?.LARGEST_CONTENTFUL_PAINT_MS?.percentile ??
    metrics['largest-contentful-paint']?.numericValue ??
    null;
  const inpRaw =
    crux?.INTERACTION_TO_NEXT_PAINT?.percentile ??
    metrics['interaction-to-next-paint']?.numericValue ??
    metrics['total-blocking-time']?.numericValue ??
    null;
  let clsRaw =
    crux?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile != null
      ? crux.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100
      : metrics['cumulative-layout-shift']?.numericValue ?? null;

  const mobileScore = Math.round(
    (data?.lighthouseResult?.categories?.performance?.score || 0) * 100
  );

  const lcp = lcpRaw != null ? Number(lcpRaw) : null;
  const inp = inpRaw != null ? Number(inpRaw) : null;
  const cls = clsRaw != null ? Number(clsRaw) : null;

  const lcpPass = lcp != null && lcp <= 2500;
  const inpPass = inp != null && inp <= 200;
  const clsPass = cls != null && cls <= 0.1;
  const allKnown = lcp != null && inp != null && cls != null;
  const score = allKnown && lcpPass && inpPass && clsPass ? 1 : 0;

  return {
    score,
    mobileScore,
    audits: metrics,
    loadingExperience,
    raw: { lcp, inp, cls, mobileScore }
  };
}

function checkCoreWebVitals(psiData) {
  return psiData.score;
}

function checkMobilePerf(psiData) {
  return (psiData.mobileScore || 0) / 100;
}

function checkTapTargets(psiData) {
  const tapTargetAudit = psiData.audits?.['tap-targets'];
  if (!tapTargetAudit) return 0;
  return tapTargetAudit.score >= 0.9 ? 1 : 0;
}

module.exports = {
  fetchPageSpeed,
  checkCoreWebVitals,
  checkMobilePerf,
  checkTapTargets
};
