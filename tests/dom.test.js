const dom = require('../src/analyzers/dom');

describe('dom analyzers', () => {
  test('checkCtaVerbCopy strong only', () => {
    expect(
      dom.checkCtaVerbCopy({
        allButtonText: ['Get started'],
        ctaHasVerb: true
      })
    ).toBe(1);
  });

  test('checkNavRemoved with few links', () => {
    expect(
      dom.checkNavRemoved({ hasNav: true, navLinkCount: 2 })
    ).toBe(1);
  });
});
