const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { PuppeteerBlocker } = require('@cliqz/adblocker-puppeteer');
const fs = require('fs').promises;
const path = require('path');
const UserAgents = require('user-agents');

class PuppeteerStealthSkill {
  constructor() {
    this.browser = null;
    this.page = null;
    this.stealthConfig = {
      userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ],
      viewports: [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1440, height: 900 },
        { width: 1536, height: 864 },
        { width: 1280, height: 720 }
      ],
      languages: ['en-US,en;q=0.9', 'en-GB,en;q=0.9', 'en;q=0.8'],
      platforms: ['Win32', 'MacIntel', 'Linux x86_64']
    };

    this.defaultOptions = {
      headless: true,
      captureScreenshots: true,
      enableHumanDelays: true,
      minDelay: 5000,
      maxDelay: 15000,
      viewportRandomization: true,
      userAgentRotation: true,
      blockAds: true,
      enableLogging: true
    };

    // Initialize puppeteer with stealth plugin
    puppeteer.use(StealthPlugin());
  }

  /**
   * Initialize browser with stealth configuration
   * @param {Object} options - Browser initialization options
   * @returns {Promise<Object>} Browser and page instances
   */
  async initialize(options = {}) {
    try {
      const config = { ...this.defaultOptions, ...options };

      // Randomize user agent if enabled
      const userAgent = config.userAgentRotation
        ? this.getRandomUserAgent()
        : this.stealthConfig.userAgents[0];

      // Randomize viewport if enabled
      const viewport = config.viewportRandomization
        ? this.getRandomViewport()
        : this.stealthConfig.viewports[0];

      const browserOptions = {
        headless: config.headless ? 'new' : false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          `--window-size=${viewport.width},${viewport.height}`,
          '--user-agent=' + userAgent
        ],
        defaultViewport: viewport,
        ignoreDefaultArgs: ['--enable-blink-features=AutomationControlled']
      };

      this.browser = await puppeteer.launch(browserOptions);
      this.page = await this.browser.newPage();

      // Set additional stealth measures
      await this.page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined
        });

        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5]
        });

        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en']
        });

        window.chrome = {
          runtime: {}
        };

        Object.defineProperty(navigator, 'permissions', {
          get: () => ({
            query: () => Promise.resolve({ state: 'granted' })
          })
        });
      });

      // Set random user agent
      await this.page.setUserAgent(userAgent);

      // Set random language
      const language = this.stealthConfig.languages[Math.floor(Math.random() * this.stealthConfig.languages.length)];
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': language
      });

      // Enable ad blocking if configured
      if (config.blockAds) {
        await this.enableAdBlocker();
      }

      // Log initialization
      if (config.enableLogging) {
        console.log('Puppeteer Stealth initialized with user-agent:', userAgent);
      }

      return { browser: this.browser, page: this.page };
    } catch (error) {
      throw new Error(`Failed to initialize Puppeteer Stealth: ${error.message}`);
    }
  }

  /**
   * Get random user agent from configuration
   * @returns {string} Random user agent
   */
  getRandomUserAgent() {
    const userAgent = new UserAgents({ deviceCategory: 'desktop' });
    return userAgent.toString();
  }

  /**
   * Get random viewport from configuration
   * @returns {Object} Random viewport dimensions
   */
  getRandomViewport() {
    const viewport = this.stealthConfig.viewports[
      Math.floor(Math.random() * this.stealthConfig.viewports.length)
    ];

    // Add small random variations
    return {
      width: viewport.width + Math.floor(Math.random() * 20) - 10,
      height: viewport.height + Math.floor(Math.random() * 20) - 10
    };
  }

  /**
   * Enable ad blocker
   */
  async enableAdBlocker() {
    try {
      const blocker = await PuppeteerBlocker.fromPrebuiltAdsAndTracking();
      await blocker.enableBlockingInPage(this.page);
    } catch (error) {
      console.warn('Failed to enable ad blocker:', error.message);
    }
  }

  /**
   * Perform stealth web scraping
   * @param {Object} config - Scraping configuration
   * @returns {Promise<Object>} Scraped data
   */
  async stealthScrape(config) {
    try {
      if (!this.page) {
        await this.initialize(config.options);
      }

      const { url, selector, options = {} } = config;

      // Navigate to URL with human-like delay
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Check for Cloudflare challenges
      if (await this.detectCloudflare()) {
        await this.handleCloudflare();
      }

      // Check for CAPTCHA
      if (await this.detectCaptcha()) {
        if (options.captureScreenshots) {
          await this.captureScreenshot('captcha-detected.png');
        }
        throw new Error('CAPTCHA detected - manual intervention required');
      }

      // Apply human-like delay
      if (options.enableHumanDelays !== false) {
        await this.humanDelay(options.minDelay || 5000, options.maxDelay || 15000);
      }

      // Extract data
      const data = await this.page.evaluate((sel) => {
        const element = document.querySelector(sel);
        return element ? element.textContent.trim() : null;
      }, selector);

      // Capture screenshot if requested
      if (options.captureScreenshots) {
        await this.captureScreenshot('scraping-result.png');
      }

      return { data, url, timestamp: new Date().toISOString() };
    } catch (error) {
      throw new Error(`Scraping failed: ${error.message}`);
    }
  }

  /**
   * Simulate human-like click
   * @param {string} selector - CSS selector for element to click
   * @param {Object} options - Click options
   */
  async humanClick(selector, options = {}) {
    try {
      const element = await this.page.$(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }

      // Scroll element into view
      await element.scrollIntoViewIfNeeded();

      // Human-like delay before click
      await this.humanDelay(200, 800);

      // Get element position for realistic mouse movement
      const rect = await element.boundingBox();
      if (rect) {
        // Simulate mouse movement
        const x = rect.left + rect.width / 2 + (Math.random() * 10 - 5);
        const y = rect.top + rect.height / 2 + (Math.random() * 10 - 5);

        await this.page.mouse.move(x, y, { steps: 10 + Math.floor(Math.random() * 20) });
      }

      // Click with random delay
      await this.page.click(selector, {
        delay: 50 + Math.floor(Math.random() * 100),
        ...options
      });

      // Post-click delay
      await this.humanDelay(500, 1500);
    } catch (error) {
      throw new Error(`Human click failed: ${error.message}`);
    }
  }

  /**
   * Simulate human-like typing
   * @param {string} selector - CSS selector for input element
   * @param {string} text - Text to type
   * @param {Object} options - Typing options
   */
  async humanType(selector, text, options = {}) {
    try {
      const element = await this.page.$(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }

      await element.scrollIntoViewIfNeeded();
      await this.humanDelay(200, 600);

      // Focus the element
      await element.focus();

      // Clear existing content if specified
      if (options.clear !== false) {
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('a');
        await this.page.keyboard.up('Control');
        await this.humanDelay(50, 150);
      }

      // Type with human-like delays
      const delay = options.delay || (50 + Math.floor(Math.random() * 100));
      await this.page.type(selector, text, { delay });

      await this.humanDelay(300, 800);
    } catch (error) {
      throw new Error(`Human typing failed: ${error.message}`);
    }
  }

  /**
   * Apply human-like delay
   * @param {number} minDelay - Minimum delay in milliseconds
   * @param {number} maxDelay - Maximum delay in milliseconds
   */
  async humanDelay(minDelay = 5000, maxDelay = 15000) {
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Save cookies to file
   * @param {string} filepath - Path to save cookies
   */
  async saveCookies(filepath) {
    try {
      if (!this.page) {
        throw new Error('No page instance available');
      }

      const cookies = await this.page.cookies();
      await fs.writeFile(filepath, JSON.stringify(cookies, null, 2));
      console.log(`Cookies saved to ${filepath}`);
    } catch (error) {
      throw new Error(`Failed to save cookies: ${error.message}`);
    }
  }

  /**
   * Load cookies from file
   * @param {string} filepath - Path to load cookies from
   */
  async loadCookies(filepath) {
    try {
      if (!this.page) {
        throw new Error('No page instance available');
      }

      const cookieData = await fs.readFile(filepath, 'utf8');
      const cookies = JSON.parse(cookieData);
      await this.page.setCookie(...cookies);
      console.log(`Cookies loaded from ${filepath}`);
    } catch (error) {
      throw new Error(`Failed to load cookies: ${error.message}`);
    }
  }

  /**
   * Capture screenshot
   * @param {string} filename - Screenshot filename
   * @param {Object} options - Screenshot options
   */
  async captureScreenshot(filename, options = {}) {
    try {
      if (!this.page) {
        throw new Error('No page instance available');
      }

      const filepath = path.resolve(filename);
      await this.page.screenshot({
        path: filepath,
        fullPage: true,
        type: 'png',
        ...options
      });

      console.log(`Screenshot saved to ${filepath}`);
      return filepath;
    } catch (error) {
      throw new Error(`Failed to capture screenshot: ${error.message}`);
    }
  }

  /**
   * Detect if CAPTCHA is present on the page
   * @returns {Promise<boolean>} True if CAPTCHA detected
   */
  async detectCaptcha() {
    try {
      const captchaSelectors = [
        'iframe[src*="recaptcha"]',
        'iframe[src*="captcha"]',
        '.g-recaptcha',
        '#captcha',
        '[class*="captcha"]',
        '[id*="captcha"]',
        'img[src*="captcha"]',
        '.captcha-box'
      ];

      for (const selector of captchaSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          return true;
        }
      }

      // Check for common CAPTCHA text patterns
      const captchaText = await this.page.evaluate(() => {
        const text = document.body.innerText.toLowerCase();
        return text.includes('captcha') ||
               text.includes('robot') ||
               text.includes('prove you are human');
      });

      return captchaText;
    } catch (error) {
      console.warn('CAPTCHA detection failed:', error.message);
      return false;
    }
  }

  /**
   * Detect Cloudflare challenges
   * @returns {Promise<boolean>} True if Cloudflare detected
   */
  async detectCloudflare() {
    try {
      const cloudflareSelectors = [
        '#cf-challenge-running',
        '.cf-browser-verification',
        '[data-ray]',
        'form[action*="cf-challenge"]',
        '.cf-im-under-attack'
      ];

      for (const selector of cloudflareSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          return true;
        }
      }

      // Check for Cloudflare in page content
      const hasCloudflareContent = await this.page.evaluate(() => {
        return document.title.includes('Cloudflare') ||
               document.body.innerText.includes('Checking your browser') ||
               document.body.innerText.includes('DDoS protection');
      });

      return hasCloudflareContent;
    } catch (error) {
      console.warn('Cloudflare detection failed:', error.message);
      return false;
    }
  }

  /**
   * Handle Cloudflare challenges
   */
  async handleCloudflare() {
    try {
      console.log('Cloudflare challenge detected, attempting to solve...');

      // Wait for challenge to complete
      await this.page.waitForSelector('body[data-nc]', { timeout: 60000 });

      // Additional wait time
      await this.humanDelay(3000, 8000);

      // Check if challenge is resolved
      const isResolved = await this.page.evaluate(() => {
        return !document.body.innerText.includes('Checking your browser') &&
               !document.body.innerText.includes('DDoS protection');
      });

      if (!isResolved) {
        throw new Error('Cloudflare challenge could not be resolved automatically');
      }

      console.log('Cloudflare challenge resolved successfully');
    } catch (error) {
      throw new Error(`Cloudflare handling failed: ${error.message}`);
    }
  }

  /**
   * Close browser and clean up resources
   */
  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        console.log('Browser closed successfully');
      }
    } catch (error) {
      console.warn('Error closing browser:', error.message);
    }
  }

  /**
   * Get current page information
   * @returns {Promise<Object>} Page information
   */
  async getPageInfo() {
    try {
      if (!this.page) {
        throw new Error('No page instance available');
      }

      return await this.page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }));
    } catch (error) {
      throw new Error(`Failed to get page info: ${error.message}`);
    }
  }
}

module.exports = PuppeteerStealthSkill;