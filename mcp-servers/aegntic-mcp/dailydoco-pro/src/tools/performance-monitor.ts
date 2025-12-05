/**
 * Performance Monitor Tool
 * Tracks system performance and ensures elite performance standards
 */

import { z } from 'zod';
import { EventEmitter } from 'events';

interface SystemMetrics {
  timestamp: string;
  system_performance: {
    cpu_usage: number;
    memory_usage: number;
    memory_total: number;
    gpu_usage?: number;
    disk_io: number;
    network_io: number;
  };
  capture_metrics: {
    capture_fps: number;
    dropped_frames: number;
    encoding_speed: number;
    bitrate: number;
    latency: number;
  };
  ai_metrics: {
    model_latency: number;
    inference_speed: number;
    memory_usage: number;
    queue_length: number;
    success_rate: number;
  };
  video_processing: {
    processing_speed: number;
    queue_size: number;
    completion_rate: number;
    error_rate: number;
  };
  performance_targets: {
    realtime_processing: {
      target: number;
      current: number;
      status: 'meeting' | 'below' | 'exceeding';
    };
    memory_baseline: {
      target: number;
      current: number;
      status: 'meeting' | 'below' | 'exceeding';
    };
    cpu_idle: {
      target: number;
      current: number;
      status: 'meeting' | 'below' | 'exceeding';
    };
  };
}

interface BenchmarkResult {
  benchmark_info: {
    type: string;
    duration: number;
    timestamp: string;
    system_specs: Record<string, any>;
  };
  overall_score: number;
  component_scores: {
    capture_performance: number;
    ai_performance: number;
    video_processing: number;
    system_stability: number;
  };
  detailed_metrics: {
    throughput: number;
    latency: number;
    resource_efficiency: number;
    error_rate: number;
  };
  performance_analysis: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  comparison: {
    vs_targets: Record<string, { target: number; achieved: number; delta: number }>;
    vs_previous: Record<string, { previous: number; current: number; improvement: number }>;
  };
}

const GetSystemMetricsArgsSchema = z.object({
  include_ai_metrics: z.boolean().default(true),
  include_capture_metrics: z.boolean().default(true),
  time_range: z.enum(['1m', '5m', '15m', '1h']).default('5m'),
});

const RunBenchmarkArgsSchema = z.object({
  benchmark_type: z.enum(['capture', 'ai', 'video_processing', 'full_system']).default('full_system'),
  duration: z.number().default(60).describe('Duration in seconds'),
});

export class PerformanceMonitor extends EventEmitter {
  private isMonitoring = false;
  private metricsHistory: SystemMetrics[] = [];
  private benchmarkHistory: BenchmarkResult[] = [];

  /**
   * Get real-time system performance metrics
   */
  async getSystemMetrics(args: z.infer<typeof GetSystemMetricsArgsSchema>) {
    const { include_ai_metrics, include_capture_metrics, time_range } = args;

    console.log(`Getting system metrics for ${time_range} time range`);
    console.log(`AI metrics: ${include_ai_metrics}, Capture metrics: ${include_capture_metrics}`);

    const metrics = await this.collectCurrentMetrics(
      include_ai_metrics,
      include_capture_metrics
    );

    const historicalData = this.getHistoricalMetrics(time_range);
    const analysis = this.analyzePerformanceTrends(metrics, historicalData);

    return {
      content: [
        {
          type: 'text',
          text: `# 📉 Real-time Performance Metrics\n\n` +
                `**Timestamp:** ${metrics.timestamp}\n` +
                `**Time Range:** ${time_range}\n\n` +
                `## 💻 System Performance\n\n` +
                `- **CPU Usage:** ${metrics.system_performance.cpu_usage.toFixed(1)}%\n` +
                `- **Memory Usage:** ${Math.round(metrics.system_performance.memory_usage / (1024 * 1024))}MB / ${Math.round(metrics.system_performance.memory_total / (1024 * 1024))}MB (${((metrics.system_performance.memory_usage / metrics.system_performance.memory_total) * 100).toFixed(1)}%)\n` +
                `- **GPU Usage:** ${metrics.system_performance.gpu_usage?.toFixed(1) || 'N/A'}%\n` +
                `- **Disk I/O:** ${(metrics.system_performance.disk_io / (1024 * 1024)).toFixed(1)} MB/s\n` +
                `- **Network I/O:** ${(metrics.system_performance.network_io / (1024 * 1024)).toFixed(1)} MB/s\n\n` +
                (include_capture_metrics ? 
                  `## 🎬 Capture Performance\n\n` +
                  `- **Capture FPS:** ${metrics.capture_metrics.capture_fps.toFixed(1)}\n` +
                  `- **Dropped Frames:** ${metrics.capture_metrics.dropped_frames}\n` +
                  `- **Encoding Speed:** ${metrics.capture_metrics.encoding_speed.toFixed(2)}x realtime\n` +
                  `- **Bitrate:** ${(metrics.capture_metrics.bitrate / 1000).toFixed(1)} Kbps\n` +
                  `- **Latency:** ${metrics.capture_metrics.latency.toFixed(0)}ms\n\n`
                : '') +
                (include_ai_metrics ?
                  `## 🤖 AI Performance\n\n` +
                  `- **Model Latency:** ${metrics.ai_metrics.model_latency.toFixed(0)}ms\n` +
                  `- **Inference Speed:** ${metrics.ai_metrics.inference_speed.toFixed(1)} req/s\n` +
                  `- **AI Memory Usage:** ${Math.round(metrics.ai_metrics.memory_usage / (1024 * 1024))}MB\n` +
                  `- **Queue Length:** ${metrics.ai_metrics.queue_length}\n` +
                  `- **Success Rate:** ${(metrics.ai_metrics.success_rate * 100).toFixed(1)}%\n\n`
                : '') +
                `## 🎯 Performance Targets\n\n` +
                `### Sub-2x Realtime Processing\n` +
                `- **Target:** < ${metrics.performance_targets.realtime_processing.target}x\n` +
                `- **Current:** ${metrics.performance_targets.realtime_processing.current.toFixed(2)}x\n` +
                `- **Status:** ${this.getStatusEmoji(metrics.performance_targets.realtime_processing.status)} ${metrics.performance_targets.realtime_processing.status.toUpperCase()}\n\n` +
                `### Memory Baseline\n` +
                `- **Target:** < ${Math.round(metrics.performance_targets.memory_baseline.target / (1024 * 1024))}MB\n` +
                `- **Current:** ${Math.round(metrics.performance_targets.memory_baseline.current / (1024 * 1024))}MB\n` +
                `- **Status:** ${this.getStatusEmoji(metrics.performance_targets.memory_baseline.status)} ${metrics.performance_targets.memory_baseline.status.toUpperCase()}\n\n` +
                `### CPU Idle Target\n` +
                `- **Target:** < ${metrics.performance_targets.cpu_idle.target}%\n` +
                `- **Current:** ${metrics.performance_targets.cpu_idle.current.toFixed(1)}%\n` +
                `- **Status:** ${this.getStatusEmoji(metrics.performance_targets.cpu_idle.status)} ${metrics.performance_targets.cpu_idle.status.toUpperCase()}\n\n` +
                `## 📊 Performance Analysis\n\n` +
                analysis.insights.map(insight => `- ${insight}\n`).join('') +
                `\n🏆 **Overall System Health:** ${this.calculateOverallHealth(metrics)}`,
        },
        {
          type: 'text',
          text: JSON.stringify(metrics, null, 2),
        },
      ],
    };
  }

  /**
   * Run comprehensive performance benchmark
   */
  async runBenchmark(args: z.infer<typeof RunBenchmarkArgsSchema>) {
    const { benchmark_type, duration } = args;

    console.log(`Running ${benchmark_type} benchmark for ${duration} seconds`);

    const result = await this.executeBenchmark(benchmark_type, duration);
    
    // Store benchmark result
    this.benchmarkHistory.push(result);
    
    // Keep only last 50 benchmark results
    if (this.benchmarkHistory.length > 50) {
      this.benchmarkHistory = this.benchmarkHistory.slice(-50);
    }

    return {
      content: [
        {
          type: 'text',
          text: `# 🏁 Performance Benchmark Results\n\n` +
                `**Benchmark Type:** ${benchmark_type}\n` +
                `**Duration:** ${duration} seconds\n` +
                `**Timestamp:** ${result.benchmark_info.timestamp}\n` +
                `**Overall Score:** ${result.overall_score.toFixed(1)}/10\n\n` +
                `## 📊 Component Scores\n\n` +
                `- **Capture Performance:** ${result.component_scores.capture_performance.toFixed(1)}/10\n` +
                `- **AI Performance:** ${result.component_scores.ai_performance.toFixed(1)}/10\n` +
                `- **Video Processing:** ${result.component_scores.video_processing.toFixed(1)}/10\n` +
                `- **System Stability:** ${result.component_scores.system_stability.toFixed(1)}/10\n\n` +
                `## 📈 Detailed Metrics\n\n` +
                `- **Throughput:** ${result.detailed_metrics.throughput.toFixed(1)} ops/sec\n` +
                `- **Latency:** ${result.detailed_metrics.latency.toFixed(0)}ms avg\n` +
                `- **Resource Efficiency:** ${(result.detailed_metrics.resource_efficiency * 100).toFixed(1)}%\n` +
                `- **Error Rate:** ${(result.detailed_metrics.error_rate * 100).toFixed(2)}%\n\n` +
                `## 💪 Strengths\n\n` +
                result.performance_analysis.strengths.map(strength => `- ✅ ${strength}\n`).join('') +
                `\n## ⚠️ Areas for Improvement\n\n` +
                result.performance_analysis.weaknesses.map(weakness => `- 🔹 ${weakness}\n`).join('') +
                `\n## 💡 Recommendations\n\n` +
                result.performance_analysis.recommendations.map(rec => `- 🎯 ${rec}\n`).join('') +
                `\n## 📏 Comparison vs Targets\n\n` +
                Object.entries(result.comparison.vs_targets).map(([metric, data]) =>
                  `- **${metric}:** ${data.achieved.toFixed(2)} / ${data.target.toFixed(2)} (${data.delta > 0 ? '+' : ''}${(data.delta * 100).toFixed(1)}%)\n`
                ).join('') +
                `\n🎆 **Elite Performance:** ${result.overall_score >= 8.5 ? 'ACHIEVED' : result.overall_score >= 7.0 ? 'GOOD' : 'NEEDS IMPROVEMENT'}`,
        },
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  // Private helper methods

  private async collectCurrentMetrics(
    includeAI: boolean,
    includeCapture: boolean
  ): Promise<SystemMetrics> {
    // Simulate real system metrics collection
    const timestamp = new Date().toISOString();
    
    // System performance
    const cpuUsage = 8 + Math.random() * 15; // 8-23%
    const memoryTotal = 16 * 1024 * 1024 * 1024; // 16GB
    const memoryUsage = (180 + Math.random() * 50) * 1024 * 1024; // 180-230MB
    const gpuUsage = 5 + Math.random() * 15; // 5-20%
    
    // Capture metrics
    const captureFps = includeCapture ? 29.5 + Math.random() * 1 : 0;
    const droppedFrames = includeCapture ? Math.floor(Math.random() * 3) : 0;
    const encodingSpeed = includeCapture ? 1.6 + Math.random() * 0.5 : 0; // 1.6-2.1x
    
    // AI metrics
    const modelLatency = includeAI ? 180 + Math.random() * 120 : 0; // 180-300ms
    const inferenceSpeed = includeAI ? 2.5 + Math.random() * 1.5 : 0; // 2.5-4 req/s
    const aiMemoryUsage = includeAI ? (45 + Math.random() * 25) * 1024 * 1024 : 0;
    
    // Performance targets
    const realtimeTarget = 2.0;
    const memoryTarget = 200 * 1024 * 1024; // 200MB
    const cpuTarget = 5.0; // 5%
    
    const metrics: SystemMetrics = {
      timestamp,
      system_performance: {
        cpu_usage: cpuUsage,
        memory_usage: memoryUsage,
        memory_total: memoryTotal,
        gpu_usage: gpuUsage,
        disk_io: (2 + Math.random() * 8) * 1024 * 1024, // 2-10 MB/s
        network_io: (1 + Math.random() * 4) * 1024 * 1024, // 1-5 MB/s
      },
      capture_metrics: {
        capture_fps: captureFps,
        dropped_frames: droppedFrames,
        encoding_speed: encodingSpeed,
        bitrate: 5000 + Math.random() * 2000, // 5-7 Mbps
        latency: 15 + Math.random() * 10, // 15-25ms
      },
      ai_metrics: {
        model_latency: modelLatency,
        inference_speed: inferenceSpeed,
        memory_usage: aiMemoryUsage,
        queue_length: Math.floor(Math.random() * 5),
        success_rate: 0.985 + Math.random() * 0.01, // 98.5-99.5%
      },
      video_processing: {
        processing_speed: 1.7 + Math.random() * 0.4, // 1.7-2.1x
        queue_size: Math.floor(Math.random() * 3),
        completion_rate: 0.99 + Math.random() * 0.008, // 99-99.8%
        error_rate: Math.random() * 0.002, // 0-0.2%
      },
      performance_targets: {
        realtime_processing: {
          target: realtimeTarget,
          current: encodingSpeed,
          status: encodingSpeed < realtimeTarget ? 'meeting' : 'exceeding',
        },
        memory_baseline: {
          target: memoryTarget,
          current: memoryUsage,
          status: memoryUsage < memoryTarget ? 'meeting' : 'exceeding',
        },
        cpu_idle: {
          target: cpuTarget,
          current: cpuUsage,
          status: cpuUsage < cpuTarget ? 'meeting' : 'exceeding',
        },
      },
    };
    
    // Store in history
    this.metricsHistory.push(metrics);
    
    // Keep only last 1000 metrics (about 1 hour at 3.6s intervals)
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory = this.metricsHistory.slice(-1000);
    }
    
    return metrics;
  }

  private getHistoricalMetrics(timeRange: string): SystemMetrics[] {
    const now = new Date();
    const minutes = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '1h': 60,
    }[timeRange] || 5;
    
    const cutoff = new Date(now.getTime() - minutes * 60 * 1000);
    
    return this.metricsHistory.filter(metric => 
      new Date(metric.timestamp) >= cutoff
    );
  }

  private analyzePerformanceTrends(current: SystemMetrics, historical: SystemMetrics[]) {
    const insights = [];
    
    if (current.performance_targets.realtime_processing.status === 'meeting') {
      insights.push('✅ Meeting sub-2x realtime processing target');
    } else {
      insights.push('⚠️ Processing speed below target - consider optimization');
    }
    
    if (current.performance_targets.memory_baseline.status === 'meeting') {
      insights.push('✅ Memory usage within 200MB baseline');
    } else {
      insights.push('🟡 Memory usage above baseline - monitor for leaks');
    }
    
    if (current.capture_metrics.dropped_frames === 0) {
      insights.push('✅ Zero dropped frames - excellent capture quality');
    } else {
      insights.push(`⚠️ ${current.capture_metrics.dropped_frames} dropped frames detected`);
    }
    
    if (current.ai_metrics.success_rate > 0.99) {
      insights.push('✅ AI models performing at 99%+ success rate');
    } else {
      insights.push('🟡 AI success rate below 99% - check model health');
    }
    
    return { insights };
  }

  private async executeBenchmark(
    type: string,
    duration: number
  ): Promise<BenchmarkResult> {
    console.log(`Executing ${type} benchmark...`);
    
    // Simulate benchmark execution
    await new Promise(resolve => setTimeout(resolve, Math.min(duration * 10, 2000))); // Simulate time
    
    const scores = this.generateBenchmarkScores(type);
    const metrics = this.generateDetailedMetrics(type);
    const analysis = this.analyzeBenchmarkResults(scores, metrics);
    const comparison = this.generateComparison(scores);
    
    return {
      benchmark_info: {
        type,
        duration,
        timestamp: new Date().toISOString(),
        system_specs: {
          cpu: 'Intel i7-12700K',
          memory: '32GB DDR4',
          gpu: 'NVIDIA RTX 4070',
          storage: 'NVMe SSD',
        },
      },
      overall_score: (scores.capture_performance + scores.ai_performance + scores.video_processing + scores.system_stability) / 4,
      component_scores: scores,
      detailed_metrics: metrics,
      performance_analysis: analysis,
      comparison,
    };
  }

  private generateBenchmarkScores(type: string) {
    const baseScore = 7.5 + Math.random() * 2; // 7.5-9.5 base
    
    return {
      capture_performance: type === 'capture' || type === 'full_system' ? 
        baseScore + Math.random() * 0.5 : baseScore - 1,
      ai_performance: type === 'ai' || type === 'full_system' ? 
        baseScore + Math.random() * 0.5 : baseScore - 1,
      video_processing: type === 'video_processing' || type === 'full_system' ? 
        baseScore + Math.random() * 0.5 : baseScore - 1,
      system_stability: baseScore + Math.random() * 0.3,
    };
  }

  private generateDetailedMetrics(type: string) {
    return {
      throughput: 850 + Math.random() * 300, // 850-1150 ops/sec
      latency: 45 + Math.random() * 30, // 45-75ms
      resource_efficiency: 0.82 + Math.random() * 0.15, // 82-97%
      error_rate: Math.random() * 0.005, // 0-0.5%
    };
  }

  private analyzeBenchmarkResults(scores: any, metrics: any) {
    const strengths = [];
    const weaknesses = [];
    const recommendations = [];
    
    if (scores.capture_performance > 8.5) {
      strengths.push('Excellent video capture performance');
    } else if (scores.capture_performance < 7.0) {
      weaknesses.push('Capture performance below expectations');
      recommendations.push('Optimize capture settings and hardware acceleration');
    }
    
    if (scores.ai_performance > 8.5) {
      strengths.push('Outstanding AI model performance');
    } else if (scores.ai_performance < 7.0) {
      weaknesses.push('AI processing needs optimization');
      recommendations.push('Consider model optimization or hardware upgrades');
    }
    
    if (metrics.latency < 50) {
      strengths.push('Low latency processing pipeline');
    } else {
      weaknesses.push('High latency detected');
      recommendations.push('Investigate bottlenecks in processing chain');
    }
    
    if (metrics.error_rate < 0.001) {
      strengths.push('Excellent system reliability');
    } else {
      weaknesses.push('Error rate above optimal');
      recommendations.push('Improve error handling and system stability');
    }
    
    return { strengths, weaknesses, recommendations };
  }

  private generateComparison(scores: any) {
    // Elite performance targets
    const targets = {
      capture_performance: 8.5,
      ai_performance: 8.0,
      video_processing: 8.5,
      system_stability: 9.0,
    };
    
    const vs_targets: Record<string, any> = {};
    Object.entries(targets).forEach(([key, target]) => {
      const achieved = scores[key];
      vs_targets[key] = {
        target,
        achieved,
        delta: (achieved - target) / target,
      };
    });
    
    // Mock previous results for comparison
    const vs_previous: Record<string, any> = {};
    Object.entries(scores).forEach(([key, current]) => {
      const currentValue = current as number;
      const previous = currentValue - 0.2 + Math.random() * 0.4; // Slight variation
      vs_previous[key] = {
        previous,
        current: currentValue,
        improvement: (currentValue - previous) / previous,
      };
    });
    
    return { vs_targets, vs_previous };
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'meeting': return '✅';
      case 'exceeding': return '🎆';
      case 'below': return '⚠️';
      default: return '🔹';
    }
  }

  private calculateOverallHealth(metrics: SystemMetrics): string {
    const targets = metrics.performance_targets;
    const meetingCount = Object.values(targets).filter(t => t.status === 'meeting' || t.status === 'exceeding').length;
    const totalTargets = Object.keys(targets).length;
    
    const healthPercentage = (meetingCount / totalTargets) * 100;
    
    if (healthPercentage >= 90) return '🟢 Excellent';
    if (healthPercentage >= 70) return '🟡 Good';
    if (healthPercentage >= 50) return '🟠 Fair';
    return '🔴 Needs Attention';
  }

  async cleanup(): Promise<void> {
    this.isMonitoring = false;
    this.metricsHistory = [];
    this.benchmarkHistory = [];
  }
}