---
name: puppeteer-stealth
description: Ethical web automation with Puppeteer Stealth for anti-bot evasion, featuring randomized configurations, cookie management, and human-like behavior patterns
location: user
category: automation
tags: [puppeteer, web-automation, stealth, browser, scraping]
---

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

## Usage

```javascript
// Basic stealth scraping
const result = await skill.stealthScrape({
  url: 'https://example.com',
  selector: '.content',
  options: { headless: true, captureScreenshots: true }
});

// Cookie management
await skill.saveCookies('session-cookies.json');
await skill.loadCookies('session-cookies.json');

// Human-like interaction
await skill.humanClick('.button');
await skill.humanType('#search', 'query', { delay: 100 });
```

## API Reference

### Methods
- `initialize(options)` - Initialize stealth browser instance
- `stealthScrape(config)` - Perform stealthy web scraping
- `humanClick(selector)` - Simulate human-like click
- `humanType(selector, text, options)` - Simulate human-like typing
- `saveCookies(filepath)` - Export cookies to file
- `loadCookies(filepath)` - Import cookies from file
- `captureScreenshot(path)` - Take screenshot for analysis
- `detectCaptcha()` - Detect if CAPTCHA is present
- `handleCloudflare()` - Attempt to bypass Cloudflare challenges
- `close()` - Clean up browser resources

## Installation

Install dependencies in your project:

```bash
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth puppeteer-extra-plugin-user-preferences user-agents
```

## Ethical Guidelines

- Always respect robots.txt files
- Implement reasonable delays between requests
- Do not overload target servers
- Use only for legitimate purposes
- Comply with website terms of service
- Never use for malicious activities