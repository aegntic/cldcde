/** WIE utilities: deterministic UUIDs, naming, hashing, scoring. */
import { createHash } from "node:crypto";

let counter = 0;

/** Deterministic UUID v4-style from a seed string. Same input → same UUID. */
export function uuid(seed: string): string {
  const hash = createHash("sha256").update(seed).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `8${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

/** Sequential short ID for ordered elements. */
export function seqId(prefix: string): string {
  counter++;
  return `${prefix}-${String(counter).padStart(4, "0")}`;
}

/** Reset the global counter (for testing). */
export function resetCounter(): void {
  counter = 0;
}

/** Convert a kebab/snake/space string to PascalCase. */
export function pascalCase(s: string): string {
  return s
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

/** Convert to camelCase. */
export function camelCase(s: string): string {
  const pc = pascalCase(s);
  return pc.charAt(0).toLowerCase() + pc.slice(1);
}

/** Convert to kebab-case. */
export function kebabCase(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/** Clamp a number to [0, 100]. */
export function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Linear interpolate between a and b. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Map a value from one range to another. */
export function mapRange(v: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) return outMin;
  return outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/** Score helper: average of numeric scores clamped to [0,100]. */
export function scoreAverage(...scores: number[]): number {
  if (scores.length === 0) return 0;
  return clamp100(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/** Detect page type from URL path segments. */
export function detectPageType(path: string): import("./types.js").PageType {
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return "home";
  const last = segments[segments.length - 1]!.toLowerCase();
  if (/(privacy|terms|legal|cookies|gdpr|policy)/.test(last)) return "legal";
  if (/(pricing)/.test(last)) return "pricing";
  if (/(contact)/.test(last)) return "contact";
  if (/(about|team)/.test(last)) return segments.some((s) => /team/.test(s)) ? "team" : "about";
  if (/(blog)/.test(segments[0]!)) return segments.length > 1 ? "blog-post" : "blog-index";
  if (/(portfolio|work|projects)/.test(segments[0]!)) return segments.length > 1 ? "portfolio-item" : "portfolio-index";
  if (/(case-stud|stud)/.test(segments[0]!)) return segments.length > 1 ? "case-study-item" : "case-study-index";
  if (/(faq)/.test(last)) return "faq";
  if (/(search)/.test(last)) return "search";
  if (/(404|not-found)/.test(last)) return "404";
  if (/(archive)/.test(last)) return "archive";
  return "unknown";
}

/** Infer a human-readable name from a section role + order. */
export function sectionName(role: string, order: number): string {
  return `${pascalCase(role || "Section")}${order + 1}`;
}

/** Estimate word count from a text string. */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** ISO timestamp (deterministic for a given Date). */
export function isoNow(): string {
  return new Date().toISOString();
}

/** Deep freeze an object (for QA immutability). */
export function deepFreeze<T>(obj: T): T {
  if (typeof obj !== "object" || obj === null) return obj;
  Object.freeze(obj);
  for (const v of Object.values(obj as Record<string, unknown>)) {
    if (Array.isArray(v)) v.forEach(deepFreeze);
    else deepFreeze(v);
  }
  return obj;
}

/** Deduplicate an array by a key function. */
export function dedupeBy<T>(arr: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const k = keyFn(item);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

/** Merge multiple records (last wins). */
export function mergeRecords(...records: Record<string, string>[]): Record<string, string> {
  return Object.assign({}, ...records);
}
