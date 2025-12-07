const { BrowserHandler } = require('./browser.js');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function test() {
    const handler = new BrowserHandler();
    console.log('Initializing browser...');
    await handler.init();

    console.log('WAITING_FOR_LOGIN'); // Signal for the agent

    await new Promise(resolve => {
        rl.question('Press Enter after logging in...', () => {
            resolve();
        });
    });

    console.log('Testing generation...');
    try {
        const result = await handler.generateContent('Hello, this is a test from Puppeteer. What is 2+2?', 'gemini-1.5-flash');
        console.log('Generation Result:', result);
    } catch (error) {
        console.error('Generation Failed:', error);
    }

    await handler.close();
    rl.close();
}

test();
