/**
 * Benchmarking — scores the template ecosystem across performance,
 * accessibility, SEO, animation density, complexity, and bundle estimate.
 */
import type { BenchmarkScore, TemplateManifest } from "./types.js";
import { clamp100 } from "./util.js";

export function runBenchmark(manifest: TemplateManifest): BenchmarkScore {
  const performance = manifest.performanceReport.overallScore;
  const accessibility = manifest.accessibilityReport.overallScore;
  const seo = manifest.seoReport.overallScore;

  const totalPresets = manifest.animationLibrary.length;
  const animationDensity = clamp100(totalPresets * 8);

  const totalSections = manifest.sectionLibrary.length;
  const totalComponents = manifest.componentLibrary.length;
  const complexity = clamp100((totalSections * 3 + totalComponents * 2 + totalPresets * 4) / 2);

  const bundleEstimate = manifest.performanceReport.bundleEstimate;

  const overall = clamp100(
    Math.round(
      performance * 0.25 +
      accessibility * 0.25 +
      seo * 0.2 +
      Math.max(0, 100 - complexity) * 0.15 +
      Math.max(0, 100 - bundleEstimate / 2000) * 0.15,
    ),
  );

  return {
    performance,
    accessibility,
    seo,
    animationDensity,
    complexity,
    bundleEstimate,
    overall,
  };
}
