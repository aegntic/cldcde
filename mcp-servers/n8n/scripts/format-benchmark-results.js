#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Formats Vitest benchmark results for github-action-benchmark
 * Converts from Vitest format to the expected format
 */
function formatBenchmarkResults() {
  const resultsPath = path.join(process.cwd(), 'benchmark-results.json');
  
  if (!fs.existsSync(resultsPath)) {
    console.error('benchmark-results.json not found');
    process.exit(1);
  }

  const vitestResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  
  // Convert to github-action-benchmark format
  const formattedResults = [];

  // Vitest benchmark JSON reporter format
  if (vitestResults.files) {
    for (const file of vitestResults.files) {
      const suiteName = path.basename(file.filepath, '.bench.ts');
      
      // Process each suite in the file
      if (file.groups) {
        for (const group of file.groups) {
          for (const benchmark of group.benchmarks || []) {
            if (benchmark.result) {
              formattedResults.push({
                name: `${suiteName} - ${benchmark.name}`,
                unit: 'ms',
                value: benchmark.result.mean || 0,
                range: (benchmark.result.max - benchmark.result.min) || 0,
                extra: `${benchmark.result.hz?.toFixed(0) || 0} ops/sec`
              });
            }
          }
        }
      }
    }
  } else if (Array.isArray(vitestResults)) {
    // Alternative format handling
    for (const result of vitestResults) {
      if (result.name && result.result) {
        formattedResults.push({
          name: result.name,
          unit: 'ms',
          value: result.result.mean || 0,
          range: (result.result.max - result.result.min) || 0,
          extra: `${result.result.hz?.toFixed(0) || 0} ops/sec`
        });
      }
    }
  }

  // Write formatted results
  const outputPath = path.join(process.cwd(), 'benchmark-results-formatted.json');
  fs.writeFileSync(outputPath, JSON.stringify(formattedResults, null, 2));
  
  // Also create a summary for PR comments
  const summary = {
    timestamp: new Date().toISOString(),
    benchmarks: formattedResults.map(b => ({
      name: b.name,
      time: `${b.value.toFixed(3)}ms`,
      opsPerSec: b.extra,
      range: `±${(b.range / 2).toFixed(3)}ms`
    }))
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'benchmark-summary.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log(`Formatted ${formattedResults.length} benchmark results`);
}

// Run if called directly
if (require.main === module) {
  formatBenchmarkResults();
}