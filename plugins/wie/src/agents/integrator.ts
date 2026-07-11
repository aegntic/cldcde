/**
 * Final Integrator — assembles the complete TemplateManifest from
 * all agent outputs, builds the compatibility graph, responsive matrix,
 * and folder architecture.
 */
import type {
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
  AccessibilityReport,
  PerformanceReport,
  SEOReport,
  ExperienceTimeline,
  PatternRecognition,
  BenchmarkScore,
  BuilderSpecification,
  ThemeDefinition,
  QAReport,
  CompatibilityGraph,
  ResponsiveMatrix,
  InteractionDNA,
  FolderArchitecture,
  UUID,
  SemVer,
} from "../types.js";
import { uuid, isoNow } from "../util.js";

export function runIntegrator(opts: {
  sourceUrl: string;
  siteGraph: SiteGraph;
  pageDNAs: PageDNA[],
  sectionLibrary: SectionDNA[];
  componentLibrary: ComponentDNA[];
  motionDNA: MotionDNA;
  animationLibrary: MotionPreset[];
  designTokens: DesignTokens;
  placeholderCatalog: PlaceholderCatalog;
  cmsSchemas: CMSSchema[];
  mediaSchemas: MediaSchema[];
  accessibilityReport: AccessibilityReport;
  performanceReport: PerformanceReport;
  seoReport: SEOReport;
  experienceTimeline: ExperienceTimeline;
  patternRecognition: PatternRecognition;
  benchmark: BenchmarkScore;
  builderSpec: BuilderSpecification;
  themes: ThemeDefinition[];
  qaReport: QAReport;
  interactionDNA: InteractionDNA;
  log?: (e: Record<string, unknown>) => void;
}): TemplateManifest {
  const { sourceUrl, log = () => {} } = opts;
  log({ agent: "integrator" });

  const templateId: UUID = uuid(`template:${sourceUrl}:${isoNow()}`);
  const version: SemVer = "1.0.0";

  const compatibilityGraph = buildCompatibilityGraph(opts.sectionLibrary, opts.componentLibrary, opts.animationLibrary);
  const responsiveMatrix = buildResponsiveMatrix(opts.sectionLibrary);

  const manifest: TemplateManifest = {
    templateId,
    version,
    generatedAt: isoNow(),
    sourceUrl,
    designSystem: opts.designTokens,
    motionDNA: opts.motionDNA,
    interactionDNA: opts.interactionDNA,
    pageDNA: opts.pageDNAs,
    sectionLibrary: opts.sectionLibrary,
    componentLibrary: opts.componentLibrary,
    designTokens: opts.designTokens,
    animationLibrary: opts.animationLibrary,
    placeholderCatalog: opts.placeholderCatalog,
    cmsSchema: opts.cmsSchemas,
    compatibilityGraph,
    responsiveMatrix,
    accessibilityReport: opts.accessibilityReport,
    performanceReport: opts.performanceReport,
    seoReport: opts.seoReport,
    experienceTimeline: opts.experienceTimeline,
    mediaSchemas: opts.mediaSchemas,
    patternRecognition: opts.patternRecognition,
    benchmark: opts.benchmark,
    builderSpec: opts.builderSpec,
    themes: opts.themes,
    qaReport: opts.qaReport,
    siteGraph: opts.siteGraph,
  };

  log({ agent: "integrator", templateId, sections: manifest.sectionLibrary.length, components: manifest.componentLibrary.length });

  return manifest;
}

function buildCompatibilityGraph(sections: SectionDNA[], components: ComponentDNA[], motions: MotionPreset[]): CompatibilityGraph {
  const nodes: Array<{ id: string; type: "section" | "component" | "motion"; name: string }> = [];
  const edges: Array<{ from: string; to: string; relationship: string }> = [];

  for (const section of sections) {
    nodes.push({ id: section.uuid, type: "section", name: section.name });
    // Link section to its animation preset
    if (section.animationPresetId) {
      edges.push({ from: section.uuid, to: section.animationPresetId, relationship: "uses-motion" });
    }
    // Link section to its placeholders
    for (const phId of section.placeholderSchemaIds) {
      edges.push({ from: section.uuid, to: phId, relationship: "has-placeholder" });
    }
    // Link section to its media
    for (const mediaId of section.mediaSchemaIds) {
      edges.push({ from: section.uuid, to: mediaId, relationship: "has-media" });
    }
    // Link parent-child sections
    if (section.parentId) {
      edges.push({ from: section.parentId, to: section.uuid, relationship: "parent-of" });
    }
  }

  for (const component of components) {
    nodes.push({ id: component.uuid, type: "component", name: component.name });
    // Link component to sections that use it
    for (const sectionId of component.sourceSections) {
      edges.push({ from: sectionId, to: component.uuid, relationship: "contains-component" });
    }
    // Link component to its animation hooks
    for (const hookId of component.animationHookIds) {
      edges.push({ from: component.uuid, to: hookId, relationship: "has-animation-hook" });
    }
  }

  for (const motion of motions) {
    nodes.push({ id: motion.id, type: "motion", name: motion.name });
  }

  return { nodes, edges };
}

function buildResponsiveMatrix(sections: SectionDNA[]): ResponsiveMatrix {
  const breakpoints = { base: 375, sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 };

  return {
    breakpoints,
    sections: sections.map((s) => ({
      sectionId: s.uuid,
      rules: {
        base: s.responsiveRules.find((r) => r.breakpoint === "base") ?? { breakpoint: "base", behavior: "stack" as const },
        sm: s.responsiveRules.find((r) => r.breakpoint === "sm") ?? { breakpoint: "sm", behavior: "stack" as const },
        md: s.responsiveRules.find((r) => r.breakpoint === "md") ?? { breakpoint: "md", behavior: "stack" as const },
        lg: s.responsiveRules.find((r) => r.breakpoint === "lg") ?? { breakpoint: "lg", behavior: "stack" as const },
        xl: s.responsiveRules.find((r) => r.breakpoint === "xl") ?? { breakpoint: "xl", behavior: "stack" as const },
        "2xl": s.responsiveRules.find((r) => r.breakpoint === "2xl") ?? { breakpoint: "2xl", behavior: "stack" as const },
      },
    })),
  };
}

export function buildFolderArchitecture(): FolderArchitecture {
  return {
    root: "template-ecosystem",
    structure: [
      {
        name: "template-ecosystem",
        type: "directory",
        description: "Root directory for the generated template ecosystem",
        children: [
          {
            name: "manifest.json",
            type: "file",
            description: "Complete TemplateManifest with all DNA, tokens, and schemas",
          },
          {
            name: "sections.json",
            type: "file",
            description: "Section library with DNA for every section",
          },
          {
            name: "components.json",
            type: "file",
            description: "Component library with DNA for every component",
          },
          {
            name: "motions.json",
            type: "file",
            description: "Motion preset library with parameterized animations",
          },
          {
            name: "pages.json",
            type: "file",
            description: "Page DNA inventory for every analyzed page",
          },
          {
            name: "tokens.json",
            type: "file",
            description: "Design tokens (colors, spacing, typography, etc.)",
          },
          {
            name: "placeholders.json",
            type: "file",
            description: "Semantic placeholder catalog with guidance",
          },
          {
            name: "compatibility.json",
            type: "file",
            description: "Compatibility graph linking sections, components, and motion",
          },
          {
            name: "media.json",
            type: "file",
            description: "Media schemas with upload zone metadata",
          },
          {
            name: "cms.json",
            type: "file",
            description: "CMS schemas for all platforms (Payload, Sanity, Strapi, etc.)",
          },
          {
            name: "timeline.json",
            type: "file",
            description: "Experience timeline describing the user journey",
          },
          {
            name: "accessibility.json",
            type: "file",
            description: "Accessibility report with per-section scores",
          },
          {
            name: "performance.json",
            type: "file",
            description: "Performance report with metrics and recommendations",
          },
          {
            name: "seo.json",
            type: "file",
            description: "SEO report with per-page analysis",
          },
          {
            name: "benchmark.json",
            type: "file",
            description: "Benchmark scores across all dimensions",
          },
          {
            name: "site-graph.json",
            type: "file",
            description: "Complete site graph with page inventory",
          },
          {
            name: "builder-spec.json",
            type: "file",
            description: "Builder specification with features and AI capabilities",
          },
          {
            name: "themes.json",
            type: "file",
            description: "Theme definitions with token and motion overrides",
          },
          {
            name: "src",
            type: "directory",
            description: "Source code for the template ecosystem",
            children: [
              { name: "components", type: "directory", description: "Reusable React components" },
              { name: "sections", type: "directory", description: "Section components" },
              { name: "motion", type: "directory", description: "Motion preset implementations" },
              { name: "tokens", type: "directory", description: "Design token definitions" },
              { name: "themes", type: "directory", description: "Theme configurations" },
              { name: "cms", type: "directory", description: "CMS schema adapters" },
              { name: "utils", type: "directory", description: "Shared utilities" },
            ],
          },
        ],
      },
    ],
  };
}
