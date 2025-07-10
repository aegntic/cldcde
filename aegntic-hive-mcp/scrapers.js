const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ConversationScraper {
  constructor() {
    this.browser = null;
    this.sessions = {};
    this.sessionFile = path.join(__dirname, 'sessions.json');
    this.loadSessions();
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: false, // Keep visible for login
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  loadSessions() {
    try {
      if (fs.existsSync(this.sessionFile)) {
        this.sessions = JSON.parse(fs.readFileSync(this.sessionFile, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      this.sessions = {};
    }
  }

  saveSessions() {
    try {
      fs.writeFileSync(this.sessionFile, JSON.stringify(this.sessions, null, 2));
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }

  async loginToService(service) {
    const page = await this.browser.newPage();
    
    // Load existing cookies if available
    if (this.sessions[service]) {
      await page.setCookie(...this.sessions[service]);
    }

    const urls = {
      chatgpt: 'https://chat.openai.com/',
      grok: 'https://grok.x.com/',
      gemini: 'https://gemini.google.com/',
      claude: 'https://claude.ai/'
    };

    await page.goto(urls[service]);
    
    // Wait for user to login manually
    console.log(`Please log in to ${service} in the browser window that opened.`);
    console.log('Press Enter when you have successfully logged in...');
    
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });

    // Save session cookies
    const cookies = await page.cookies();
    this.sessions[service] = cookies;
    this.saveSessions();
    
    console.log(`Session saved for ${service}`);
    await page.close();
  }

  async scrapeChatGPT() {
    const page = await this.browser.newPage();
    
    if (this.sessions.chatgpt) {
      await page.setCookie(...this.sessions.chatgpt);
    }

    await page.goto('https://chat.openai.com/');
    
    // Wait for page to load
    await page.waitForTimeout(3000);

    const conversations = [];

    try {
      // Get conversation list
      const conversationElements = await page.$$('nav [data-testid^="conversation-"], nav a[href*="/c/"]');
      
      for (const element of conversationElements) {
        try {
          const titleElement = await element.$('div, span');
          const title = titleElement ? await titleElement.evaluate(el => el.textContent?.trim()) : 'Untitled';
          
          const href = await element.evaluate(el => el.getAttribute('href'));
          const conversationId = href ? href.split('/c/')[1]?.split('?')[0] : null;
          
          if (conversationId) {
            conversations.push({
              id: conversationId,
              title: title || 'Untitled',
              url: `https://chat.openai.com/c/${conversationId}`
            });
          }
        } catch (error) {
          console.error('Error extracting conversation:', error);
        }
      }

      // Get messages for each conversation
      for (const conv of conversations) {
        try {
          await page.goto(conv.url);
          await page.waitForTimeout(2000);

          const messages = [];
          const messageElements = await page.$$('[data-message-author-role]');

          for (let i = 0; i < messageElements.length; i++) {
            const messageEl = messageElements[i];
            const role = await messageEl.evaluate(el => el.getAttribute('data-message-author-role'));
            const content = await messageEl.evaluate(el => el.textContent?.trim());
            
            if (content) {
              messages.push({
                role: role === 'user' ? 'user' : 'assistant',
                content,
                order: i
              });
            }
          }

          conv.messages = messages;
        } catch (error) {
          console.error(`Error scraping conversation ${conv.id}:`, error);
          conv.messages = [];
        }
      }

    } catch (error) {
      console.error('Error scraping ChatGPT:', error);
    }

    await page.close();
    return conversations;
  }

  async scrapeGrok() {
    const page = await this.browser.newPage();
    
    if (this.sessions.grok) {
      await page.setCookie(...this.sessions.grok);
    }

    await page.goto('https://grok.x.com/');
    await page.waitForTimeout(3000);

    const conversations = [];

    try {
      // Grok conversation scraping logic
      const conversationElements = await page.$$('div[data-testid="conversation-item"], a[href*="/share/"]');
      
      for (const element of conversationElements) {
        try {
          const title = await element.evaluate(el => el.textContent?.trim());
          const href = await element.evaluate(el => el.getAttribute('href'));
          const conversationId = href ? href.split('/').pop() : Date.now().toString();
          
          if (title && conversationId) {
            conversations.push({
              id: conversationId,
              title,
              url: `https://grok.x.com${href}`
            });
          }
        } catch (error) {
          console.error('Error extracting Grok conversation:', error);
        }
      }

      // Get messages for each conversation
      for (const conv of conversations) {
        try {
          await page.goto(conv.url);
          await page.waitForTimeout(2000);

          const messages = [];
          const messageElements = await page.$$('[data-testid="message"], .message');

          for (let i = 0; i < messageElements.length; i++) {
            const messageEl = messageElements[i];
            const content = await messageEl.evaluate(el => el.textContent?.trim());
            const isUser = await messageEl.evaluate(el => 
              el.classList.contains('user') || 
              el.getAttribute('data-role') === 'user'
            );
            
            if (content) {
              messages.push({
                role: isUser ? 'user' : 'assistant',
                content,
                order: i
              });
            }
          }

          conv.messages = messages;
        } catch (error) {
          console.error(`Error scraping Grok conversation ${conv.id}:`, error);
          conv.messages = [];
        }
      }

    } catch (error) {
      console.error('Error scraping Grok:', error);
    }

    await page.close();
    return conversations;
  }

  async scrapeGemini() {
    const page = await this.browser.newPage();
    
    if (this.sessions.gemini) {
      await page.setCookie(...this.sessions.gemini);
    }

    await page.goto('https://gemini.google.com/');
    await page.waitForTimeout(3000);

    const conversations = [];

    try {
      // Gemini conversation scraping logic
      const conversationElements = await page.$$('div[data-conversation-id], a[href*="/chat/"]');
      
      for (const element of conversationElements) {
        try {
          const title = await element.evaluate(el => el.textContent?.trim());
          const href = await element.evaluate(el => el.getAttribute('href'));
          const conversationId = href ? href.split('/chat/')[1]?.split('?')[0] : Date.now().toString();
          
          if (title && conversationId) {
            conversations.push({
              id: conversationId,
              title,
              url: `https://gemini.google.com/chat/${conversationId}`
            });
          }
        } catch (error) {
          console.error('Error extracting Gemini conversation:', error);
        }
      }

      // Get messages for each conversation
      for (const conv of conversations) {
        try {
          await page.goto(conv.url);
          await page.waitForTimeout(2000);

          const messages = [];
          const messageElements = await page.$$('[data-message-author], .message-content');

          for (let i = 0; i < messageElements.length; i++) {
            const messageEl = messageElements[i];
            const content = await messageEl.evaluate(el => el.textContent?.trim());
            const role = await messageEl.evaluate(el => 
              el.getAttribute('data-message-author') === 'user' ? 'user' : 'assistant'
            );
            
            if (content) {
              messages.push({
                role: role || 'assistant',
                content,
                order: i
              });
            }
          }

          conv.messages = messages;
        } catch (error) {
          console.error(`Error scraping Gemini conversation ${conv.id}:`, error);
          conv.messages = [];
        }
      }

    } catch (error) {
      console.error('Error scraping Gemini:', error);
    }

    await page.close();
    return conversations;
  }

  async scrapeClaude() {
    const page = await this.browser.newPage();
    
    if (this.sessions.claude) {
      await page.setCookie(...this.sessions.claude);
    }

    await page.goto('https://claude.ai/');
    await page.waitForTimeout(3000);

    const conversations = [];

    try {
      // Claude conversation scraping logic
      const conversationElements = await page.$$('div[data-testid="conversation"], a[href*="/chat/"]');
      
      for (const element of conversationElements) {
        try {
          const title = await element.evaluate(el => el.textContent?.trim());
          const href = await element.evaluate(el => el.getAttribute('href'));
          const conversationId = href ? href.split('/chat/')[1]?.split('?')[0] : Date.now().toString();
          
          if (title && conversationId) {
            conversations.push({
              id: conversationId,
              title,
              url: `https://claude.ai/chat/${conversationId}`
            });
          }
        } catch (error) {
          console.error('Error extracting Claude conversation:', error);
        }
      }

      // Get messages for each conversation
      for (const conv of conversations) {
        try {
          await page.goto(conv.url);
          await page.waitForTimeout(2000);

          const messages = [];
          const messageElements = await page.$$('[data-is-streaming], .message');

          for (let i = 0; i < messageElements.length; i++) {
            const messageEl = messageElements[i];
            const content = await messageEl.evaluate(el => el.textContent?.trim());
            const isUser = await messageEl.evaluate(el => 
              el.classList.contains('user') || 
              el.getAttribute('data-role') === 'user'
            );
            
            if (content) {
              messages.push({
                role: isUser ? 'user' : 'assistant',
                content,
                order: i
              });
            }
          }

          conv.messages = messages;
        } catch (error) {
          console.error(`Error scraping Claude conversation ${conv.id}:`, error);
          conv.messages = [];
        }
      }

    } catch (error) {
      console.error('Error scraping Claude:', error);
    }

    await page.close();
    return conversations;
  }

  async scrapeAll() {
    const results = {};
    
    try {
      results.chatgpt = await this.scrapeChatGPT();
      console.log(`Scraped ${results.chatgpt.length} ChatGPT conversations`);
    } catch (error) {
      console.error('Error scraping ChatGPT:', error);
      results.chatgpt = [];
    }

    try {
      results.grok = await this.scrapeGrok();
      console.log(`Scraped ${results.grok.length} Grok conversations`);
    } catch (error) {
      console.error('Error scraping Grok:', error);
      results.grok = [];
    }

    try {
      results.gemini = await this.scrapeGemini();
      console.log(`Scraped ${results.gemini.length} Gemini conversations`);
    } catch (error) {
      console.error('Error scraping Gemini:', error);
      results.gemini = [];
    }

    try {
      results.claude = await this.scrapeClaude();
      console.log(`Scraped ${results.claude.length} Claude conversations`);
    } catch (error) {
      console.error('Error scraping Claude:', error);
      results.claude = [];
    }

    return results;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = ConversationScraper;
