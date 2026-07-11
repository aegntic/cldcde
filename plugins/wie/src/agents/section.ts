/**
 * Section Agent — transforms detected sections into SectionDNA records
 * with archetype classification, responsive rules, dependencies, and
 * linked placeholder/media schemas.
 */
import type {
  SectionDNA,
  SectionCategory,
  ResponsiveRule,
  SectionAccessibility,
  PerformanceCost,
  BoundingBox,
} from "../types.js";
import { uuid, sectionName } from "../util.js";
import { classifyArchetype } from "../patterns.js";

export type SectionInput = {
  sections: Array<{
    id: string;
    role: string;
    order: number;
    nodeId: string;
    bboxByVp?: Record<number, BoundingBox>;
  }>;
  pagePath: string;
  pageType?: string;
  motionPresetIds?: string[];
  placeholderSchemaIds?: string[];
  mediaSchemaIds?: string[];
};

export function runSectionAgent(opts: {
  input: SectionInput;
  log?: (e: Record<string, unknown>) => void;
}): SectionDNA[] {
  const { input, log = () => {} } = opts;
  log({ agent: "section", sections: input.sections.length });

  const sectionDNAs: SectionDNA[] = [];
  const motionIds = input.motionPresetIds ?? [];
  const placeholderIds = input.placeholderSchemaIds ?? [];
  const mediaIds = input.mediaSchemaIds ?? [];

  for (let i = 0; i < input.sections.length; i++) {
    const section = input.sections[i]!;
    const category = classifyCategory(section.role);
    const archetype = classifyArchetype(category, section.role);
    const bbox = section.bboxByVp?.[1280] ?? { x: 0, y: 0, width: 1280, height: 400 };
    const responsiveRules = inferResponsiveRules(category, bbox);
    const accessibility = inferAccessibility(section, category);
    const performanceCost = inferPerformanceCost(category, bbox);
    const compatibilityScore = computeCompatibilityScore(category, responsiveRules);

    sectionDNAs.push({
      uuid: uuid(`section:${input.pagePath}:${section.id}`),
      name: sectionName(section.role, section.order),
      category,
      archetype,
      parentId: null,
      childrenIds: [],
      dependencies: inferDependencies(category),
      animationPresetId: motionIds[i % motionIds.length] ?? null,
      responsiveRules,
      cmsSchemaId: null,
      placeholderSchemaIds: placeholderIds.slice(i * 2, i * 2 + 3),
      mediaSchemaIds: mediaIds.slice(i, i + 2),
      accessibility,
      performanceCost,
      compatibilityScore,
      order: section.order,
      pagePath: input.pagePath,
      bbox,
    });
  }

  // Link parent-child relationships
  for (let i = 0; i < sectionDNAs.length; i++) {
    if (i > 0) {
      sectionDNAs[i]!.parentId = sectionDNAs[i - 1]!.uuid;
      sectionDNAs[i - 1]!.childrenIds.push(sectionDNAs[i]!.uuid);
    }
  }

  log({ agent: "section", total: sectionDNAs.length });
  return sectionDNAs;
}

function classifyCategory(role: string): SectionCategory {
  const r = role.toLowerCase();
  if (/hero/.test(r)) return "hero";
  if (/nav|header|menu/.test(r)) return "navigation";
  if (/footer/.test(r)) return "footer";
  if (/feature|grid|service/.test(r)) return "feature-grid";
  if (/gallery|portfolio|work/.test(r)) return "gallery";
  if (/timeline/.test(r)) return "timeline";
  if (/testimonial|review/.test(r)) return "testimonial";
  if (/pricing|plan/.test(r)) return "pricing";
  if (/cta|call-to-action/.test(r)) return "cta";
  if (/contact/.test(r)) return "contact";
  if (/sidebar/.test(r)) return "sidebar";
  if (/stat|metric|counter/.test(r)) return "stats";
  if (/logo|brand|partner|client/.test(r)) return "logo-cloud";
  if (/faq|question/.test(r)) return "faq";
  if (/team|member|people/.test(r)) return "team";
  if (/blog|article|post|news/.test(r)) return "blog-list";
  if (/newsletter|subscribe/.test(r)) return "newsletter";
  if (/marquee|ticker/.test(r)) return "marquee";
  if (/tab/.test(r)) return "tabs";
  if (/accordion|collapse/.test(r)) return "accordion";
  if (/carousel|slider|swiper/.test(r)) return "carousel";
  if (/video/.test(r)) return "video";
  if (/map/.test(r)) return "map";
  if (/form/.test(r)) return "form";
  return "content";
}

function inferResponsiveRules(category: SectionCategory, bbox: BoundingBox): ResponsiveRule[] {
  const rules: ResponsiveRule[] = [];

  switch (category) {
    case "hero":
      rules.push(
        { breakpoint: "base", behavior: "stack", minHeight: Math.round(bbox.height * 0.8) },
        { breakpoint: "md", behavior: "grid", columns: 2, minHeight: bbox.height },
        { breakpoint: "lg", behavior: "grid", columns: 2, minHeight: bbox.height },
      );
      break;
    case "feature-grid":
      rules.push(
        { breakpoint: "base", behavior: "grid", columns: 1 },
        { breakpoint: "sm", behavior: "grid", columns: 2 },
        { breakpoint: "lg", behavior: "grid", columns: 3 },
        { breakpoint: "xl", behavior: "grid", columns: 4 },
      );
      break;
    case "gallery":
      rules.push(
        { breakpoint: "base", behavior: "grid", columns: 1 },
        { breakpoint: "sm", behavior: "grid", columns: 2 },
        { breakpoint: "lg", behavior: "grid", columns: 3 },
      );
      break;
    case "pricing":
      rules.push(
        { breakpoint: "base", behavior: "stack" },
        { breakpoint: "md", behavior: "grid", columns: 2 },
        { breakpoint: "lg", behavior: "grid", columns: 3 },
      );
      break;
    case "footer":
      rules.push(
        { breakpoint: "base", behavior: "stack" },
        { breakpoint: "md", behavior: "grid", columns: 2 },
        { breakpoint: "lg", behavior: "grid", columns: 4 },
      );
      break;
    case "navigation":
      rules.push(
        { breakpoint: "base", behavior: "collapse" },
        { breakpoint: "md", behavior: "full-width" },
      );
      break;
    case "carousel":
    case "marquee":
      rules.push(
        { breakpoint: "base", behavior: "scroll" },
        { breakpoint: "lg", behavior: "full-width" },
      );
      break;
    case "sidebar":
      rules.push(
        { breakpoint: "base", behavior: "hidden" },
        { breakpoint: "lg", behavior: "full-width" },
      );
      break;
    default:
      rules.push(
        { breakpoint: "base", behavior: "stack" },
        { breakpoint: "md", behavior: "full-width" },
      );
  }

  return rules;
}

function inferAccessibility(section: { role: string; id: string; order: number }, category: SectionCategory): SectionAccessibility {
  const landmark = inferLandmark(category);
  const headingLevel = inferHeadingLevel(category, section.order);
  const issues: string[] = [];

  if (category === "carousel") issues.push("Ensure carousel has accessible controls and live region");
  if (category === "marquee") issues.push("Provide pause control for auto-scrolling content");
  if (category === "form") issues.push("Ensure all form controls have associated labels");
  if (category === "video") issues.push("Provide captions and transcript for video content");

  return {
    landmark,
    headingLevel,
    ariaLabels: [],
    focusOrder: section.order,
    issues,
  };
}

function inferLandmark(category: SectionCategory): string | null {
  const map: Partial<Record<SectionCategory, string>> = {
    navigation: "navigation",
    header: "banner",
    footer: "contentinfo",
    form: "form",
    hero: "main",
    content: "region",
    faq: "region",
  };
  return map[category] ?? null;
}

function inferHeadingLevel(category: SectionCategory, order: number): number {
  if (category === "hero") return 1;
  if (order === 0) return 1;
  return 2;
}

function inferPerformanceCost(category: SectionCategory, bbox: BoundingBox): PerformanceCost {
  const area = bbox.width * bbox.height;
  if (category === "carousel" || category === "video") return "heavy";
  if (category === "gallery" || category === "marquee") return "high";
  if (area > 500000) return "moderate";
  if (category === "hero") return "moderate";
  return "low";
}

function computeCompatibilityScore(category: SectionCategory, rules: ResponsiveRule[]): number {
  let score = 80;
  const hasMobileRule = rules.some((r) => r.breakpoint === "base");
  if (hasMobileRule) score += 10;
  if (rules.length >= 3) score += 5;
  if (category === "carousel" || category === "video") score -= 10;
  return Math.max(50, Math.min(100, score));
}

function inferDependencies(category: SectionCategory): string[] {
  const deps: string[] = [];
  if (category === "carousel") deps.push("carousel-component", "motion-marquee");
  if (category === "accordion") deps.push("accordion-component");
  if (category === "tabs") deps.push("tabs-component");
  if (category === "form") deps.push("form-component", "validation-lib");
  if (category === "video") deps.push("video-player");
  if (category === "map") deps.push("map-provider");
  if (category === "newsletter") deps.push("form-component", "email-service");
  return deps;
}
