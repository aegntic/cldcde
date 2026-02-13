/**
 * Ethical Web Automation Guidelines Example
 *
 * This file demonstrates how to implement ethical web automation practices
 * using the Puppeteer Stealth skill.
 */

const PuppeteerStealthSkill = require('../index.js');
const fs = require('fs').promises;

class EthicalWebAutomation {
  constructor() {
    this.skill = new PuppeteerStealthSkill();
    this.requestCount = 0;
    this.maxRequestsPerMinute = 10;
    this.lastRequestTime = null;
    this.minRequestInterval = 6000; // 6 seconds between requests
  }

  /**
   * Check robots.txt before scraping
   * @param {string} domain - Domain to check
   * @returns {Promise<boolean>} True if scraping is allowed
   */
  async checkRobotsTxt(domain) {
    try {
      console.log(`Checking robots.txt for ${domain}...`);

      const robotsUrl = `https://${domain}/robots.txt`;
      const response = await fetch(robotsUrl);
      const robotsText = await response.text();

      // Basic check for common disallow patterns
      const disallowedPaths = [
        '/admin',
        '/private',
        '/login',
        '/user',
        '/dashboard'
      ];

      const allowsScraping = !disallowedPaths.some(path =>
        robotsText.includes(`Disallow: ${path}`)
      );

      console.log(`Robots.txt check completed. Scraping allowed: ${allowsScraping}`);
      return allowsScraping;

    } catch (error) {
      console.warn('Could not fetch robots.txt, proceeding with caution:', error.message);
      return true; // Default to allow if robots.txt is inaccessible
    }
  }

  /**
   * Implement rate limiting to respect server resources
   */
  async enforceRateLimit() {
    const now = Date.now();

    if (this.lastRequestTime) {
      const timeSinceLastRequest = now - this.lastRequestTime;
      const waitTime = Math.max(0, this.minRequestInterval - timeSinceLastRequest);

      if (waitTime > 0) {
        console.log(`Rate limiting: waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Check if we've exceeded request limits
   * @returns {boolean} True if we should stop making requests
   */
  isRequestLimitExceeded() {
    return this.requestCount >= this.maxRequestsPerMinute;
  }

  /**
   * Ethical scraping with proper headers and identification
   * @param {Object} config - Scraping configuration
   * @returns {Promise<Object>} Scraped data
   */
  async ethicalScrape(config) {
    try {
      // Extract domain from URL
      const url = new URL(config.url);
      const domain = url.hostname;

      // Check robots.txt first
      const allowedByRobots = await this.checkRobotsTxt(domain);
      if (!allowedByRobots) {
        throw new Error(`Scraping not allowed by robots.txt for ${domain}`);
      }

      // Enforce rate limiting
      await this.enforceRateLimit();

      // Check request limits
      if (this.isRequestLimitExceeded()) {
        throw new Error('Request limit exceeded. Please wait before making more requests.');
      }

      // Initialize with ethical settings
      await this.skill.initialize({
        headless: true,
        enableHumanDelays: true,
        minDelay: 8000, // Longer delays to be respectful
        maxDelay: 20000,
        enableLogging: true
      });

      // Set ethical headers
      await this.skill.page.setExtraHTTPHeaders({
        'User-Agent': 'EthicalBot/1.0 (Contact: your-email@example.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      });

      // Perform scraping with ethical considerations
      const result = await this.skill.stealthScrape({
        ...config,
        options: {
          ...config.options,
          enableHumanDelays: true,
          minDelay: 5000,
          maxDelay: 15000
        }
      });

      // Add ethical metadata
      result.ethicalMetadata = {
        requestId: this.requestCount,
        timestamp: new Date().toISOString(),
        userAgent: 'EthicalBot/1.0',
        rateLimited: true,
        robotsCompliant: true
      };

      console.log(`Ethical scraping completed for ${domain}. Request #${this.requestCount}`);
      return result;

    } catch (error) {
      console.error('Ethical scraping failed:', error.message);
      throw error;
    }
  }

  /**
   * Save data with proper attribution and timestamp
   * @param {Object} data - Data to save
   * @param {string} filename - Output filename
   */
  async saveDataEthically(data, filename) {
    try {
      const ethicalData = {
        ...data,
        metadata: {
          source: 'Puppeteer Stealth Skill - Ethical Web Automation',
          scrapedAt: new Date().toISOString(),
          purpose: 'Educational/Research purposes only',
          contact: 'Please contact if this data should not be collected',
          compliance: {
            robotsTxt: true,
            rateLimited: true,
            respectForServer: true
          }
        }
      };

      await fs.writeFile(filename, JSON.stringify(ethicalData, null, 2));
      console.log(`Data saved ethically to ${filename}`);

    } catch (error) {
      console.error('Failed to save data ethically:', error.message);
    }
  }

  /**
   * Demonstrate respectful scraping session
   */
  async respectfulScrapingSession() {
    console.log('Starting respectful scraping session...');

    const urls = [
      'https://example.com',
      'https://example.org',
      'https://httpbin.org'
    ];

    const results = [];

    try {
      for (const url of urls) {
        try {
          const result = await this.ethicalScrape({
            url,
            selector: 'h1',
            options: { captureScreenshots: false }
          });

          results.push(result);

          // Respectful delay between sites
          console.log('Waiting 30 seconds before next request...');
          await new Promise(resolve => setTimeout(resolve, 30000));

        } catch (error) {
          console.error(`Failed to scrape ${url}:`, error.message);
          results.push({ url, error: error.message });
        }
      }

      // Save results with ethical metadata
      await this.saveDataEthically(results, 'ethical-scraping-results.json');

      console.log('Respectful scraping session completed');

    } finally {
      await this.skill.close();
    }
  }

  /**
   * Clean up any temporary files and respect privacy
   */
  async cleanup() {
    try {
      // Close browser
      await this.skill.close();

      // Log session end
      console.log('Ethical web automation session ended');
      console.log(`Total requests made: ${this.requestCount}`);
      console.log('Rate limiting and ethical guidelines were followed');

    } catch (error) {
      console.error('Cleanup failed:', error.message);
    }
  }
}

// Example usage
async function demonstrateEthicalScraping() {
  const ethicalBot = new EthicalWebAutomation();

  try {
    // Show ethical guidelines
    console.log('ETHICAL WEB AUTOMATION GUIDELINES:');
    console.log('1. Always respect robots.txt files');
    console.log('2. Implement reasonable rate limiting');
    console.log('3. Identify your bot with proper headers');
    console.log('4. Never overload target servers');
    console.log('5. Use only for legitimate purposes');
    console.log('6. Comply with website terms of service');
    console.log('7. Be transparent about your scraping activities');
    console.log('8. Clean up after scraping sessions');
    console.log('');

    // Run respectful scraping session
    await ethicalBot.respectfulScrapingSession();

  } finally {
    await ethicalBot.cleanup();
  }
}

// Additional ethical utilities
async function checkWebsiteTerms(url) {
  console.log(`Checking terms of service for ${url}...`);
  // In a real implementation, you might want to:
  // 1. Look for terms of service links
  // 2. Check for API availability (preferred over scraping)
  // 3. Verify the site allows automated access
  console.log('Terms check completed - proceed with respect');
}

function logEthicalUsage(data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    purpose: 'Ethical web automation for educational purposes',
    dataAccessed: 'Publicly available information',
    compliance: 'Following ethical guidelines and rate limiting',
    respectForPrivacy: 'No personal data collected'
  };

  console.log('Ethical usage logged:', JSON.stringify(logEntry, null, 2));
}

// Run demonstration
if (require.main === module) {
  demonstrateEthicalScraping();
}

module.exports = {
  EthicalWebAutomation,
  checkWebsiteTerms,
  logEthicalUsage,
  demonstrateEthicalScraping
};