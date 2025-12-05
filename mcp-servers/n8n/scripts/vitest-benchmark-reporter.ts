import type { Task, TaskResult, BenchmarkResult } from 'vitest';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

interface BenchmarkJsonResult {
  timestamp: string;
  files: Array<{
    filepath: string;
    groups: Array<{
      name: string;
      benchmarks: Array<{
        name: string;
        result: {
          mean: number;
          min: number;
          max: number;
          hz: number;
          p75: number;
          p99: number;
          p995: number;
          p999: number;
          rme: number;
          samples: number;
        };
      }>;
    }>;
  }>;
}

export class BenchmarkJsonReporter {
  private results: BenchmarkJsonResult = {
    timestamp: new Date().toISOString(),
    files: []
  };

  onInit() {
    console.log('[BenchmarkJsonReporter] Initialized');
  }

  onFinished(files?: Task[]) {
    console.log('[BenchmarkJsonReporter] onFinished called');
    
    if (!files) {
      console.log('[BenchmarkJsonReporter] No files provided');
      return;
    }

    for (const file of files) {
      const fileResult = {
        filepath: file.filepath || 'unknown',
        groups: [] as any[]
      };

      this.processTask(file, fileResult);

      if (fileResult.groups.length > 0) {
        this.results.files.push(fileResult);
      }
    }

    // Write results
    const outputPath = resolve(process.cwd(), 'benchmark-results.json');
    writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    console.log(`[BenchmarkJsonReporter] Results written to ${outputPath}`);
  }

  private processTask(task: Task, fileResult: any) {
    if (task.type === 'suite' && task.tasks) {
      const group = {
        name: task.name,
        benchmarks: [] as any[]
      };

      for (const benchmark of task.tasks) {
        const result = benchmark.result as TaskResult & { benchmark?: BenchmarkResult };
        if (result?.benchmark) {
          group.benchmarks.push({
            name: benchmark.name,
            result: {
              mean: result.benchmark.mean || 0,
              min: result.benchmark.min || 0,
              max: result.benchmark.max || 0,
              hz: result.benchmark.hz || 0,
              p75: result.benchmark.p75 || 0,
              p99: result.benchmark.p99 || 0,
              p995: result.benchmark.p995 || 0,
              p999: result.benchmark.p999 || 0,
              rme: result.benchmark.rme || 0,
              samples: result.benchmark.samples?.length || 0
            }
          });
        }
      }

      if (group.benchmarks.length > 0) {
        fileResult.groups.push(group);
      }
    }
  }
}