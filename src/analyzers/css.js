const Color = require('color');

function calculateContrastRatio(bg, fg) {
  try {
    const bgL = Color(bg).luminosity();
    const fgL = Color(fg).luminosity();
    const lighter = Math.max(bgL, fgL);
    const darker = Math.min(bgL, fgL);
    return (lighter + 0.05) / (darker + 0.05);
  } catch {
    return 0;
  }
}

function checkCtaContrast(pageData) {
  if (!pageData.ctaBg || !pageData.ctaFg) return 0;
  const ratio = calculateContrastRatio(pageData.ctaBg, pageData.ctaFg);
  return ratio >= 4.5 ? 1 : 0;
}

module.exports = {
  checkCtaContrast,
  calculateContrastRatio
};
