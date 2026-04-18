const { buildScore, computeCategoryWeightedScore } = require('../src/scoring/aggregator');
const { DEFAULT_CATEGORY_WEIGHTS } = require('../src/scoring/weights');

describe('computeCategoryWeightedScore', () => {
  test('renormalizes when a category has no scored params', () => {
    const flat = { p01_subheadline: 1 };
    const w = { ...DEFAULT_CATEGORY_WEIGHTS };
    const score = computeCategoryWeightedScore(flat, w);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('uniform params yield weighted score near mean times 100', () => {
    const flat = {};
    const ids = require('../config/parameters').PARAMETERS;
    for (const p of ids) {
      flat[p.csvColumn] = 0.5;
    }
    const score = computeCategoryWeightedScore(flat, DEFAULT_CATEGORY_WEIGHTS);
    expect(score).toBeCloseTo(50, 5);
  });
});

describe('buildScore', () => {
  const tier1 = {
    subheadline: 1,
    ctaAboveFold: 1,
    ctaVerbCopy: 1,
    ctaContrast: 1,
    singleCta: 1,
    ctaRepeated: 1,
    ctaStickyMobile: 1,
    videoTestimonial: 0,
    starRating: 0,
    customerStat: 0,
    countdown: 0,
    frictionMicrocopy: 0,
    formFieldCount: 0,
    labelsAbove: 0,
    multistepForm: 0,
    privacyMicrocopy: 0,
    transparentPricing: 0,
    pricingTable: 0,
    billingToggle: 0,
    liveChat: 0,
    bookingWidget: 0,
    coreWebVitals: 0,
    mobilePerfScore: 0,
    tapTargets: 0,
    analyticsGTM: 0,
    retargetingPixels: 0,
    sessionReplay: 0,
    abTesting: 0
  };

  const tier2 = {
    logoWall: 0,
    attributedTestimonials: 0,
    trustBadges: 0,
    urgency: 0,
    guaranteeNearCta: 0,
    faq: 0,
    leadMagnet: 0,
    popupTiming: 0,
    inlineOptin: 0,
    blogContentUpgrade: 0,
    inlineValidation: 0,
    navRemoved: 0,
    planPersona: 0
  };

  const psi = {
    raw: { lcp: 1000, inp: 100, cls: 0.05 },
    mobileScore: 90
  };

  test('produces grade from weighted score', () => {
    const tier3 = {
      scores: [0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6],
      raw: '3,3,3,3,3,3,3,3',
      valid: true
    };
    const out = buildScore(tier1, tier2, tier3, psi, {});
    expect(out.p01_subheadline).toBe(1);
    expect(out.grade).toMatch(/[A-F]/);
    expect(out.total_weighted_score).not.toBe('');
 });

  test('empty LLM scores excluded from copy_quality mean only', () => {
    const tier3 = {
      scores: [null, null, null, null, null, null, null, null],
      raw: '',
      valid: false
    };
    const out = buildScore(tier1, tier2, tier3, psi, {});
    expect(out.p42_headline_clarity).toBe('');
    expect(out.total_raw_score).not.toBe('');
  });
});
