/**
 * AEGNTIC Website Intelligence Engine (WIE)
 *
 * Standalone plugin for the cldcde platform.
 * Analyzes a reference website and produces an original, reusable,
 * production-ready template ecosystem.
 *
 * Usage:
 *   npx tsx src/cli.ts <URL> --output <dir>
 *
 * Programmatic:
 *   import { runWIE } from '@aegntic/cldcde-wie';
 *   const result = await runWIE({ url: 'https://example.com' });
 */

export { runWIE } from './src/engine.js';
export type { CapturedPageData, CaptureResult } from './src/engine.js';

export type {
  WIEOptions,
  WIEResult,
  TemplateManifest,
  SiteGraph,
  PageNode,
  PageType,
  PageDNA,
  CTA,
  MotionComplexity,
  InteractionComplexity,
  SectionDNA,
  SectionCategory,
  ResponsiveRule,
  SectionAccessibility,
  PerformanceCost,
  ComponentDNA,
  ComponentProp,
  ComponentSlot,
  ComponentVariant,
  ARIAProfile,
  MotionPreset,
  MotionCategory,
  MotionParameters,
  MotionTrigger,
  MotionDNA,
  ScrollSmoothing,
  EasingPhilosophy,
  RevealSequencing,
  StickyLogic,
  PageTransitionProfile,
  CursorBehaviour,
  HoverInterpolation,
  LoaderChoreography,
  NavigationChoreography,
  VisualPacing,
  EmotionalRhythm,
  TransitionLanguage,
  ExperienceTimeline,
  TimelineEvent,
  PlaceholderSchema,
  PlaceholderType,
  PlaceholderCatalog,
  MediaSchema,
  ResponsiveVariant,
  CompressionProfile,
  DesignTokens,
  TypographyTokens,
  TextStyleToken,
  GridTokens,
  ThemeDefinition,
  ThemeName,
  CMSSchema,
  CMSPlatform,
  CMSCollection,
  CMSGlobal,
  CMSField,
  PatternArchetype,
  PatternRecognition,
  DetectedPattern,
  BenchmarkScore,
  BuilderSpecification,
  BuilderFeature,
  BuilderPanel,
  BuilderAIFeature,
  CompatibilityGraph,
  ResponsiveMatrix,
  AccessibilityReport,
  AccessibilityIssue,
  PerformanceReport,
  PerformanceMetrics,
  SEOReport,
  SEOIssue,
  QAReport,
  QACheck,
  InteractionDNA,
  InteractionPattern,
  FolderArchitecture,
  FolderNode,
  BoundingBox,
  ResponsiveValue,
  BreakpointKey,
  UUID,
  SemVer,
} from './src/types.js';

export { runDiscovery } from './src/agents/discovery.js';
export { runIA } from './src/agents/ia.js';
export { runMotionAgent } from './src/agents/motion.js';
export type { MotionInput } from './src/agents/motion.js';
export { runDesignSystemAgent } from './src/agents/designSystem.js';
export type { DesignSystemInput } from './src/agents/designSystem.js';
export { runComponentAgent } from './src/agents/component.js';
export type { ComponentInput } from './src/agents/component.js';
export { runSectionAgent } from './src/agents/section.js';
export type { SectionInput } from './src/agents/section.js';
export { runPlaceholderAgent } from './src/agents/placeholder.js';
export type { PlaceholderInput } from './src/agents/placeholder.js';
export { runMediaAgent } from './src/agents/media.js';
export type { MediaInput } from './src/agents/media.js';
export { runAccessibilityAgent } from './src/agents/accessibility.js';
export { runPerformanceAgent } from './src/agents/performance.js';
export { runSEOAgent } from './src/agents/seo.js';
export { runCMSAgent } from './src/agents/cms.js';
export { runBuilderAgent } from './src/agents/builder.js';
export { runTimelineAgent } from './src/agents/timeline.js';
export { runIntegrator, buildFolderArchitecture } from './src/agents/integrator.js';
export { runQAAgent } from './src/agents/qa.js';
export { runPatternRecognition, getArchetypes, classifyArchetype } from './src/patterns.js';
export { runBenchmark } from './src/benchmark.js';
export { uuid, seqId, pascalCase, camelCase, kebabCase, detectPageType, wordCount } from './src/util.js';

export const VERSION = '1.0.0';
export const AGENTS = [
  'discovery',
  'ia',
  'motion',
  'design-system',
  'component',
  'section',
  'placeholder',
  'media',
  'accessibility',
  'performance',
  'seo',
  'cms',
  'builder',
  'timeline',
  'integrator',
] as const;
export const OUTPUT_FILES = [
  'manifest.json',
  'sections.json',
  'components.json',
  'motions.json',
  'pages.json',
  'tokens.json',
  'placeholders.json',
  'compatibility.json',
  'media.json',
  'cms.json',
  'timeline.json',
  'accessibility.json',
  'performance.json',
  'seo.json',
  'benchmark.json',
  'site-graph.json',
  'builder-spec.json',
  'themes.json',
  'patterns.json',
  'qa.json',
  'folder-architecture.json',
  'executive-summary.md',
] as const;
