const dom = require('./dom');
const source = require('./source');
const css = require('./css');
const {
  fetchPageSpeed,
  checkCoreWebVitals,
  checkMobilePerf,
  checkTapTargets
} = require('./pagespeed');

/**
 * @param {object} pageData
 * @param {object|null} psiData
 * @param {{ skipPsi?: boolean }} opts
 */
async function analyzeAll(pageData, psiData, opts = {}) {
  const skipPsi = opts.skipPsi === true;
  let psi = psiData;
  if (!skipPsi) {
    const hasAudits = psi && psi.audits && Object.keys(psi.audits).length > 0;
    const hasErr = psi && psi.error;
    if (!psi || (!hasAudits && !hasErr)) {
      psi = await fetchPageSpeed(pageData.url);
    }
  } else {
    psi = {
      score: 0,
      mobileScore: 0,
      raw: { lcp: '', inp: '', cls: '', mobileScore: '' },
      audits: {},
      loadingExperience: {}
    };
  }

  const tier1 = {
    subheadline: dom.checkSubheadline(pageData),
    ctaAboveFold: dom.checkCtaAboveFold(pageData),
    ctaVerbCopy: dom.checkCtaVerbCopy(pageData),
    ctaContrast: css.checkCtaContrast(pageData),
    singleCta: dom.checkSingleCta(pageData),
    ctaRepeated: dom.checkCtaRepeated(pageData),
    ctaStickyMobile: dom.checkStickyMobileCta(pageData.mobileData || {}),
    videoTestimonial: dom.checkVideoTestimonial(pageData),
    starRating: dom.checkStarRating(pageData),
    customerStat: dom.checkCustomerStat(pageData),
    countdown: dom.checkCountdown(pageData),
    frictionMicrocopy: dom.checkFrictionMicrocopy(pageData),
    formFieldCount: dom.checkFormFieldCount(pageData),
    labelsAbove: dom.checkLabelsAbove(pageData),
    multistepForm: dom.checkMultiStepForm(pageData),
    privacyMicrocopy: dom.checkPrivacyMicrocopy(pageData),
    transparentPricing: dom.checkTransparentPricing(pageData),
    pricingTable: dom.checkPricingTable(pageData),
    billingToggle: dom.checkBillingToggle(pageData),
    liveChat: source.checkLiveChat(pageData.sourceHtml || '', pageData.networkRequests || []),
    bookingWidget: source.checkBookingWidget(
      pageData.sourceHtml || '',
      pageData.networkRequests || []
    ),
    coreWebVitals: skipPsi ? 0 : checkCoreWebVitals(psi),
    mobilePerfScore: skipPsi ? 0 : checkMobilePerf(psi),
    tapTargets: skipPsi ? 0 : checkTapTargets(psi),
    analyticsGTM: source.checkAnalytics(pageData.sourceHtml || ''),
    retargetingPixels: source.checkRetargetingPixels(
      pageData.sourceHtml || '',
      pageData.networkRequests || []
    ),
    sessionReplay: source.checkSessionReplay(
      pageData.sourceHtml || '',
      pageData.networkRequests || []
    ),
    abTesting: source.checkABTesting(pageData.sourceHtml || '', pageData.networkRequests || [])
  };

  const tier2 = {
    logoWall: dom.checkLogoWall(pageData),
    attributedTestimonials: dom.checkAttributedTestimonials(pageData),
    trustBadges: dom.checkTrustBadges(pageData),
    urgency: dom.checkUrgency(pageData),
    guaranteeNearCta: dom.checkGuaranteeNearCta(pageData),
    faq: dom.checkFAQ(pageData),
    leadMagnet: dom.checkLeadMagnet(pageData),
    popupTiming: dom.checkPopupTiming(pageData),
    inlineOptin: dom.checkInlineOptin(pageData),
    blogContentUpgrade: dom.checkBlogContentUpgrade(pageData),
    inlineValidation: dom.checkInlineValidation(pageData),
    navRemoved: dom.checkNavRemoved(pageData),
    planPersona: dom.checkPlanPersona(pageData)
  };

  return { tier1, tier2, psi };
}

module.exports = {
  analyzeAll,
  fetchPageSpeed
};
