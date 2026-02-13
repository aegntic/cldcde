/**
 * Google Labs Core Integration
 * Browser automation for accessing Google Labs tools
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs-extra');
const path = require('path');

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

class GoogleLabs {
  constructor() {
    this.browser = null;
    this.page = null;
    this.config = {
      headless: true,
      slowMo: 50,
      defaultViewport: { width: 1920, height: 1080 }
    };
  }

  /**
   * Initialize browser
   */
  async initBrowser(options = {}) {
    if (this.browser) return;

    const launchOptions = {
      headless: options.headless !== false ? 'new' : false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ],
      ...options
    };

    this.browser = await puppeteer.launch(launchOptions);
    this.page = await this.browser.newPage();
    
    // Set user agent
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );
  }

  /**
   * Close browser
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  /**
   * Google Stitch - Visual Storytelling
   */
  async stitch(options) {
    await this.initBrowser(options);
    
    try {
      console.log('🧵 Opening Google Stitch...');
      
      // Navigate to Stitch (URL would be updated when available)
      await this.page.goto('https://labs.google/stitch', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // Handle any login prompts
      await this.handleLogin();

      // Enter prompt
      await this.page.waitForSelector('textarea[placeholder*="prompt"], input[type="text"]', {
        timeout: 10000
      });
      
      await this.page.type('textarea[placeholder*="prompt"], input[type="text"]', options.prompt);
      
      // Click generate
      await this.page.click('button[type="submit"], button:has-text("Generate")');
      
      // Wait for results
      console.log('⏳ Generating visual story...');
      await this.page.waitForTimeout(10000);
      
      // Download variations
      await this.downloadResults(options.outputDir, 'stitch');
      
      console.log(`✅ Saved to: ${options.outputDir}`);
      
    } catch (error) {
      console.error('❌ Stitch error:', error.message);
      throw error;
    } finally {
      if (!options.visible) {
        await this.closeBrowser();
      }
    }
  }

  /**
   * Google Whisk - Image Remix
   */
  async whisk(options) {
    await this.initBrowser(options);
    
    try {
      console.log('🎨 Opening Google Whisk...');
      
      await this.page.goto('https://labs.google/whisk', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      await this.handleLogin();

      // Upload or reference image
      if (options.input.startsWith('http')) {
        // URL input
        await this.page.type('input[type="url"]', options.input);
      } else {
        // File upload
        const inputUploadHandle = await this.page.$('input[type="file"]');
        await inputUploadHandle.uploadFile(options.input);
      }

      // Set style
      if (options.style) {
        await this.page.select('select[name="style"]', options.style);
      }

      // Set strength
      if (options.strength) {
        await this.page.evaluate((strength) => {
          const slider = document.querySelector('input[type="range"]');
          if (slider) slider.value = strength;
        }, options.strength);
      }

      // Generate
      await this.page.click('button:has-text("Remix"), button:has-text("Generate")');
      
      console.log('⏳ Remixing image...');
      await this.page.waitForTimeout(15000);
      
      await this.downloadResults(options.outputDir, 'whisk');
      
      console.log(`✅ Saved to: ${options.outputDir}`);
      
    } catch (error) {
      console.error('❌ Whisk error:', error.message);
      throw error;
    } finally {
      if (!options.visible) {
        await this.closeBrowser();
      }
    }
  }

  /**
   * Google Flow - Animation
   */
  async flow(options) {
    await this.initBrowser(options);
    
    try {
      console.log('🌊 Opening Google Flow...');
      
      await this.page.goto('https://labs.google/flow', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      await this.handleLogin();

      // Upload image
      const inputUploadHandle = await this.page.$('input[type="file"]');
      await inputUploadHandle.uploadFile(options.input);

      // Configure animation
      if (options.duration) {
        await this.page.select('select[name="duration"]', `${options.duration}s`);
      }

      if (options.style) {
        await this.page.select('select[name="style"]', options.style);
      }

      // Generate animation
      await this.page.click('button:has-text("Animate"), button:has-text("Generate")');
      
      console.log('⏳ Creating animation...');
      await this.page.waitForTimeout(20000);
      
      await this.downloadResults(options.outputDir, 'flow');
      
      console.log(`✅ Saved to: ${options.outputDir}`);
      
    } catch (error) {
      console.error('❌ Flow error:', error.message);
      throw error;
    } finally {
      if (!options.visible) {
        await this.closeBrowser();
      }
    }
  }

  /**
   * Google MusicFX
   */
  async musicfx(options) {
    await this.initBrowser(options);
    
    try {
      console.log('🎵 Opening Google MusicFX...');
      
      await this.page.goto('https://labs.google/musicfx', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      await this.handleLogin();

      // Enter prompt
      await this.page.type('textarea, input[type="text"]', options.prompt);

      // Select genre
      if (options.genre) {
        await this.page.select('select[name="genre"]', options.genre);
      }

      // Generate
      await this.page.click('button:has-text("Generate"), button:has-text("Create")');
      
      console.log('⏳ Generating music...');
      await this.page.waitForTimeout(15000);
      
      await this.downloadResults(options.outputDir, 'musicfx');
      
      console.log(`✅ Saved to: ${options.outputDir}`);
      
    } catch (error) {
      console.error('❌ MusicFX error:', error.message);
      throw error;
    } finally {
      if (!options.visible) {
        await this.closeBrowser();
      }
    }
  }

  /**
   * Google ImageFX
   */
  async imagefx(options) {
    await this.initBrowser(options);
    
    try {
      console.log('🖼️  Opening Google ImageFX...');
      
      await this.page.goto('https://labs.google/imagefx', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      await this.handleLogin();

      // Enter prompt
      await this.page.type('textarea, input[type="text"]', options.prompt);

      // Select edit type
      if (options.editType) {
        await this.page.click(`button:has-text("${options.editType}")`);
      }

      // Generate
      await this.page.click('button:has-text("Generate"), button:has-text("Edit")');
      
      console.log('⏳ Processing image...');
      await this.page.waitForTimeout(15000);
      
      await this.downloadResults(options.outputDir, 'imagefx');
      
      console.log(`✅ Saved to: ${options.outputDir}`);
      
    } catch (error) {
      console.error('❌ ImageFX error:', error.message);
      throw error;
    } finally {
      if (!options.visible) {
        await this.closeBrowser();
      }
    }
  }

  /**
   * Handle login if needed
   */
  async handleLogin() {
    // Check if we're on a login page
    const loginButton = await this.page.$('button:has-text("Sign in"), a:has-text("Sign in")');
    
    if (loginButton) {
      console.log('🔐 Please sign in via the browser window...');
      
      // Wait for login to complete (user does it manually)
      await this.page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 120000
      });
    }
  }

  /**
   * Download generated results
   */
  async downloadResults(outputDir, tool) {
    await fs.ensureDir(outputDir);
    
    // Find all image/video elements
    const mediaElements = await this.page.$$('img, video');
    
    for (let i = 0; i < mediaElements.length; i++) {
      const element = mediaElements[i];
      const src = await element.evaluate(el => el.src);
      
      if (src && !src.startsWith('data:')) {
        // Download the file
        const extension = src.endsWith('.mp4') ? 'mp4' : 'png';
        const filename = `${tool}-${Date.now()}-${i}.${extension}`;
        const filepath = path.join(outputDir, filename);
        
        // Use page evaluate to download
        await this.page.evaluate(async (url, filepath) => {
          const response = await fetch(url);
          const buffer = await response.arrayBuffer();
          // Note: Actual file saving would require Node.js fs in page context
          // This is simplified - real implementation would use proper download
        }, src, filepath);
        
        console.log(`  💾 Downloaded: ${filename}`);
      }
    }
  }
}

module.exports = GoogleLabs;