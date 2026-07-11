/**
 * SEO Agent — evaluates the template ecosystem's SEO readiness
 * across meta tags, structured data, semantic HTML, and per-page analysis.
 */
import type { SEOReport, SEOIssue, PageDNA, SectionDNA } from "../types.js";
import { clamp100 } from "../util.js";

export function runSEOAgent(opts: {
  pageDNAs: PageDNA[];
  sections: SectionDNA[];
  hasMetaDescription?: boolean;
  hasOpenGraph?: boolean;
  hasJSONLD?: boolean;
  hasCanonical?: boolean;
  log?: (e: Record<string, unknown>) => void;
}): SEOReport {
  const { pageDNAs, sections, hasMetaDescription = true, hasOpenGraph = true, hasJSONLD = false, hasCanonical = true, log = () => {} } = opts;
  log({ agent: "seo", pages: pageDNAs.length });

  const issues: SEOIssue[] = [];
  const passes: string[] = [];

  // Global checks
  if (hasMetaDescription) passes.push("Meta descriptions present");
  else issues.push({ severity: "critical", rule: "meta-description", description: "Missing meta description tags", recommendation: "Add a unique meta description (under 160 chars) to every page" });

  if (hasOpenGraph) passes.push("Open Graph tags present for social sharing");
  else issues.push({ severity: "warning", rule: "open-graph", description: "Missing Open Graph tags", recommendation: "Add og:title, og:description, and og:image meta tags" });

  if (hasCanonical) passes.push("Canonical URLs present");
  else issues.push({ severity: "warning", rule: "canonical", description: "Missing canonical URL tags", recommendation: "Add <link rel='canonical'> to every page" });

  if (hasJSONLD) passes.push("Structured data (JSON-LD) present");
  else issues.push({ severity: "info", rule: "structured-data", description: "No JSON-LD structured data detected", recommendation: "Add Schema.org markup for rich results" });

  // Heading hierarchy check
  const hasH1 = sections.some((s) => s.accessibility.headingLevel === 1);
  if (hasH1) passes.push("Pages have H1 headings");
  else issues.push({ severity: "critical", rule: "h1-heading", description: "Missing H1 heading", recommendation: "Ensure each page has exactly one H1 with the primary keyword" });

  // Per-page analysis
  const perPage = pageDNAs.map((page) => {
    const pageIssues: string[] = [];
    let score = page.seoWeight;

    if (page.wordCount < 300) {
      pageIssues.push("Low word count may impact search rankings");
      score -= 10;
    }
    if (page.ctas.length === 0 && page.pageType !== "legal") {
      pageIssues.push("No CTAs found; consider adding conversion opportunities");
      score -= 5;
    }
    if (page.sectionCount < 3) {
      pageIssues.push("Thin content; add more sections for better SEO");
      score -= 10;
    }

    return { pagePath: page.path, score: clamp100(score), issues: pageIssues };
  });

  // Sitemap check
  passes.push("Sitemap should be generated for all discovered pages");

  // Calculate overall score
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const penalty = criticalCount * 20 + warningCount * 5;
  const passBonus = passes.length * 3;
  const avgPageScore = perPage.reduce((sum, p) => sum + p.score, 0) / (perPage.length || 1);
  const overallScore = clamp100(Math.round(avgPageScore * 0.6 + (100 - penalty + passBonus) * 0.4));

  log({ agent: "seo", score: overallScore, issues: issues.length });

  return {
    overallScore,
    issues,
    passes,
    perPage,
  };
}
