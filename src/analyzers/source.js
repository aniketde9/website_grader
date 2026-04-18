function checkLiveChat(sourceHtml, networkRequests) {
  const chatSignals = [
    /intercom/i,
    /drift\.com/i,
    /crisp\.chat/i,
    /tidiochat/i,
    /zendesk/i,
    /livechat\.com/i,
    /hubspot.*messages/i,
    /freshchat/i,
    /olark/i,
    /tawk\.to/i,
    /chaport/i
  ];
  const allContent = sourceHtml + networkRequests.join(' ');
  return chatSignals.some(pattern => pattern.test(allContent)) ? 1 : 0;
}

function checkBookingWidget(sourceHtml, networkRequests) {
  const bookingSignals = [
    /calendly\.com/i,
    /meetings\.hubspot/i,
    /acuityscheduling/i,
    /chilipiper/i,
    /savvycal/i,
    /cal\.com/i,
    /oncehub/i,
    /appointmentplus/i,
    /bookingkoala/i,
    /setmore/i
  ];
  const allContent = sourceHtml + networkRequests.join(' ');
  return bookingSignals.some(pattern => pattern.test(allContent)) ? 1 : 0;
}

function checkAnalytics(sourceHtml) {
  const hasGA4 =
    /G-[A-Z0-9]{10,}/i.test(sourceHtml) || /gtag.*G-/i.test(sourceHtml);
  const hasGTM = /GTM-[A-Z0-9]{5,}/i.test(sourceHtml);
  return hasGA4 || hasGTM ? 1 : 0;
}

function checkRetargetingPixels(sourceHtml, networkRequests) {
  const allContent = sourceHtml + networkRequests.join('\n');
  const pixels = {
    meta: /fbq\(|facebook\.net\/en_US\/fbevents|connect\.facebook\.net/i,
    linkedin: /_linkedin_partner_id|snap\.licdn\.com/i,
    tiktok: /analytics\.tiktok\.com|ttq\./i,
    google_ads: /googleadservices|google_conversion_id|gtag.*AW-/i,
    twitter: /platform\.twitter\.com\/oct\.js|ads\.twitter/i,
    pinterest: /pintrk\(/i
  };
  const count = Object.values(pixels).filter(p => p.test(allContent)).length;
  return Math.min(count / 4, 1.0);
}

function checkSessionReplay(sourceHtml, networkRequests) {
  const tools = [
    /hotjar\.com/i,
    /clarity\.ms/i,
    /fullstory\.com/i,
    /mouseflow\.com/i,
    /logrocket\.com/i,
    /smartlook/i,
    /inspectlet/i,
    /luckyorange/i,
    /crazyegg/i
  ];
  const allContent = sourceHtml + networkRequests.join(' ');
  return tools.some(t => t.test(allContent)) ? 1 : 0;
}

function checkABTesting(sourceHtml, networkRequests) {
  const tools = [
    /optimizely/i,
    /vwo\.com/i,
    /abtasty/i,
    /convert\.com/i,
    /statsig/i,
    /kameleoon/i,
    /unbounce/i,
    /launchdarkly/i,
    /_vwo_uuid|optimizelyEndUserId/i
  ];
  const allContent = sourceHtml + networkRequests.join(' ');
  return tools.some(t => t.test(allContent)) ? 1 : 0;
}

module.exports = {
  checkLiveChat,
  checkBookingWidget,
  checkAnalytics,
  checkRetargetingPixels,
  checkSessionReplay,
  checkABTesting
};
