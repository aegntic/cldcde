/**
 * AEGNTIC Website Intelligence Engine (WIE)
 *
 * Public API barrel. The engine analyzes a reference website and produces
 * an original, reusable, production-ready template ecosystem.
 *
 * Core principle: Analyze, don't copy. The engine extracts systems — not
 * copyrighted creative assets. Expressive content is replaced with semantic
 * placeholders. The output is reusable components, sections, motion presets,
 * design tokens, and manifests.
 *
 * Usage:
 *   import { runWIE } from "@aegntic/wie";
 *   const result = await runWIE({ url: "https://example.com" });
 */

// ── Engine ──────────────────────────────────────────────────────────
export { runWIE } from "./engine.js";
export type { CapturedPageData, CaptureResult } from "./engine.js";

// ── Types ───────────────────────────────────────────────────────────
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
} from "./types.js";

// ── Agents (for advanced usage) ─────────────────────────────────────
export { runDiscovery } from "./agents/discovery.js";
export { runIA } from "./agents/ia.js";
export { runMotionAgent } from "./agents/motion.js";
export type { MotionInput } from "./agents/motion.js";
export { runDesignSystemAgent } from "./agents/designSystem.js";
export type { DesignSystemInput } from "./agents/designSystem.js";
export { runComponentAgent } from "./agents/component.js";
export type { ComponentInput } from "./agents/component.js";
export { runSectionAgent } from "./agents/section.js";
export type { SectionInput } from "./agents/section.js";
export { runPlaceholderAgent } from "./agents/placeholder.js";
export type { PlaceholderInput } from "./agents/placeholder.js";
export { runMediaAgent } from "./agents/media.js";
export type { MediaInput } from "./agents/media.js";
export { runAccessibilityAgent } from "./agents/accessibility.js";
export { runPerformanceAgent } from "./agents/performance.js";
export { runSEOAgent } from "./agents/seo.js";
export { runCMSAgent } from "./agents/cms.js";
export { runBuilderAgent } from "./agents/builder.js";
export { runTimelineAgent } from "./agents/timeline.js";
export { runIntegrator, buildFolderArchitecture } from "./agents/integrator.js";
export { runQAAgent } from "./agents/qa.js";

// ── Pattern Recognition & Benchmarking ──────────────────────────────
export { runPatternRecognition, getArchetypes, classifyArchetype } from "./patterns.js";
export { runBenchmark } from "./benchmark.js";

// ── Utilities ───────────────────────────────────────────────────────
export { uuid, seqId, pascalCase, camelCase, kebabCase, detectPageType, wordCount } from "./util.js";
