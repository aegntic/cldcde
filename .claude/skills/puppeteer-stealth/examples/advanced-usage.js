const PuppeteerStealthSkill = require('../index.js');
const fs = require('fs').promises;

async function advancedScrapingWithRetry() {
  const skill = new PuppeteerStealthSkill();
  const maxRetries = 3;
  let attempt = 0;

  try {
    console.log('Starting advanced scraping with retry logic...');

    while (attempt < maxRetries) {
      attempt++;
      console.log(`Attempt ${attempt} of ${maxRetries}`);

      try {
        await skill.initialize({
          headless: true,
          captureScreenshots: true,
          enableHumanDelays: true,
          viewportRandomization: true,
          userAgentRotation: true
        });

        const result = await skill.stealthScrape({
          url: 'https://example.com',
          selector: 'p',
          options: {
            captureScreenshots: true,
            enableHumanDelays: true,
            minDelay: 3000,
            maxDelay: 10000
          }
        });

        console.log('Scraping successful:', result);
        break; // Success, exit retry loop

      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error.message);

        if (attempt === maxRetries) {
          throw error; // Max retries reached
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
      } finally {
        await skill.close();
      }
    }

  } catch (error) {
    console.error('Advanced scraping failed after all retries:', error.message);
  }
}

async function multiPageScraping() {
  const skill = new PuppeteerStealthSkill();
  const urls = [
    'https://example.com',
    'https://example.org',
    'https://example.net'
  ];

  try {
    console.log('Starting multi-page scraping...');

    await skill.initialize({
      headless: true,
      captureScreenshots: true,
      enableHumanDelays: true
    });

    const results = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`Scraping ${url} (${i + 1}/${urls.length})`);

      try {
        const result = await skill.stealthScrape({
          url,
          selector: 'h1',
          options: {
            captureScreenshots: true,
            enableHumanDelays: true,
            minDelay: 5000,
            maxDelay: 15000
          }
        });

        results.push(result);

        // Save screenshot for each page
        await skill.captureScreenshot(`page-${i + 1}-screenshot.png`);

        // Human-like delay between pages
        await skill.humanDelay(10000, 30000);

      } catch (error) {
        console.error(`Failed to scrape ${url}:`, error.message);
        results.push({ url, error: error.message, timestamp: new Date().toISOString() });
      }
    }

    // Save results to file
    await fs.writeFile(
      'multi-page-results.json',
      JSON.stringify(results, null, 2)
    );

    console.log(`Completed scraping ${urls.length} pages`);
    console.log('Results saved to multi-page-results.json');

  } catch (error) {
    console.error('Multi-page scraping failed:', error.message);
  } finally {
    await skill.close();
  }
}

async function customConfigurationExample() {
  const skill = new PuppeteerStealthSkill();

  try {
    console.log('Starting custom configuration example...');

    // Custom stealth configuration
    const customOptions = {
      headless: false, // Show browser
      captureScreenshots: true,
      enableHumanDelays: true,
      minDelay: 8000,
      maxDelay: 20000,
      viewportRandomization: true,
      userAgentRotation: true,
      blockAds: true,
      enableLogging: true
    };

    await skill.initialize(customOptions);

    // Navigate to a complex website
    await skill.page.goto('https://httpbin.org');

    // Demonstrate advanced page interactions
    console.log('Testing advanced interactions...');

    // Check for CAPTCHA
    const hasCaptcha = await skill.detectCaptcha();
    console.log('CAPTCHA detected:', hasCaptcha);

    // Check for Cloudflare
    const hasCloudflare = await skill.detectCloudflare();
    console.log('Cloudflare detected:', hasCloudflare);

    // Get detailed page information
    const pageInfo = await skill.getPageInfo();
    console.log('Page information:', pageInfo);

    // Custom human-like sequence
    await skill.humanClick('a[href="/html"]');
    await skill.humanDelay(3000, 7000);

    await skill.humanType('input[name="query"]', 'test query', {
      clear: true,
      delay: 120
    });

    await skill.humanClick('button[type="submit"]');
    await skill.humanDelay(5000, 10000);

    // Capture final state
    await skill.captureScreenshot('advanced-interaction-result.png');

    console.log('Custom configuration example completed successfully');

  } catch (error) {
    console.error('Custom configuration example failed:', error.message);
  } finally {
    await skill.close();
  }
}

async function monitoringAndDebugging() {
  const skill = new PuppeteerStealthSkill();

  try {
    console.log('Starting monitoring and debugging example...');

    await skill.initialize({
      headless: true,
      enableLogging: true
    });

    // Enable request monitoring
    const requests = [];
    skill.page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    });

    // Enable response monitoring
    const responses = [];
    skill.page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        timestamp: new Date().toISOString()
      });
    });

    // Navigate and monitor
    await skill.page.goto('https://httpbin.org/json');

    // Wait a bit for all requests to complete
    await skill.humanDelay(2000, 4000);

    // Save monitoring data
    const monitoringData = {
      requests: requests.slice(0, 10), // Limit to first 10 requests
      responses: responses.slice(0, 10), // Limit to first 10 responses
      pageInfo: await skill.getPageInfo(),
      timestamp: new Date().toISOString()
    };

    await fs.writeFile(
      'monitoring-data.json',
      JSON.stringify(monitoringData, null, 2)
    );

    console.log('Monitoring data saved to monitoring-data.json');
    console.log(`Captured ${requests.length} requests and ${responses.length} responses`);

  } catch (error) {
    console.error('Monitoring example failed:', error.message);
  } finally {
    await skill.close();
  }
}

// Error handling and recovery example
async function errorHandlingExample() {
  const skill = new PuppeteerStealthSkill();

  try {
    console.log('Starting error handling example...');

    // Try to scrape a non-existent URL
    try {
      await skill.initialize();
      await skill.stealthScrape({
        url: 'https://this-domain-does-not-exist-12345.com',
        selector: 'h1'
      });
    } catch (error) {
      console.log('Expected error caught:', error.message);
    }

    // Try to find a non-existent element
    try {
      await skill.page.goto('https://example.com');
      await skill.page.waitForSelector('#non-existent-element', { timeout: 5000 });
    } catch (error) {
      console.log('Element not found error handled:', error.message);
    }

    // Demonstrate graceful recovery
    console.log('Attempting recovery...');
    await skill.close();

    // Reinitialize with different configuration
    await skill.initialize({
      headless: true,
      enableHumanDelays: true
    });

    const result = await skill.stealthScrape({
      url: 'https://example.com',
      selector: 'h1'
    });

    console.log('Recovery successful:', result);

  } catch (error) {
    console.error('Error handling example failed:', error.message);
  } finally {
    await skill.close();
  }
}

// Run examples
if (require.main === module) {
  console.log('Choose an advanced example to run:');
  console.log('1. Advanced scraping with retry');
  console.log('2. Multi-page scraping');
  console.log('3. Custom configuration');
  console.log('4. Monitoring and debugging');
  console.log('5. Error handling and recovery');

  const choice = process.argv[2] || '1';

  switch (choice) {
    case '1':
      advancedScrapingWithRetry();
      break;
    case '2':
      multiPageScraping();
      break;
    case '3':
      customConfigurationExample();
      break;
    case '4':
      monitoringAndDebugging();
      break;
    case '5':
      errorHandlingExample();
      break;
    default:
      console.log('Running advanced scraping with retry by default...');
      advancedScrapingWithRetry();
  }
}

module.exports = {
  advancedScrapingWithRetry,
  multiPageScraping,
  customConfigurationExample,
  monitoringAndDebugging,
  errorHandlingExample
};