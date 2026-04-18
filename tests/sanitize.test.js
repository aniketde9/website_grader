const {
  normalizeUrlString,
  extractDomain,
  isDirectoryHost
} = require('../src/utils/sanitize');

describe('sanitize', () => {
  test('normalizeUrlString adds https', () => {
    expect(normalizeUrlString('example.com/foo')).toContain('https://');
  });

  test('extractDomain strips www', () => {
    expect(extractDomain('https://www.example.com/a')).toBe('example.com');
  });

  test('isDirectoryHost', () => {
    expect(isDirectoryHost('yelp.com')).toBe(true);
    expect(isDirectoryHost('example.com')).toBe(false);
  });
});
