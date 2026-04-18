const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { extractDomain } = require('../utils/sanitize');

/**
 * @param {string} filePath
 * @returns {Record<string, string>[]}
 */
function readInputCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  });
  return rows;
}

/**
 * @param {string} filePath
 * @returns {Set<string>}
 */
function readScoredDomainsFromOutput(filePath) {
  if (!fs.existsSync(filePath)) return new Set();
  const raw = fs.readFileSync(filePath, 'utf8');
  if (!raw.trim()) return new Set();
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  });
  const domains = new Set();
  for (const row of rows) {
    const fromCol = (row.domain || '').trim().toLowerCase();
    const fromUrl = extractDomain(row.url || '').toLowerCase();
    const d = fromCol || fromUrl;
    if (d) domains.add(d);
  }
  return domains;
}

function dedupeInputRows(rows) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const domain = extractDomain(row.url || '').toLowerCase();
    const key = domain || (row.url || '').trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...row, _domain: domain });
  }
  return out;
}

module.exports = {
  readInputCsv,
  readScoredDomainsFromOutput,
  dedupeInputRows
};
