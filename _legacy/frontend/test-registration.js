import puppeteer from 'puppeteer';

async function testRegistration() {
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for CI/CD
    devtools: true 
  });
  
  const page = await browser.newPage();
  
  // Enable console log capture
  page.on('console', msg => {
    console.log('Console:', msg.type(), msg.text());
  });
  
  // Capture network failures
  page.on('requestfailed', request => {
    console.log('Request failed:', {
      url: request.url(),
      method: request.method(),
      failure: request.failure()
    });
  });
  
  // Capture responses
  page.on('response', response => {
    if (!response.ok() && response.url().includes('api')) {
      console.log('API Error Response:', {
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });
  
  // Log all network requests
  page.on('request', request => {
    if (request.url().includes('api')) {
      console.log('API Request:', {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
    }
  });
  
  try {
    console.log('1. Navigating to site...');
    await page.goto('https://dc8cf170.cldcde.pages.dev', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Take initial screenshot
    await page.screenshot({ path: 'screenshot-1-initial.png', fullPage: true });
    console.log('Initial screenshot saved');
    
    console.log('2. Looking for Login/Register button...');
    // Try different selectors
    const loginButton = await page.waitForSelector('button', { timeout: 10000 });
    const buttons = await page.$$eval('button', buttons => 
      buttons.map(b => ({ text: b.textContent, html: b.outerHTML }))
    );
    console.log('Found buttons:', buttons);
    
    // Click the login/register button using evaluate
    const clicked = await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(
        b => b.textContent === 'Login / Register'
      );
      if (button) {
        button.click();
        return true;
      }
      return false;
    });
    
    if (clicked) {
      console.log('Clicked Login/Register button');
    } else {
      console.log('Could not find Login/Register button');
    }
    
    // Wait for modal to appear - look for dialog role
    try {
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      console.log('Modal opened successfully');
    } catch (e) {
      console.log('Modal did not appear, trying alternative approach...');
      // Take a screenshot to debug
      await page.screenshot({ path: 'screenshot-modal-debug.png', fullPage: true });
    }
    
    console.log('3. Switching to Register tab...');
    // Wait a bit to ensure modal is fully rendered
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click on Register tab - look for the specific Register text
    const registerClicked = await page.evaluate(() => {
      // Find the Register tab button - it's likely to be a div or button with text "Register"
      const registerElements = Array.from(document.querySelectorAll('*')).filter(
        el => el.textContent === 'Register' && 
        (el.tagName === 'BUTTON' || el.tagName === 'DIV' || el.tagName === 'A' || el.tagName === 'SPAN') &&
        !el.textContent.includes('/')
      );
      
      console.log('Found register elements:', registerElements.map(el => ({
        tag: el.tagName,
        text: el.textContent,
        class: el.className
      })));
      
      if (registerElements.length > 0) {
        // Click the first one that looks like a tab
        const registerTab = registerElements.find(el => 
          el.parentElement?.textContent?.includes('Login') || 
          el.className?.includes('tab') ||
          el.textContent === 'Register'
        );
        
        if (registerTab) {
          registerTab.click();
          return true;
        }
      }
      return false;
    });
    
    console.log('Register tab clicked:', registerClicked);
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for tab switch
    
    // Take screenshot of register form
    await page.screenshot({ path: 'screenshot-2-register-form.png', fullPage: true });
    
    console.log('4. Filling registration form...');
    // Find all inputs and log them
    const inputs = await page.$$eval('input', inputs => 
      inputs.map(i => ({ 
        type: i.type, 
        placeholder: i.placeholder,
        name: i.name,
        id: i.id 
      }))
    );
    console.log('Found inputs:', inputs);
    
    // Fill in the registration form - be more specific with selectors
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.click({ clickCount: 3 }); // Triple click to select all
      await emailInput.type('test-puppet@example.com');
    }
    
    // Find password inputs more carefully
    const passwordInputs = await page.$$('input[type="password"]');
    console.log(`Found ${passwordInputs.length} password inputs`);
    
    if (passwordInputs.length >= 2) {
      // First password
      await passwordInputs[0].click({ clickCount: 3 });
      await passwordInputs[0].type('TestPassword123!');
      
      // Confirm password
      await passwordInputs[1].click({ clickCount: 3 });
      await passwordInputs[1].type('TestPassword123!');
    }
    
    // Take screenshot before submission
    await page.screenshot({ path: 'screenshot-3-filled-form.png', fullPage: true });
    
    console.log('5. Finding and clicking submit button...');
    
    // Find the submit button
    const submitButtons = await page.$$eval('button[type="submit"]', buttons => 
      buttons.map(b => ({ text: b.textContent, disabled: b.disabled }))
    );
    console.log('Submit buttons found:', submitButtons);
    
    // Set up promise to catch the response - look for registration endpoint
    const responsePromise = page.waitForResponse(response => 
      (response.url().includes('/api/register') || 
       response.url().includes('/api/auth/register') ||
       response.url().includes('/register')) && 
      response.request().method() === 'POST', 
      { timeout: 10000 }
    ).catch(err => {
      console.log('No registration API response received:', err.message);
      return null;
    });
    
    // Click register button
    await page.evaluate(() => {
      const submitButton = document.querySelector('button[type="submit"]');
      if (submitButton && !submitButton.disabled) {
        console.log('Clicking submit button:', submitButton.textContent);
        submitButton.click();
      } else {
        console.log('Submit button not found or disabled');
      }
    });
    
    // Wait for response or timeout
    const response = await responsePromise;
    
    if (response) {
      console.log('Registration response:', {
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers()
      });
      
      try {
        const responseBody = await response.text();
        console.log('Response body:', responseBody);
      } catch (e) {
        console.log('Could not read response body:', e.message);
      }
    }
    
    // Wait a bit for any error messages to appear
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for error messages in the UI - more comprehensive search
    const errorMessages = await page.evaluate(() => {
      const possibleErrors = [];
      
      // Check for any element with error-related classes or text
      document.querySelectorAll('*').forEach(el => {
        const text = el.textContent?.trim();
        const classes = el.className;
        
        if (text && (
          text.toLowerCase().includes('error') ||
          text.toLowerCase().includes('failed') ||
          text.toLowerCase().includes('invalid') ||
          classes?.toString().toLowerCase().includes('error')
        )) {
          // Only include if it's visible and not a script/style tag
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden' && 
              el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
            possibleErrors.push({
              text: text.substring(0, 200), // Limit text length
              tagName: el.tagName,
              className: classes?.toString() || '',
              id: el.id || ''
            });
          }
        }
      });
      
      return possibleErrors;
    });
    
    if (errorMessages.length > 0) {
      console.log('Possible error messages found:', errorMessages);
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'screenshot-4-after-submit.png', fullPage: true });
    
    // Get current URL and check if it changed
    console.log('Current URL:', page.url());
    
    // Check for any JavaScript errors in console
    const jsErrors = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent?.includes('TypeError') || 
        el.textContent?.includes('Error:')
      ).map(el => el.textContent);
    });
    
    if (jsErrors.length > 0) {
      console.log('JavaScript errors found in page:', jsErrors);
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'screenshot-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testRegistration().catch(console.error);