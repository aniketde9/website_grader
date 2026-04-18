const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { devices } = require('playwright');
const { MOBILE_DEVICE } = require('./mobile');

chromium.use(StealthPlugin());

class BrowserPool {
  constructor() {
    /** @type {import('playwright').Browser | null} */
    this.browser = null;
  }

  async launch() {
    if (this.browser) return this.browser;
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    return this.browser;
  }

  async newContext() {
    if (!this.browser) await this.launch();
    return this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      javaScriptEnabled: true
    });
  }

  async newMobileContext() {
    if (!this.browser) await this.launch();
    return this.browser.newContext({
      ...devices[MOBILE_DEVICE],
      locale: 'en-US'
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = new BrowserPool();
