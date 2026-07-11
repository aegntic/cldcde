/**
 * Information Architecture Agent — analyzes the site's information
 * architecture: page hierarchy, navigation structure, content relationships,
 * and reading flow per page.
 */
import type { PageDNA, CTA, PageType, MotionComplexity, InteractionComplexity, SiteGraph, PageNode } from "../types.js";
import { uuid, wordCount, clamp100 } from "../util.js";

export type IAResult = {
  pageDNAs: PageDNA[];
  hierarchy: HierarchyNode;
  navigationStructure: NavigationStructure;
};

export type HierarchyNode = {
  path: string;
  pageType: PageType;
  children: HierarchyNode[];
};

export type NavigationStructure = {
  primary: NavItem[];
  footer: NavItem[];
  mobile: NavItem[];
};

export type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};

export function runIA(opts: {
  siteGraph: SiteGraph;
  sectionsByPage?: Record<string, Array<{ role: string; text: string }>>;
  ctasByPage?: Record<string, CTA[]>;
  log?: (e: Record<string, unknown>) => void;
}): IAResult {
  const { siteGraph, sectionsByPage = {}, ctasByPage = {}, log = () => {} } = opts;
  log({ agent: "ia", totalPages: siteGraph.pages.length });

  const pageDNAs: PageDNA[] = siteGraph.pages.map((page) => {
    const sections = sectionsByPage[page.path] ?? [];
    const ctas = ctasByPage[page.path] ?? [];
    const totalWords = sections.reduce((sum, s) => sum + wordCount(s.text), 0);
    const sectionCount = sections.length;
    const componentCount = Math.max(1, Math.floor(sectionCount * 1.5));

    const motionComplexity = inferMotionComplexity(sections);
    const interactionComplexity = inferInteractionComplexity(ctas, sections);
    const seoWeight = computeSEOWeight(page, totalWords, sectionCount);
    const accessibilityScore = 75;
    const purpose = inferPurpose(page.pageType);
    const narrative = inferNarrative(page.pageType, sections);
    const readingFlow = sections.map((s) => s.role);

    return {
      uuid: uuid(`page:${page.url}`),
      url: page.url,
      path: page.path,
      title: page.title,
      pageType: page.pageType,
      purpose,
      narrative,
      ctas,
      readingFlow,
      motionComplexity,
      interactionComplexity,
      seoWeight,
      accessibilityScore,
      sectionCount,
      componentCount,
      wordCount: totalWords,
      loadTimeEstimate: Math.ceil(sectionCount * 200 + totalWords * 0.5),
    };
  });

  const hierarchy = buildHierarchy(siteGraph.pages);
  const navigationStructure = buildNavigation(siteGraph.pages);

  log({ agent: "ia", pageDNAs: pageDNAs.length });

  return { pageDNAs, hierarchy, navigationStructure };
}

function inferMotionComplexity(sections: Array<{ role: string; text: string }>): MotionComplexity {
  const interactiveCount = sections.filter((s) => /hero|carousel|gallery|marquee|tabs/.test(s.role)).length;
  if (interactiveCount >= 3) return "cinematic";
  if (interactiveCount >= 2) return "rich";
  if (interactiveCount >= 1) return "moderate";
  if (sections.length > 5) return "subtle";
  return "none";
}

function inferInteractionComplexity(ctas: CTA[], sections: Array<{ role: string }>): InteractionComplexity {
  const score = ctas.length + sections.filter((s) => /form|carousel|tabs|accordion/.test(s.role)).length;
  if (score >= 8) return "complex";
  if (score >= 5) return "heavy";
  if (score >= 3) return "moderate";
  if (score >= 1) return "light";
  return "static";
}

function computeSEOWeight(page: PageNode, words: number, sections: number): number {
  let weight = 50;
  if (page.pageType === "home") weight += 30;
  if (page.pageType === "blog-post" || page.pageType === "case-study-item") weight += 20;
  if (page.pageType === "landing") weight += 15;
  if (page.pageType === "legal") weight -= 10;
  if (words > 500) weight += 10;
  if (sections > 6) weight += 5;
  return clamp100(weight);
}

function inferPurpose(pageType: PageType): string {
  const purposes: Record<string, string> = {
    home: "Establish brand identity and guide visitors to primary actions",
    about: "Build trust through company story, mission, and team",
    "blog-index": "Showcase thought leadership and drive content engagement",
    "blog-post": "Deliver valuable insights and capture reader interest",
    "portfolio-index": "Showcase capabilities and past work",
    "portfolio-item": "Demonstrate expertise through detailed project showcase",
    "case-study-index": "Present proven results and client success stories",
    "case-study-item": "Provide deep-dive analysis of a specific project outcome",
    pricing: "Present pricing options and drive conversion",
    contact: "Enable visitor communication and lead capture",
    legal: "Fulfill legal compliance requirements",
    landing: "Drive a specific conversion action",
    product: "Showcase product features and benefits",
    team: "Humanize the brand through team profiles",
    faq: "Answer common questions and reduce support burden",
  };
  return purposes[pageType] ?? "Provide content relevant to the visitor's journey";
}

function inferNarrative(pageType: PageType, sections: Array<{ role: string; text: string }>): string {
  const has = (r: string) => sections.some((s) => s.role.includes(r));
  const parts: string[] = [];

  if (has("hero")) parts.push("Opens with a compelling hero that establishes the value proposition");
  if (has("feature")) parts.push("Follows with feature highlights that build credibility");
  if (has("testimonial")) parts.push("Reinforces trust through social proof");
  if (has("cta")) parts.push("Concludes with a clear call to action");
  if (has("footer")) parts.push("Provides navigation and supplementary links in the footer");

  if (parts.length === 0) return `A ${pageType} page structured to inform and engage the visitor`;
  return parts.join(", then ");
}

function buildHierarchy(pages: PageNode[]): HierarchyNode {
  const root: HierarchyNode = { path: "/", pageType: "home", children: [] };
  for (const page of pages) {
    if (page.path === "/" || page.path === "") continue;
    root.children.push({ path: page.path, pageType: page.pageType, children: [] });
  }
  return root;
}

function buildNavigation(pages: PageNode[]): NavigationStructure {
  const navPages = pages.filter((p) => p.depth <= 2 && p.pageType !== "legal" && p.pageType !== "404");
  const items: NavItem[] = navPages.map((p) => ({
    label: p.title || p.path,
    href: p.path,
  }));
  const footerPages = pages.filter((p) => p.pageType === "legal" || p.depth > 2);
  return {
    primary: items.slice(0, 6),
    footer: footerPages.map((p) => ({ label: p.title || p.path, href: p.path })),
    mobile: items.slice(0, 5),
  };
}
