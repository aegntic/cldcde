/**
 * WIE Engine — the main orchestrator that runs the full 15-agent pipeline:
 *
 *  1.  Discovery Agent       — crawl site, build page graph
 *  2.  Crawl Agent           — capture each page (delegated to compiler)
 *  3.  IA Agent              — information architecture analysis
 *  4.  Motion DNA Agent      — extract reusable MotionPresets
 *  5.  Design System Agent   — infer design tokens
 *  6.  Component Agent       — build component library
 *  7.  Section Agent         — build section library
 *  8.  Placeholder Agent     — generate semantic placeholders
 *  9.  Media Agent           — asset intelligence
 *  10. Accessibility Agent   — WCAG evaluation
 *  11. Performance Agent     — metrics & bundle estimation
 *  12. SEO Agent             — SEO readiness evaluation
 *  13. CMS Agent             — multi-platform schema generation
 *  14. Builder Agent         — builder specification
 *  15. Timeline Agent        — experience timeline
 *
 *  Final: Integrator + QA Gate → TemplateManifest
 */
import type {
  WIEOptions,
  WIEResult,
  TemplateManifest,
  SiteGraph,
  PageDNA,
  SectionDNA,
  ComponentDNA,
  MotionDNA,
  MotionPreset,
  DesignTokens,
  PlaceholderCatalog,
  CMSSchema,
  MediaSchema,
  ThemeDefinition,
  InteractionDNA,
  ExperienceTimeline,
  PatternRecognition,
  BenchmarkScore,
  AccessibilityReport,
  PerformanceReport,
  SEOReport,
  BuilderSpecification,
  QAReport,
  CompatibilityGraph,
  ResponsiveMatrix,
  FolderArchitecture,
} from "./types.js";
import { runDiscovery } from "./agents/discovery.js";
import { runIA } from "./agents/ia.js";
import { runMotionAgent, type MotionInput } from "./agents/motion.js";
import { runDesignSystemAgent, type DesignSystemInput } from "./agents/designSystem.js";
import { runComponentAgent, type ComponentInput } from "./agents/component.js";
import { runSectionAgent, type SectionInput } from "./agents/section.js";
import { runPlaceholderAgent, type PlaceholderInput } from "./agents/placeholder.js";
import { runMediaAgent, type MediaInput } from "./agents/media.js";
import { runAccessibilityAgent } from "./agents/accessibility.js";
import { runPerformanceAgent } from "./agents/performance.js";
import { runSEOAgent } from "./agents/seo.js";
import { runCMSAgent } from "./agents/cms.js";
import { runBuilderAgent } from "./agents/builder.js";
import { runTimelineAgent } from "./agents/timeline.js";
import { runIntegrator, buildFolderArchitecture } from "./agents/integrator.js";
import { runQAAgent } from "./agents/qa.js";
import { runPatternRecognition } from "./patterns.js";
import { runBenchmark } from "./benchmark.js";
import { emitOutput } from "./emitter.js";
import { resetCounter } from "./util.js";

export type CapturedPageData = {
  url: string;
  path: string;
  title: string;
  sections: Array<{ id: string; role: string; order: number; nodeId: string; text: string; bboxByVp?: Record<number, { x: number; y: number; width: number; height: number }> }>;
  tokens?: DesignSystemInput;
  motion?: MotionInput;
  components?: ComponentInput;
  media?: MediaInput;
  ctas?: Array<{ text: string; href: string; variant: "primary" | "secondary" | "ghost" | "link"; position: string }>;
  seo?: { hasMetaDescription: boolean; hasOpenGraph: boolean; hasJSONLD: boolean; hasCanonical: boolean };
};

export type CaptureResult = {
  crawlPaths: string[];
  crawlDepths: Record<string, number>;
  crawlSources: Record<string, string[]>;
  robotsDisallow: string[];
  origin: string;
  titles: Record<string, string>;
  pages: CapturedPageData[];
};

export async function runWIE(opts: WIEOptions): Promise<WIEResult> {
  const { url, outputDir = "./wie-output", log = () => {} } = opts;
  resetCounter();
  log({ phase: "start", url });

  // ── Phase 1: Capture ──────────────────────────────────────────────
  // The caller provides captured page data (from the compiler or a mock).
  // The engine itself is capture-agnostic — it works on any captured data.
  const capture = opts as unknown as { capture?: CaptureResult };
  const captured: CaptureResult = capture.capture ?? defaultCapture(url);

  // ── Agent 1: Discovery ────────────────────────────────────────────
  const { siteGraph } = runDiscovery({
    entryUrl: url,
    crawlPaths: captured.crawlPaths,
    crawlDepths: captured.crawlDepths,
    crawlSources: captured.crawlSources,
    robotsDisallow: captured.robotsDisallow,
    origin: captured.origin,
    titles: captured.titles,
    maxPages: opts.maxPages,
    log,
  });

  // ── Agent 3: Information Architecture ─────────────────────────────
  const sectionsByPage: Record<string, Array<{ role: string; text: string }>> = {};
  const ctasByPage: Record<string, Array<{ text: string; href: string; variant: "primary" | "secondary" | "ghost" | "link"; position: string }>> = {};
  for (const page of captured.pages) {
    sectionsByPage[page.path] = page.sections.map((s) => ({ role: s.role, text: s.text }));
    ctasByPage[page.path] = page.ctas ?? [];
  }

  const { pageDNAs } = runIA({ siteGraph, sectionsByPage, ctasByPage, log });

  // ── Agent 4: Motion DNA ───────────────────────────────────────────
  const allMotion: MotionInput = {
    waapiAnims: [],
    rotators: [],
    reveals: [],
    marquees: [],
    keyframes: [],
    interactions: [],
    transitions: [],
    stickyElements: [],
  };
  for (const page of captured.pages) {
    if (page.motion) {
      allMotion.waapiAnims?.push(...(page.motion.waapiAnims ?? []));
      allMotion.rotators?.push(...(page.motion.rotators ?? []));
      allMotion.reveals?.push(...(page.motion.reveals ?? []));
      allMotion.marquees?.push(...(page.motion.marquees ?? []));
      allMotion.keyframes?.push(...(page.motion.keyframes ?? []));
      allMotion.interactions?.push(...(page.motion.interactions ?? []));
      allMotion.transitions?.push(...(page.motion.transitions ?? []));
      allMotion.stickyElements?.push(...(page.motion.stickyElements ?? []));
    }
  }
  const motionDNA: MotionDNA = runMotionAgent({ input: allMotion, log });
  const motionPresetIds = motionDNA.presets.map((p) => p.id);

  // ── Agent 5: Design System ────────────────────────────────────────
  const designInput: DesignSystemInput = captured.pages[0]?.tokens ?? {};
  const { tokens: designTokens, themes } = runDesignSystemAgent({
    input: designInput,
    themes: opts.themes ?? ["editorial", "minimal", "corporate", "glass"],
    log,
  });
  const tokenIds = Object.keys(designTokens.colors);

  // ── Agent 6: Component ────────────────────────────────────────────
  const componentInput: ComponentInput = captured.pages[0]?.components ?? { clusters: [], primitives: [] };
  const componentLibrary: ComponentDNA[] = runComponentAgent({
    input: componentInput,
    tokenIds,
    motionPresetIds,
    log,
  });

  // ── Agent 7: Section ──────────────────────────────────────────────
  const allSectionDNAs: SectionDNA[] = [];
  const sectionsByPageMap = new Map<string, SectionDNA[]>();
  for (const page of captured.pages) {
    const sectionInput: SectionInput = {
      sections: page.sections,
      pagePath: page.path,
      motionPresetIds,
      placeholderSchemaIds: [],
      mediaSchemaIds: [],
    };
    const sectionDNAs = runSectionAgent({ input: sectionInput, log });
    allSectionDNAs.push(...sectionDNAs);
    sectionsByPageMap.set(page.path, sectionDNAs);
  }

  // ── Agent 8: Placeholder ──────────────────────────────────────────
  const placeholderInput: PlaceholderInput = {
    sections: captured.pages.flatMap((p) => p.sections.map((s) => ({ ...s, pagePath: p.path }))),
    components: componentLibrary.map((c) => ({
      name: c.name,
      props: c.props.map((p) => ({ name: p.name, type: p.type, description: p.description })),
    })),
  };
  const placeholderCatalog: PlaceholderCatalog = runPlaceholderAgent({ input: placeholderInput, log });
  const placeholderIds = placeholderCatalog.placeholders.map((p) => p.id);

  // ── Agent 9: Media ────────────────────────────────────────────────
  const mediaInput: MediaInput = captured.pages[0]?.media ?? { assets: [] };
  const mediaSchemas: MediaSchema[] = runMediaAgent({ input: mediaInput, log });
  const mediaIds = mediaSchemas.map((m) => m.id);

  // Link placeholders and media back to sections
  for (const section of allSectionDNAs) {
    if (section.placeholderSchemaIds.length === 0) {
      section.placeholderSchemaIds = placeholderIds.slice(0, 3);
    }
    if (section.mediaSchemaIds.length === 0) {
      section.mediaSchemaIds = mediaIds.slice(0, 2);
    }
  }

  // ── Agent 10: Accessibility ───────────────────────────────────────
  const accessibilityReport: AccessibilityReport = runAccessibilityAgent({
    sections: allSectionDNAs,
    hasForms: allSectionDNAs.some((s) => s.category === "form" || s.category === "contact" || s.category === "newsletter"),
    hasVideo: allSectionDNAs.some((s) => s.category === "video"),
    hasCarousel: allSectionDNAs.some((s) => s.category === "carousel"),
    log,
  });

  // ── Agent 11: Performance ─────────────────────────────────────────
  const performanceReport: PerformanceReport = runPerformanceAgent({
    sections: allSectionDNAs,
    components: componentLibrary,
    imageCount: mediaSchemas.length,
    fontCount: Object.keys(designTokens.typography.fontFamily).length,
    motionPresetCount: motionDNA.presets.length,
    log,
  });

  // ── Agent 12: SEO ─────────────────────────────────────────────────
  const seoData = captured.pages[0]?.seo ?? { hasMetaDescription: true, hasOpenGraph: true, hasJSONLD: false, hasCanonical: true };
  const seoReport: SEOReport = runSEOAgent({
    pageDNAs,
    sections: allSectionDNAs,
    ...seoData,
    log,
  });

  // ── Agent 13: CMS ─────────────────────────────────────────────────
  const cmsSchemas: CMSSchema[] = runCMSAgent({
    placeholders: placeholderCatalog.placeholders,
    components: componentLibrary,
    sections: allSectionDNAs,
    platforms: opts.cmsPlatforms ?? ["payload", "sanity", "strapi", "contentful", "json", "markdown"],
    log,
  });

  // ── Agent 14: Builder ─────────────────────────────────────────────
  const builderSpec: BuilderSpecification = runBuilderAgent({
    componentCount: componentLibrary.length,
    sectionCount: allSectionDNAs.length,
    motionPresetCount: motionDNA.presets.length,
    log,
  });

  // ── Agent 15: Timeline ────────────────────────────────────────────
  const experienceTimeline: ExperienceTimeline = runTimelineAgent({
    pageDNAs,
    sectionsByPage: sectionsByPageMap,
    motionPresets: motionDNA.presets,
    log,
  });

  // ── Pattern Recognition ───────────────────────────────────────────
  const patternRecognition: PatternRecognition = runPatternRecognition({
    sections: allSectionDNAs.map((s) => ({ id: s.uuid, role: s.name, category: s.category, pagePath: s.pagePath })),
    log,
  });

  // ── Interaction DNA ───────────────────────────────────────────────
  const interactionDNA: InteractionDNA = buildInteractionDNA(allMotion);

  // ── Final: Integrator ─────────────────────────────────────────────
  const manifest = runIntegrator({
    sourceUrl: url,
    siteGraph,
    pageDNAs,
    sectionLibrary: allSectionDNAs,
    componentLibrary,
    motionDNA,
    animationLibrary: motionDNA.presets,
    designTokens,
    placeholderCatalog,
    cmsSchemas,
    mediaSchemas,
    accessibilityReport,
    performanceReport,
    seoReport,
    experienceTimeline,
    patternRecognition,
    benchmark: { performance: 0, accessibility: 0, seo: 0, animationDensity: 0, complexity: 0, bundleEstimate: 0, overall: 0 },
    builderSpec,
    themes,
    qaReport: { passed: false, checks: [], iterations: 0, maxIterations: 3 },
    interactionDNA,
    log,
  });

  // ── Benchmark ─────────────────────────────────────────────────────
  manifest.benchmark = runBenchmark(manifest);

  // ── QA Gate ───────────────────────────────────────────────────────
  const qaReport: QAReport = runQAAgent({ manifest, maxIterations: 3, log });
  manifest.qaReport = qaReport;

  // ── Emit Output ───────────────────────────────────────────────────
  const folderArch = buildFolderArchitecture();
  const files = emitOutput(manifest, folderArch, { outputDir, log });

  log({ phase: "complete", templateId: manifest.templateId, files: files.length });

  return { manifest, outputDir, files };
}

function buildInteractionDNA(motion: MotionInput): InteractionDNA {
  const categories: Record<string, number> = {};
  const patterns: InteractionDNA["patterns"] = [];

  for (const i of motion.interactions ?? []) {
    categories[i.type] = (categories[i.type] ?? 0) + 1;
    patterns.push({
      name: i.type,
      type: i.type,
      description: i.description,
      trigger: i.selector,
      effect: i.description,
    });
  }

  const totalInteractions = Object.values(categories).reduce((a, b) => a + b, 0);
  return { totalInteractions, categories, patterns };
}

function defaultCapture(url: string): CaptureResult {
  const origin = new URL(url).origin;
  return {
    crawlPaths: ["/"],
    crawlDepths: { "/": 0 },
    crawlSources: { "/": ["entry"] },
    robotsDisallow: [],
    origin,
    titles: { "/": "Home" },
    pages: [
      {
        url,
        path: "/",
        title: "Home",
        sections: [
          { id: "section-001", role: "hero", order: 0, nodeId: "n0", text: "Welcome to our platform" },
          { id: "section-002", role: "features", order: 1, nodeId: "n1", text: "Key features and benefits" },
          { id: "section-003", role: "testimonial", order: 2, nodeId: "n2", text: "What our customers say" },
          { id: "section-004", role: "cta", order: 3, nodeId: "n3", text: "Get started today" },
          { id: "section-005", role: "footer", order: 4, nodeId: "n4", text: "Footer links and info" },
        ],
        ctas: [
          { text: "Get Started", href: "#signup", variant: "primary", position: "hero" },
          { text: "Learn More", href: "#features", variant: "secondary", position: "hero" },
        ],
        seo: { hasMetaDescription: true, hasOpenGraph: true, hasJSONLD: false, hasCanonical: true },
      },
    ],
  };
}
