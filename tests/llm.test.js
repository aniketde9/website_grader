const { parseLLMResponse } = require('../src/llm/grader');

describe('parseLLMResponse', () => {
  test('parses eight integers', () => {
    const r = parseLLMResponse('1,2,3,4,5,1,2,3');
    expect(r.valid).toBe(true);
    expect(r.scores).toHaveLength(8);
    expect(r.scores[4]).toBe(1);
  });

  test('malformed returns neutral', () => {
    const r = parseLLMResponse('1,2,3');
    expect(r.valid).toBe(false);
    expect(r.scores.every(s => s === 0.5)).toBe(true);
  });
});
