# Puppeteer Stealth Skill

A comprehensive web automation skill that implements ethical browser automation with anti-bot evasion capabilities using Puppeteer Extra and Stealth plugin.

## Features

- **Stealth Mode**: Uses puppeteer-extra-plugin-stealth to avoid detection
- **Randomized Configurations**: User-agent rotation, viewport variation, and fingerprint randomization
- **Cookie Management**: Import/export cookies for session persistence
- **CAPTCHA Detection**: Screenshot capture and analysis for CAPTCHA identification
- **Human-like Behavior**: Realistic delays and interaction patterns
- **Flexible Modes**: Support for both headless and headful browser operations
- **Error Handling**: Robust handling of Cloudflare challenges and common anti-bot measures
- **Ethical Compliance**: Built-in rate limiting and respectful scraping practices

## Installation

### Prerequisites
- Node.js 14.0.0 or higher
- npm or yarn package manager

### Install Dependencies

```bash
cd /path/to/skills/puppeteer-stealth
npm install
```

### Dependencies
- `puppeteer` - Headless Chrome browser automation
- `puppeteer-extra` - Extensible Puppeteer with plugin system
- `puppeteer-extra-plugin-stealth` - Stealth plugin to avoid detection
- `puppeteer-extra-plugin-user-preferences` - User preference management
- `@cliqz/adblocker-puppeteer` - Ad blocking capabilities
- `user-agents` - Randomized user-agent generation

## Quick Start

### Basic Usage

```javascript
const PuppeteerStealthSkill = require('./index.js');

async function basicExample() {
  const skill = new PuppeteerStealthSkill();

  try {
    // Initialize browser
    await skill.initialize({
      headless: true,
      captureScreenshots: true
    });

    // Scrape data
    const result = await skill.stealthScrape({
      url: 'https://example.com',
      selector: 'h1'
    });

    console.log('Scraped data:', result);

  } finally {
    await skill.close();
  }
}

basicExample();
```

### Human-like Interactions

```javascript
// Navigate to a page
await skill.page.goto('https://example.com/form');

// Fill form with human-like typing
await skill.humanType('#name', 'John Doe');
await skill.humanType('#email', 'john@example.com');

// Click button with human-like behavior
await skill.humanClick('#submit-button');
```

### Cookie Management

```javascript
// Save cookies for later use
await skill.saveCookies('session.json');

// Load cookies to resume session
await skill.loadCookies('session.json');
```

## API Reference

### Constructor
```javascript
const skill = new PuppeteerStealthSkill();
```

### Methods

#### `initialize(options)`
Initialize browser with stealth configuration.

**Parameters:**
- `options` (Object): Configuration options
  - `headless` (boolean): Browser mode (default: true)
  - `captureScreenshots` (boolean): Enable screenshot capture (default: true)
  - `enableHumanDelays` (boolean): Apply human-like delays (default: true)
  - `minDelay` (number): Minimum delay in ms (default: 5000)
  - `maxDelay` (number): Maximum delay in ms (default: 15000)
  - `viewportRandomization` (boolean): Randomize viewport sizes (default: true)
  - `userAgentRotation` (boolean): Rotate user agents (default: true)
  - `blockAds` (boolean): Enable ad blocking (default: true)

**Returns:** Promise<Object> - Browser and page instances

#### `stealthScrape(config)`
Perform stealthy web scraping.

**Parameters:**
- `config` (Object): Scraping configuration
  - `url` (string): Target URL
  - `selector` (string): CSS selector to extract data from
  - `options` (Object): Scraping options

**Returns:** Promise<Object> - Scraped data with metadata

#### `humanClick(selector, options)`
Simulate human-like click on element.

**Parameters:**
- `selector` (string): CSS selector for element
- `options` (Object): Click options (optional)

#### `humanType(selector, text, options)`
Simulate human-like typing.

**Parameters:**
- `selector` (string): CSS selector for input element
- `text` (string): Text to type
- `options` (Object): Typing options (optional)

#### `humanDelay(minDelay, maxDelay)`
Apply human-like delay.

**Parameters:**
- `minDelay` (number): Minimum delay in ms (default: 5000)
- `maxDelay` (number): Maximum delay in ms (default: 15000)

#### `saveCookies(filepath)`
Save cookies to file.

**Parameters:**
- `filepath` (string): Path to save cookies

#### `loadCookies(filepath)`
Load cookies from file.

**Parameters:**
- `filepath` (string): Path to load cookies from

#### `captureScreenshot(filename, options)`
Take screenshot of current page.

**Parameters:**
- `filename` (string): Screenshot filename
- `options` (Object): Screenshot options (optional)

#### `detectCaptcha()`
Check if CAPTCHA is present on the page.

**Returns:** Promise<boolean> - True if CAPTCHA detected

#### `detectCloudflare()`
Check if Cloudflare challenge is present.

**Returns:** Promise<boolean> - True if Cloudflare detected

#### `handleCloudflare()`
Attempt to handle Cloudflare challenges automatically.

#### `getPageInfo()`
Get current page information.

**Returns:** Promise<Object> - Page metadata

#### `close()`
Close browser and clean up resources.

## Examples

### Basic Scraping
```bash
node examples/basic-scraping.js 1
```

### Human Interaction
```bash
node examples/basic-scraping.js 2
```

### Cookie Management
```bash
node examples/basic-scraping.js 3
```

### Advanced Usage
```bash
node examples/advanced-usage.js 1  # Advanced scraping with retry
node examples/advanced-usage.js 2  # Multi-page scraping
node examples/advanced-usage.js 3  # Custom configuration
node examples/advanced-usage.js 4  # Monitoring and debugging
node examples/advanced-usage.js 5  # Error handling and recovery
```

### Ethical Guidelines
```bash
node examples/ethical-guidelines.js
```

## Configuration Options

### Default Configuration
```javascript
const defaultOptions = {
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
```

### Custom User Agents
The skill includes a diverse set of user agents that can be randomly rotated:
- Chrome on Windows 10
- Chrome on macOS
- Firefox on Windows 10
- Firefox on macOS
- Chrome on Linux

### Viewport Sizes
Common viewport sizes are randomly selected:
- 1920x1080 (Desktop)
- 1366x768 (Laptop)
- 1440x900 (Desktop)
- 1536x864 (Desktop)
- 1280x720 (Laptop)

## Error Handling

The skill includes comprehensive error handling for:
- Network timeouts
- Element not found errors
- CAPTCHA detection
- Cloudflare challenges
- Browser crashes
- Memory issues

## Ethical Considerations

This skill is designed for ethical web automation:

1. **Respect robots.txt**: Always check and respect robots.txt files
2. **Rate limiting**: Built-in delays prevent server overload
3. **Identification**: User agents identify the automation responsibly
4. **Privacy**: Only collect publicly available information
5. **Legitimacy**: Use only for legitimate purposes
6. **Compliance**: Follow website terms of service

## Troubleshooting

### Common Issues

1. **Browser Crashes**
   ```javascript
   try {
     await skill.initialize();
   } catch (error) {
     console.log('Restarting browser...');
     await skill.close();
     await skill.initialize();
   }
   ```

2. **CAPTCHA Detection**
   ```javascript
   if (await skill.detectCaptcha()) {
     await skill.captureScreenshot('captcha.png');
     console.log('CAPTCHA detected - manual intervention required');
   }
   ```

3. **Cloudflare Challenges**
   ```javascript
   if (await skill.detectCloudflare()) {
     await skill.handleCloudflare();
   }
   ```

### Performance Tips

- Use headful mode for debugging
- Increase delays for sensitive websites
- Monitor memory usage with long sessions
- Save progress periodically for large scraping jobs

## Contributing

To contribute to this skill:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure ethical compliance
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the examples directory
2. Review the troubleshooting section
3. Ensure ethical usage guidelines are followed
4. Create an issue with detailed information

## Updates

The skill is regularly updated to:
- Add new anti-detection techniques
- Improve performance and reliability
- Enhance ethical compliance features
- Support new browser versions