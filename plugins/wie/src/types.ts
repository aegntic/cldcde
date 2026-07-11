/**
 * AEGNTIC Website Intelligence Engine — Type System
 *
 * All wire shapes for the WIE pipeline. Every type is designed to be
 * serializable to JSON and consumed by the Builder, CMS adapters, and
 * downstream code generators.
 */

// ---------------------------------------------------------------------------
// Core primitives
// ---------------------------------------------------------------------------

export type UUID = string;
export type SemVer = string;

export type BoundingBox = { x: number; y: number; width: number; height: number };

export type ResponsiveValue<T> = {
  base: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  "2xl"?: T;
};

export type BreakpointKey = "base" | "sm" | "md" | "lg" | "xl" | "2xl";

// ---------------------------------------------------------------------------
// Site Graph & Discovery
// ---------------------------------------------------------------------------

export type PageNode = {
  url: string;
  path: string;
  title: string;
  depth: number;
  sources: string[];
  pageType: PageType;
  status: "discovered" | "captured" | "skipped" | "error";
};

export type PageType =
  | "home"
  | "about"
  | "blog-index"
  | "blog-post"
  | "portfolio-index"
  | "portfolio-item"
  | "case-study-index"
  | "case-study-item"
  | "pricing"
  | "contact"
  | "legal"
  | "archive"
  | "landing"
  | "product"
  | "team"
  | "faq"
  | "search"
  | "404"
  | "unknown";

export type SiteGraph = {
  entryUrl: string;
  origin: string;
  crawledAt: string;
  totalPages: number;
  pages: PageNode[];
  edges: Array<{ from: string; to: string }>;
  robotsDisallow: string[];
};

// ---------------------------------------------------------------------------
// Page DNA
// ---------------------------------------------------------------------------

export type PageDNA = {
  uuid: UUID;
  url: string;
  path: string;
  title: string;
  pageType: PageType;
  purpose: string;
  narrative: string;
  ctas: CTA[];
  readingFlow: string[];
  motionComplexity: MotionComplexity;
  interactionComplexity: InteractionComplexity;
  seoWeight: number;
  accessibilityScore: number;
  sectionCount: number;
  componentCount: number;
  wordCount: number;
  loadTimeEstimate: number;
};

export type CTA = {
  text: string;
  href: string;
  variant: "primary" | "secondary" | "ghost" | "link";
  position: string;
};

export type MotionComplexity = "none" | "subtle" | "moderate" | "rich" | "cinematic";
export type InteractionComplexity = "static" | "light" | "moderate" | "heavy" | "complex";

// ---------------------------------------------------------------------------
// Section DNA
// ---------------------------------------------------------------------------

export type SectionDNA = {
  uuid: UUID;
  name: string;
  category: SectionCategory;
  archetype: string;
  parentId: UUID | null;
  childrenIds: UUID[];
  dependencies: string[];
  animationPresetId: string | null;
  responsiveRules: ResponsiveRule[];
  cmsSchemaId: string | null;
  placeholderSchemaIds: string[];
  mediaSchemaIds: string[];
  accessibility: SectionAccessibility;
  performanceCost: PerformanceCost;
  compatibilityScore: number;
  order: number;
  pagePath: string;
  bbox: BoundingBox;
};

export type SectionCategory =
  | "hero"
  | "navigation"
  | "header"
  | "feature-grid"
  | "content"
  | "gallery"
  | "timeline"
  | "testimonial"
  | "pricing"
  | "cta"
  | "contact"
  | "footer"
  | "sidebar"
  | "stats"
  | "logo-cloud"
  | "faq"
  | "team"
  | "blog-list"
  | "newsletter"
  | "marquee"
  | "tabs"
  | "accordion"
  | "carousel"
  | "video"
  | "map"
  | "form"
  | "custom";

export type ResponsiveRule = {
  breakpoint: BreakpointKey;
  behavior: "stack" | "grid" | "hidden" | "scroll" | "collapse" | "full-width";
  columns?: number;
  minHeight?: number;
};

export type SectionAccessibility = {
  landmark: string | null;
  headingLevel: number;
  ariaLabels: string[];
  focusOrder: number;
  issues: string[];
};

export type PerformanceCost = "minimal" | "low" | "moderate" | "high" | "heavy";

// ---------------------------------------------------------------------------
// Component DNA
// ---------------------------------------------------------------------------

export type ComponentDNA = {
  uuid: UUID;
  name: string;
  category: string;
  props: ComponentProp[];
  slots: ComponentSlot[];
  variants: ComponentVariant[];
  states: string[];
  tokenIds: string[];
  animationHookIds: string[];
  aria: ARIAProfile;
  responsiveBehaviour: string;
  themeSupport: string[];
  instances: number;
  sourceSections: string[];
};

export type ComponentProp = {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object" | "image" | "link" | "rich-text";
  required: boolean;
  defaultValue?: string;
  description: string;
  placeholderId?: string;
};

export type ComponentSlot = {
  name: string;
  type: "single" | "multiple";
  required: boolean;
  acceptedComponents: string[];
};

export type ComponentVariant = {
  name: string;
  description: string;
  tokenOverrides: Record<string, string>;
};

export type ARIAProfile = {
  role: string | null;
  labels: string[];
  patterns: string[];
  issues: string[];
};

// ---------------------------------------------------------------------------
// Motion DNA
// ---------------------------------------------------------------------------

export type MotionPreset = {
  id: string;
  name: string;
  category: MotionCategory;
  description: string;
  parameters: MotionParameters;
  triggers: MotionTrigger[];
  cssCode: string;
  jsCode: string | null;
  accessibility: {
    respectsReducedMotion: boolean;
    fallbackDescription: string;
  };
};

export type MotionCategory =
  | "scroll-smoothing"
  | "reveal"
  | "stagger"
  | "parallax"
  | "sticky"
  | "horizontal-scroll"
  | "page-transition"
  | "cursor"
  | "hover"
  | "loader"
  | "navigation"
  | "marquee"
  | "rotator"
  | "modal"
  | "accordion"
  | "carousel"
  | "tab-switch"
  | "dropdown"
  | "tooltip"
  | "pulse"
  | "shake"
  | "bounce"
  | "slide"
  | "fade"
  | "scale"
  | "custom";

export type MotionParameters = {
  duration: number;
  delay: number;
  easing: string;
  stagger?: number;
  threshold?: number;
  iterations?: number;
  direction?: string;
  fill?: string;
  damping?: number;
  inertia?: number;
  momentum?: number;
  scrollSmoothness?: number;
  viewportThreshold?: number;
};

export type MotionTrigger = {
  event: "scroll" | "hover" | "click" | "load" | "focus" | "intersection" | "resize" | "manual";
  threshold?: number;
  selector?: string;
};

export type MotionDNA = {
  presets: MotionPreset[];
  scrollSmoothing: ScrollSmoothing;
  easingPhilosophy: EasingPhilosophy;
  revealSequencing: RevealSequencing;
  staggerCadence: number;
  viewportThresholds: number[];
  stickyLogic: StickyLogic[];
  horizontalStorytelling: boolean;
  pageTransitions: PageTransitionProfile | null;
  cursorBehaviour: CursorBehaviour | null;
  hoverInterpolation: HoverInterpolation;
  loaderChoreography: LoaderChoreography | null;
  navigationChoreography: NavigationChoreography | null;
  visualPacing: VisualPacing;
  emotionalRhythm: EmotionalRhythm;
  transitionLanguage: TransitionLanguage;
};

export type ScrollSmoothing = {
  enabled: boolean;
  type: "native" | "lenis" | "locomotive" | "gsap" | "custom";
  parameters: Record<string, number>;
};

export type EasingPhilosophy = {
  primary: string;
  secondary: string;
  enter: string;
  exit: string;
  customCurves: Array<{ name: string; cubicBezier: [number, number, number, number] }>;
};

export type RevealSequencing = {
  strategy: "sequential" | "simultaneous" | "cascade" | "staggered" | "threshold-gated";
  defaultDelay: number;
  defaultStagger: number;
};

export type StickyLogic = {
  selector: string;
  offset: number;
  behaviour: "stick" | "stick-and-shrink" | "stick-and-hide" | "stacking";
};

export type PageTransitionProfile = {
  type: "fade" | "slide" | "morph" | "clip" | "none";
  duration: number;
  easing: string;
};

export type CursorBehaviour = {
  type: "default" | "custom" | "magnetic" | "trailing" | "blend";
  parameters: Record<string, number>;
};

export type HoverInterpolation = {
  duration: number;
  easing: string;
  properties: string[];
};

export type LoaderChoreography = {
  type: "spinner" | "progress" | "skeleton" | "counter" | "curtain" | "none";
  duration: number;
  exitAnimation: string;
};

export type NavigationChoreography = {
  mobile: "slide-in" | "overlay" | "drawer" | "fullscreen" | "dropdown";
  desktop: "dropdown" | "mega-menu" | "none";
  duration: number;
  easing: string;
};

export type VisualPacing = {
  rhythm: "fast" | "medium" | "slow" | "deliberate";
  breathingRoom: number;
  compressionExpansion: boolean;
};

export type EmotionalRhythm = {
  tone: "calm" | "energetic" | "dramatic" | "playful" | "corporate" | "luxurious";
  intensity: number;
  peaks: string[];
};

export type TransitionLanguage = {
  shared: string[];
  perSection: Array<{ sectionId: string; transitions: string[] }>;
};

// ---------------------------------------------------------------------------
// Experience Timeline
// ---------------------------------------------------------------------------

export type TimelineEvent = {
  order: number;
  pagePath: string;
  sectionName: string;
  whatAppears: string;
  whyItAppears: string;
  motion: string;
  intent: string;
  cta: string | null;
  narrativeRole: string;
};

export type ExperienceTimeline = {
  events: TimelineEvent[];
};

// ---------------------------------------------------------------------------
// Placeholder Intelligence
// ---------------------------------------------------------------------------

export type PlaceholderSchema = {
  id: string;
  key: string;
  purpose: string;
  type: PlaceholderType;
  recommendedLength: string;
  tone: string;
  accessibilityGuidance: string;
  seoGuidance: string;
  example: string;
  componentId?: string;
  sectionId?: string;
};

export type PlaceholderType =
  | "headline"
  | "subheadline"
  | "body"
  | "label"
  | "button-text"
  | "link-text"
  | "caption"
  | "alt-text"
  | "meta-title"
  | "meta-description"
  | "nav-item"
  | "tag"
  | "quote"
  | "author"
  | "role"
  | "date"
  | "stat-label"
  | "stat-value"
  | "price"
  | "feature-title"
  | "feature-description"
  | "custom";

export type PlaceholderCatalog = {
  placeholders: PlaceholderSchema[];
};

// ---------------------------------------------------------------------------
// Asset / Media Intelligence
// ---------------------------------------------------------------------------

export type MediaSchema = {
  id: string;
  name: string;
  type: "image" | "video" | "svg" | "icon" | "lottie" | "audio" | "3d";
  aspectRatio: string;
  focalPoint: { x: number; y: number };
  minSize: { width: number; height: number };
  responsiveVariants: ResponsiveVariant[];
  altText: string;
  caption: string | null;
  compressionProfile: CompressionProfile;
  uploadZone: boolean;
  sectionId?: string;
  componentId?: string;
};

export type ResponsiveVariant = {
  breakpoint: BreakpointKey;
  width: number;
  height: number;
  format: "webp" | "avif" | "jpg" | "png" | "svg";
};

export type CompressionProfile = {
  quality: number;
  format: "webp" | "avif" | "jpg" | "png" | "svg";
  progressive: boolean;
  lazy: boolean;
};

// ---------------------------------------------------------------------------
// Design Tokens
// ---------------------------------------------------------------------------

export type DesignTokens = {
  colors: Record<string, string>;
  spacing: Record<string, string>;
  typography: TypographyTokens;
  radius: Record<string, string>;
  shadows: Record<string, string>;
  blur: Record<string, string>;
  animation: Record<string, string>;
  opacity: Record<string, string>;
  containers: Record<string, string>;
  grids: GridTokens;
};

export type TypographyTokens = {
  fontFamily: Record<string, string>;
  fontSize: Record<string, string>;
  fontWeight: Record<string, string>;
  lineHeight: Record<string, string>;
  letterSpacing: Record<string, string>;
  textStyle: Record<string, TextStyleToken>;
};

export type TextStyleToken = {
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  fontFamily: string;
};

export type GridTokens = {
  columns: Record<string, number>;
  gutter: Record<string, string>;
  margin: Record<string, string>;
  maxWidth: string;
};

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

export type ThemeDefinition = {
  name: string;
  description: string;
  tokenOverrides: Record<string, Record<string, string>>;
  motionOverrides: Record<string, Partial<MotionParameters>>;
  typographyOverrides: Partial<TypographyTokens>;
};

export type ThemeName =
  | "editorial"
  | "glass"
  | "luxury"
  | "minimal"
  | "corporate"
  | "fashion"
  | "cyber"
  | "brutalist"
  | "monochrome"
  | "museum";

// ---------------------------------------------------------------------------
// CMS Schema
// ---------------------------------------------------------------------------

export type CMSSchema = {
  cms: CMSPlatform;
  collections: CMSCollection[];
  globals: CMSGlobal[];
};

export type CMSPlatform = "payload" | "sanity" | "strapi" | "contentful" | "json" | "markdown";

export type CMSCollection = {
  name: string;
  slug: string;
  label: string;
  fields: CMSField[];
};

export type CMSGlobal = {
  name: string;
  label: string;
  fields: CMSField[];
};

export type CMSField = {
  name: string;
  type: string;
  label: string;
  required: boolean;
  localized: boolean;
  defaultValue?: string;
  options?: string[];
  fields?: CMSField[];
  validation?: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// Pattern Recognition
// ---------------------------------------------------------------------------

export type PatternArchetype = {
  id: string;
  name: string;
  category: SectionCategory;
  description: string;
  characteristics: string[];
  detectedIn: string[];
  recommendedSections: string[];
};

export type PatternRecognition = {
  archetypes: PatternArchetype[];
  detectedPatterns: DetectedPattern[];
};

export type DetectedPattern = {
  archetypeId: string;
  pagePath: string;
  sectionId: string;
  confidence: number;
};

// ---------------------------------------------------------------------------
// Benchmarking
// ---------------------------------------------------------------------------

export type BenchmarkScore = {
  performance: number;
  accessibility: number;
  seo: number;
  animationDensity: number;
  complexity: number;
  bundleEstimate: number;
  overall: number;
};

// ---------------------------------------------------------------------------
// Builder Specification
// ---------------------------------------------------------------------------

export type BuilderSpecification = {
  features: BuilderFeature[];
  panels: BuilderPanel[];
  aiFeatures: BuilderAIFeature[];
};

export type BuilderFeature =
  | "drag-drop"
  | "reorder"
  | "duplicate"
  | "delete"
  | "lock"
  | "hide"
  | "save-preset"
  | "convert-to-global";

export type BuilderPanel =
  | "sections"
  | "components"
  | "motion"
  | "typography"
  | "tokens"
  | "media"
  | "seo"
  | "accessibility"
  | "cms"
  | "responsive";

export type BuilderAIFeature = {
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
};

// ---------------------------------------------------------------------------
// Compatibility & Responsive
// ---------------------------------------------------------------------------

export type CompatibilityGraph = {
  nodes: Array<{ id: string; type: "section" | "component" | "motion"; name: string }>;
  edges: Array<{ from: string; to: string; relationship: string }>;
};

export type ResponsiveMatrix = {
  breakpoints: Record<BreakpointKey, number>;
  sections: Array<{
    sectionId: string;
    rules: Record<BreakpointKey, ResponsiveRule>;
  }>;
};

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export type AccessibilityReport = {
  overallScore: number;
  issues: AccessibilityIssue[];
  passes: string[];
  wcagLevel: "A" | "AA" | "AAA";
  perSection: Array<{ sectionId: string; score: number; issues: string[] }>;
};

export type AccessibilityIssue = {
  severity: "critical" | "serious" | "moderate" | "minor";
  rule: string;
  description: string;
  element: string;
  recommendation: string;
};

export type PerformanceReport = {
  overallScore: number;
  metrics: PerformanceMetrics;
  recommendations: string[];
  bundleEstimate: number;
  perSection: Array<{ sectionId: string; cost: PerformanceCost; score: number }>;
};

export type PerformanceMetrics = {
  fcpEstimate: number;
  lcpEstimate: number;
  clsEstimate: number;
  tbtEstimate: number;
  totalJsEstimate: number;
  totalCssEstimate: number;
  imageCount: number;
  fontCount: number;
};

export type SEOReport = {
  overallScore: number;
  issues: SEOIssue[];
  passes: string[];
  perPage: Array<{ pagePath: string; score: number; issues: string[] }>;
};

export type SEOIssue = {
  severity: "critical" | "warning" | "info";
  rule: string;
  description: string;
  recommendation: string;
};

// ---------------------------------------------------------------------------
// QA Report
// ---------------------------------------------------------------------------

export type QAReport = {
  passed: boolean;
  checks: QACheck[];
  iterations: number;
  maxIterations: number;
};

export type QACheck = {
  name: string;
  category: "schemas" | "placeholders" | "manifests" | "motion-presets" | "accessibility" | "responsive" | "naming";
  passed: boolean;
  message: string;
};

// ---------------------------------------------------------------------------
// Template Manifest (Final Output)
// ---------------------------------------------------------------------------

export type TemplateManifest = {
  templateId: UUID;
  version: SemVer;
  generatedAt: string;
  sourceUrl: string;
  designSystem: DesignTokens;
  motionDNA: MotionDNA;
  interactionDNA: InteractionDNA;
  pageDNA: PageDNA[];
  sectionLibrary: SectionDNA[];
  componentLibrary: ComponentDNA[];
  designTokens: DesignTokens;
  animationLibrary: MotionPreset[];
  placeholderCatalog: PlaceholderCatalog;
  cmsSchema: CMSSchema[];
  compatibilityGraph: CompatibilityGraph;
  responsiveMatrix: ResponsiveMatrix;
  accessibilityReport: AccessibilityReport;
  performanceReport: PerformanceReport;
  seoReport: SEOReport;
  experienceTimeline: ExperienceTimeline;
  mediaSchemas: MediaSchema[];
  patternRecognition: PatternRecognition;
  benchmark: BenchmarkScore;
  builderSpec: BuilderSpecification;
  themes: ThemeDefinition[];
  qaReport: QAReport;
  siteGraph: SiteGraph;
};

export type InteractionDNA = {
  totalInteractions: number;
  categories: Record<string, number>;
  patterns: InteractionPattern[];
};

export type InteractionPattern = {
  name: string;
  type: string;
  description: string;
  trigger: string;
  effect: string;
};

// ---------------------------------------------------------------------------
// Engine Options & Result
// ---------------------------------------------------------------------------

export type WIEOptions = {
  url: string;
  maxPages?: number;
  maxDepth?: number;
  viewports?: number[];
  outputDir?: string;
  captureConcurrency?: number;
  cmsPlatforms?: CMSPlatform[];
  themes?: ThemeName[];
  log?: (e: Record<string, unknown>) => void;
};

export type WIEResult = {
  manifest: TemplateManifest;
  outputDir: string;
  files: string[];
};

// ---------------------------------------------------------------------------
// Folder Architecture
// ---------------------------------------------------------------------------

export type FolderArchitecture = {
  root: string;
  structure: FolderNode[];
};

export type FolderNode = {
  name: string;
  type: "directory" | "file";
  description: string;
  children?: FolderNode[];
};
