const { writeFileSync } = require('fs');
const { resolve } = require('path');

class BenchmarkJsonReporter {
  constructor() {
    this.results = [];
    console.log('[BenchmarkJsonReporter] Initialized');
  }

  onInit(ctx) {
    console.log('[BenchmarkJsonReporter] onInit called');
  }

  onCollected(files) {
    console.log('[BenchmarkJsonReporter] onCollected called with', files ? files.length : 0, 'files');
  }

  onTaskUpdate(tasks) {
    console.log('[BenchmarkJsonReporter] onTaskUpdate called');
  }

  onBenchmarkResult(file, benchmark) {
    console.log('[BenchmarkJsonReporter] onBenchmarkResult called for', benchmark.name);
  }

  onFinished(files, errors) {
    console.log('[BenchmarkJsonReporter] onFinished called with', files ? files.length : 0, 'files');
    
    const results = {
      timestamp: new Date().toISOString(),
      files: []
    };

    try {
      for (const file of files || []) {
        if (!file) continue;
        
        const fileResult = {
          filepath: file.filepath || file.name || 'unknown',
          groups: []
        };

        // Handle both file.tasks and file.benchmarks
        const tasks = file.tasks || file.benchmarks || [];
        
        // Process tasks/benchmarks
        for (const task of tasks) {
          if (task.type === 'suite' && task.tasks) {
            // This is a suite containing benchmarks
            const group = {
              name: task.name,
              benchmarks: []
            };

            for (const benchmark of task.tasks) {
              if (benchmark.result?.benchmark) {
                group.benchmarks.push({
                  name: benchmark.name,
                  result: {
                    mean: benchmark.result.benchmark.mean,
                    min: benchmark.result.benchmark.min,
                    max: benchmark.result.benchmark.max,
                    hz: benchmark.result.benchmark.hz,
                    p75: benchmark.result.benchmark.p75,
                    p99: benchmark.result.benchmark.p99,
                    p995: benchmark.result.benchmark.p995,
                    p999: benchmark.result.benchmark.p999,
                    rme: benchmark.result.benchmark.rme,
                    samples: benchmark.result.benchmark.samples
                  }
                });
              }
            }

            if (group.benchmarks.length > 0) {
              fileResult.groups.push(group);
            }
          } else if (task.result?.benchmark) {
            // This is a direct benchmark (not in a suite)
            if (!fileResult.groups.length) {
              fileResult.groups.push({
                name: 'Default',
                benchmarks: []
              });
            }
            
            fileResult.groups[0].benchmarks.push({
              name: task.name,
              result: {
                mean: task.result.benchmark.mean,
                min: task.result.benchmark.min,
                max: task.result.benchmark.max,
                hz: task.result.benchmark.hz,
                p75: task.result.benchmark.p75,
                p99: task.result.benchmark.p99,
                p995: task.result.benchmark.p995,
                p999: task.result.benchmark.p999,
                rme: task.result.benchmark.rme,
                samples: task.result.benchmark.samples
              }
            });
          }
        }

        if (fileResult.groups.length > 0) {
          results.files.push(fileResult);
        }
      }

      // Write results
      const outputPath = resolve(process.cwd(), 'benchmark-results.json');
      writeFileSync(outputPath, JSON.stringify(results, null, 2));
      console.log(`[BenchmarkJsonReporter] Benchmark results written to ${outputPath}`);
      console.log(`[BenchmarkJsonReporter] Total files processed: ${results.files.length}`);
    } catch (error) {
      console.error('[BenchmarkJsonReporter] Error writing results:', error);
    }
  }
}

module.exports = BenchmarkJsonReporter;