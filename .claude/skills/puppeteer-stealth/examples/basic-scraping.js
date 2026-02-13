const PuppeteerStealthSkill = require('../index.js');

async function basicScrapingExample() {
  const skill = new PuppeteerStealthSkill();

  try {
    console.log('Starting basic scraping example...');

    // Initialize browser with stealth configuration
    await skill.initialize({
      headless: true,
      captureScreenshots: true,
      enableHumanDelays: true
    });

    // Perform stealth scraping
    const result = await skill.stealthScrape({
      url: 'https://example.com',
      selector: 'h1',
      options: {
        captureScreenshots: true,
        enableHumanDelays: true
      }
    });

    console.log('Scraping result:', result);

    // Get page information
    const pageInfo = await skill.getPageInfo();
    console.log('Page information:', pageInfo);

  } catch (error) {
    console.error('Scraping failed:', error.message);
  } finally {
    // Clean up resources
    await skill.close();
  }
}

async function humanInteractionExample() {
  const skill = new PuppeteerStealthSkill();

  try {
    console.log('Starting human interaction example...');

    await skill.initialize({
      headless: false, // Show browser for this example
      enableHumanDelays: true
    });

    // Navigate to a website
    await skill.page.goto('https://httpbin.org/forms/post');

    // Fill out a form with human-like typing
    await skill.humanType('#custname', 'John Doe');
    await skill.humanType('#custtel', '555-123-4567');
    await skill.humanType('#custemail', 'john.doe@example.com');

    // Select a dropdown
    await skill.humanClick('select[name="size"]');
    await skill.humanDelay(500, 1000);
    await skill.page.select('select[name="size"]', 'medium');

    // Click submit button
    await skill.humanClick('input[type="submit"]');

    // Wait for response
    await skill.humanDelay(2000, 4000);

    // Take screenshot of result
    await skill.captureScreenshot('form-submission-result.png');

    console.log('Form submission completed successfully');

  } catch (error) {
    console.error('Human interaction failed:', error.message);
  } finally {
    await skill.close();
  }
}

async function cookieManagementExample() {
  const skill = new PuppeteerStealthSkill();

  try {
    console.log('Starting cookie management example...');

    await skill.initialize({
      headless: true,
      enableHumanDelays: true
    });

    // Navigate to a website that sets cookies
    await skill.page.goto('https://httpbin.org/cookies/set/test/value');

    // Save cookies
    await skill.saveCookies('cookies.json');

    // Navigate to a different page
    await skill.page.goto('https://httpbin.org/cookies');

    // Check cookies
    const initialCookies = await skill.page.evaluate(() => {
      return document.body.innerText;
    });
    console.log('Initial cookies:', initialCookies);

    // Clear cookies
    await skill.page.deleteCookie(...await skill.page.cookies());

    // Load saved cookies
    await skill.loadCookies('cookies.json');

    // Verify cookies are restored
    await skill.page.goto('https://httpbin.org/cookies');
    const restoredCookies = await skill.page.evaluate(() => {
      return document.body.innerText;
    });
    console.log('Restored cookies:', restoredCookies);

  } catch (error) {
    console.error('Cookie management failed:', error.message);
  } finally {
    await skill.close();
  }
}

// Run examples
if (require.main === module) {
  console.log('Choose an example to run:');
  console.log('1. Basic scraping');
  console.log('2. Human interaction');
  console.log('3. Cookie management');

  const choice = process.argv[2] || '1';

  switch (choice) {
    case '1':
      basicScrapingExample();
      break;
    case '2':
      humanInteractionExample();
      break;
    case '3':
      cookieManagementExample();
      break;
    default:
      console.log('Running basic scraping example by default...');
      basicScrapingExample();
  }
}

module.exports = {
  basicScrapingExample,
  humanInteractionExample,
  cookieManagementExample
};