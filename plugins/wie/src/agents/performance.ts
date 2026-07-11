/**
 * Performance Agent — estimates performance metrics, bundle sizes,
 * and per-section performance costs.
 */
import type { PerformanceReport, PerformanceMetrics, PerformanceCost, SectionDNA, ComponentDNA } from "../types.js";
import { clamp100 } from "../util.js";

export function runPerformanceAgent(opts: {
  sections: SectionDNA[];
  components: ComponentDNA[];
  imageCount?: number;
  fontCount?: number;
  motionPresetCount?: number;
  log?: (e: Record<string, unknown>) => void;
}): PerformanceReport {
  const { sections, components, imageCount = 0, fontCount = 0, motionPresetCount = 0, log = () => {} } = opts;
  log({ agent: "performance", sections: sections.length });

  // Estimate bundle sizes
  const baseJs = 45_000; // React + base framework
  const componentJs = components.length * 2_500;
  const motionJs = motionPresetCount * 800;
  const totalJsEstimate = baseJs + componentJs + motionJs;

  const baseCss = 8_000;
  const componentCss = components.length * 1_200;
  const totalCssEstimate = baseCss + componentCss;

  // Estimate Core Web Vitals
  const heavySections = sections.filter((s) => s.performanceCost === "heavy" || s.performanceCost === "high").length;
  const fcpEstimate = Math.round(800 + heavySections * 200 + imageCount * 50);
  const lcpEstimate = Math.round(fcpEstimate + 400 + imageCount * 80);
  const clsEstimate = Math.min(0.25, heavySections * 0.05);
  const tbtEstimate = Math.round(totalJsEstimate * 0.001 + motionPresetCount * 20);

  const metrics: PerformanceMetrics = {
    fcpEstimate,
    lcpEstimate,
    clsEstimate,
    tbtEstimate,
    totalJsEstimate,
    totalCssEstimate,
    imageCount,
    fontCount,
  };

  // Per-section performance
  const perSection = sections.map((s) => {
    const costMap: Record<PerformanceCost, number> = { minimal: 100, low: 85, moderate: 70, high: 55, heavy: 35 };
    return {
      sectionId: s.uuid,
      cost: s.performanceCost,
      score: costMap[s.performanceCost],
    };
  });

  // Recommendations
  const recommendations: string[] = [];
  if (totalJsEstimate > 150_000) recommendations.push("Consider code splitting to reduce initial JavaScript bundle");
  if (imageCount > 10) recommendations.push("Implement lazy loading for below-the-fold images");
  if (fontCount > 3) recommendations.push("Reduce number of web fonts; use font-display: swap");
  if (motionPresetCount > 8) recommendations.push("Limit motion presets on critical rendering path");
  if (heavySections > 2) recommendations.push("Optimize heavy sections (carousels, videos) with deferred loading");
  if (clsEstimate > 0.1) recommendations.push("Set explicit dimensions on media to prevent layout shift");
  recommendations.push("Use WebP/AVIF formats for images with JPEG fallback");
  recommendations.push("Enable gzip/brotli compression on text assets");
  recommendations.push("Implement a CDN for static asset delivery");

  // Overall score
  const fcpScore = clamp100(100 - (fcpEstimate - 800) / 10);
  const lcpScore = clamp100(100 - (lcpEstimate - 1200) / 15);
  const clsScore = clamp100(100 - clsEstimate * 400);
  const tbtScore = clamp100(100 - tbtEstimate / 5);
  const bundleScore = clamp100(100 - (totalJsEstimate - 45_000) / 2000);

  const overallScore = Math.round(
    (fcpScore * 0.2 + lcpScore * 0.3 + clsScore * 0.15 + tbtScore * 0.15 + bundleScore * 0.2),
  );

  log({ agent: "performance", score: overallScore, jsKB: Math.round(totalJsEstimate / 1024) });

  return {
    overallScore,
    metrics,
    recommendations,
    bundleEstimate: totalJsEstimate + totalCssEstimate,
    perSection,
  };
}
