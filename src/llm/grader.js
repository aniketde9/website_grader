const axios = require('axios');
const { buildCavemanPrompt } = require('./prompts');
const { logger } = require('../utils/logger');

/** Default: Sonnet 4.6. Grading still uses caveman prompts (short output, no prose). */
const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-4-6';

function buildLLMContext(pageData) {
  return `
H1: ${(pageData.h1 || '').slice(0, 120)}
H2: ${(pageData.h2 || '').slice(0, 120)}
HEADINGS: ${(pageData.allHeadings || []).slice(0, 8).join(' | ').slice(0, 300)}
ABOVE_FOLD: ${(pageData.aboveFoldText || '').slice(0, 500)}
BODY_SAMPLE: ${(pageData.bodyText || '').slice(0, 800)}
BUTTONS: ${(pageData.allButtonText || []).slice(0, 6).join(' | ')}
`.trim();
}

function parseLLMResponse(raw) {
  const nums = raw
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !Number.isNaN(n));

  if (nums.length !== 8) {
    return { scores: Array(8).fill(0.5), raw, valid: false };
  }

  return {
    scores: nums.map(n => Math.min(Math.max(n, 1), 5) / 5),
    raw,
    valid: true
  };
}

/**
 * @param {object} pageData
 * @param {{ visionHero?: boolean }} [opts]
 */
async function gradeLLMParameters(pageData, opts = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { scores: Array(8).fill(null), raw: '', valid: false };
  }

  const context = buildLLMContext(pageData);
  const useVision =
    opts.visionHero === true &&
    pageData.screenshotDesktop &&
    pageData.screenshotDesktop.length > 0;

  const prompt = buildCavemanPrompt(context, { includeVision: useVision });

  const model = process.env.CLAUDE_MODEL || DEFAULT_CLAUDE_MODEL;
  const maxTokens = parseInt(process.env.LLM_MAX_TOKENS || '50', 10);

  /** @type {object[]} */
  let userContent;
  if (useVision) {
    const b64 = pageData.screenshotDesktop.toString('base64');
    userContent = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: b64
        }
      },
      { type: 'text', text: prompt }
    ];
  } else {
    userContent = [{ type: 'text', text: prompt }];
  }

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: userContent }]
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 15000
      }
    );

    const parts = response.data?.content;
    let raw = '';
    if (Array.isArray(parts)) {
      const textBlock = parts.find(p => p.type === 'text');
      raw = (textBlock?.text || '').trim();
    }
    return parseLLMResponse(raw);
  } catch (e) {
    logger.warn('Claude API error', { message: e.message });
    return { scores: Array(8).fill(null), raw: '', valid: false };
  }
}

module.exports = {
  buildLLMContext,
  gradeLLMParameters,
  parseLLMResponse,
  DEFAULT_CLAUDE_MODEL
};
