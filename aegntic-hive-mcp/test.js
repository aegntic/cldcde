#!/usr/bin/env node

const Database = require('./database.js');
const ConversationScraper = require('./scrapers.js');

async function testDatabase() {
  console.log('Testing database...');
  const db = new Database();
  
  // Test saving a project
  const projectId = await db.saveProject(
    'Test Project',
    'A test project',
    'Test instructions'
  );
  
  // Test saving a conversation
  const convId = await db.saveConversation(
    'test',
    projectId,
    'test-123',
    'Test Conversation',
    new Date().toISOString(),
    new Date().toISOString(),
    'https://example.com/test'
  );
  
  console.log('Saved conversation with ID:', convId);
  
  // Test getting conversations
  const conversations = await db.getConversations();
  console.log('Retrieved conversations:', conversations.length);
  
  // Test searching
  const results = await db.searchConversations('test');
  console.log('Search results:', results.length);
  
  db.close();
  console.log('Database test completed ✓');
}

async function testScraper() {
  console.log('Testing scraper initialization...');
  const scraper = new ConversationScraper();
  
  // Test session loading
  scraper.loadSessions();
  console.log('Session loading test completed ✓');
  
  // Don't actually scrape in test mode
  console.log('Scraper test completed ✓');
}

async function runTests() {
  try {
    await testDatabase();
    await testScraper();
    console.log('\nAll tests passed! ✅');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

runTests();
