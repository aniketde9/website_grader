const browserPool = require('./pool');
const { withRetry } = require('../utils/retry');
const { logger } = require('../utils/logger');

function popupInitScript() {
  return () => {
    window.__popupLog = [];
    window.__popupStartTime = Date.now();
    const start = () => {
      const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node.nodeType === 1) {
              const el = /** @type {Element} */ (node);
              const className = (el.className || '').toString().toLowerCase();
              const id = (el.id || '').toString().toLowerCase();
              if (
                /(modal|popup|overlay|lightbox|dialog)/.test(className) ||
                /(modal|popup|dialog)/.test(id)
              ) {
                window.__popupLog.push({ time: Date.now(), class: className });
              }
            }
          }
        }
      });
      const root = document.documentElement;
      if (root) observer.observe(root, { childList: true, subtree: true });
    };
    if (document.documentElement) start();
    else document.addEventListener('DOMContentLoaded', start);
  };
}

function extractInPage() {
  const getText = el => (el ? el.innerText.trim() : '');
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  const h1 = getText($('h1'));
  const h2 = getText($('h2'));
  const allHeadings = $$('h1,h2,h3')
    .map(h => h.innerText.trim())
    .filter(Boolean);

  const vh = window.innerHeight;
  const aboveFoldElements = $$('*').filter(el => {
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.top < vh && rect.bottom <= vh * 1.2;
  });
  const aboveFoldText = aboveFoldElements
    .map(e => e.innerText)
    .join(' ')
    .slice(0, 3000);

  const buttonEls = $$(
    'button, input[type="submit"], a[class*="btn"], a[class*="cta"], [class*="button"]'
  );
  const allButtonText = buttonEls.map(b => b.innerText.trim()).filter(Boolean);
  const ctaInViewport = buttonEls.filter(b => {
    const r = b.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight;
  });

  let ctaBg = '';
  let ctaFg = '';
  const firstCta = $('button, [class*="btn"], [class*="cta"]');
  if (firstCta) {
    const style = window.getComputedStyle(firstCta);
    ctaBg = style.backgroundColor;
    ctaFg = style.color;
  }

  const forms = $$('form').map(form => {
    const inputs = [
      ...form.querySelectorAll('input:not([type="hidden"]):not([type="submit"])')
    ];
    const labels = [...form.querySelectorAll('label')];
    const submitBtn = form.querySelector(
      'input[type="submit"], button[type="submit"], button'
    );
    const labelsAboveAll = inputs.every(input => {
      const label =
        form.querySelector(`label[for="${input.id}"]`) ||
        input.closest('label') ||
        input.previousElementSibling;
      if (!label) return false;
      const labelRect = label.getBoundingClientRect();
      const inputRect = input.getBoundingClientRect();
      return labelRect.bottom <= inputRect.top + 5;
    });
    const hasInlineValidation = inputs.some(
      input => typeof input.oninput === 'function' || typeof input.onblur === 'function'
    );
    const formText = form.innerText.toLowerCase();
    const hasPrivacyText = /no spam|privacy|unsubscribe|cancel anytime|won't share/.test(
      formText
    );
    const inputsData = inputs.map(input => ({
      type: input.type,
      name: input.name,
      autocomplete: input.getAttribute('autocomplete'),
      hasLabel: !!form.querySelector(`label[for="${input.id}"]`)
    }));
    return {
      inputCount: inputs.length,
      labelsAboveAll,
      hasInlineValidation,
      hasPrivacyText,
      inputsData,
      hasProgressBar: !!form.querySelector('[class*="progress"], [role="progressbar"]'),
      isMultiStep: !!form.querySelector(
        '[class*="step"], [class*="wizard"], [data-step]'
      )
    };
  });

  const stickyOrFixed =
    $$('button, [class*="cta"], [class*="btn"]').filter(el => {
      const style = window.getComputedStyle(el);
      return style.position === 'sticky' || style.position === 'fixed';
    }).length > 0;

  const hasNav = !!$('nav') || $$('[role="navigation"]').length > 0;
  const navLinkCount = $$('nav a, [role="navigation"] a').length;

  const bodyText = document.body ? document.body.innerText : '';
  const hasCurrencyPattern = /\$[\d,]+|\£[\d,]+|€[\d,]+|\d+\/mo|\d+ per month/i.test(
    bodyText
  );
  const hasContactUsForPricing =
    /contact us for pricing|request a quote|get a quote|pricing on request/i.test(bodyText);
  const hasPricingTable =
    (!!$('table') && bodyText.includes('$')) || $$('[class*="pricing"]').length > 0;

  const testimonialContainers = $$(
    '[class*="testimonial"], [class*="review"], [class*="quote"]'
  );
  const hasNameInTestimonial = testimonialContainers.some(tc => {
    const imgs = tc.querySelectorAll('img');
    const text = tc.innerText;
    return imgs.length > 0 && /[A-Z][a-z]+\s[A-Z][a-z]+/.test(text);
  });

  const hasStarRating =
    !!$('[class*="star"], [class*="rating"], [itemprop="aggregateRating"]') &&
    /[\d.]+\s*(out of)?\s*5|[\d,]+ reviews?/i.test(bodyText);

  const hasUrgency =
    /only \d+ (left|remaining|spots|seats)|limited (time|offer|spots|availability)|ends (in|on|soon)|closing (soon|in)/i.test(
      bodyText
    );

  const hasGuarantee =
    /money.back|guarantee|refund|risk.free|\d{2,}.day trial/i.test(bodyText);
  const ctaTextsJoined = allButtonText.join(' ').toLowerCase();
  const guaranteeNearCTA =
    hasGuarantee &&
    (/money.back|guarantee|refund|risk.free/.test(ctaTextsJoined) ||
      (() => {
        const ctaEl = $('button, [class*="cta"]');
        if (!ctaEl) return false;
        const parent = ctaEl.closest('section') || ctaEl.parentElement;
        return parent ? /money.back|guarantee|refund|risk.free/i.test(parent.innerText) : false;
      })());

  const hasLeadMagnet =
    /free (guide|ebook|checklist|template|course|webinar|report|toolkit|download)|download (your|our|the|free)|get (the|your) free/i.test(
      bodyText
    );

  const hasFAQ =
    !!$('[class*="faq"], [class*="accordion"]') ||
    $$('h2,h3').some(h => /frequently asked|faq/i.test(h.innerText));

  const frictionPhrases =
    /no credit card|cancel anytime|no commitment|free forever|no obligation|try free|money.back/i;
  const hasFrictionMicrocopy = frictionPhrases.test(bodyText);

  const hasVideo =
    $$(
      'video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="loom"]'
    ).length > 0;

  const hasCustomerStat =
    /\d[\d,]+\+?\s*(customers?|users?|businesses?|companies|teams?|clients?|professionals?)|trusted by \d|used by \d|join \d[\d,]+/i.test(
      bodyText
    );

  const hasBillingToggle = $$(
    'input[type="checkbox"], [class*="toggle"], [class*="switch"]'
  ).some(el => {
    const parent = el.closest('section') || el.parentElement;
    return parent ? /annual|monthly|yearly|save|billing/i.test(parent.innerText) : false;
  });

  const hasPlanPersona =
    /for (solo|freelancers?|teams?|startups?|agencies?|enterprises?|individuals?|businesses?|professionals?)/i.test(
      bodyText
    );

  const hasCountdown =
    $$('[class*="countdown"], [class*="timer"]').length > 0 ||
    $$('[id*="countdown"], [id*="timer"]').length > 0;

  const hasLogoWall = $$(
    '[class*="logo"], [class*="client"], [class*="partner"], [class*="brand"]'
  ).some(el => {
    const imgs = el.querySelectorAll('img');
    return imgs.length >= 3;
  });

  const allForms = $$('form');
  const heroForm = $('section:first-of-type form, [class*="hero"] form, header form');
  const hasInlineOptin = allForms.length > 1 || (allForms.length === 1 && !heroForm);

  const verbPattern =
    /^(get|start|try|book|claim|download|join|sign up|subscribe|schedule|request|discover|access|unlock|see|watch|learn|build|create)/i;
  const ctaHasVerb = allButtonText.some(t => verbPattern.test(t.trim()));

  const ctaInViewportCount = ctaInViewport.length;

  const hasSubheadline = !!(
    getText($('h1 + h2')) ||
    getText($('h1 + p')) ||
    getText($('[class*="subtitle"], [class*="subheadline"], [class*="sub-headline"]'))
  );

  const trustKeywords =
    /ssl|secure|bbb|mcafee|norton|visa|mastercard|paypal|verified|certified|guaranteed/i;
  const badges = $$('img').filter(img =>
    trustKeywords.test(img.alt || img.src || img.className)
  );
  let trustBadgeNearCta = 0;
  if (badges.length > 0) {
    const cta = $('button, [class*="cta"], [class*="btn"]');
    if (cta) {
      const ctaRect = cta.getBoundingClientRect();
      trustBadgeNearCta = badges.some(badge => {
        const r = badge.getBoundingClientRect();
        const dist = Math.hypot(r.x - ctaRect.x, r.y - ctaRect.y);
        return dist < 300;
      })
        ? 1
        : 0;
    }
  }

  const path = window.location.pathname || '';
  const isBlogPost = /\/blog\/|\/post\/|\/article\/|\/insights\//i.test(path);
  let blogContentUpgrade = 0;
  if (isBlogPost) {
    const formsEls = $$('form');
    const mainContent = $('article, main, [class*="content"], [class*="post"]');
    if (mainContent && formsEls.length > 0) {
      blogContentUpgrade = formsEls.some(f => mainContent.contains(f)) ? 1 : 0;
    }
  }

  const popupLog = window.__popupLog || [];
  const popupStart = window.__popupStartTime || Date.now();
  let popupTriggerTiming = 0;
  if (popupLog.length === 0) popupTriggerTiming = 0;
  else {
    const delayMs = popupLog[0].time - popupStart;
    popupTriggerTiming = delayMs > 5000 ? 1 : 0;
  }

  return {
    h1,
    h2,
    allHeadings,
    bodyText: bodyText.slice(0, 10000),
    aboveFoldText,
    allButtonText,
    ctaHasVerb,
    ctaInViewportCount,
    stickyOrFixed,
    hasNav,
    navLinkCount,
    forms,
    hasPricingTable,
    hasCurrencyPattern,
    hasContactUsForPricing,
    hasNameInTestimonial,
    hasStarRating,
    hasUrgency,
    hasGuarantee,
    guaranteeNearCTA,
    hasLeadMagnet,
    hasFAQ,
    hasFrictionMicrocopy,
    hasVideo,
    hasCustomerStat,
    hasBillingToggle,
    hasPlanPersona,
    hasCountdown,
    hasLogoWall,
    hasInlineOptin,
    hasSubheadline,
    ctaTexts: ctaTextsJoined,
    pageTitle: document.title,
    ctaBg,
    ctaFg,
    trustBadgeNearCta,
    blogContentUpgrade,
    popupTriggerTiming
  };
}

function extractMobileInPage() {
  const $$ = selector => [...document.querySelectorAll(selector)];
  const hasStickyOrFixedCta = $$('button,[class*="cta"],[class*="btn"]').some(el => {
    const style = window.getComputedStyle(el);
    return style.position === 'sticky' || style.position === 'fixed';
  });
  return { hasStickyOrFixedCta };
}

/**
 * @param {string} url
 * @param {{ timeoutMs?: number }} [opts]
 */
async function collectPage(url, opts = {}) {
  const timeoutMs = opts.timeoutMs || parseInt(process.env.PAGE_TIMEOUT_MS || '30000', 10);
  const skipNon200 = process.env.SKIP_ERROR_SITES !== 'false';

  await browserPool.launch();
  let sourceHtml = '';
  const networkRequests = [];

  const context = await browserPool.newContext();
  const page = await context.newPage();

  await page.addInitScript(popupInitScript());

  await page.route('**/*', async route => {
    try {
      const response = await route.fetch();
      const req = route.request();
      if (req.resourceType() === 'document') {
        const ct = (response.headers()['content-type'] || '').toLowerCase();
        if (ct.includes('text/html')) {
          try {
            const text = await response.text();
            if (text) sourceHtml = text;
          } catch (_) {}
        }
      }
      await route.fulfill({ response });
    } catch {
      try {
        await route.continue();
      } catch (_) {}
    }
  });

  page.on('request', req => {
    if (req.resourceType() === 'script' || req.resourceType() === 'fetch') {
      networkRequests.push(req.url());
    }
  });

  const doNavigate = async () => {
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: timeoutMs
    });
    if (skipNon200 && response && response.status() && response.status() >= 400) {
      const err = new Error(`HTTP ${response.status()}`);
      err.code = 'HTTP_ERROR';
      err.status = response.status();
      throw err;
    }
  };

  await withRetry(doNavigate, 2, 3000);

  const stabilizeMs = 6500;
  await new Promise(r => setTimeout(r, stabilizeMs));

  const pageData = await page.evaluate(extractInPage);
  const html = await page.content();

  const screenshotDesktop = await page.screenshot({
    clip: { x: 0, y: 0, width: 1366, height: 768 },
    type: 'png'
  });

  await context.close();

  const mobileContext = await browserPool.newMobileContext();
  const mobilePage = await mobileContext.newPage();
  try {
    await mobilePage.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch (e) {
    logger.warn('Mobile pass navigation failed', { url, err: e.message });
  }
  await new Promise(r => setTimeout(r, 1000));
  let mobileData = { hasStickyOrFixedCta: false };
  try {
    mobileData = await mobilePage.evaluate(extractMobileInPage);
  } catch (_) {}
  let screenshotMobile = Buffer.alloc(0);
  try {
    screenshotMobile = await mobilePage.screenshot({
      clip: { x: 0, y: 0, width: 393, height: 852 },
      type: 'png'
    });
  } catch (_) {}
  await mobileContext.close();

  return {
    url,
    sourceHtml,
    html,
    networkRequests,
    screenshotDesktop,
    screenshotMobile,
    mobileData,
    loadedAt: new Date(),
    ...pageData
  };
}

module.exports = {
  collectPage,
  extractInPage,
  extractMobileInPage
};
