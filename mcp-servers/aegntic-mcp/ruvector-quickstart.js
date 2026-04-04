/**
 * RuVector Quickstart Guide
 *
 * Simplified examples using the actual ruvector API
 */

const { VectorDB } = require('ruvector');
const { RuvectorLayer } = require('@ruvector/gnn');

// Example 1: Basic Vector Database
async function example1_BasicVectorDB() {
  console.log('\n📦 Example 1: Basic Vector Database\n');

  // Create a vector database with 384 dimensions
  const db = new VectorDB({ dimensions: 384 });

  // Insert vectors
  const id1 = await db.insert({
    id: 'doc-001',
    vector: new Float32Array(384).fill(0).map((_, i) => Math.sin(i * 0.1))
  });
  console.log('✅ Inserted doc-001:', id1);

  const id2 = await db.insert({
    id: 'doc-002',
    vector: new Float32Array(384).fill(0).map((_, i) => Math.cos(i * 0.1))
  });
  console.log('✅ Inserted doc-002:', id2);

  // Search for similar vectors
  const query = new Float32Array(384).fill(0).map((_, i) => Math.sin(i * 0.1));
  const results = await db.search({
    vector: query,
    k: 5
  });

  console.log('\n🔍 Search results:');
  results.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.id} (score: ${r.score.toFixed(4)})`);
  });

  // Get database size
  const count = await db.len();
  console.log(`\n📊 Total vectors: ${count}`);

  return db;
}

// Example 2: Batch Insert
async function example2_BatchInsert() {
  console.log('\n📦 Example 2: Batch Insert\n');

  const db = new VectorDB({ dimensions: 384 });

  // Prepare multiple vectors
  const vectors = [];
  for (let i = 0; i < 100; i++) {
    vectors.push({
      id: `doc-${i.toString().padStart(3, '0')}`,
      vector: new Float32Array(384).fill(0).map((_, j) => Math.sin((i + j) * 0.1))
    });
  }

  // Batch insert (much faster!)
  const start = Date.now();
  const ids = await db.insertBatch(vectors);
  const duration = Date.now() - start;

  console.log(`✅ Inserted ${ids.length} vectors in ${duration}ms`);
  console.log(`   Performance: ${(ids.length / (duration / 1000)).toFixed(0)} vectors/sec`);

  return db;
}

// Example 3: Obsidian RAG Integration
async function example3_ObsidianRAG() {
  console.log('\n📝 Example 3: Obsidian RAG Integration\n');

  const db = new VectorDB({ dimensions: 1536 }); // OpenAI dimension

  // Simulated embeddings (replace with actual OpenAI embeddings)
  const notes = [
    { id: 'ml-basics', title: 'Machine Learning Basics', content: 'Introduction to ML...' },
    { id: 'neural-nets', title: 'Neural Networks', content: 'Deep learning with NNs...' },
    { id: 'transformers', title: 'Transformers Architecture', content: 'Attention mechanisms...' }
  ];

  // Create embeddings (using simple hash-based approach for demo)
  const embeddings = notes.map(note => ({
    id: note.id,
    vector: new Float32Array(1536).fill(0).map((_, i) => {
      const hash = note.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      return Math.sin(hash * (i + 1) * 0.001);
    })
  }));

  // Insert all notes
  await db.insertBatch(embeddings);
  console.log(`✅ Indexed ${notes.length} notes`);

  // Search for similar content
  const queryEmbedding = embeddings[0].vector; // Search for notes similar to first one
  const results = await db.search({
    vector: queryEmbedding,
    k: 3
  });

  console.log('\n🔍 Related notes:');
  results.forEach((r, i) => {
    const note = notes.find(n => n.id === r.id);
    console.log(`  ${i + 1}. ${note.title} (${r.score.toFixed(4)})`);
  });

  return db;
}

// Example 4: GNN Layer for Graph Operations
async function example4_GNNLayer() {
  console.log('\n🧠 Example 4: GNN Layer\n');

  // Create a GNN layer
  const layer = new RuvectorLayer(
    128, // input_dim
    256, // hidden_dim
    4,   // heads (attention)
    0.1  // dropout
  );
  console.log('✅ Created GNN layer');

  // Node embeddings
  const nodeEmbedding = new Float32Array(128).fill(0).map(() => Math.random());
  const neighborEmbeddings = [
    new Float32Array(128).fill(0).map(() => Math.random()),
    new Float32Array(128).fill(0).map(() => Math.random())
  ];
  const edgeWeights = [0.7, 0.3];

  // Forward pass through GNN
  const output = layer.forward(
    Array.from(nodeEmbedding),
    neighborEmbeddings.map(e => Array.from(e)),
    edgeWeights
  );

  console.log(`✅ GNN forward pass complete`);
  console.log(`   Input dimension: 128`);
  console.log(`   Output dimension: ${output.length}`);
  console.log(`   First 5 values: ${output.slice(0, 5).map(v => v.toFixed(4)).join(', ')}`);

  // Save layer for later use
  const json = layer.toJson();
  console.log(`\n💾 Layer serialized (${json.length} bytes)`);

  return layer;
}

// Example 5: Differentiable Search
async function example5_DifferentiableSearch() {
  console.log('\n🎯 Example 5: Differentiable Search (Soft Attention)\n');

  const { differentiableSearch } = require('@ruvector/gnn');

  const query = [1.0, 0.0, 0.0];
  const candidates = [
    [1.0, 0.0, 0.0], // exact match
    [0.9, 0.1, 0.0], // close match
    [0.0, 1.0, 0.0], // different
    [0.5, 0.5, 0.0]  // somewhat similar
  ];

  const result = differentiableSearch(query, candidates, 3, 1.0);

  console.log('🔍 Soft attention search results:');
  console.log(`   Indices: ${result.indices}`);
  console.log(`   Weights: ${result.weights.map(w => w.toFixed(4))}`);
  console.log('\n   Interpretation:');
  result.indices.forEach((idx, i) => {
    const weight = result.weights[i];
    console.log(`     Candidate ${idx}: ${weight.toFixed(4)} weight`);
  });
}

// Example 6: Performance Benchmark
async function example6_PerformanceBenchmark() {
  console.log('\n⚡ Example 6: Performance Benchmark\n');

  const db = new VectorDB({ dimensions: 384 });

  // Benchmark: Insert 10,000 vectors
  const insertCount = 10000;
  const vectors = [];
  for (let i = 0; i < insertCount; i++) {
    vectors.push({
      id: `vec-${i}`,
      vector: new Float32Array(384).fill(0).map(() => Math.random())
    });
  }

  console.log(`📊 Inserting ${insertCount.toLocaleString()} vectors...`);
  const insertStart = Date.now();
  await db.insertBatch(vectors);
  const insertDuration = Date.now() - insertStart;
  const insertRate = (insertCount / (insertDuration / 1000)).toFixed(0);

  console.log(`✅ Insert complete!`);
  console.log(`   Time: ${insertDuration}ms`);
  console.log(`   Rate: ${insertRate} vectors/sec`);

  // Benchmark: Search 1,000 queries
  const searchCount = 1000;
  console.log(`\n🔍 Running ${searchCount.toLocaleString()} searches...`);

  const query = new Float32Array(384).fill(0).map(() => Math.random());
  const searchStart = Date.now();

  for (let i = 0; i < searchCount; i++) {
    await db.search({
      vector: query,
      k: 10
    });
  }

  const searchDuration = Date.now() - searchStart;
  const searchRate = (searchCount / (searchDuration / 1000)).toFixed(0);
  const avgLatency = (searchDuration / searchCount).toFixed(2);

  console.log(`✅ Search complete!`);
  console.log(`   Time: ${searchDuration}ms`);
  console.log(`   Rate: ${searchRate} searches/sec`);
  console.log(`   Avg latency: ${avgLatency}ms`);

  return {
    insertRate: `${insertRate} vec/sec`,
    searchRate: `${searchRate} searches/sec`,
    avgLatency: `${avgLatency}ms`
  };
}

// Run all examples
async function runAllExamples() {
  console.log('🚀 RuVector Quickstart Examples');
  console.log('='.repeat(60));

  try {
    await example1_BasicVectorDB();
    await example2_BatchInsert();
    await example3_ObsidianRAG();
    await example4_GNNLayer();
    await example5_DifferentiableSearch();
    const perf = await example6_PerformanceBenchmark();

    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 All examples completed successfully!\n');
    console.log('📊 Performance Summary:');
    console.log(`   Insert Rate: ${perf.insertRate}`);
    console.log(`   Search Rate: ${perf.searchRate}`);
    console.log(`   Avg Latency: ${perf.avgLatency}`);
    console.log('\n✅ RuVector is ready to use in your projects!\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

// Run if called directly
if (require.main === module) {
  runAllExamples();
}

module.exports = {
  example1_BasicVectorDB,
  example2_BatchInsert,
  example3_ObsidianRAG,
  example4_GNNLayer,
  example5_DifferentiableSearch,
  example6_PerformanceBenchmark,
  runAllExamples
};
