const fs = require('fs');
const path = require('path');

/** Default weights from spec §13 — must sum to 1.0 */
const DEFAULT_CATEGORY_WEIGHTS = {
  first_impression_cta: 0.2,
  trust_social_proof: 0.18,
  lead_capture_forms: 0.15,
  copy_quality: 0.15,
  funnel_pricing: 0.12,
  technical_performance: 0.1,
  tracking_infra: 0.1
};

function normalizeWeights(w) {
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 0.001) {
    const out = {};
    for (const [k, v] of Object.entries(w)) {
      out[k] = v / sum;
    }
    return out;
  }
  return { ...w };
}

/**
 * @param {string} [profilePath]
 * @returns {Record<string, number>}
 */
function loadCategoryWeights(profilePath) {
  if (!profilePath) return { ...DEFAULT_CATEGORY_WEIGHTS };
  const resolved = path.isAbsolute(profilePath)
    ? profilePath
    : path.join(process.cwd(), profilePath);
  const raw = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  return normalizeWeights(raw);
}

module.exports = {
  DEFAULT_CATEGORY_WEIGHTS,
  loadCategoryWeights,
  normalizeWeights
};
