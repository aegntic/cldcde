/**
 * Media/Asset Intelligence Agent — converts every visual asset into
 * an upload zone with metadata: aspect ratio, focal point, minimum
 * size, responsive variants, alt text, caption, and compression profile.
 */
import type { MediaSchema, ResponsiveVariant, CompressionProfile, BreakpointKey } from "../types.js";
import { kebabCase } from "../util.js";

export type MediaInput = {
  assets?: Array<{
    url: string;
    type: string;
    width?: number;
    height?: number;
    alt?: string;
  }>;
  sections?: Array<{ id: string; uuid: string }>;
};

export function runMediaAgent(opts: {
  input: MediaInput;
  log?: (e: Record<string, unknown>) => void;
}): MediaSchema[] {
  const { input, log = () => {} } = opts;
  log({ agent: "media", assets: input.assets?.length ?? 0 });

  const schemas: MediaSchema[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < (input.assets ?? []).length; i++) {
    const asset = input.assets![i]!;
    const key = `${asset.type}:${asset.url}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const width = asset.width ?? 1200;
    const height = asset.height ?? 800;
    const aspectRatio = simplifyRatio(width, height);
    const type = classifyMediaType(asset.type, asset.url);

    schemas.push({
      id: `media-${kebabCase(type)}-${i}`,
      name: `${type} asset ${i + 1}`,
      type,
      aspectRatio,
      focalPoint: { x: 0.5, y: 0.5 },
      minSize: { width: Math.min(width, 400), height: Math.min(height, 300) },
      responsiveVariants: buildResponsiveVariants(width, height, type),
      altText: asset.alt ?? "",
      caption: null,
      compressionProfile: buildCompressionProfile(type),
      uploadZone: true,
      sectionId: input.sections?.[i]?.uuid,
    });
  }

  // Ensure at least a placeholder hero image schema
  if (schemas.length === 0) {
    schemas.push({
      id: "media-hero-placeholder",
      name: "Hero Image",
      type: "image",
      aspectRatio: "16/9",
      focalPoint: { x: 0.5, y: 0.5 },
      minSize: { width: 1200, height: 675 },
      responsiveVariants: buildResponsiveVariants(1920, 1080, "image"),
      altText: "Hero image placeholder",
      caption: null,
      compressionProfile: { quality: 80, format: "webp", progressive: true, lazy: false },
      uploadZone: true,
    });
  }

  log({ agent: "media", total: schemas.length });
  return schemas;
}

function classifyMediaType(type: string, url: string): MediaSchema["type"] {
  const ext = url.split(".").pop()?.toLowerCase() ?? "";
  if (type === "svg" || ext === "svg") return "svg";
  if (type === "video" || /mp4|webm|mov|avi/.test(ext)) return "video";
  if (type === "lottie" || /lottie|json/.test(ext)) return "lottie";
  if (/icon|ico/.test(type) || ext === "ico") return "icon";
  if (/audio|mp3|wav|ogg/.test(type) || /mp3|wav|ogg/.test(ext)) return "audio";
  return "image";
}

function simplifyRatio(w: number, h: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(w, h);
  const rw = w / d;
  const rh = h / d;
  // Simplify to common ratios
  if (rw / rh > 1.7 && rw / rh < 1.8) return "16/9";
  if (rw / rh > 0.55 && rw / rh < 0.57) return "9/16";
  if (rw === rh) return "1/1";
  if (rw / rh > 1.3 && rw / rh < 1.4) return "4/3";
  if (rw / rh > 2.3 && rw / rh < 2.4) return "21/9";
  return `${rw}/${rh}`;
}

function buildResponsiveVariants(width: number, height: number, type: MediaSchema["type"]): ResponsiveVariant[] {
  if (type === "svg" || type === "icon") {
    return [{ breakpoint: "base", width: width, height: height, format: "svg" }];
  }

  const variants: ResponsiveVariant[] = [];
  const breakpoints: Array<{ key: BreakpointKey; w: number }> = [
    { key: "base", w: 375 },
    { key: "sm", w: 640 },
    { key: "md", w: 768 },
    { key: "lg", w: 1024 },
    { key: "xl", w: 1280 },
    { key: "2xl", w: 1536 },
  ];

  for (const bp of breakpoints) {
    const scaledW = Math.min(width, bp.w * 2); // 2x for retina
    const scaledH = Math.round((scaledW / width) * height);
    const format: ResponsiveVariant["format"] = type === "video" ? "jpg" : "webp";
    variants.push({ breakpoint: bp.key, width: scaledW, height: scaledH, format });
  }

  return variants;
}

function buildCompressionProfile(type: MediaSchema["type"]): CompressionProfile {
  switch (type) {
    case "image":
      return { quality: 80, format: "webp", progressive: true, lazy: true };
    case "video":
      return { quality: 70, format: "jpg", progressive: false, lazy: true };
    case "svg":
    case "icon":
      return { quality: 100, format: "svg", progressive: false, lazy: true };
    case "lottie":
      return { quality: 100, format: "svg", progressive: false, lazy: true };
    default:
      return { quality: 80, format: "webp", progressive: true, lazy: true };
  }
}
