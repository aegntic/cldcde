/**
 * Discovery Agent — crawls the reference site, builds the page graph,
 * and classifies each page by type.
 */
import type { SiteGraph, PageNode, PageType } from "../types.js";
import { detectPageType } from "../util.js";

export type DiscoveryResult = {
  siteGraph: SiteGraph;
  pagesToCapture: string[];
};

export function runDiscovery(opts: {
  entryUrl: string;
  crawlPaths?: string[];
  crawlDepths?: Record<string, number>;
  crawlSources?: Record<string, string[]>;
  robotsDisallow?: string[];
  origin?: string;
  maxPages?: number;
  titles?: Record<string, string>;
  log?: (e: Record<string, unknown>) => void;
}): DiscoveryResult {
  const {
    entryUrl,
    crawlPaths = [],
    crawlDepths = {},
    crawlSources = {},
    robotsDisallow = [],
    origin = new URL(entryUrl).origin,
    maxPages = 50,
    titles = {},
    log = () => {},
  } = opts;

  log({ agent: "discovery", entryUrl, discoveredPaths: crawlPaths.length });

  const paths = crawlPaths.length > 0 ? crawlPaths : ["/"];
  const pages: PageNode[] = [];
  const edges: Array<{ from: string; to: string }> = [];

  const seen = new Set<string>();
  for (const path of paths) {
    if (seen.has(path)) continue;
    seen.add(path);
    if (pages.length >= maxPages) break;

    const pageType: PageType = detectPageType(path);
    const url = path.startsWith("http") ? path : `${origin}${path}`;
    pages.push({
      url,
      path,
      title: titles[path] ?? path,
      depth: crawlDepths[path] ?? 0,
      sources: crawlSources[path] ?? ["entry"],
      pageType,
      status: "discovered",
    });
  }

  // Build edges from crawl depth relationships (parent → child)
  for (const page of pages) {
    if (page.depth > 0) {
      // Find parent at depth - 1 that shares a path prefix
      const parent = pages.find((p) => p.depth === page.depth - 1 && page.path.startsWith(p.path.split("/").slice(0, -1).join("/")));
      if (parent) edges.push({ from: parent.path, to: page.path });
    }
  }

  const siteGraph: SiteGraph = {
    entryUrl,
    origin,
    crawledAt: new Date().toISOString(),
    totalPages: pages.length,
    pages,
    edges,
    robotsDisallow,
  };

  const pagesToCapture = pages.slice(0, maxPages).map((p) => p.url);

  log({ agent: "discovery", totalPages: pages.length, pagesToCapture: pagesToCapture.length });

  return { siteGraph, pagesToCapture };
}
