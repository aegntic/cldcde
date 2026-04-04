/**
 * RuVector Integration Example for Obsidian Elite RAG
 *
 * This example shows how to use ruvector for high-performance
 * semantic search in your Obsidian vault.
 */

const RuVectorAdapter = require('./ruvector-adapter');

async function example() {
  // Initialize ruvector adapter
  const vectorDB = new RuVectorAdapter({
    dimension: 1536, // OpenAI embeddings
    collectionName: 'obsidian_knowledge'
  });

  await vectorDB.initialize();

  // Example 1: Insert documents with embeddings
  console.log('\n📥 Inserting documents...');
  await vectorDB.insert([
    {
      id: 'note-001',
      vector: new Array(1536).fill(0).map(() => Math.random()), // Replace with actual embedding
      metadata: {
        title: 'Machine Learning Basics',
        path: '02-Research/ml-basics.md',
        tags: ['ml', 'ai', 'beginner'],
        created: '2025-01-15'
      }
    },
    {
      id: 'note-002',
      vector: new Array(1536).fill(0).map(() => Math.random()),
      metadata: {
        title: 'Advanced Neural Networks',
        path: '02-Research/neural-networks.md',
        tags: ['ml', 'deep-learning', 'advanced'],
        created: '2025-01-16'
      }
    }
  ]);

  // Example 2: Semantic search
  console.log('\n🔍 Semantic search...');
  const queryVector = new Array(1536).fill(0).map(() => Math.random());
  const results = await vectorDB.search(queryVector, {
    limit: 5,
    scoreThreshold: 0.7,
    filters: {
      tags: { $in: ['ml', 'ai'] }
    }
  });

  console.log('Search results:', results);

  // Example 3: Hybrid search with graph (GNN)
  console.log('\n🧠 Hybrid search with knowledge graph...');
  const hybridResults = await vectorDB.searchWithGraph(queryVector, {
    limit: 5,
    graphDepth: 2,
    scoreThreshold: 0.6
  });

  console.log('Hybrid search results:', hybridResults);

  // Example 4: Get database statistics
  console.log('\n📊 Database statistics...');
  const stats = await vectorDB.getStats();
  console.log('Stats:', stats);

  // Example 5: Update metadata
  console.log('\n✏️  Updating metadata...');
  await vectorDB.update('note-001', {
    lastReviewed: '2025-01-20',
    rating: 5
  });

  // Example 6: Delete old documents
  console.log('\n🗑️  Cleaning up...');
  await vectorDB.delete(['old-note-001', 'old-note-002']);

  // Close connection
  await vectorDB.close();
  console.log('\n✅ Example completed!');
}

// Integration with existing RAG pipeline
async function integrateWithRAG(vaultPath) {
  const vectorDB = new RuVectorAdapter();

  // Initialize
  await vectorDB.initialize();

  // Load OpenAI embeddings (or use your preferred embedding model)
  const OpenAI = require('openai');
  const openai = new OpenAI();

  // Index vault content
  console.log('📚 Indexing vault...');
  const fs = require('fs');
  const path = require('path');

  function walkDirectory(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...walkDirectory(fullPath));
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const markdownFiles = walkDirectory(vaultPath);
  console.log(`Found ${markdownFiles.length} markdown files`);

  // Process files in batches for better performance
  const batchSize = 100;
  for (let i = 0; i < markdownFiles.length; i += batchSize) {
    const batch = markdownFiles.slice(i, i + batchSize);
    const vectors = [];

    for (const file of batch) {
      const content = fs.readFileSync(file, 'utf-8');
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: content.slice(0, 8191) // Limit to token max
      });

      vectors.push({
        id: file.replace(vaultPath, ''),
        vector: embedding.data[0].embedding,
        metadata: {
          path: file,
          title: path.basename(file, '.md'),
          size: content.length,
          indexed: new Date().toISOString()
        }
      });
    }

    await vectorDB.insert(vectors);
    console.log(`Indexed ${Math.min(i + batchSize, markdownFiles.length)}/${markdownFiles.length}`);
  }

  console.log('✅ Vault indexing complete!');

  // Query example
  const query = "How do machine learning models work?";
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  });

  const results = await vectorDB.searchWithGraph(queryEmbedding.data[0].embedding, {
    limit: 5,
    graphDepth: 2
  });

  console.log('\n🔍 Query results:', query);
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.metadata.title} (${r.score.toFixed(3)})`);
  });

  await vectorDB.close();
}

// Run examples
if (require.main === module) {
  example()
    .then(() => console.log('\n✅ Success!'))
    .catch(err => console.error('❌ Error:', err));
}

module.exports = { example, integrateWithRAG };
