/**
 * RuVector Integration Test
 *
 * Quick test to verify all integrations are working correctly
 */

const { EmbeddingUtils, RuVectorFactory, Logger } = require('./shared/ruvector-utils');

async function testEmbeddingUtils() {
  console.log('\n🧪 Testing EmbeddingUtils...');

  const text = "Hello, this is a test";
  const embedding = EmbeddingUtils.textToEmbedding(text, 384);

  console.log(`✅ Generated ${embedding.length}-dimension embedding`);
  console.log(`✅ First 5 values: ${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}`);

  // Test cosine similarity
  const embedding2 = EmbeddingUtils.textToEmbedding(text, 384);
  const similarity = EmbeddingUtils.cosineSimilarity(embedding, embedding2);
  console.log(`✅ Cosine similarity (should be ~1.0): ${similarity.toFixed(4)}`);

  return true;
}

async function testRuVectorFactory() {
  console.log('\n🧪 Testing RuVectorFactory...');

  try {
    const { vectorDB, gnn, dimension } = await RuVectorFactory.createInMemory(384);
    console.log(`✅ Created in-memory ruvector instance (dimension: ${dimension})`);

    // Test insert
    await vectorDB.insert({
      collection: 'test',
      vectors: [{
        id: 'test-001',
        vector: Array(384).fill(0).map(() => Math.random()),
        metadata: { name: 'Test Document' }
      }]
    });
    console.log('✅ Inserted test vector');

    // Test search
    const results = await vectorDB.search({
      collection: 'test',
      vector: Array(384).fill(0).map(() => Math.random()),
      limit: 5
    });
    console.log(`✅ Search completed, found ${results.length} results`);

    await vectorDB.close();
    console.log('✅ Closed connection');

    return true;
  } catch (error) {
    console.error('❌ RuVectorFactory test failed:', error.message);
    return false;
  }
}

async function testPerformanceMonitoring() {
  console.log('\n🧪 Testing Performance Monitoring...');

  const { PerformanceMonitor } = require('./shared/ruvector-utils');

  // Measure some operations
  await PerformanceMonitor.measure('test-op-1', async () => {
    return new Promise(resolve => setTimeout(resolve, 10));
  });

  await PerformanceMonitor.measure('test-op-2', async () => {
    return new Promise(resolve => setTimeout(resolve, 20));
  });

  const stats1 = PerformanceMonitor.getStats('test-op-1');
  const stats2 = PerformanceMonitor.getStats('test-op-2');

  console.log(`✅ Operation 1 stats:`, stats1);
  console.log(`✅ Operation 2 stats:`, stats2);

  const allStats = PerformanceMonitor.getAllStats();
  console.log(`✅ All stats:`, Object.keys(allStats));

  PerformanceMonitor.clear();
  console.log('✅ Cleared metrics');

  return true;
}

async function testValidation() {
  console.log('\n🧪 Testing Validation Utils...');

  const { ValidationUtils } = require('./shared/ruvector-utils');

  // Valid embedding
  const validEmbedding = Array(384).fill(0).map(() => Math.random());
  const isValid = ValidationUtils.validateEmbedding(validEmbedding, 384);
  console.log(`✅ Valid embedding passed: ${isValid}`);

  // Invalid embedding
  try {
    ValidationUtils.validateEmbedding([], 384);
    console.log('❌ Should have thrown error for empty embedding');
    return false;
  } catch (error) {
    console.log(`✅ Correctly rejected empty embedding: ${error.message}`);
  }

  // Invalid search options
  try {
    ValidationUtils.validateSearchOptions({ limit: -1 });
    console.log('❌ Should have thrown error for invalid limit');
    return false;
  } catch (error) {
    console.log(`✅ Correctly rejected invalid options: ${error.message}`);
  }

  return true;
}

async function runAllTests() {
  console.log('🚀 Starting RuVector Integration Tests...\n');
  console.log('=' .repeat(60));

  const results = {
    embeddingUtils: false,
    ruvectorFactory: false,
    performanceMonitoring: false,
    validation: false
  };

  try {
    results.embeddingUtils = await testEmbeddingUtils();
    results.ruvectorFactory = await testRuVectorFactory();
    results.performanceMonitoring = await testPerformanceMonitoring();
    results.validation = await testValidation();
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results:\n');

  const allPassed = Object.values(results).every(r => r === true);

  for (const [test, passed] of Object.entries(results)) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const spacing = ' '.repeat(30 - test.length);
    console.log(`${test}${spacing}${status}`);
  }

  console.log('\n' + '='.repeat(60));

  if (allPassed) {
    console.log('\n🎉 All tests passed! RuVector is ready to use.\n');
    console.log('Next steps:');
    console.log('1. Install dependencies in each project');
    console.log('2. Run project-specific examples');
    console.log('3. Integrate into your codebase');
    console.log('4. Check out RUVECTOR_INTEGRATION_GUIDE.md for details\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.\n');
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runAllTests()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { runAllTests };
