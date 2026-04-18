const fs = require('fs');
const { stringify } = require('csv-stringify/sync');
const { getOutputHeader } = require('../../config/parameters');

class CsvWriter {
  constructor(outputPath) {
    this.outputPath = outputPath;
    this.header = getOutputHeader();
    /** @type {Promise<void>} */
    this._chain = Promise.resolve();
  }

  ensureHeader() {
    if (!fs.existsSync(this.outputPath) || fs.statSync(this.outputPath).size === 0) {
      const line = stringify([this.header], { header: false });
      fs.writeFileSync(this.outputPath, line, 'utf8');
    } else {
      const first = fs.readFileSync(this.outputPath, 'utf8').split(/\r?\n/)[0];
      if (!first || !first.includes('domain')) {
        const body = fs.readFileSync(this.outputPath, 'utf8');
        fs.writeFileSync(this.outputPath, stringify([this.header], { header: false }) + body, 'utf8');
      }
    }
  }

  /**
   * Serialize appends — one at a time for concurrent workers.
   * @param {Record<string, string|number>} row
   */
  appendRow(row) {
    const ordered = this.header.map(col => {
      const v = row[col];
      if (v === null || v === undefined) return '';
      return v;
    });
    this._chain = this._chain.then(
      () =>
        new Promise((resolve, reject) => {
          try {
            const line = stringify([ordered], { header: false });
            fs.appendFileSync(this.outputPath, line, 'utf8');
            resolve();
          } catch (e) {
            reject(e);
          }
        })
    );
    return this._chain;
  }

  flush() {
    return this._chain;
  }
}

module.exports = { CsvWriter };
