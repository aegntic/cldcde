/**
 * Auto-Demo Video Renderer
 * Renders demo recordings to video using Remotion or ffmpeg
 *
 * Usage:
 *   import { VideoRenderer } from './video-renderer';
 *
 *   const renderer = new VideoRenderer();
 *   await renderer.render(demo, { format: 'mp4', outputPath: './demo.mp4' });
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface VideoRenderOptions {
  format: 'mp4' | 'webm' | 'gif' | 'prores';
  outputPath: string;
  width?: number;
  height?: number;
  fps?: number;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  codec?: 'h264' | 'h265' | 'vp9' | 'prores';
  includeAudio?: boolean;
  narrationText?: string[];
}

export interface Demo {
  id: string;
  config: {
    name: string;
    style: string;
  };
  steps: DemoStep[];
  metadata: {
    totalDuration: number;
    filesChanged: string[];
    commandsRun: number;
  };
}

export interface DemoStep {
  id: string;
  order: number;
  title: string;
  description: string;
  actions: RecordedAction[];
  code?: string;
  language?: string;
}

export interface RecordedAction {
  id: string;
  timestamp: Date;
  type: string;
  target: string;
  before?: string;
  after?: string;
  command?: string;
  output?: string;
  explanation?: string;
}

export interface RenderProgress {
  frame: number;
  totalFrames: number;
  percentage: number;
  currentStep: string;
  estimatedTimeRemaining: number;
}

// ============================================================================
// VIDEO RENDERER CLASS
// ============================================================================

export class VideoRenderer {
  private ffmpegPath: string;
  private ffprobePath: string;

  constructor() {
    this.ffmpegPath = 'ffmpeg';
    this.ffprobePath = 'ffprobe';
  }

  /**
   * Render a demo to video
   */
  async render(
    demo: Demo,
    options: VideoRenderOptions,
    onProgress?: (progress: RenderProgress) => void
  ): Promise<string> {
    const {
      format = 'mp4',
      outputPath,
      width = 1920,
      height = 1080,
      fps = 30,
      quality = 'high',
      codec = 'h264',
      includeAudio = false,
      narrationText = []
    } = options;

    // Create temp directory for frames
    const tempDir = path.join(path.dirname(outputPath), `.temp-${demo.id}`);
    await fs.promises.mkdir(tempDir, { recursive: true });

    try {
      // Generate frames from demo steps
      const totalFrames = await this.generateFrames(demo, tempDir, width, height, fps, onProgress);

      // Generate audio if narration provided
      let audioFile: string | null = null;
      if (includeAudio && narrationText.length > 0) {
        audioFile = await this.generateNarration(narrationText, tempDir);
      }

      // Compile frames to video using ffmpeg
      await this.compileVideo(tempDir, outputPath, {
        width,
        height,
        fps,
        format,
        codec,
        quality,
        audioFile
      });

      return outputPath;
    } finally {
      // Cleanup temp directory
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  }

  /**
   * Generate individual frames from demo steps
   */
  private async generateFrames(
    demo: Demo,
    tempDir: string,
    width: number,
    height: number,
    fps: number,
    onProgress?: (progress: RenderProgress) => void
  ): Promise<number> {
    let currentFrame = 0;
    const framesPerStep = fps * 5; // 5 seconds per step
    const totalFrames = demo.steps.length * framesPerStep;

    for (let stepIndex = 0; stepIndex < demo.steps.length; stepIndex++) {
      const step = demo.steps[stepIndex];

      for (let frameInStep = 0; frameInStep < framesPerStep; frameInStep++) {
        const progress = frameInStep / framesPerStep;
        const frame = this.createFrame(step, progress, width, height, demo.config.style);

        const framePath = path.join(tempDir, `frame-${String(currentFrame).padStart(6, '0')}.png`);
        await fs.promises.writeFile(framePath, frame);

        currentFrame++;

        if (onProgress && currentFrame % 10 === 0) {
          onProgress({
            frame: currentFrame,
            totalFrames,
            percentage: (currentFrame / totalFrames) * 100,
            currentStep: step.title,
            estimatedTimeRemaining: this.estimateTimeRemaining(currentFrame, totalFrames, fps)
          });
        }
      }
    }

    return currentFrame;
  }

  /**
   * Create a single frame image
   */
  private createFrame(
    step: DemoStep,
    progress: number,
    width: number,
    height: number,
    style: string
  ): Buffer {
    // This would use canvas or a similar library to render frames
    // For now, return a placeholder SVG that can be converted to PNG

    const colors = this.getStyleColors(style);
    const code = step.code || '';
    const visibleChars = Math.floor(code.length * progress);
    const visibleCode = code.slice(0, visibleChars);

    const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.bg1}"/>
      <stop offset="100%" style="stop-color:${colors.bg2}"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bg)"/>

  <!-- Window frame -->
  <rect x="40" y="40" width="${width - 80}" height="${height - 80}"
        rx="12" fill="${colors.windowBg}" filter="url(#shadow)"/>

  <!-- Window controls -->
  <circle cx="68" cy="68" r="6" fill="#ff5f56"/>
  <circle cx="88" cy="68" r="6" fill="#ffbd2e"/>
  <circle cx="108" cy="68" r="6" fill="#27c93f"/>

  <!-- Title -->
  <text x="${width / 2}" y="72"
        font-family="system-ui, sans-serif" font-size="14"
        fill="${colors.textMuted}" text-anchor="middle">
    ${step.title}
  </text>

  <!-- Code area -->
  <foreignObject x="60" y="100" width="${width - 120}" height="${height - 140}">
    <div xmlns="http://www.w3.org/1999/xhtml"
         style="font-family: 'JetBrains Mono', monospace; font-size: 16px;
                color: ${colors.text}; white-space: pre; line-height: 1.6;">
      ${this.escapeHtml(visibleCode)}
      <span style="border-left: 2px solid ${colors.cursor}; animation: blink 1s infinite;">&#8203;</span>
    </div>
  </foreignObject>
</svg>`;

    // In a real implementation, this would convert SVG to PNG
    return Buffer.from(svg);
  }

  /**
   * Generate narration audio using TTS
   */
  private async generateNarration(
    texts: string[],
    tempDir: string
  ): Promise<string> {
    // This would integrate with a TTS service like:
    // - ElevenLabs API
    // - AWS Polly
    // - Google Cloud TTS
    // - OpenAI TTS

    const audioSegments: string[] = [];

    for (let i = 0; i < texts.length; i++) {
      const segmentPath = path.join(tempDir, `narration-${i}.mp3`);
      // Placeholder - in real implementation, call TTS API
      // await this.ttsGenerate(texts[i], segmentPath);
      audioSegments.push(segmentPath);
    }

    // Concatenate all segments
    const outputPath = path.join(tempDir, 'narration.mp3');
    await this.concatAudio(audioSegments, outputPath);

    return outputPath;
  }

  /**
   * Concatenate audio files
   */
  private async concatAudio(inputs: string[], output: string): Promise<void> {
    const listFile = path.join(path.dirname(output), 'audio-list.txt');
    const content = inputs.map(f => `file '${f}'`).join('\n');
    await fs.promises.writeFile(listFile, content);

    await execAsync(
      `${this.ffmpegPath} -f concat -safe 0 -i ${listFile} -c copy ${output}`
    );
  }

  /**
   * Compile frames to video using ffmpeg
   */
  private async compileVideo(
    tempDir: string,
    outputPath: string,
    options: {
      width: number;
      height: number;
      fps: number;
      format: string;
      codec: string;
      quality: string;
      audioFile: string | null;
    }
  ): Promise<void> {
    const qualitySettings: Record<string, string> = {
      low: '-crf 28 -preset veryfast',
      medium: '-crf 23 -preset medium',
      high: '-crf 18 -preset slow',
      ultra: '-crf 10 -preset veryslow'
    };

    const codecSettings: Record<string, string> = {
      h264: '-c:v libx264',
      h265: '-c:v libx265',
      vp9: '-c:v libvpx-vp9',
      prores: '-c:v prores_ks'
    };

    const inputPattern = path.join(tempDir, 'frame-%06d.png');
    const qualityOpts = qualitySettings[options.quality] || qualitySettings.high;
    const codecOpts = codecSettings[options.codec] || codecSettings.h264;

    let command = `${this.ffmpegPath} -y -framerate ${options.fps} -i ${inputPattern}`;

    if (options.audioFile) {
      command += ` -i ${options.audioFile}`;
    }

    command += ` ${codecOpts} ${qualityOpts}`;
    command += ` -s ${options.width}x${options.height}`;
    command += ` -pix_fmt yuv420p`;

    if (options.audioFile) {
      command += ` -c:a aac -b:a 192k`;
    }

    command += ` ${outputPath}`;

    await execAsync(command);
  }

  /**
   * Get style-specific colors
   */
  private getStyleColors(style: string): Record<string, string> {
    const styles: Record<string, Record<string, string>> = {
      dark: {
        bg1: '#1a1a2e',
        bg2: '#16213e',
        windowBg: '#1e1e1e',
        text: '#d4d4d4',
        textMuted: '#6e7681',
        cursor: '#aeafad'
      },
      light: {
        bg1: '#f5f7fa',
        bg2: '#c3cfe2',
        windowBg: '#ffffff',
        text: '#1e1e1e',
        textMuted: '#6b7280',
        cursor: '#000000'
      },
      modern: {
        bg1: '#0d1117',
        bg2: '#21262d',
        windowBg: '#161b22',
        text: '#c9d1d9',
        textMuted: '#8b949e',
        cursor: '#58a6ff'
      },
      gradient: {
        bg1: '#667eea',
        bg2: '#764ba2',
        windowBg: '#1e1e2e',
        text: '#ffffff',
        textMuted: '#a0aec0',
        cursor: '#ffffff'
      }
    };

    return styles[style] || styles.modern;
  }

  /**
   * Estimate time remaining
   */
  private estimateTimeRemaining(
    currentFrame: number,
    totalFrames: number,
    fps: number
  ): number {
    const framesRemaining = totalFrames - currentFrame;
    const secondsRemaining = framesRemaining / fps;
    return Math.ceil(secondsRemaining);
  }

  /**
   * Escape HTML entities
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// ============================================================================
// SCREEN CAPTURE RECORDER
// ============================================================================

export class ScreenCaptureRecorder {
  private recordingProcess: any = null;
  private outputPath: string = '';
  private isRecording: boolean = false;

  /**
   * Start screen recording
   */
  async start(options: {
    outputPath: string;
    region?: { x: number; y: number; width: number; height: number };
    fps?: number;
    captureAudio?: boolean;
  }): Promise<void> {
    const {
      outputPath,
      region,
      fps = 30,
      captureAudio = false
    } = options;

    this.outputPath = outputPath;
    this.isRecording = true;

    // Build ffmpeg command for screen capture
    let command = 'ffmpeg -y';

    // Platform-specific input
    if (process.platform === 'darwin') {
      // macOS - use avfoundation
      command += ` -f avfoundation -i "${captureAudio ? '1:1' : '1:none'}"`;
    } else if (process.platform === 'linux') {
      // Linux - use x11grab
      const display = region
        ? `:0.0+${region.x},${region.y}`
        : ':0.0';
      const size = region
        ? `${region.width}x${region.height}`
        : '1920x1080';
      command += ` -f x11grab -video_size ${size} -i ${display}`;
    } else if (process.platform === 'win32') {
      // Windows - use gdigrab
      command += ` -f gdigrab -framerate ${fps} -i desktop`;
    }

    command += ` -r ${fps} -c:v libx264 -preset ultrafast -crf 23`;
    command += ` -pix_fmt yuv420p ${outputPath}`;

    this.recordingProcess = spawn('sh', ['-c', command]);
  }

  /**
   * Stop recording
   */
  async stop(): Promise<string> {
    if (!this.isRecording || !this.recordingProcess) {
      throw new Error('Not recording');
    }

    return new Promise((resolve, reject) => {
      // Send 'q' to ffmpeg to stop recording
      this.recordingProcess.stdin.write('q');

      this.recordingProcess.on('close', (code: number) => {
        this.isRecording = false;
        if (code === 0) {
          resolve(this.outputPath);
        } else {
          reject(new Error(`ffmpeg exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Check if currently recording
   */
  isActive(): boolean {
    return this.isRecording;
  }
}

// ============================================================================
// QUICK RENDER FUNCTION
// ============================================================================

export async function renderDemoVideo(
  demo: Demo,
  options: Partial<VideoRenderOptions> = {}
): Promise<string> {
  const renderer = new VideoRenderer();

  const fullOptions: VideoRenderOptions = {
    format: options.format || 'mp4',
    outputPath: options.outputPath || `./${demo.id}.mp4`,
    width: options.width || 1920,
    height: options.height || 1080,
    fps: options.fps || 30,
    quality: options.quality || 'high',
    codec: options.codec || 'h264',
    includeAudio: options.includeAudio || false,
    narrationText: options.narrationText || []
  };

  return renderer.render(demo, fullOptions);
}

export default {
  VideoRenderer,
  ScreenCaptureRecorder,
  renderDemoVideo
};
