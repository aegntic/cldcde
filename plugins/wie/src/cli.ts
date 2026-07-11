#!/usr/bin/env -S npx tsx
/**
 * WIE CLI — Zero-shot website intelligence analysis.
 *
 * Usage:
 *   npx tsx src/cli.ts <URL> [--output <dir>] [--max-pages <n>]
 *
 * Input: {{WEBSITE_URL}}
 * Output: Complete template ecosystem in the output directory.
 */
import { runWIE } from "./engine.js";
import type { WIEOptions } from "./types.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.error(`AEGNTIC Website Intelligence Engine

Usage: wie <URL> [options]

Options:
  --output <dir>       Output directory (default: ./wie-output)
  --max-pages <n>      Maximum pages to analyze (default: 50)
  --max-depth <n>      Maximum crawl depth (default: 3)
  --themes <list>      Comma-separated theme names
  --cms <list>         Comma-separated CMS platforms

Output:
  A complete template ecosystem with manifest files, section library,
  component library, motion presets, design tokens, placeholder catalog,
  CMS schemas, accessibility/performance/SEO reports, and more.`);
    process.exit(args.length === 0 ? 1 : 0);
  }

  const url = args[0]!;
  const options: WIEOptions = { url };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i]!;
    switch (arg) {
      case "--output":
        options.outputDir = args[++i];
        break;
      case "--max-pages":
        options.maxPages = parseInt(args[++i] ?? "50", 10);
        break;
      case "--max-depth":
        options.maxDepth = parseInt(args[++i] ?? "3", 10);
        break;
      case "--themes":
        options.themes = (args[++i] ?? "").split(",") as WIEOptions["themes"];
        break;
      case "--cms":
        options.cmsPlatforms = (args[++i] ?? "").split(",") as WIEOptions["cmsPlatforms"];
        break;
      default:
        if (arg.startsWith("--")) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  options.log = (e) => {
    const agent = e.agent ?? e.phase ?? "system";
    const summary = Object.entries(e)
      .filter(([k]) => k !== "agent" && k !== "phase")
      .map(([k, v]) => `${k}=${v}`)
      .join(" ");
    console.error(`[WIE:${agent}] ${summary}`);
  };

  try {
    console.error(`\nAEGNTIC Website Intelligence Engine v1.0.0`);
    console.error(`Analyzing: ${url}\n`);

    const result = await runWIE(options);

    console.error(`\nTemplate Ecosystem Generated:`);
    console.error(`  Template ID: ${result.manifest.templateId}`);
    console.error(`  Output Dir:  ${result.outputDir}`);
    console.error(`  Files:       ${result.files.length}`);
    console.error(`  Sections:    ${result.manifest.sectionLibrary.length}`);
    console.error(`  Components:  ${result.manifest.componentLibrary.length}`);
    console.error(`  Motion:      ${result.manifest.animationLibrary.length} presets`);
    console.error(`  Placeholders: ${result.manifest.placeholderCatalog.placeholders.length}`);
    console.error(`  CMS Schemas: ${result.manifest.cmsSchema.length} platforms`);
    console.error(`  Benchmark:   ${result.manifest.benchmark.overall}/100`);
    console.error(`  QA Passed:   ${result.manifest.qaReport.passed}\n`);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main();
