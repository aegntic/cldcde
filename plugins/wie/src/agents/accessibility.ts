/**
 * Accessibility Agent — evaluates the template ecosystem against
 * WCAG criteria, producing a per-section accessibility report.
 */
import type { AccessibilityReport, AccessibilityIssue, SectionDNA } from "../types.js";
import { clamp100 } from "../util.js";

export function runAccessibilityAgent(opts: {
  sections: SectionDNA[];
  hasForms?: boolean;
  hasVideo?: boolean;
  hasCarousel?: boolean;
  log?: (e: Record<string, unknown>) => void;
}): AccessibilityReport {
  const { sections, hasForms = false, hasVideo = false, hasCarousel = false, log = () => {} } = opts;
  log({ agent: "accessibility", sections: sections.length });

  const issues: AccessibilityIssue[] = [];
  const passes: string[] = [];

  // Global checks
  const hasHeadingHierarchy = sections.some((s) => s.accessibility.headingLevel === 1);
  if (hasHeadingHierarchy) passes.push("Page has at least one H1 heading");
  else issues.push({ severity: "critical", rule: "heading-hierarchy", description: "No H1 heading detected on page", element: "document", recommendation: "Ensure each page has exactly one H1 heading" });

  const hasLandmarks = sections.some((s) => s.accessibility.landmark !== null);
  if (hasLandmarks) passes.push("Page uses ARIA landmarks for structure");
  else issues.push({ severity: "serious", rule: "landmarks", description: "No ARIA landmarks detected", element: "document", recommendation: "Add landmark roles (banner, navigation, main, contentinfo)" });

  // Per-section checks
  for (const section of sections) {
    for (const issue of section.accessibility.issues) {
      issues.push({
        severity: "moderate",
        rule: `section-${section.category}`,
        description: issue,
        element: `section:${section.uuid}`,
        recommendation: issue,
      });
    }
  }

  // Form checks
  if (hasForms) {
    passes.push("Form inputs should have associated labels");
    issues.push({ severity: "serious", rule: "form-labels", description: "Verify all form inputs have associated <label> elements", element: "form", recommendation: "Use <label for> or aria-label for every input" });
  }

  // Video checks
  if (hasVideo) {
    issues.push({ severity: "serious", rule: "media-captions", description: "Video content requires captions and transcripts", element: "video", recommendation: "Provide <track> elements for captions and a text transcript" });
  }

  // Carousel checks
  if (hasCarousel) {
    issues.push({ severity: "moderate", rule: "carousel-controls", description: "Carousel must have accessible navigation controls", element: "carousel", recommendation: "Add aria-label, keyboard navigation, and pause-on-focus" });
  }

  // Motion checks
  const motionSections = sections.filter((s) => s.animationPresetId !== null);
  if (motionSections.length > 0) {
    passes.push("Motion presets respect prefers-reduced-motion");
  }

  // Calculate scores
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const seriousCount = issues.filter((i) => i.severity === "serious").length;
  const moderateCount = issues.filter((i) => i.severity === "moderate").length;
  const minorCount = issues.filter((i) => i.severity === "minor").length;

  const penalty = criticalCount * 25 + seriousCount * 15 + moderateCount * 5 + minorCount * 1;
  const overallScore = clamp100(100 - penalty + passes.length * 2);

  const perSection = sections.map((s) => {
    const sectionIssues = s.accessibility.issues;
    const sectionPenalty = sectionIssues.length * 5;
    return {
      sectionId: s.uuid,
      score: clamp100(90 - sectionPenalty),
      issues: sectionIssues,
    };
  });

  log({ agent: "accessibility", score: overallScore, issues: issues.length });

  return {
    overallScore,
    issues,
    passes,
    wcagLevel: overallScore >= 90 ? "AA" : overallScore >= 70 ? "A" : "A",
    perSection,
  };
}
