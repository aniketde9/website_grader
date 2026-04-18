function checkSubheadline(pageData) {
  return pageData.hasSubheadline ? 1 : 0;
}

function checkCtaAboveFold(pageData) {
  return pageData.ctaInViewportCount >= 1 ? 1 : 0;
}

function checkCtaVerbCopy(pageData) {
  const strongVerbs =
    /^(get|start|try|book|claim|download|join|schedule|access|unlock|build)/i;
  const weakVerbs = /^(learn more|read more|click here|submit|go|continue|next)/i;
  const hasStrong = pageData.allButtonText.some(t => strongVerbs.test(t.trim()));
  const hasWeak = pageData.allButtonText.some(t => weakVerbs.test(t.trim()));
  if (hasStrong && !hasWeak) return 1;
  if (hasStrong && hasWeak) return 0.6;
  if (pageData.ctaHasVerb) return 0.4;
  return 0;
}

function checkSingleCta(pageData) {
  return pageData.ctaInViewportCount === 1 ? 1 : 0;
}

function checkCtaRepeated(pageData) {
  const ctaCount = pageData.allButtonText.filter(t =>
    /^(get|start|try|book|claim|download|join|schedule|sign up|subscribe)/i.test(
      t.trim()
    )
  ).length;
  return ctaCount >= 2 ? 1 : 0;
}

function checkStickyMobileCta(mobileData) {
  return mobileData.hasStickyOrFixedCta ? 1 : 0;
}

function checkVideoTestimonial(pageData) {
  return pageData.hasVideo ? 1 : 0;
}

function checkStarRating(pageData) {
  return pageData.hasStarRating ? 1 : 0;
}

function checkCustomerStat(pageData) {
  return pageData.hasCustomerStat ? 1 : 0;
}

function checkCountdown(pageData) {
  return pageData.hasCountdown ? 1 : 0;
}

function checkFrictionMicrocopy(pageData) {
  return pageData.hasFrictionMicrocopy ? 1 : 0;
}

function checkFormFieldCount(pageData) {
  if (!pageData.forms || pageData.forms.length === 0) return 0;
  const primaryForm = pageData.forms.reduce((min, f) =>
    f.inputCount < min.inputCount ? f : min, pageData.forms[0]);
  return primaryForm.inputCount <= 5 ? 1 : 0;
}

function checkLabelsAbove(pageData) {
  if (!pageData.forms || pageData.forms.length === 0) return 0;
  return pageData.forms[0].labelsAboveAll ? 1 : 0;
}

function checkMultiStepForm(pageData) {
  return pageData.forms.some(f => f.isMultiStep && f.hasProgressBar) ? 1 : 0;
}

function checkPrivacyMicrocopy(pageData) {
  return pageData.forms.some(f => f.hasPrivacyText) ? 1 : 0;
}

function checkTransparentPricing(pageData) {
  if (pageData.hasCurrencyPattern && !pageData.hasContactUsForPricing) return 1;
  return 0;
}

function checkPricingTable(pageData) {
  return pageData.hasPricingTable ? 1 : 0;
}

function checkBillingToggle(pageData) {
  return pageData.hasBillingToggle ? 1 : 0;
}

function checkLogoWall(pageData) {
  return pageData.hasLogoWall ? 1 : 0;
}

function checkAttributedTestimonials(pageData) {
  return pageData.hasNameInTestimonial ? 1 : 0;
}

function checkTrustBadges(pageData) {
  return pageData.trustBadgeNearCta ? 1 : 0;
}

function checkUrgency(pageData) {
  return pageData.hasUrgency ? 1 : 0;
}

function checkGuaranteeNearCta(pageData) {
  return pageData.guaranteeNearCTA ? 1 : 0;
}

function checkFAQ(pageData) {
  return pageData.hasFAQ ? 1 : 0;
}

function checkLeadMagnet(pageData) {
  return pageData.hasLeadMagnet ? 1 : 0;
}

function checkPopupTiming(pageData) {
  return pageData.popupTriggerTiming ? 1 : 0;
}

function checkInlineOptin(pageData) {
  return pageData.hasInlineOptin ? 1 : 0;
}

function checkBlogContentUpgrade(pageData) {
  return pageData.blogContentUpgrade ? 1 : 0;
}

function checkInlineValidation(pageData) {
  return pageData.forms.some(f => f.hasInlineValidation) ? 1 : 0;
}

function checkNavRemoved(pageData) {
  if (!pageData.hasNav) return 1;
  return pageData.navLinkCount <= 2 ? 1 : 0;
}

function checkPlanPersona(pageData) {
  return pageData.hasPlanPersona ? 1 : 0;
}

module.exports = {
  checkSubheadline,
  checkCtaAboveFold,
  checkCtaVerbCopy,
  checkSingleCta,
  checkCtaRepeated,
  checkStickyMobileCta,
  checkVideoTestimonial,
  checkStarRating,
  checkCustomerStat,
  checkCountdown,
  checkFrictionMicrocopy,
  checkFormFieldCount,
  checkLabelsAbove,
  checkMultiStepForm,
  checkPrivacyMicrocopy,
  checkTransparentPricing,
  checkPricingTable,
  checkBillingToggle,
  checkLogoWall,
  checkAttributedTestimonials,
  checkTrustBadges,
  checkUrgency,
  checkGuaranteeNearCta,
  checkFAQ,
  checkLeadMagnet,
  checkPopupTiming,
  checkInlineOptin,
  checkBlogContentUpgrade,
  checkInlineValidation,
  checkNavRemoved,
  checkPlanPersona
};
