/**
 * Pattern Recognition — classifies sections into archetypes and
 * detects recurring patterns across the site.
 */
import type { PatternArchetype, PatternRecognition, DetectedPattern, SectionCategory } from "./types.js";
import { uuid } from "./util.js";

const ARCHETYPES: PatternArchetype[] = [
  {
    id: "editorial-hero",
    name: "Editorial Hero",
    category: "hero",
    description: "Full-height hero with large typography, minimal imagery, and a single CTA. Emphasizes storytelling and brand voice.",
    characteristics: ["full-viewport height", "large display typography", "single primary CTA", "minimal navigation chrome", "generous whitespace"],
    detectedIn: [],
    recommendedSections: ["feature-grid", "content", "testimonial"],
  },
  {
    id: "startup-hero",
    name: "Startup Hero",
    category: "hero",
    description: "Split-layout hero with headline, subheadline, CTA, and product screenshot or illustration on the right.",
    characteristics: ["split layout", "product screenshot", "dual CTA (primary + secondary)", "social proof badges", "gradient or solid background"],
    detectedIn: [],
    recommendedSections: ["feature-grid", "stats", "testimonial", "pricing", "cta"],
  },
  {
    id: "agency-hero",
    name: "Agency Hero",
    category: "hero",
    description: "Cinematic hero with full-bleed video or image background, overlay text, and scroll indicator.",
    characteristics: ["full-bleed media", "overlay text", "scroll indicator", "minimal text", "motion-rich entrance"],
    detectedIn: [],
    recommendedSections: ["gallery", "timeline", "testimonial", "cta"],
  },
  {
    id: "narrative-hero",
    name: "Narrative Hero",
    category: "hero",
    description: "Story-driven hero with sequential text reveals, building a narrative before the CTA.",
    characteristics: ["sequential text reveals", "typewriter or rotator effect", "progressive disclosure", "emotional pacing"],
    detectedIn: [],
    recommendedSections: ["timeline", "content", "testimonial"],
  },
  {
    id: "gallery-grid",
    name: "Gallery",
    category: "gallery",
    description: "Visual-first grid of images or projects with hover effects and lightbox interaction.",
    characteristics: ["image-dominant", "hover effects", "filterable categories", "lightbox/modal", "masonry or grid layout"],
    detectedIn: [],
    recommendedSections: ["testimonial", "cta"],
  },
  {
    id: "timeline-flow",
    name: "Timeline",
    category: "timeline",
    description: "Sequential presentation of events, milestones, or process steps with vertical or horizontal flow.",
    characteristics: ["sequential nodes", "connector lines", "alternating layout", "scroll-triggered reveals", "date markers"],
    detectedIn: [],
    recommendedSections: ["content", "cta"],
  },
  {
    id: "testimonial-wall",
    name: "Testimonial",
    category: "testimonial",
    description: "Collection of customer quotes with avatars, names, and roles, often in a carousel or grid.",
    characteristics: ["quote cards", "avatar images", "author attribution", "carousel or grid", "star ratings"],
    detectedIn: [],
    recommendedSections: ["cta", "pricing"],
  },
  {
    id: "cta-banner",
    name: "CTA",
    category: "cta",
    description: "High-contrast call-to-action section with compelling headline and prominent button.",
    characteristics: ["high contrast", "single focus", "prominent button", "minimal text", "background accent"],
    detectedIn: [],
    recommendedSections: [],
  },
  {
    id: "pricing-table",
    name: "Pricing",
    category: "pricing",
    description: "Side-by-side pricing plans with feature lists, highlighted recommended option, and CTAs.",
    characteristics: ["plan cards", "feature comparison", "highlighted plan", "toggle (monthly/annual)", "CTA per plan"],
    detectedIn: [],
    recommendedSections: ["faq", "testimonial", "cta"],
  },
  {
    id: "contact-form",
    name: "Contact",
    category: "contact",
    description: "Contact form with input fields, optional map, and alternative contact methods.",
    characteristics: ["form fields", "submit button", "contact info sidebar", "optional map embed", "validation feedback"],
    detectedIn: [],
    recommendedSections: [],
  },
];

export function getArchetypes(): PatternArchetype[] {
  return ARCHETYPES;
}

export function classifyArchetype(category: SectionCategory, role: string): string {
  const matching = ARCHETYPES.filter((a) => a.category === category);
  if (matching.length === 0) return "custom";
  if (matching.length === 1) return matching[0]!.id;

  // Disambiguate based on role
  const r = role.toLowerCase();
  if (category === "hero") {
    if (/video|cinema|full-bleed/.test(r)) return "agency-hero";
    if (/story|narrative|type/.test(r)) return "narrative-hero";
    if (/split|product|screenshot/.test(r)) return "startup-hero";
    return "editorial-hero";
  }
  return matching[0]!.id;
}

export function runPatternRecognition(opts: {
  sections: Array<{ id: string; role: string; category: SectionCategory; pagePath: string }>;
  log?: (e: Record<string, unknown>) => void;
}): PatternRecognition {
  const { sections, log = () => {} } = opts;
  log({ agent: "pattern-recognition", sections: sections.length });

  const detected: DetectedPattern[] = [];
  const archetypeMap = new Map<string, PatternArchetype>();

  for (const archetype of ARCHETYPES) {
    archetypeMap.set(archetype.id, { ...archetype, detectedIn: [] });
  }

  for (const section of sections) {
    const archetypeId = classifyArchetype(section.category, section.role);
    const archetype = archetypeMap.get(archetypeId);
    if (archetype) {
      archetype.detectedIn.push(section.id);
      detected.push({
        archetypeId,
        pagePath: section.pagePath,
        sectionId: section.id,
        confidence: 0.85,
      });
    }
  }

  const archetypes = [...archetypeMap.values()];

  log({ agent: "pattern-recognition", detected: detected.length, archetypes: archetypes.length });

  return { archetypes, detectedPatterns: detected };
}
