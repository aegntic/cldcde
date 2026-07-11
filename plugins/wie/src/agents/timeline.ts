/**
 * Experience Timeline Agent — generates a timeline describing the
 * user journey through every page, capturing what appears, why it
 * appears, the motion, intent, CTA, and narrative role.
 */
import type { ExperienceTimeline, TimelineEvent, PageDNA, SectionDNA, MotionPreset } from "../types.js";

export function runTimelineAgent(opts: {
  pageDNAs: PageDNA[];
  sectionsByPage: Map<string, SectionDNA[]>;
  motionPresets: MotionPreset[];
  log?: (e: Record<string, unknown>) => void;
}): ExperienceTimeline {
  const { pageDNAs, sectionsByPage, motionPresets, log = () => {} } = opts;
  log({ agent: "timeline", pages: pageDNAs.length });

  const events: TimelineEvent[] = [];
  let order = 0;

  for (const page of pageDNAs) {
    const sections = sectionsByPage.get(page.path) ?? [];
    for (const section of sections) {
      const motion = findMotionForSection(section, motionPresets);
      const cta = findCTAForSection(page, section);
      events.push({
        order: order++,
        pagePath: page.path,
        sectionName: section.name,
        whatAppears: describeWhatAppears(section),
        whyItAppears: describeWhy(section, page),
        motion: motion ?? "Static (no motion)",
        intent: describeIntent(section, page),
        cta,
        narrativeRole: describeNarrativeRole(section, page),
      });
    }
  }

  log({ agent: "timeline", events: events.length });
  return { events };
}

function findMotionForSection(section: SectionDNA, presets: MotionPreset[]): string | null {
  if (!section.animationPresetId) return null;
  const preset = presets.find((p) => p.id === section.animationPresetId);
  return preset ? `${preset.name} (${preset.category})` : null;
}

function findCTAForSection(page: PageDNA, section: SectionDNA): string | null {
  if (section.category === "cta") return page.ctas[0]?.text ?? null;
  if (section.category === "hero") return page.ctas[0]?.text ?? null;
  if (section.category === "pricing") return page.ctas.find((c) => c.variant === "primary")?.text ?? null;
  return null;
}

function describeWhatAppears(section: SectionDNA): string {
  const descriptions: Record<string, string> = {
    hero: "Full-viewport hero with headline, subheadline, and primary CTA",
    navigation: "Site navigation bar with primary menu items",
    footer: "Footer with secondary navigation, social links, and legal info",
    "feature-grid": "Grid of feature cards with icons, titles, and descriptions",
    gallery: "Visual gallery of images or project thumbnails",
    timeline: "Sequential timeline of milestones or process steps",
    testimonial: "Customer testimonials with quotes, names, and roles",
    pricing: "Pricing plans displayed side-by-side with feature comparison",
    cta: "High-contrast call-to-action banner with prominent button",
    contact: "Contact form with input fields and submit button",
    stats: "Key statistics and metrics displayed prominently",
    "logo-cloud": "Row or grid of partner/client logos",
    faq: "Accordion of frequently asked questions",
    team: "Team member profiles with photos and roles",
    "blog-list": "List of blog post previews with titles and excerpts",
    newsletter: "Email subscription form with compelling copy",
    marquee: "Continuously scrolling content strip",
    carousel: "Interactive carousel of content cards",
  };
  return descriptions[section.category] ?? `${section.name} section`;
}

function describeWhy(section: SectionDNA, page: PageDNA): string {
  const purposes: Record<string, string> = {
    hero: `Establishes the page's value proposition and captures attention for ${page.pageType}`,
    navigation: "Provides primary navigation structure for the site",
    footer: "Offers secondary navigation and compliance information",
    "feature-grid": "Builds credibility by highlighting key capabilities",
    gallery: "Showcases visual work and demonstrates expertise",
    testimonial: "Provides social proof and builds trust",
    pricing: "Presents options and drives conversion decision",
    cta: "Creates urgency and drives the primary conversion action",
    contact: "Enables direct communication and lead capture",
    stats: "Quantifies value and reinforces credibility",
  };
  return purposes[section.category] ?? `Supports the ${page.pageType} page's purpose`;
}

function describeIntent(section: SectionDNA, page: PageDNA): string {
  if (section.category === "hero") return "Engage and orient the visitor immediately";
  if (section.category === "cta") return "Drive the visitor toward conversion";
  if (section.category === "pricing") return "Facilitate purchase decision";
  if (section.category === "contact") return "Remove friction from reaching out";
  if (section.category === "testimonial") return "Overcome objections through social proof";
  if (section.category === "feature-grid") return "Educate about capabilities";
  if (section.category === "faq") return "Address common objections and questions";
  return `Support the ${page.pageType} page narrative`;
}

function describeNarrativeRole(section: SectionDNA, page: PageDNA): string {
  if (section.order === 0) return "Opening: sets the stage and hooks the reader";
  if (section.category === "cta") return "Climax: the conversion moment";
  if (section.category === "footer") return "Closing: provides exit paths and compliance";
  if (section.order <= 2) return "Setup: builds context after the hook";
  if (section.order <= Math.floor(page.sectionCount / 2)) return "Development: deepens the narrative";
  return "Resolution: reinforces the message before the CTA";
}
