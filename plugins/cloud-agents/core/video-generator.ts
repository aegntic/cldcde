/**
 * Auto-Demo Video Generator
 * Automatically creates demo videos from recorded coding sessions
 *
 * Uses Remotion for code-to-video rendering
 * Inspired by Cursor's autoDemo feature concept
 */

import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Video as RemotionVideo,
  Img,
  Text,
  Rect,
  Audio,
  staticFile,
} from 'remotion';

// ============================================================================
// TYPES
// ============================================================================

export interface DemoVideoConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  style: VideoStyle;
  includeNarration: boolean;
  includeCodeHighlights: boolean;
  background: BackgroundConfig;
  music?: string;
}

export type VideoStyle =
  | 'minimal'
  | 'modern'
  | 'dark'
  | 'light'
  | 'gradient'
  | 'custom';

export interface BackgroundConfig {
  type: 'solid' | 'gradient' | 'image' | 'video';
  value: string;
  secondaryValue?: string;
}

export interface CodeFrame {
  code: string;
  language: string;
  highlightLines: number[];
  cursorPosition: { line: number; column: number };
  typingProgress: number; // 0-1
}

export interface DemoStepVideo {
  id: string;
  title: string;
  description: string;
  durationInFrames: number;
  type: 'intro' | 'code' | 'terminal' | 'browser' | 'outro';
  codeFrame?: CodeFrame;
  terminalOutput?: string;
  browserScreenshot?: string;
  narration?: string;
}

// ============================================================================
// TYPING ANIMATION COMPONENT
// ============================================================================

export const TypingCode: React.FC<{
  code: string;
  language: string;
  typingProgress: number;
  highlightLines: number[];
  cursorVisible: boolean;
  style?: VideoStyle;
}> = ({
  code,
  language,
  typingProgress,
  highlightLines,
  cursorVisible,
  style = 'dark'
}) => {
  const frame = useCurrentFrame();
  const lines = code.split('\n');
  const visibleChars = Math.floor(code.length * typingProgress);

  // Calculate which lines to show based on typing progress
  let charCount = 0;
  let visibleLines: string[] = [];
  let currentLinePartial = '';

  for (const line of lines) {
    if (charCount + line.length + 1 <= visibleChars) {
      visibleLines.push(line);
      charCount += line.length + 1;
    } else {
      currentLinePartial = line.slice(0, visibleChars - charCount);
      visibleLines.push(currentLinePartial);
      break;
    }
  }

  const colors = {
    dark: {
      bg: '#1e1e1e',
      text: '#d4d4d4',
      keyword: '#569cd6',
      string: '#ce9178',
      number: '#b5cea8',
      comment: '#6a9955',
      highlight: '#264f78',
      cursor: '#aeafad'
    },
    light: {
      bg: '#ffffff',
      text: '#1e1e1e',
      keyword: '#0000ff',
      string: '#a31515',
      number: '#098658',
      comment: '#008000',
      highlight: '#fff3cd',
      cursor: '#000000'
    },
    modern: {
      bg: '#0d1117',
      text: '#c9d1d9',
      keyword: '#ff7b72',
      string: '#a5d6ff',
      number: '#79c0ff',
      comment: '#8b949e',
      highlight: '#1f6feb44',
      cursor: '#58a6ff'
    }
  };

  const theme = colors[style] || colors.dark;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        borderRadius: 12,
        padding: 24,
        fontFamily: 'JetBrains Mono, Fira Code, monospace',
        fontSize: 18,
        lineHeight: 1.6,
        overflow: 'hidden',
      }}
    >
      {/* Window controls */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 16,
        display: 'flex',
        gap: 8
      }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f56' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#27c93f' }} />
      </div>

      {/* Code content */}
      <div style={{ marginTop: 24 }}>
        {visibleLines.map((line, index) => (
          <div
            key={index}
            style={{
              backgroundColor: highlightLines.includes(index + 1)
                ? theme.highlight
                : 'transparent',
              padding: '0 8px',
              whiteSpace: 'pre',
              color: theme.text,
            }}
          >
            <span style={{ color: '#6e7681', marginRight: 16, userSelect: 'none' }}>
              {String(index + 1).padStart(3, ' ')}
            </span>
            <span dangerouslySetInnerHTML={{
              __html: highlightSyntax(line, language, theme)
            }} />
            {cursorVisible && index === visibleLines.length - 1 && (
              <span style={{
                borderLeft: `2px solid ${theme.cursor}`,
                marginLeft: 1,
                animation: 'blink 1s infinite'
              }}>&nbsp;</span>
            )}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// TERMINAL ANIMATION COMPONENT
// ============================================================================

export const TerminalAnimation: React.FC<{
  command: string;
  output: string;
  typingProgress: number;
  style?: VideoStyle;
}> = ({ command, output, typingProgress, style = 'dark' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const visibleCommand = command.slice(0, Math.floor(command.length * typingProgress));
  const showOutput = typingProgress >= 1;
  const outputOpacity = showOutput
    ? interpolate(typingProgress - 1, 0, 0.3, 0, 1)
    : 0;

  const colors = {
    dark: { bg: '#1e1e1e', prompt: '#4ec9b0', text: '#d4d4d4', success: '#4fc3f7', error: '#f44747' },
    light: { bg: '#f5f5f5', prompt: '#008000', text: '#1e1e1e', success: '#0066cc', error: '#cc0000' },
    modern: { bg: '#0d1117', prompt: '#58a6ff', text: '#c9d1d9', success: '#3fb950', error: '#f85149' }
  };

  const theme = colors[style] || colors.dark;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        borderRadius: 12,
        padding: 24,
        fontFamily: 'JetBrains Mono, Fira Code, monospace',
        fontSize: 16,
        lineHeight: 1.5,
      }}
    >
      {/* Window controls */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 16,
        display: 'flex',
        gap: 8
      }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f56' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#27c93f' }} />
      </div>

      {/* Terminal content */}
      <div style={{ marginTop: 24 }}>
        <div>
          <span style={{ color: theme.prompt }}>$ </span>
          <span style={{ color: theme.text }}>{visibleCommand}</span>
          {typingProgress < 1 && (
            <span style={{
              borderLeft: '2px solid #fff',
              animation: 'blink 1s infinite'
            }}>&nbsp;</span>
          )}
        </div>

        {showOutput && (
          <div
            style={{
              color: theme.text,
              opacity: outputOpacity,
              marginTop: 8,
              whiteSpace: 'pre-wrap'
            }}
          >
            {output}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// INTRO/OUTRO COMPONENTS
// ============================================================================

export const IntroSequence: React.FC<{
  title: string;
  subtitle?: string;
  style?: VideoStyle;
}> = ({ title, subtitle, style = 'modern' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp'
  });

  const titleScale = spring({
    frame,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
      mass: 0.5
    }
  });

  const subtitleOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateRight: 'clamp'
  });

  const gradients = {
    dark: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    light: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    modern: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%)',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minimal: '#ffffff'
  };

  return (
    <AbsoluteFill
      style={{
        background: gradients[style] || gradients.modern,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          textAlign: 'center'
        }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: style === 'light' ? '#1a1a2e' : '#ffffff',
            margin: 0,
            textShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: 28,
              color: style === 'light' ? '#4a5568' : '#a0aec0',
              marginTop: 16,
              opacity: subtitleOpacity
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const OutroSequence: React.FC<{
  title?: string;
  cta?: string;
  style?: VideoStyle;
}> = ({ title = 'Thank You', cta = 'Created with Auto-Demo', style = 'modern' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: {
      damping: 10,
      stiffness: 80
    }
  });

  const gradients = {
    dark: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    light: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    modern: 'linear-gradient(135deg, #0d1117 0%, #21262d 100%)',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minimal: '#ffffff'
  };

  return (
    <AbsoluteFill
      style={{
        background: gradients[style] || gradients.modern,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
      }}
    >
      <div style={{ transform: `scale(${scale})`, textAlign: 'center' }}>
        <h1
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: style === 'light' ? '#1a1a2e' : '#ffffff',
            margin: 0
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 24,
            color: style === 'light' ? '#4a5568' : '#718096',
            marginTop: 24
          }}
        >
          {cta}
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// MAIN DEMO VIDEO COMPOSITION
// ============================================================================

export const DemoVideoComposition: React.FC<{
  steps: DemoStepVideo[];
  config: DemoVideoConfig;
}> = ({ steps, config }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  let currentFrame = 0;

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {steps.map((step, index) => {
        const startFrame = currentFrame;
        currentFrame += step.durationInFrames;

        return (
          <Sequence
            key={step.id}
            from={startFrame}
            durationInFrames={step.durationInFrames}
          >
            <DemoStepComponent step={step} config={config} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const DemoStepComponent: React.FC<{
  step: DemoStepVideo;
  config: DemoVideoConfig;
}> = ({ step, config }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const progress = frame / durationInFrames;
  const typingProgress = Math.min(progress * 1.5, 1);

  switch (step.type) {
    case 'intro':
      return (
        <IntroSequence
          title={step.title}
          subtitle={step.description}
          style={config.style}
        />
      );

    case 'outro':
      return (
        <OutroSequence
          title={step.title}
          cta={step.description}
          style={config.style}
        />
      );

    case 'code':
      return (
        <AbsoluteFill style={{ padding: 40 }}>
          <TypingCode
            code={step.codeFrame?.code || ''}
            language={step.codeFrame?.language || 'typescript'}
            typingProgress={typingProgress}
            highlightLines={step.codeFrame?.highlightLines || []}
            cursorVisible={true}
            style={config.style}
          />
        </AbsoluteFill>
      );

    case 'terminal':
      return (
        <AbsoluteFill style={{ padding: 40 }}>
          <TerminalAnimation
            command={step.codeFrame?.code || ''}
            output={step.terminalOutput || ''}
            typingProgress={typingProgress}
            style={config.style}
          />
        </AbsoluteFill>
      );

    default:
      return null;
  }
};

// ============================================================================
// SYNTAX HIGHLIGHTING
// ============================================================================

function highlightSyntax(code: string, language: string, theme: any): string {
  let highlighted = code
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Keywords
  const keywords: Record<string, string[]> = {
    typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'interface', 'type', 'import', 'export', 'from', 'async', 'await', 'new', 'this', 'extends', 'implements'],
    javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'new', 'this'],
    python: ['def', 'class', 'return', 'if', 'else', 'elif', 'for', 'while', 'import', 'from', 'as', 'with', 'try', 'except', 'finally', 'raise', 'async', 'await', 'self'],
    rust: ['fn', 'let', 'mut', 'pub', 'struct', 'enum', 'impl', 'trait', 'use', 'mod', 'self', 'Self', 'async', 'await', 'return', 'if', 'else', 'match', 'loop', 'while', 'for']
  };

  const langKeywords = keywords[language] || keywords.typescript;

  for (const keyword of langKeywords) {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
    highlighted = highlighted.replace(regex, `<span style="color: ${theme.keyword}">$1</span>`);
  }

  // Strings
  highlighted = highlighted.replace(
    /(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g,
    `<span style="color: ${theme.string}">$&</span>`
  );

  // Numbers
  highlighted = highlighted.replace(
    /\b(\d+\.?\d*)\b/g,
    `<span style="color: ${theme.number}">$1</span>`
  );

  // Comments
  highlighted = highlighted.replace(
    /(\/\/.*$)|(\/\*[\s\S]*?\*\/)/gm,
    `<span style="color: ${theme.comment}">$&</span>`
  );

  return highlighted;
}

// ============================================================================
// VIDEO CONFIGURATION BUILDER
// ============================================================================

export function buildVideoConfig(
  steps: DemoStepVideo[],
  options: Partial<DemoVideoConfig> = {}
): DemoVideoConfig {
  const totalFrames = steps.reduce((sum, step) => sum + step.durationInFrames, 0);

  return {
    id: options.id || `video-${Date.now()}`,
    name: options.name || 'Demo Video',
    width: options.width || 1920,
    height: options.height || 1080,
    fps: options.fps || 30,
    durationInFrames: totalFrames,
    style: options.style || 'modern',
    includeNarration: options.includeNarration ?? false,
    includeCodeHighlights: options.includeCodeHighlights ?? true,
    background: options.background || {
      type: 'gradient',
      value: '#0d1117',
      secondaryValue: '#21262d'
    },
    music: options.music
  };
}

export function createCodeStep(
  title: string,
  code: string,
  language: string = 'typescript',
  durationSeconds: number = 5,
  fps: number = 30
): DemoStepVideo {
  return {
    id: `step-${Date.now()}`,
    title,
    description: '',
    durationInFrames: durationSeconds * fps,
    type: 'code',
    codeFrame: {
      code,
      language,
      highlightLines: [],
      cursorPosition: { line: 1, column: 1 },
      typingProgress: 0
    }
  };
}

export function createTerminalStep(
  command: string,
  output: string,
  durationSeconds: number = 3,
  fps: number = 30
): DemoStepVideo {
  return {
    id: `step-${Date.now()}`,
    title: 'Terminal',
    description: '',
    durationInFrames: durationSeconds * fps,
    type: 'terminal',
    codeFrame: {
      code: command,
      language: 'bash',
      highlightLines: [],
      cursorPosition: { line: 1, column: 1 },
      typingProgress: 0
    },
    terminalOutput: output
  };
}

export default {
  DemoVideoComposition,
  TypingCode,
  TerminalAnimation,
  IntroSequence,
  OutroSequence,
  buildVideoConfig,
  createCodeStep,
  createTerminalStep
};
