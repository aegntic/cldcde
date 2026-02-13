const PuppeteerStealthSkill = require('../index.js');
const fs = require('fs').promises;

describe('PuppeteerStealthSkill', () => {
  let skill;

  beforeEach(() => {
    skill = new PuppeteerStealthSkill();
  });

  afterEach(async () => {
    if (skill && skill.browser) {
      await skill.close();
    }
  });

  describe('Initialization', () => {
    test('should initialize with default options', async () => {
      const { browser, page } = await skill.initialize();
      expect(browser).toBeDefined();
      expect(page).toBeDefined();
      expect(browser.isConnected()).toBe(true);
    });

    test('should initialize with custom options', async () => {
      const options = {
        headless: true,
        enableHumanDelays: false,
        minDelay: 1000,
        maxDelay: 2000
      };

      await skill.initialize(options);
      expect(skill.defaultOptions.enableHumanDelays).toBe(false);
    });

    test('should generate random user agents', () => {
      const userAgent1 = skill.getRandomUserAgent();
      const userAgent2 = skill.getRandomUserAgent();

      expect(userAgent1).toBeDefined();
      expect(userAgent2).toBeDefined();
      expect(typeof userAgent1).toBe('string');
    });

    test('should generate random viewports', () => {
      const viewport1 = skill.getRandomViewport();
      const viewport2 = skill.getRandomViewport();

      expect(viewport1).toHaveProperty('width');
      expect(viewport1).toHaveProperty('height');
      expect(viewport1.width).toBeGreaterThan(0);
      expect(viewport1.height).toBeGreaterThan(0);
    });
  });

  describe('Human-like Interactions', () => {
    test('should apply human delay', async () => {
      const startTime = Date.now();
      await skill.humanDelay(100, 200);
      const endTime = Date.now();

      const delay = endTime - startTime;
      expect(delay).toBeGreaterThanOrEqual(100);
      expect(delay).toBeLessThan(500); // Allow some buffer
    });

    test('should handle human typing simulation', async () => {
      await skill.initialize();
      await skill.page.goto('data:text/html,<html><body><input id="test" type="text"></body></html>');

      await skill.humanType('#test', 'Hello World');

      const value = await skill.page.$eval('#test', el => el.value);
      expect(value).toBe('Hello World');
    });
  });

  describe('Cookie Management', () => {
    test('should save and load cookies', async () => {
      await skill.initialize();
      await skill.page.goto('https://httpbin.org/cookies/set/test/value');

      const testFile = 'test-cookies.json';
      await skill.saveCookies(testFile);

      // Verify file was created
      const stats = await fs.stat(testFile);
      expect(stats.isFile()).toBe(true);

      // Clean up
      await fs.unlink(testFile);
    });

    test('should handle cookie loading errors gracefully', async () => {
      await skill.initialize();

      // Try to load non-existent file
      await expect(skill.loadCookies('non-existent.json')).rejects.toThrow();
    });
  });

  describe('CAPTCHA Detection', () => {
    test('should detect CAPTCHA on test page', async () => {
      await skill.initialize();

      // Create a test page with CAPTCHA
      await skill.page.setContent(`
        <html>
          <body>
            <div class="g-recaptcha"></div>
          </body>
        </html>
      `);

      const hasCaptcha = await skill.detectCaptcha();
      expect(hasCaptcha).toBe(true);
    });

    test('should not detect CAPTCHA on clean page', async () => {
      await skill.initialize();
      await skill.page.goto('data:text/html,<html><body><h1>Clean Page</h1></body></html>');

      const hasCaptcha = await skill.detectCaptcha();
      expect(hasCaptcha).toBe(false);
    });
  });

  describe('Cloudflare Detection', () => {
    test('should detect Cloudflare challenge', async () => {
      await skill.initialize();

      // Create a test page with Cloudflare indicators
      await skill.page.setContent(`
        <html>
          <body>
            <div class="cf-browser-verification">
              <p>Checking your browser before accessing</p>
            </div>
          </body>
        </html>
      `);

      const hasCloudflare = await skill.detectCloudflare();
      expect(hasCloudflare).toBe(true);
    });

    test('should not detect Cloudflare on normal page', async () => {
      await skill.initialize();
      await skill.page.goto('data:text/html,<html><body><h1>Normal Page</h1></body></html>');

      const hasCloudflare = await skill.detectCloudflare();
      expect(hasCloudflare).toBe(false);
    });
  });

  describe('Screenshot Capture', () => {
    test('should capture screenshots', async () => {
      await skill.initialize();
      const testFile = 'test-screenshot.png';

      await skill.page.goto('data:text/html,<html><body><h1>Test Page</h1></body></html>');
      const savedPath = await skill.captureScreenshot(testFile);

      expect(savedPath).toContain('test-screenshot.png');

      // Verify file was created
      const stats = await fs.stat(testFile);
      expect(stats.isFile()).toBe(true);

      // Clean up
      await fs.unlink(testFile);
    });
  });

  describe('Page Information', () => {
    test('should get page information', async () => {
      await skill.initialize();
      await skill.page.goto('https://example.com');

      const pageInfo = await skill.getPageInfo();

      expect(pageInfo).toHaveProperty('url');
      expect(pageInfo).toHaveProperty('title');
      expect(pageInfo).toHaveProperty('userAgent');
      expect(pageInfo).toHaveProperty('viewport');

      expect(pageInfo.url).toContain('example.com');
      expect(typeof pageInfo.userAgent).toBe('string');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid selector gracefully', async () => {
      await skill.initialize();

      await expect(skill.humanClick('#non-existent-element')).rejects.toThrow('Element not found');
    });

    test('should handle browser initialization errors', async () => {
      // Mock invalid browser options
      const invalidOptions = {
        headless: 'invalid-value'
      };

      await expect(skill.initialize(invalidOptions)).rejects.toThrow();
    });

    test('should handle scraping errors gracefully', async () => {
      await skill.initialize();

      const config = {
        url: 'https://this-domain-does-not-exist-12345.com',
        selector: 'h1'
      };

      await expect(skill.stealthScrape(config)).rejects.toThrow('Scraping failed');
    });
  });

  describe('Resource Cleanup', () => {
    test('should close browser properly', async () => {
      await skill.initialize();
      expect(skill.browser.isConnected()).toBe(true);

      await skill.close();
      expect(skill.browser).toBeNull();
      expect(skill.page).toBeNull();
    });

    test('should handle cleanup when browser is not initialized', async () => {
      // Should not throw error when closing uninitialized browser
      await expect(skill.close()).resolves.not.toThrow();
    });
  });
});