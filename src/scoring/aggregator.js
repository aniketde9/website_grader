const { PARAMETERS } = require('../../config/parameters');
const { loadCategoryWeights } = require('./weights');

function round2(n) {
  if (n === null || n === undefined || n === '') return '';
  const num = Number(n);
  if (Number.isNaN(num)) return '';
  return Math.round(num * 100) / 100;
}

/**
 * @param {number|null|undefined} v
 */
function isScoredValue(v) {
  if (v === null || v === undefined) return false;
  if (v === '') return false;
  const n = Number(v);
  return !Number.isNaN(n);
}

/**
 * @param {Record<string, number|string|null>} flatScoresByCsvColumn
 * @param {Record<string, number>} [categoryWeights]
 */
function computeCategoryWeightedScore(flatScoresByCsvColumn, categoryWeights) {
  const weights = categoryWeights || loadCategoryWeights();
  const byCategory = {};

  for (const p of PARAMETERS) {
    const val = flatScoresByCsvColumn[p.csvColumn];
    if (!isScoredValue(val)) continue;
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(Number(val));
  }

  let weightedSum = 0;
  let weightUsed = 0;

  for (const [cat, w] of Object.entries(weights)) {
    const vals = byCategory[cat];
    if (!vals || vals.length === 0) continue;
    const catMean = vals.reduce((a, b) => a + b, 0) / vals.length;
    weightedSum += w * catMean;
    weightUsed += w;
  }

  if (weightUsed <= 0) return 0;
  const normalized = weightedSum / weightUsed;
  return Math.min(100, Math.max(0, normalized * 100));
}

/**
 * @param {object} tier1Results
 * @param {object} tier2Results
 * @param {{ scores: (number|null)[], raw: string, valid: boolean }} tier3Results
 * @param {object} psiData
 * @param {{ categoryWeights?: Record<string, string> }} [opts]
 */
function buildScore(tier1Results, tier2Results, tier3Results, psiData, opts = {}) {
  const weights = opts.categoryWeights || loadCategoryWeights(opts.weightsProfilePath);

  const flatScores = {};

  const t1Map = [
    ['p01_subheadline', tier1Results.subheadline],
    ['p02_cta_above_fold', tier1Results.ctaAboveFold],
    ['p03_cta_verb_copy', tier1Results.ctaVerbCopy],
    ['p04_cta_contrast', tier1Results.ctaContrast],
    ['p05_single_cta_per_view', tier1Results.singleCta],
    ['p06_cta_repeated', tier1Results.ctaRepeated],
    ['p07_cta_sticky_mobile', tier1Results.ctaStickyMobile],
    ['p08_video_testimonial', tier1Results.videoTestimonial],
    ['p09_star_rating', tier1Results.starRating],
    ['p10_customer_stat', tier1Results.customerStat],
    ['p11_countdown_timer', tier1Results.countdown],
    ['p12_friction_microcopy', tier1Results.frictionMicrocopy],
    ['p13_form_field_count_score', tier1Results.formFieldCount],
    ['p14_label_above_field', tier1Results.labelsAbove],
    ['p15_multistep_form', tier1Results.multistepForm],
    ['p16_privacy_microcopy', tier1Results.privacyMicrocopy],
    ['p17_transparent_pricing', tier1Results.transparentPricing],
    ['p18_pricing_comparison_table', tier1Results.pricingTable],
    ['p19_billing_toggle', tier1Results.billingToggle],
    ['p20_live_chat', tier1Results.liveChat],
    ['p21_booking_widget', tier1Results.bookingWidget],
    ['p22_core_web_vitals', tier1Results.coreWebVitals],
    ['p23_mobile_perf_score', tier1Results.mobilePerfScore],
    ['p24_tap_targets', tier1Results.tapTargets],
    ['p25_ga4_gtm', tier1Results.analyticsGTM],
    ['p26_retargeting_pixels', tier1Results.retargetingPixels],
    ['p27_session_replay', tier1Results.sessionReplay],
    ['p28_ab_testing', tier1Results.abTesting]
  ];

  const t2Map = [
    ['p29_logo_wall', tier2Results.logoWall],
    ['p30_attributed_testimonials', tier2Results.attributedTestimonials],
    ['p31_trust_badges_decision', tier2Results.trustBadges],
    ['p32_urgency_scarcity', tier2Results.urgency],
    ['p33_guarantee_near_cta', tier2Results.guaranteeNearCta],
    ['p34_faq_section', tier2Results.faq],
    ['p35_lead_magnet', tier2Results.leadMagnet],
    ['p36_popup_trigger_timing', tier2Results.popupTiming],
    ['p37_inline_optin', tier2Results.inlineOptin],
    ['p38_blog_content_upgrades', tier2Results.blogContentUpgrade],
    ['p39_inline_form_validation', tier2Results.inlineValidation],
    ['p40_nav_removed_lp', tier2Results.navRemoved],
    ['p41_plan_persona_mapping', tier2Results.planPersona]
  ];

  const t3Cols = [
    'p42_headline_clarity',
    'p43_hero_visual_quality',
    'p44_three_question_test',
    'p45_benefit_led_copy',
    'p46_claim_specificity',
    'p47_differentiation',
    'p48_voc_language',
    'p49_benefit_subheadings'
  ];

  for (const [col, val] of [...t1Map, ...t2Map]) {
    flatScores[col] = val;
  }

  for (let i = 0; i < 8; i++) {
    const s = tier3Results.scores[i];
    flatScores[t3Cols[i]] = s === null || s === undefined ? '' : s;
  }

  const allForRaw = PARAMETERS.map(p => flatScores[p.csvColumn]).filter(isScoredValue);
  const totalRaw =
    allForRaw.length > 0
      ? allForRaw.reduce((a, b) => a + Number(b), 0) / allForRaw.length
      : 0;

  const totalWeighted = computeCategoryWeightedScore(flatScores, weights);

  const grade =
    totalWeighted >= 80
      ? 'A'
      : totalWeighted >= 65
        ? 'B'
        : totalWeighted >= 50
          ? 'C'
          : totalWeighted >= 35
            ? 'D'
            : 'F';

  const t1Vals = t1Map.map(([, v]) => v).filter(isScoredValue);
  const t2Vals = t2Map.map(([, v]) => v).filter(isScoredValue);
  const t3Vals = tier3Results.scores.filter(s => s !== null && s !== undefined);

  const tier1Score = t1Vals.length ? t1Vals.reduce((a, b) => a + Number(b), 0) / t1Vals.length : 0;
  const tier2Score = t2Vals.length ? t2Vals.reduce((a, b) => a + Number(b), 0) / t2Vals.length : 0;
  const tier3Score = t3Vals.length ? t3Vals.reduce((a, b) => a + Number(b), 0) / t3Vals.length : 0;

  const out = {};
  for (const p of PARAMETERS) {
    const v = flatScores[p.csvColumn];
    out[p.csvColumn] = v === '' || v === null || v === undefined ? '' : round2(v);
  }

  return {
    ...out,
    llm_raw_response: tier3Results.raw || '',
    psi_lcp_ms: psiData.raw?.lcp ?? '',
    psi_inp_ms: psiData.raw?.inp ?? '',
    psi_cls: psiData.raw?.cls ?? '',
    psi_mobile_score: psiData.mobileScore ?? '',
    tier1_score: round2(tier1Score),
    tier2_score: round2(tier2Score),
    tier3_score: round2(tier3Score),
    total_raw_score: round2(totalRaw),
    total_weighted_score: round2(totalWeighted),
    grade
  };
}

module.exports = {
  buildScore,
  computeCategoryWeightedScore,
  round2
};
