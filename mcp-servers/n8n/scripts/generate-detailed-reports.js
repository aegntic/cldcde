#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

/**
 * Generate detailed test reports in multiple formats
 */
class TestReportGenerator {
  constructor() {
    this.results = {
      tests: null,
      coverage: null,
      benchmarks: null,
      metadata: {
        timestamp: new Date().toISOString(),
        repository: process.env.GITHUB_REPOSITORY || 'n8n-mcp',
        sha: process.env.GITHUB_SHA || 'unknown',
        branch: process.env.GITHUB_REF || 'unknown',
        runId: process.env.GITHUB_RUN_ID || 'local',
        runNumber: process.env.GITHUB_RUN_NUMBER || '0',
      }
    };
  }

  loadTestResults() {
    const testResultPath = resolve(process.cwd(), 'test-results/results.json');
    if (existsSync(testResultPath)) {
      try {
        const data = JSON.parse(readFileSync(testResultPath, 'utf-8'));
        this.results.tests = this.processTestResults(data);
      } catch (error) {
        console.error('Error loading test results:', error);
      }
    }
  }

  processTestResults(data) {
    const processedResults = {
      summary: {
        total: data.numTotalTests || 0,
        passed: data.numPassedTests || 0,
        failed: data.numFailedTests || 0,
        skipped: data.numSkippedTests || 0,
        duration: data.duration || 0,
        success: (data.numFailedTests || 0) === 0
      },
      testSuites: [],
      failedTests: []
    };

    // Process test suites
    if (data.testResults) {
      for (const suite of data.testResults) {
        const suiteInfo = {
          name: suite.name,
          duration: suite.duration || 0,
          tests: {
            total: suite.numPassingTests + suite.numFailingTests + suite.numPendingTests,
            passed: suite.numPassingTests || 0,
            failed: suite.numFailingTests || 0,
            skipped: suite.numPendingTests || 0
          },
          status: suite.numFailingTests === 0 ? 'passed' : 'failed'
        };

        processedResults.testSuites.push(suiteInfo);

        // Collect failed tests
        if (suite.testResults) {
          for (const test of suite.testResults) {
            if (test.status === 'failed') {
              processedResults.failedTests.push({
                suite: suite.name,
                test: test.title,
                duration: test.duration || 0,
                error: test.failureMessages ? test.failureMessages.join('\n') : 'Unknown error'
              });
            }
          }
        }
      }
    }

    return processedResults;
  }

  loadCoverageResults() {
    const coveragePath = resolve(process.cwd(), 'coverage/coverage-summary.json');
    if (existsSync(coveragePath)) {
      try {
        const data = JSON.parse(readFileSync(coveragePath, 'utf-8'));
        this.results.coverage = this.processCoverageResults(data);
      } catch (error) {
        console.error('Error loading coverage results:', error);
      }
    }
  }

  processCoverageResults(data) {
    const coverage = {
      summary: {
        lines: data.total.lines.pct,
        statements: data.total.statements.pct,
        functions: data.total.functions.pct,
        branches: data.total.branches.pct,
        average: 0
      },
      files: []
    };

    // Calculate average
    coverage.summary.average = (
      coverage.summary.lines +
      coverage.summary.statements +
      coverage.summary.functions +
      coverage.summary.branches
    ) / 4;

    // Process file coverage
    for (const [filePath, fileData] of Object.entries(data)) {
      if (filePath !== 'total') {
        coverage.files.push({
          path: filePath,
          lines: fileData.lines.pct,
          statements: fileData.statements.pct,
          functions: fileData.functions.pct,
          branches: fileData.branches.pct,
          uncoveredLines: fileData.lines.total - fileData.lines.covered
        });
      }
    }

    // Sort files by coverage (lowest first)
    coverage.files.sort((a, b) => a.lines - b.lines);

    return coverage;
  }

  loadBenchmarkResults() {
    const benchmarkPath = resolve(process.cwd(), 'benchmark-results.json');
    if (existsSync(benchmarkPath)) {
      try {
        const data = JSON.parse(readFileSync(benchmarkPath, 'utf-8'));
        this.results.benchmarks = this.processBenchmarkResults(data);
      } catch (error) {
        console.error('Error loading benchmark results:', error);
      }
    }
  }

  processBenchmarkResults(data) {
    const benchmarks = {
      timestamp: data.timestamp,
      results: []
    };

    for (const file of data.files || []) {
      for (const group of file.groups || []) {
        for (const benchmark of group.benchmarks || []) {
          benchmarks.results.push({
            file: file.filepath,
            group: group.name,
            name: benchmark.name,
            ops: benchmark.result.hz,
            mean: benchmark.result.mean,
            min: benchmark.result.min,
            max: benchmark.result.max,
            p75: benchmark.result.p75,
            p99: benchmark.result.p99,
            samples: benchmark.result.samples
          });
        }
      }
    }

    // Sort by ops/sec (highest first)
    benchmarks.results.sort((a, b) => b.ops - a.ops);

    return benchmarks;
  }

  generateMarkdownReport() {
    let report = '# n8n-mcp Test Report\n\n';
    report += `Generated: ${this.results.metadata.timestamp}\n\n`;
    
    // Metadata
    report += '## Build Information\n\n';
    report += `- **Repository**: ${this.results.metadata.repository}\n`;
    report += `- **Commit**: ${this.results.metadata.sha.substring(0, 7)}\n`;
    report += `- **Branch**: ${this.results.metadata.branch}\n`;
    report += `- **Run**: #${this.results.metadata.runNumber}\n\n`;

    // Test Results
    if (this.results.tests) {
      const { summary, testSuites, failedTests } = this.results.tests;
      const emoji = summary.success ? '✅' : '❌';
      
      report += `## ${emoji} Test Results\n\n`;
      report += `### Summary\n\n`;
      report += `- **Total Tests**: ${summary.total}\n`;
      report += `- **Passed**: ${summary.passed} (${((summary.passed / summary.total) * 100).toFixed(1)}%)\n`;
      report += `- **Failed**: ${summary.failed}\n`;
      report += `- **Skipped**: ${summary.skipped}\n`;
      report += `- **Duration**: ${(summary.duration / 1000).toFixed(2)}s\n\n`;

      // Test Suites
      if (testSuites.length > 0) {
        report += '### Test Suites\n\n';
        report += '| Suite | Status | Tests | Duration |\n';
        report += '|-------|--------|-------|----------|\n';
        
        for (const suite of testSuites) {
          const status = suite.status === 'passed' ? '✅' : '❌';
          const tests = `${suite.tests.passed}/${suite.tests.total}`;
          const duration = `${(suite.duration / 1000).toFixed(2)}s`;
          report += `| ${suite.name} | ${status} | ${tests} | ${duration} |\n`;
        }
        report += '\n';
      }

      // Failed Tests
      if (failedTests.length > 0) {
        report += '### Failed Tests\n\n';
        for (const failed of failedTests) {
          report += `#### ${failed.suite} > ${failed.test}\n\n`;
          report += '```\n';
          report += failed.error;
          report += '\n```\n\n';
        }
      }
    }

    // Coverage Results
    if (this.results.coverage) {
      const { summary, files } = this.results.coverage;
      const emoji = summary.average >= 80 ? '✅' : summary.average >= 60 ? '⚠️' : '❌';
      
      report += `## ${emoji} Coverage Report\n\n`;
      report += '### Summary\n\n';
      report += `- **Lines**: ${summary.lines.toFixed(2)}%\n`;
      report += `- **Statements**: ${summary.statements.toFixed(2)}%\n`;
      report += `- **Functions**: ${summary.functions.toFixed(2)}%\n`;
      report += `- **Branches**: ${summary.branches.toFixed(2)}%\n`;
      report += `- **Average**: ${summary.average.toFixed(2)}%\n\n`;

      // Files with low coverage
      const lowCoverageFiles = files.filter(f => f.lines < 80).slice(0, 10);
      if (lowCoverageFiles.length > 0) {
        report += '### Files with Low Coverage\n\n';
        report += '| File | Lines | Uncovered Lines |\n';
        report += '|------|-------|----------------|\n';
        
        for (const file of lowCoverageFiles) {
          const fileName = file.path.split('/').pop();
          report += `| ${fileName} | ${file.lines.toFixed(1)}% | ${file.uncoveredLines} |\n`;
        }
        report += '\n';
      }
    }

    // Benchmark Results
    if (this.results.benchmarks && this.results.benchmarks.results.length > 0) {
      report += '## ⚡ Benchmark Results\n\n';
      report += '### Top Performers\n\n';
      report += '| Benchmark | Ops/sec | Mean (ms) | Samples |\n';
      report += '|-----------|---------|-----------|----------|\n';
      
      for (const bench of this.results.benchmarks.results.slice(0, 10)) {
        const opsFormatted = bench.ops.toLocaleString('en-US', { maximumFractionDigits: 0 });
        const meanFormatted = (bench.mean * 1000).toFixed(3);
        report += `| ${bench.name} | ${opsFormatted} | ${meanFormatted} | ${bench.samples} |\n`;
      }
      report += '\n';
    }

    return report;
  }

  generateJsonReport() {
    return JSON.stringify(this.results, null, 2);
  }

  generateHtmlReport() {
    const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>n8n-mcp Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 2.5em;
        }
        .metadata {
            opacity: 0.9;
            font-size: 0.9em;
        }
        .section {
            background: white;
            padding: 25px;
            margin-bottom: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .section h2 {
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e9ecef;
        }
        .stat-card .value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        .stat-card .label {
            color: #666;
            font-size: 0.9em;
            margin-top: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #495057;
        }
        tr:hover {
            background-color: #f8f9fa;
        }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .failed-test {
            background-color: #fff5f5;
            border: 1px solid #feb2b2;
            border-radius: 5px;
            padding: 15px;
            margin: 10px 0;
        }
        .failed-test h4 {
            margin: 0 0 10px 0;
            color: #c53030;
        }
        .error-message {
            background-color: #1a202c;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            overflow-x: auto;
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background-color: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
            transition: width 0.3s ease;
        }
        .coverage-low { background: linear-gradient(90deg, #dc3545 0%, #f86734 100%); }
        .coverage-medium { background: linear-gradient(90deg, #ffc107 0%, #ffb347 100%); }
    </style>
</head>
<body>
    <div class="header">
        <h1>n8n-mcp Test Report</h1>
        <div class="metadata">
            <div>Repository: ${this.results.metadata.repository}</div>
            <div>Commit: ${this.results.metadata.sha.substring(0, 7)}</div>
            <div>Run: #${this.results.metadata.runNumber}</div>
            <div>Generated: ${new Date(this.results.metadata.timestamp).toLocaleString()}</div>
        </div>
    </div>
    
    ${this.generateTestResultsHtml()}
    ${this.generateCoverageHtml()}
    ${this.generateBenchmarkHtml()}
</body>
</html>`;

    return htmlTemplate;
  }

  generateTestResultsHtml() {
    if (!this.results.tests) return '';
    
    const { summary, testSuites, failedTests } = this.results.tests;
    const successRate = ((summary.passed / summary.total) * 100).toFixed(1);
    const statusClass = summary.success ? 'success' : 'danger';
    const statusIcon = summary.success ? '✅' : '❌';

    let html = `
    <div class="section">
        <h2>${statusIcon} Test Results</h2>
        <div class="stats">
            <div class="stat-card">
                <div class="value">${summary.total}</div>
                <div class="label">Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="value ${statusClass}">${summary.passed}</div>
                <div class="label">Passed</div>
            </div>
            <div class="stat-card">
                <div class="value ${summary.failed > 0 ? 'danger' : ''}">${summary.failed}</div>
                <div class="label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="value">${successRate}%</div>
                <div class="label">Success Rate</div>
            </div>
            <div class="stat-card">
                <div class="value">${(summary.duration / 1000).toFixed(1)}s</div>
                <div class="label">Duration</div>
            </div>
        </div>`;

    if (testSuites.length > 0) {
      html += `
        <h3>Test Suites</h3>
        <table>
            <thead>
                <tr>
                    <th>Suite</th>
                    <th>Status</th>
                    <th>Tests</th>
                    <th>Duration</th>
                </tr>
            </thead>
            <tbody>`;
      
      for (const suite of testSuites) {
        const status = suite.status === 'passed' ? '✅' : '❌';
        const statusClass = suite.status === 'passed' ? 'success' : 'danger';
        html += `
                <tr>
                    <td>${suite.name}</td>
                    <td class="${statusClass}">${status}</td>
                    <td>${suite.tests.passed}/${suite.tests.total}</td>
                    <td>${(suite.duration / 1000).toFixed(2)}s</td>
                </tr>`;
      }
      
      html += `
            </tbody>
        </table>`;
    }

    if (failedTests.length > 0) {
      html += `
        <h3>Failed Tests</h3>`;
      
      for (const failed of failedTests) {
        html += `
        <div class="failed-test">
            <h4>${failed.suite} > ${failed.test}</h4>
            <div class="error-message">${this.escapeHtml(failed.error)}</div>
        </div>`;
      }
    }

    html += `</div>`;
    return html;
  }

  generateCoverageHtml() {
    if (!this.results.coverage) return '';
    
    const { summary, files } = this.results.coverage;
    const coverageClass = summary.average >= 80 ? 'success' : summary.average >= 60 ? 'warning' : 'danger';
    const progressClass = summary.average >= 80 ? '' : summary.average >= 60 ? 'coverage-medium' : 'coverage-low';

    let html = `
    <div class="section">
        <h2>📊 Coverage Report</h2>
        <div class="stats">
            <div class="stat-card">
                <div class="value ${coverageClass}">${summary.average.toFixed(1)}%</div>
                <div class="label">Average Coverage</div>
            </div>
            <div class="stat-card">
                <div class="value">${summary.lines.toFixed(1)}%</div>
                <div class="label">Lines</div>
            </div>
            <div class="stat-card">
                <div class="value">${summary.statements.toFixed(1)}%</div>
                <div class="label">Statements</div>
            </div>
            <div class="stat-card">
                <div class="value">${summary.functions.toFixed(1)}%</div>
                <div class="label">Functions</div>
            </div>
            <div class="stat-card">
                <div class="value">${summary.branches.toFixed(1)}%</div>
                <div class="label">Branches</div>
            </div>
        </div>
        
        <div class="progress-bar">
            <div class="progress-fill ${progressClass}" style="width: ${summary.average}%"></div>
        </div>`;

    const lowCoverageFiles = files.filter(f => f.lines < 80).slice(0, 10);
    if (lowCoverageFiles.length > 0) {
      html += `
        <h3>Files with Low Coverage</h3>
        <table>
            <thead>
                <tr>
                    <th>File</th>
                    <th>Lines</th>
                    <th>Statements</th>
                    <th>Functions</th>
                    <th>Branches</th>
                </tr>
            </thead>
            <tbody>`;
      
      for (const file of lowCoverageFiles) {
        const fileName = file.path.split('/').pop();
        html += `
                <tr>
                    <td>${fileName}</td>
                    <td class="${file.lines < 50 ? 'danger' : file.lines < 80 ? 'warning' : ''}">${file.lines.toFixed(1)}%</td>
                    <td>${file.statements.toFixed(1)}%</td>
                    <td>${file.functions.toFixed(1)}%</td>
                    <td>${file.branches.toFixed(1)}%</td>
                </tr>`;
      }
      
      html += `
            </tbody>
        </table>`;
    }

    html += `</div>`;
    return html;
  }

  generateBenchmarkHtml() {
    if (!this.results.benchmarks || this.results.benchmarks.results.length === 0) return '';
    
    let html = `
    <div class="section">
        <h2>⚡ Benchmark Results</h2>
        <table>
            <thead>
                <tr>
                    <th>Benchmark</th>
                    <th>Operations/sec</th>
                    <th>Mean Time (ms)</th>
                    <th>Min (ms)</th>
                    <th>Max (ms)</th>
                    <th>Samples</th>
                </tr>
            </thead>
            <tbody>`;
    
    for (const bench of this.results.benchmarks.results.slice(0, 20)) {
      const opsFormatted = bench.ops.toLocaleString('en-US', { maximumFractionDigits: 0 });
      const meanFormatted = (bench.mean * 1000).toFixed(3);
      const minFormatted = (bench.min * 1000).toFixed(3);
      const maxFormatted = (bench.max * 1000).toFixed(3);
      
      html += `
                <tr>
                    <td>${bench.name}</td>
                    <td><strong>${opsFormatted}</strong></td>
                    <td>${meanFormatted}</td>
                    <td>${minFormatted}</td>
                    <td>${maxFormatted}</td>
                    <td>${bench.samples}</td>
                </tr>`;
    }
    
    html += `
            </tbody>
        </table>`;
    
    if (this.results.benchmarks.results.length > 20) {
      html += `<p><em>Showing top 20 of ${this.results.benchmarks.results.length} benchmarks</em></p>`;
    }
    
    html += `</div>`;
    return html;
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  async generate() {
    // Load all results
    this.loadTestResults();
    this.loadCoverageResults();
    this.loadBenchmarkResults();

    // Ensure output directory exists
    const outputDir = resolve(process.cwd(), 'test-reports');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Generate reports in different formats
    const markdownReport = this.generateMarkdownReport();
    const jsonReport = this.generateJsonReport();
    const htmlReport = this.generateHtmlReport();

    // Write reports
    writeFileSync(resolve(outputDir, 'report.md'), markdownReport);
    writeFileSync(resolve(outputDir, 'report.json'), jsonReport);
    writeFileSync(resolve(outputDir, 'report.html'), htmlReport);

    console.log('Test reports generated successfully:');
    console.log('- test-reports/report.md');
    console.log('- test-reports/report.json');
    console.log('- test-reports/report.html');
  }
}

// Run the generator
const generator = new TestReportGenerator();
generator.generate().catch(console.error);