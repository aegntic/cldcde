#!/usr/bin/env node
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Compare benchmark results between runs
 */
class BenchmarkComparator {
  constructor() {
    this.threshold = 0.1; // 10% threshold for significant changes
  }

  loadBenchmarkResults(path) {
    if (!existsSync(path)) {
      return null;
    }
    
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch (error) {
      console.error(`Error loading benchmark results from ${path}:`, error);
      return null;
    }
  }

  compareBenchmarks(current, baseline) {
    const comparison = {
      timestamp: new Date().toISOString(),
      summary: {
        improved: 0,
        regressed: 0,
        unchanged: 0,
        added: 0,
        removed: 0
      },
      benchmarks: []
    };

    // Create maps for easy lookup
    const currentMap = new Map();
    const baselineMap = new Map();

    // Process current benchmarks
    if (current && current.files) {
      for (const file of current.files) {
        for (const group of file.groups || []) {
          for (const bench of group.benchmarks || []) {
            const key = `${group.name}::${bench.name}`;
            currentMap.set(key, {
              ops: bench.result.hz,
              mean: bench.result.mean,
              file: file.filepath
            });
          }
        }
      }
    }

    // Process baseline benchmarks
    if (baseline && baseline.files) {
      for (const file of baseline.files) {
        for (const group of file.groups || []) {
          for (const bench of group.benchmarks || []) {
            const key = `${group.name}::${bench.name}`;
            baselineMap.set(key, {
              ops: bench.result.hz,
              mean: bench.result.mean,
              file: file.filepath
            });
          }
        }
      }
    }

    // Compare benchmarks
    for (const [key, current] of currentMap) {
      const baseline = baselineMap.get(key);
      
      if (!baseline) {
        // New benchmark
        comparison.summary.added++;
        comparison.benchmarks.push({
          name: key,
          status: 'added',
          current: current.ops,
          baseline: null,
          change: null,
          file: current.file
        });
      } else {
        // Compare performance
        const change = ((current.ops - baseline.ops) / baseline.ops) * 100;
        let status = 'unchanged';
        
        if (Math.abs(change) >= this.threshold * 100) {
          if (change > 0) {
            status = 'improved';
            comparison.summary.improved++;
          } else {
            status = 'regressed';
            comparison.summary.regressed++;
          }
        } else {
          comparison.summary.unchanged++;
        }
        
        comparison.benchmarks.push({
          name: key,
          status,
          current: current.ops,
          baseline: baseline.ops,
          change,
          meanCurrent: current.mean,
          meanBaseline: baseline.mean,
          file: current.file
        });
      }
    }

    // Check for removed benchmarks
    for (const [key, baseline] of baselineMap) {
      if (!currentMap.has(key)) {
        comparison.summary.removed++;
        comparison.benchmarks.push({
          name: key,
          status: 'removed',
          current: null,
          baseline: baseline.ops,
          change: null,
          file: baseline.file
        });
      }
    }

    // Sort by change percentage (regressions first)
    comparison.benchmarks.sort((a, b) => {
      if (a.status === 'regressed' && b.status !== 'regressed') return -1;
      if (b.status === 'regressed' && a.status !== 'regressed') return 1;
      if (a.change !== null && b.change !== null) {
        return a.change - b.change;
      }
      return 0;
    });

    return comparison;
  }

  generateMarkdownReport(comparison) {
    let report = '## Benchmark Comparison Report\n\n';
    
    const { summary } = comparison;
    report += '### Summary\n\n';
    report += `- **Improved**: ${summary.improved} benchmarks\n`;
    report += `- **Regressed**: ${summary.regressed} benchmarks\n`;
    report += `- **Unchanged**: ${summary.unchanged} benchmarks\n`;
    report += `- **Added**: ${summary.added} benchmarks\n`;
    report += `- **Removed**: ${summary.removed} benchmarks\n\n`;

    // Regressions
    const regressions = comparison.benchmarks.filter(b => b.status === 'regressed');
    if (regressions.length > 0) {
      report += '### ⚠️ Performance Regressions\n\n';
      report += '| Benchmark | Current | Baseline | Change |\n';
      report += '|-----------|---------|----------|--------|\n';
      
      for (const bench of regressions) {
        const currentOps = bench.current.toLocaleString('en-US', { maximumFractionDigits: 0 });
        const baselineOps = bench.baseline.toLocaleString('en-US', { maximumFractionDigits: 0 });
        const changeStr = bench.change.toFixed(2);
        report += `| ${bench.name} | ${currentOps} ops/s | ${baselineOps} ops/s | **${changeStr}%** |\n`;
      }
      report += '\n';
    }

    // Improvements
    const improvements = comparison.benchmarks.filter(b => b.status === 'improved');
    if (improvements.length > 0) {
      report += '### ✅ Performance Improvements\n\n';
      report += '| Benchmark | Current | Baseline | Change |\n';
      report += '|-----------|---------|----------|--------|\n';
      
      for (const bench of improvements) {
        const currentOps = bench.current.toLocaleString('en-US', { maximumFractionDigits: 0 });
        const baselineOps = bench.baseline.toLocaleString('en-US', { maximumFractionDigits: 0 });
        const changeStr = bench.change.toFixed(2);
        report += `| ${bench.name} | ${currentOps} ops/s | ${baselineOps} ops/s | **+${changeStr}%** |\n`;
      }
      report += '\n';
    }

    // New benchmarks
    const added = comparison.benchmarks.filter(b => b.status === 'added');
    if (added.length > 0) {
      report += '### 🆕 New Benchmarks\n\n';
      report += '| Benchmark | Performance |\n';
      report += '|-----------|-------------|\n';
      
      for (const bench of added) {
        const ops = bench.current.toLocaleString('en-US', { maximumFractionDigits: 0 });
        report += `| ${bench.name} | ${ops} ops/s |\n`;
      }
      report += '\n';
    }

    return report;
  }

  generateJsonReport(comparison) {
    return JSON.stringify(comparison, null, 2);
  }

  async compare(currentPath, baselinePath) {
    // Load results
    const current = this.loadBenchmarkResults(currentPath);
    const baseline = this.loadBenchmarkResults(baselinePath);

    if (!current && !baseline) {
      console.error('No benchmark results found');
      return;
    }

    // Generate comparison
    const comparison = this.compareBenchmarks(current, baseline);

    // Generate reports
    const markdownReport = this.generateMarkdownReport(comparison);
    const jsonReport = this.generateJsonReport(comparison);

    // Write reports
    writeFileSync('benchmark-comparison.md', markdownReport);
    writeFileSync('benchmark-comparison.json', jsonReport);

    // Output summary to console
    console.log(markdownReport);

    // Return exit code based on regressions
    if (comparison.summary.regressed > 0) {
      console.error(`\n❌ Found ${comparison.summary.regressed} performance regressions`);
      process.exit(1);
    } else {
      console.log(`\n✅ No performance regressions found`);
      process.exit(0);
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node compare-benchmarks.js <current-results> [baseline-results]');
  console.error('If baseline-results is not provided, it will look for benchmark-baseline.json');
  process.exit(1);
}

const currentPath = args[0];
const baselinePath = args[1] || 'benchmark-baseline.json';

// Run comparison
const comparator = new BenchmarkComparator();
comparator.compare(currentPath, baselinePath).catch(console.error);