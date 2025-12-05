#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Generate a markdown summary of test results for PR comments
 */
function generateTestSummary() {
  const results = {
    tests: null,
    coverage: null,
    benchmarks: null,
    timestamp: new Date().toISOString()
  };

  // Read test results
  const testResultPath = resolve(process.cwd(), 'test-results/results.json');
  if (existsSync(testResultPath)) {
    try {
      const testData = JSON.parse(readFileSync(testResultPath, 'utf-8'));
      const totalTests = testData.numTotalTests || 0;
      const passedTests = testData.numPassedTests || 0;
      const failedTests = testData.numFailedTests || 0;
      const skippedTests = testData.numSkippedTests || 0;
      const duration = testData.duration || 0;

      results.tests = {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        skipped: skippedTests,
        duration: duration,
        success: failedTests === 0
      };
    } catch (error) {
      console.error('Error reading test results:', error);
    }
  }

  // Read coverage results
  const coveragePath = resolve(process.cwd(), 'coverage/coverage-summary.json');
  if (existsSync(coveragePath)) {
    try {
      const coverageData = JSON.parse(readFileSync(coveragePath, 'utf-8'));
      const total = coverageData.total;
      
      results.coverage = {
        lines: total.lines.pct,
        statements: total.statements.pct,
        functions: total.functions.pct,
        branches: total.branches.pct
      };
    } catch (error) {
      console.error('Error reading coverage results:', error);
    }
  }

  // Read benchmark results
  const benchmarkPath = resolve(process.cwd(), 'benchmark-results.json');
  if (existsSync(benchmarkPath)) {
    try {
      const benchmarkData = JSON.parse(readFileSync(benchmarkPath, 'utf-8'));
      const benchmarks = [];
      
      for (const file of benchmarkData.files || []) {
        for (const group of file.groups || []) {
          for (const benchmark of group.benchmarks || []) {
            benchmarks.push({
              name: `${group.name} - ${benchmark.name}`,
              mean: benchmark.result.mean,
              ops: benchmark.result.hz
            });
          }
        }
      }
      
      results.benchmarks = benchmarks;
    } catch (error) {
      console.error('Error reading benchmark results:', error);
    }
  }

  // Generate markdown summary
  let summary = '## Test Results Summary\n\n';
  
  // Test results
  if (results.tests) {
    const { total, passed, failed, skipped, duration, success } = results.tests;
    const emoji = success ? '✅' : '❌';
    const status = success ? 'PASSED' : 'FAILED';
    
    summary += `### ${emoji} Tests ${status}\n\n`;
    summary += `| Metric | Value |\n`;
    summary += `|--------|-------|\n`;
    summary += `| Total Tests | ${total} |\n`;
    summary += `| Passed | ${passed} |\n`;
    summary += `| Failed | ${failed} |\n`;
    summary += `| Skipped | ${skipped} |\n`;
    summary += `| Duration | ${(duration / 1000).toFixed(2)}s |\n\n`;
  }

  // Coverage results
  if (results.coverage) {
    const { lines, statements, functions, branches } = results.coverage;
    const avgCoverage = (lines + statements + functions + branches) / 4;
    const emoji = avgCoverage >= 80 ? '✅' : avgCoverage >= 60 ? '⚠️' : '❌';
    
    summary += `### ${emoji} Coverage Report\n\n`;
    summary += `| Type | Coverage |\n`;
    summary += `|------|----------|\n`;
    summary += `| Lines | ${lines.toFixed(2)}% |\n`;
    summary += `| Statements | ${statements.toFixed(2)}% |\n`;
    summary += `| Functions | ${functions.toFixed(2)}% |\n`;
    summary += `| Branches | ${branches.toFixed(2)}% |\n`;
    summary += `| **Average** | **${avgCoverage.toFixed(2)}%** |\n\n`;
  }

  // Benchmark results
  if (results.benchmarks && results.benchmarks.length > 0) {
    summary += `### ⚡ Benchmark Results\n\n`;
    summary += `| Benchmark | Ops/sec | Mean (ms) |\n`;
    summary += `|-----------|---------|------------|\n`;
    
    for (const bench of results.benchmarks.slice(0, 10)) { // Show top 10
      const opsFormatted = bench.ops.toLocaleString('en-US', { maximumFractionDigits: 0 });
      const meanFormatted = (bench.mean * 1000).toFixed(3);
      summary += `| ${bench.name} | ${opsFormatted} | ${meanFormatted} |\n`;
    }
    
    if (results.benchmarks.length > 10) {
      summary += `\n*...and ${results.benchmarks.length - 10} more benchmarks*\n`;
    }
    summary += '\n';
  }

  // Links to artifacts
  const runId = process.env.GITHUB_RUN_ID;
  const runNumber = process.env.GITHUB_RUN_NUMBER;
  const sha = process.env.GITHUB_SHA;
  
  if (runId) {
    summary += `### 📊 Artifacts\n\n`;
    summary += `- 📄 [Test Results](https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${runId})\n`;
    summary += `- 📊 [Coverage Report](https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${runId})\n`;
    summary += `- ⚡ [Benchmark Results](https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${runId})\n\n`;
  }

  // Metadata
  summary += `---\n`;
  summary += `*Generated at ${new Date().toUTCString()}*\n`;
  if (sha) {
    summary += `*Commit: ${sha.substring(0, 7)}*\n`;
  }
  if (runNumber) {
    summary += `*Run: #${runNumber}*\n`;
  }

  return summary;
}

// Generate and output summary
const summary = generateTestSummary();
console.log(summary);

// Also write to file for artifact
import { writeFileSync } from 'fs';
writeFileSync('test-summary.md', summary);