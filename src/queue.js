const path = require('path');
const pLimit = require('p-limit');
const chalk = require('chalk');
const { collectPage } = require('./browser/collector');
const { analyzeAll } = require('./analyzers');
const { gradeLLMParameters, DEFAULT_CLAUDE_MODEL } = require('./llm/grader');
const { buildScore } = require('./scoring/aggregator');
const { CsvWriter } = require('./io/writer');
const {
  readInputCsv,
  readScoredDomainsFromOutput,
  dedupeInputRows
} = require('./io/reader');
const {
  normalizeUrlString,
  extractDomain,
  isDirectoryHost
} = require('./utils/sanitize');
const { logger } = require('./utils/logger');
const { PARAMETERS } = require('../config/parameters');
const fs = require('fs');

function emptyParamObject() {
  const o = {};
  for (const p of PARAMETERS) {
    o[p.csvColumn] = '';
  }
  for (const col of [
    'llm_raw_response',
    'psi_lcp_ms',
    'psi_inp_ms',
    'psi_cls',
    'psi_mobile_score',
    'tier1_score',
    'tier2_score',
    'tier3_score',
    'total_raw_score',
    'total_weighted_score',
    'grade'
  ]) {
    o[col] = '';
  }
  return o;
}

/**
 * @param {object} inputRow
 * @param {object} options
 */
async function gradeOneSite(inputRow, options) {
  const urlRaw = inputRow.url || '';
  const url = normalizeUrlString(urlRaw);
  const domain =
    (inputRow.domain && String(inputRow.domain).trim()) ||
    extractDomain(url) ||
    inputRow._domain ||
    '';

  const hostForDir = extractDomain(url);
  const meta = {
    domain,
    profession: inputRow.profession || '',
    location: inputRow.location || '',
    website_name: inputRow.website_name || '',
    url,
    is_directory: isDirectoryHost(hostForDir) ? 'true' : 'false'
  };

  const emptyPsi = {
    score: 0,
    mobileScore: 0,
    raw: { lcp: '', inp: '', cls: '' },
    audits: {},
    loadingExperience: {}
  };

  let scrape_status = 'success';
  let scrape_error_message = '';

  let pageData;
  try {
    pageData = await collectPage(url, {
      timeoutMs: parseInt(process.env.PAGE_TIMEOUT_MS || '30000', 10)
    });
  } catch (e) {
    logger.warn('collectPage failed', { url, err: e.message });
    scrape_status =
      e.code === 'HTTP_ERROR'
        ? 'blocked'
        : /timeout|Timeout/i.test(e.message)
          ? 'timeout'
          : 'error';
    scrape_error_message = e.message || String(e);
    const empty = emptyParamObject();
    return {
      ...meta,
      ...empty,
      llm_raw_response: '',
      psi_lcp_ms: '',
      psi_inp_ms: '',
      psi_cls: '',
      psi_mobile_score: '',
      scrape_status,
      scrape_error_message
    };
  }

  let psi = null;
  if (!options.skipPsi) {
    const { fetchPageSpeed } = require('./analyzers/pagespeed');
    psi = await fetchPageSpeed(url);
  }

  const { tier1, tier2, psi: psiResult } = await analyzeAll(pageData, psi, {
    skipPsi: options.skipPsi
  });

  let tier3 = { scores: Array(8).fill(null), raw: '', valid: false };
  if (!options.skipLlm) {
    const visionHero =
      options.visionHero === true || process.env.LLM_VISION_HERO === 'true';
    tier3 = await gradeLLMParameters(pageData, { visionHero });
  }

  const scoreObj = buildScore(tier1, tier2, tier3, psiResult || emptyPsi, {
    weightsProfilePath: options.weightsProfilePath || options.weightsProfile
  });

  return {
    ...meta,
    ...scoreObj,
    scrape_status,
    scrape_error_message
  };
}

async function runGrader(options) {
  const inputPath = path.resolve(options.input || 'ads.csv');
  const outputPath = path.resolve(
    options.output || process.env.OUTPUT_PATH || 'results.csv'
  );
  const concurrency = Math.min(
    parseInt(options.concurrency || process.env.CONCURRENCY || '3', 10),
    5
  );
  const delayMs = parseInt(process.env.REQUEST_DELAY_MS || '1500', 10);

  if (!fs.existsSync(inputPath)) {
    console.error(chalk.red(`Input not found: ${inputPath}`));
    process.exit(1);
  }

  if (!options.skipPsi && !process.env.PAGESPEED_API_KEY) {
    console.warn(
      chalk.yellow('PAGESPEED_API_KEY missing — PSI scores will be empty/fallback.')
    );
  }
  if (!options.skipLlm && !process.env.ANTHROPIC_API_KEY) {
    console.warn(chalk.yellow('ANTHROPIC_API_KEY missing — LLM columns will be empty.'));
  }

  let rows = readInputCsv(inputPath);
  rows = dedupeInputRows(rows);

  const scoredDomains =
    options.resume !== false
      ? readScoredDomainsFromOutput(outputPath)
      : new Set();

  if (options.onlyDomain) {
    const od = options.onlyDomain.toLowerCase().replace(/^www\./, '');
    rows = rows.filter(
      r =>
        extractDomain(r.url || '').replace(/^www\./, '') === od ||
        (r.domain || '').toLowerCase().replace(/^www\./, '') === od
    );
  }

  const limit = pLimit(concurrency);
  const writer = new CsvWriter(outputPath);
  writer.ensureHeader();

  const limitN = options.limit ? parseInt(options.limit, 10) : null;
  const tasks = [];

  let toProcess = rows.filter(r => {
    const d = (r._domain || extractDomain(r.url || '')).toLowerCase();
    if (options.resume !== false && scoredDomains.has(d)) return false;
    return true;
  });

  if (limitN != null && !Number.isNaN(limitN)) {
    toProcess = toProcess.slice(0, limitN);
  }

  console.log(chalk.bold('Website Grader v1.0.0'));
  console.log('─────────────────────────────────────────');
  console.log(`Input:       ${inputPath} (${rows.length} URLs)`);
  console.log(`Output:      ${outputPath}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`PSI:         ${options.skipPsi ? 'disabled' : 'enabled'}`);
  console.log(
    `LLM:         ${options.skipLlm ? 'disabled' : `enabled (${process.env.CLAUDE_MODEL || DEFAULT_CLAUDE_MODEL})`}`
  );
  console.log(`Resume:      ${options.resume !== false ? 'on' : 'off'}`);
  console.log('─────────────────────────────────────────');

  let ok = 0;
  let err = 0;
  let completed = 0;

  for (const row of toProcess) {
    const d = row._domain || extractDomain(row.url || '');
    const task = limit(async () => {
      const start = Date.now();
      try {
        const outRow = await gradeOneSite(row, {
          skipPsi: options.skipPsi,
          skipLlm: options.skipLlm,
          visionHero: options.visionHero,
          weightsProfile: options.weightsProfile,
          resume: options.resume
        });
        await writer.appendRow(outRow);
        const ms = ((Date.now() - start) / 1000).toFixed(1);
        completed += 1;
        const label = `[${String(completed).padStart(3)}/${toProcess.length}]`;
        if (outRow.scrape_status === 'success') {
          ok += 1;
          console.log(
            chalk.green(`${label} ok `) +
              `${(d || '').padEnd(28)} score=${outRow.total_weighted_score}/100 grade=${outRow.grade} (${ms}s)`
          );
        } else {
          err += 1;
          console.log(
            chalk.red(`${label} `) +
              `${(d || '').padEnd(28)} ${outRow.scrape_status.toUpperCase()} (${ms}s)`
          );
        }
      } catch (e) {
        err += 1;
        completed += 1;
        logger.error('gradeOneSite', { err: e.message, stack: e.stack });
        const empty = emptyParamObject();
        await writer.appendRow({
          domain: d,
          profession: row.profession || '',
          location: row.location || '',
          website_name: row.website_name || '',
          url: normalizeUrlString(row.url || ''),
          is_directory: isDirectoryHost(d) ? 'true' : 'false',
          ...empty,
          scrape_status: 'error',
          scrape_error_message: e.message || String(e)
        });
      }
      await new Promise(r => setTimeout(r, delayMs));
    });
    tasks.push(task);
  }

  await Promise.all(tasks);
  await writer.flush();

  console.log('─────────────────────────────────────────');
  console.log(
    chalk.bold(
      `Done. ${ok}/${toProcess.length} scored. ${err} errors. Output: ${outputPath}`
    )
  );
}

module.exports = {
  runGrader,
  gradeOneSite
};
