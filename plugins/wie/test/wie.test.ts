import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runWIE, runDiscovery, runPatternRecognition, getArchetypes } from "../src/index.js";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const TEST_OUTPUT = "/tmp/wie-test-suite";

describe("WIE Engine — end-to-end", () => {
  it("runs the full pipeline with default capture and emits all files", async () => {
    rmSync(TEST_OUTPUT, { recursive: true, force: true });

    const result = await runWIE({
      url: "https://example.com",
      outputDir: TEST_OUTPUT,
      themes: ["editorial", "minimal"],
      cmsPlatforms: ["payload", "json"],
    });

    // Manifest
    assert.ok(result.manifest);
    assert.ok(/^[0-9a-f-]+$/.test(result.manifest.templateId));
    assert.equal(result.manifest.version, "1.0.0");
    assert.equal(result.manifest.sourceUrl, "https://example.com");

    // Sections
    assert.ok(result.manifest.sectionLibrary.length > 0);
    const section = result.manifest.sectionLibrary[0]!;
    assert.ok(section.uuid);
    assert.ok(section.name);
    assert.ok(section.category);
    assert.ok(section.archetype);
    assert.ok(Array.isArray(section.responsiveRules));
    assert.ok(section.compatibilityScore >= 0);
    assert.ok(section.compatibilityScore <= 100);

    // Placeholders
    assert.ok(result.manifest.placeholderCatalog.placeholders.length > 0);
    const ph = result.manifest.placeholderCatalog.placeholders[0]!;
    assert.ok(ph.id);
    assert.ok(ph.key);
    assert.ok(ph.purpose);
    assert.ok(ph.type);
    assert.ok(ph.tone);
    assert.ok(ph.example);

    // CMS Schemas
    assert.equal(result.manifest.cmsSchema.length, 2);
    assert.ok(result.manifest.cmsSchema.some((c) => c.cms === "payload"));
    assert.ok(result.manifest.cmsSchema.some((c) => c.cms === "json"));

    // Themes
    assert.equal(result.manifest.themes.length, 2);

    // Benchmark
    assert.ok(result.manifest.benchmark.overall > 0);
    assert.ok(result.manifest.benchmark.overall <= 100);

    // Accessibility
    assert.ok(result.manifest.accessibilityReport.overallScore >= 0);
    assert.ok(result.manifest.accessibilityReport.overallScore <= 100);

    // Performance
    assert.ok(result.manifest.performanceReport.overallScore >= 0);
    assert.ok(result.manifest.performanceReport.overallScore <= 100);

    // SEO
    assert.ok(result.manifest.seoReport.overallScore >= 0);
    assert.ok(result.manifest.seoReport.overallScore <= 100);

    // Builder spec
    assert.ok(result.manifest.builderSpec.features.length > 0);
    assert.ok(result.manifest.builderSpec.panels.length > 0);
    assert.ok(result.manifest.builderSpec.aiFeatures.length > 0);

    // Experience timeline
    assert.ok(result.manifest.experienceTimeline.events.length > 0);

    // QA report
    assert.ok(result.manifest.qaReport.checks.length > 0);

    // Files emitted
    assert.ok(result.files.length >= 20);

    const expectedFiles = [
      "manifest.json", "sections.json", "components.json", "motions.json",
      "pages.json", "tokens.json", "placeholders.json", "compatibility.json",
      "media.json", "cms.json", "timeline.json", "accessibility.json",
      "performance.json", "seo.json", "benchmark.json", "site-graph.json",
      "builder-spec.json", "themes.json", "patterns.json", "qa.json",
      "folder-architecture.json", "executive-summary.md",
    ];
    for (const f of expectedFiles) {
      assert.ok(result.files.includes(f), `Missing file: ${f}`);
      assert.ok(existsSync(join(TEST_OUTPUT, f)), `File not on disk: ${f}`);
    }

    // Executive summary is valid markdown
    const summary = readFileSync(join(TEST_OUTPUT, "executive-summary.md"), "utf-8");
    assert.ok(summary.includes("# AEGNTIC Website Intelligence Engine"));
    assert.ok(summary.includes("https://example.com"));
  });

  it("produces consistent section/placeholder counts for same input", async () => {
    const r1 = await runWIE({ url: "https://test.com", outputDir: "/tmp/wie-det-1" });
    const r2 = await runWIE({ url: "https://test.com", outputDir: "/tmp/wie-det-2" });
    assert.equal(r1.manifest.sectionLibrary.length, r2.manifest.sectionLibrary.length);
    assert.equal(
      r1.manifest.placeholderCatalog.placeholders.length,
      r2.manifest.placeholderCatalog.placeholders.length,
    );
  });
});

describe("WIE Engine — agent-level tests", () => {
  it("runDiscovery builds a site graph", () => {
    const { siteGraph } = runDiscovery({
      entryUrl: "https://example.com",
      crawlPaths: ["/", "/about", "/contact"],
      crawlDepths: { "/": 0, "/about": 1, "/contact": 1 },
      crawlSources: { "/": ["entry"], "/about": ["/"], "/contact": ["/"] },
      robotsDisallow: [],
      origin: "https://example.com",
      titles: { "/": "Home", "/about": "About", "/contact": "Contact" },
    });
    assert.equal(siteGraph.totalPages, 3);
    assert.equal(siteGraph.origin, "https://example.com");
  });

  it("runPatternRecognition detects archetypes", () => {
    const archetypes = getArchetypes();
    assert.equal(archetypes.length, 10);

    const result = runPatternRecognition({
      sections: [
        { id: "s1", role: "hero", category: "hero", pagePath: "/" },
        { id: "s2", role: "features", category: "feature-grid", pagePath: "/" },
        { id: "s3", role: "pricing", category: "pricing", pagePath: "/pricing" },
      ],
    });
    assert.ok(result.detectedPatterns.length > 0);
  });
});
