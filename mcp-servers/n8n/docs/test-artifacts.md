# Test Artifacts Documentation

This document describes the comprehensive test result artifact storage system implemented in the n8n-mcp project.

## Overview

The test artifact system captures, stores, and presents test results in multiple formats to facilitate debugging, analysis, and historical tracking of test performance.

## Artifact Types

### 1. Test Results
- **JUnit XML** (`test-results/junit.xml`): Standard format for CI integration
- **JSON Results** (`test-results/results.json`): Detailed test data for analysis
- **HTML Report** (`test-results/html/index.html`): Interactive test report
- **Test Summary** (`test-summary.md`): Markdown summary for PR comments

### 2. Coverage Reports
- **LCOV** (`coverage/lcov.info`): Standard coverage format
- **HTML Coverage** (`coverage/html/index.html`): Interactive coverage browser
- **Coverage Summary** (`coverage/coverage-summary.json`): JSON coverage data

### 3. Benchmark Results
- **Benchmark JSON** (`benchmark-results.json`): Raw benchmark data
- **Comparison Reports** (`benchmark-comparison.md`): PR benchmark comparisons

### 4. Detailed Reports
- **HTML Report** (`test-reports/report.html`): Comprehensive styled report
- **Markdown Report** (`test-reports/report.md`): Full markdown report
- **JSON Report** (`test-reports/report.json`): Complete test data

## GitHub Actions Integration

### Test Workflow (`test.yml`)

The main test workflow:
1. Runs tests with coverage using multiple reporters
2. Generates test summaries and detailed reports
3. Uploads artifacts with metadata
4. Posts summaries to PRs
5. Creates a combined artifact index

### Benchmark PR Workflow (`benchmark-pr.yml`)

For pull requests:
1. Runs benchmarks on PR branch
2. Runs benchmarks on base branch
3. Compares results
4. Posts comparison to PR
5. Sets status checks for regressions

## Artifact Retention

- **Test Results**: 30 days
- **Coverage Reports**: 30 days
- **Benchmark Results**: 30 days
- **Combined Results**: 90 days
- **Test Metadata**: 30 days

## PR Comment Integration

The system automatically:
- Posts test summaries to PR comments
- Updates existing comments instead of creating duplicates
- Includes links to full artifacts
- Shows coverage and benchmark changes

## Job Summary

Each workflow run includes a job summary with:
- Test results overview
- Coverage summary
- Benchmark results
- Direct links to download artifacts

## Local Development

### Running Tests with Reports

```bash
# Run tests with all reporters
CI=true npm run test:coverage

# Generate detailed reports
node scripts/generate-detailed-reports.js

# Generate test summary
node scripts/generate-test-summary.js

# Compare benchmarks
node scripts/compare-benchmarks.js benchmark-results.json benchmark-baseline.json
```

### Report Locations

When running locally, reports are generated in:
- `test-results/` - Vitest outputs
- `test-reports/` - Detailed reports
- `coverage/` - Coverage reports
- Root directory - Summary files

## Report Formats

### HTML Report Features
- Responsive design
- Test suite breakdown
- Failed test details with error messages
- Coverage visualization with progress bars
- Benchmark performance metrics
- Sortable tables

### Markdown Report Features
- GitHub-compatible formatting
- Summary statistics
- Failed test listings
- Coverage breakdown
- Benchmark comparisons

### JSON Report Features
- Complete test data
- Programmatic access
- Historical comparison
- CI/CD integration

## Best Practices

1. **Always Check Artifacts**: When tests fail in CI, download and review the HTML report
2. **Monitor Coverage**: Use the coverage reports to identify untested code
3. **Track Benchmarks**: Review benchmark comparisons on performance-critical PRs
4. **Archive Important Runs**: Download artifacts from significant releases

## Troubleshooting

### Missing Artifacts
- Check if tests ran to completion
- Verify artifact upload steps executed
- Check retention period hasn't expired

### Report Generation Failures
- Ensure all dependencies are installed
- Check for valid test/coverage output files
- Review workflow logs for errors

### PR Comment Issues
- Verify GitHub Actions permissions
- Check bot authentication
- Review comment posting logs