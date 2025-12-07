const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const os = require('os');

puppeteer.use(StealthPlugin());

class BrowserHandler {
    constructor() {
        this.browser = null;
        this.page = null;
        // Persistent user data directory for login persistence
        this.userDataDir = path.join(os.homedir(), '.google-ai-studio-mcp-profile');
    }

    async init() {
        if (this.browser) return;

        // Ensure user data dir exists
        if (!fs.existsSync(this.userDataDir)) {
            fs.mkdirSync(this.userDataDir, { recursive: true });
        }

        console.error('Launching browser with stealth mode...');
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            userDataDir: this.userDataDir,
            args: [
                '--start-maximized',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled'
            ],
            ignoreDefaultArgs: ['--enable-automation']
        });

        const pages = await this.browser.pages();
        this.page = pages[0];

        // Remove webdriver flag
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        });

        console.error('Navigating to Google AI Studio prompt page...');
        await this.page.goto('https://aistudio.google.com/prompts/new_chat', { waitUntil: 'networkidle2' });

        console.error('Browser ready. Please log in if needed.');
    }

    async generateContent(prompt, model) {
        if (!this.browser) await this.init();

        try {
            console.error('Waiting for prompt area...');
            const promptSelector = 'textarea';
            await this.page.waitForSelector(promptSelector, { timeout: 60000 });

            await this.page.click(promptSelector);

            // Clear previous text
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('A');
            await this.page.keyboard.up('Control');
            await this.page.keyboard.press('Backspace');

            console.error('Typing prompt...');
            await this.page.keyboard.type(prompt);

            console.error('Looking for Run button...');
            const runButton = await this.page.evaluateHandle(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.find(b => {
                    const text = b.innerText.toLowerCase();
                    return text.includes('run') || text.includes('generate');
                });
            });

            if (runButton.asElement()) {
                await runButton.click();
            } else {
                console.error('Run button not found, trying Ctrl+Enter');
                await this.page.keyboard.down('Control');
                await this.page.keyboard.press('Enter');
                await this.page.keyboard.up('Control');
            }

            console.error('Waiting for response...');
            await this.page.waitForNetworkIdle({ idleTime: 2000, timeout: 30000 });

            const content = await this.page.evaluate(() => {
                return document.body.innerText;
            });

            return content;

        } catch (error) {
            console.error('Error in generateContent:', error);
            await this.debugDump();
            throw error;
        }
    }

    async debugDump() {
        if (!this.page) return;
        const html = await this.page.content();
        const debugPath = path.join(__dirname, 'debug_dump.html');
        fs.writeFileSync(debugPath, html);
        console.error(`Debug HTML dumped to ${debugPath}`);
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }
}

module.exports = { BrowserHandler };
