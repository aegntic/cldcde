/**
 * Design System Agent — infers design tokens from captured computed styles
 * and maps them into a structured DesignTokens object with theme support.
 */
import type { DesignTokens, TypographyTokens, GridTokens, TextStyleToken, ThemeDefinition, ThemeName } from "../types.js";
import { kebabCase, mergeRecords } from "../util.js";

export type DesignSystemInput = {
  // From the compiler's token extraction
  colors?: Record<string, string>;
  fonts?: Record<string, string>;
  fontSizes?: Record<string, string>;
  fontWeights?: Record<string, string>;
  lineHeights?: Record<string, string>;
  spacing?: Record<string, string>;
  radii?: Record<string, string>;
  shadows?: Record<string, string>;
  zIndices?: Record<string, string>;
  breakpoints?: Record<string, string>;
  // Semantic tokens
  semanticColors?: Array<{ name: string; value: string }>;
};

export function runDesignSystemAgent(opts: {
  input: DesignSystemInput;
  themes?: ThemeName[];
  log?: (e: Record<string, unknown>) => void;
}): { tokens: DesignTokens; themes: ThemeDefinition[] } {
  const { input, themes = [], log = () => {} } = opts;
  log({ agent: "design-system", colorCount: Object.keys(input.colors ?? {}).length });

  const colors = normalizeColors(input.colors, input.semanticColors);
  const spacing = normalizeSpacing(input.spacing);
  const typography = normalizeTypography(input);
  const radius = normalizeRadius(input.radii);
  const shadows = normalizeShadows(input.shadows);
  const blur = inferBlur(shadows);
  const animation = inferAnimationTokens();
  const opacity = inferOpacity(colors);
  const containers = inferContainers(spacing);
  const grids = inferGrids(input.breakpoints);

  const tokens: DesignTokens = {
    colors,
    spacing,
    typography,
    radius,
    shadows,
    blur,
    animation,
    opacity,
    containers,
    grids,
  };

  const themeDefs = themes.map((t) => buildTheme(t, tokens));

  log({ agent: "design-system", tokenCategories: Object.keys(tokens).length, themes: themeDefs.length });

  return { tokens, themes: themeDefs };
}

function normalizeColors(raw: Record<string, string> = {}, semantic: Array<{ name: string; value: string }> = []): Record<string, string> {
  const out: Record<string, string> = {};
  // Semantic colors take precedence (background, foreground, primary, etc.)
  for (const s of semantic) {
    out[s.name] = s.value;
  }
  // Fill in remaining raw colors
  for (const [k, v] of Object.entries(raw)) {
    const name = kebabCase(k);
    if (!out[name]) out[name] = v;
  }
  return out;
}

function normalizeSpacing(raw: Record<string, string> = {}): Record<string, string> {
  const out: Record<string, string> = {};
  const entries = Object.entries(raw).sort((a, b) => parseFloat(a[1]) - parseFloat(b[1]));
  entries.forEach(([k, v], i) => {
    out[kebabCase(k) || `space-${i}`] = v;
  });
  // Ensure a standard scale exists
  if (!out["0"]) out["0"] = "0px";
  if (!out["1"]) out["1"] = "4px";
  if (!out["2"]) out["2"] = "8px";
  if (!out["4"]) out["4"] = "16px";
  if (!out["8"]) out["8"] = "32px";
  if (!out["16"]) out["16"] = "64px";
  return out;
}

function normalizeTypography(input: DesignSystemInput): TypographyTokens {
  const fontFamily: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.fonts ?? {})) {
    fontFamily[kebabCase(k)] = v;
  }
  if (Object.keys(fontFamily).length === 0) {
    fontFamily["sans"] = "system-ui, -apple-system, sans-serif";
  }

  const fontSize: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.fontSizes ?? {})) {
    fontSize[kebabCase(k)] = v;
  }
  if (Object.keys(fontSize).length === 0) {
    Object.assign(fontSize, { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem", "3xl": "2rem", "4xl": "2.5rem", "5xl": "3.5rem", "6xl": "4.5rem" });
  }

  const fontWeight: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.fontWeights ?? {})) {
    fontWeight[kebabCase(k)] = v;
  }
  if (Object.keys(fontWeight).length === 0) {
    Object.assign(fontWeight, { normal: "400", medium: "500", semibold: "600", bold: "700" });
  }

  const lineHeight: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.lineHeights ?? {})) {
    lineHeight[kebabCase(k)] = v;
  }
  if (Object.keys(lineHeight).length === 0) {
    Object.assign(lineHeight, { none: "1", tight: "1.25", snug: "1.375", normal: "1.5", relaxed: "1.625", loose: "2" });
  }

  const letterSpacing: Record<string, string> = {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0em",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  };

  // Build text styles (display, heading, body, caption, etc.)
  const textStyle: Record<string, TextStyleToken> = {
    display: { fontSize: fontSize["5xl"] ?? "3.5rem", fontWeight: fontWeight["bold"] ?? "700", lineHeight: lineHeight["none"] ?? "1", letterSpacing: letterSpacing.tighter ?? "-0.05em", fontFamily: Object.values(fontFamily)[0] ?? "sans-serif" },
    h1: { fontSize: fontSize["4xl"] ?? "2.5rem", fontWeight: fontWeight["bold"] ?? "700", lineHeight: lineHeight["tight"] ?? "1.25", letterSpacing: letterSpacing.tight ?? "-0.025em", fontFamily: Object.values(fontFamily)[0] ?? "sans-serif" },
    h2: { fontSize: fontSize["3xl"] ?? "2rem", fontWeight: fontWeight["semibold"] ?? "600", lineHeight: lineHeight["snug"] ?? "1.375", letterSpacing: letterSpacing.tight ?? "-0.025em", fontFamily: Object.values(fontFamily)[0] ?? "sans-serif" },
    h3: { fontSize: fontSize["2xl"] ?? "1.5rem", fontWeight: fontWeight["semibold"] ?? "600", lineHeight: lineHeight["snug"] ?? "1.375", letterSpacing: letterSpacing.normal ?? "0em", fontFamily: Object.values(fontFamily)[0] ?? "sans-serif" },
    body: { fontSize: fontSize["base"] ?? "1rem", fontWeight: fontWeight["normal"] ?? "400", lineHeight: lineHeight["normal"] ?? "1.5", letterSpacing: letterSpacing.normal ?? "0em", fontFamily: Object.values(fontFamily)[0] ?? "sans-serif" },
    caption: { fontSize: fontSize["sm"] ?? "0.875rem", fontWeight: fontWeight["normal"] ?? "400", lineHeight: lineHeight["normal"] ?? "1.5", letterSpacing: letterSpacing.wide ?? "0.025em", fontFamily: Object.values(fontFamily)[0] ?? "sans-serif" },
  };

  return { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textStyle };
}

function normalizeRadius(raw: Record<string, string> = {}): Record<string, string> {
  const out: Record<string, string> = {};
  const entries = Object.entries(raw).sort((a, b) => parseFloat(a[1]) - parseFloat(b[1]));
  entries.forEach(([k, v], i) => {
    out[kebabCase(k) || `radius-${i}`] = v;
  });
  if (Object.keys(out).length === 0) {
    Object.assign(out, { none: "0px", sm: "2px", md: "6px", lg: "12px", xl: "20px", full: "9999px" });
  }
  return out;
}

function normalizeShadows(raw: Record<string, string> = {}): Record<string, string> {
  const out: Record<string, string> = {};
  const entries = Object.entries(raw).sort((a, b) => a[1].length - b[1].length);
  entries.forEach(([k, v], i) => {
    out[kebabCase(k) || `shadow-${i}`] = v;
  });
  if (Object.keys(out).length === 0) {
    Object.assign(out, {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    });
  }
  return out;
}

function inferBlur(shadows: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { none: "0px", sm: "4px", md: "8px", lg: "16px", xl: "24px", "2xl": "40px" };
  for (const [k, v] of Object.entries(shadows)) {
    const match = /blur\((\d+\.?\d*)px\)/.exec(v);
    if (match) out[kebabCase(k)] = `${match[1]}px`;
  }
  return out;
}

function inferAnimationTokens(): Record<string, string> {
  return {
    "fade-in": "opacity 0.3s ease-out",
    "fade-in-up": "opacity 0.3s ease-out, transform 0.3s ease-out",
    "slide-in-right": "transform 0.3s ease-out",
    "scale-in": "transform 0.2s ease-out",
    "bounce-in": "transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  };
}

function inferOpacity(colors: Record<string, string>): Record<string, string> {
  return { "0": "0", "5": "0.05", "10": "0.1", "20": "0.2", "30": "0.3", "40": "0.4", "50": "0.5", "60": "0.6", "70": "0.7", "80": "0.8", "90": "0.9", "100": "1" };
}

function inferContainers(spacing: Record<string, string>): Record<string, string> {
  return {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
    full: "100%",
  };
}

function inferGrids(breakpoints: Record<string, string> = {}): GridTokens {
  const bp = Object.values(breakpoints);
  return {
    columns: { base: 4, sm: 6, md: 8, lg: 12, xl: 12, "2xl": 12 },
    gutter: { base: "16px", sm: "16px", md: "24px", lg: "32px", xl: "32px", "2xl": "32px" },
    margin: { base: "16px", sm: "24px", md: "32px", lg: "48px", xl: "64px", "2xl": "80px" },
    maxWidth: "1536px",
  };
}

function buildTheme(name: ThemeName, tokens: DesignTokens): ThemeDefinition {
  const themeMap: Record<ThemeName, { description: string; colors: Record<string, string>; typography: Partial<TypographyTokens> }> = {
    editorial: { description: "Refined, content-first with serif headings and generous whitespace", colors: {}, typography: {} },
    glass: { description: "Frosted glass effect with backdrop blur and translucent surfaces", colors: {}, typography: {} },
    luxury: { description: "Opulent with deep tones, gold accents, and elegant serif typography", colors: {}, typography: {} },
    minimal: { description: "Stripped back, high contrast, maximum whitespace", colors: {}, typography: {} },
    corporate: { description: "Professional, trustworthy, with structured grids and neutral palette", colors: {}, typography: {} },
    fashion: { description: "Bold, editorial with dramatic typography and full-bleed imagery", colors: {}, typography: {} },
    cyber: { description: "Neon on dark, glitch aesthetics, monospace accents", colors: {}, typography: {} },
    brutalist: { description: "Raw, exposed structure, harsh contrasts, unconventional layouts", colors: {}, typography: {} },
    monochrome: { description: "Black and white only, with grayscale gradients", colors: {}, typography: {} },
    museum: { description: "Gallery-like presentation with generous padding and centered content", colors: {}, typography: {} },
  };

  const def = themeMap[name];
  return {
    name,
    description: def.description,
    tokenOverrides: { colors: def.colors },
    motionOverrides: {},
    typographyOverrides: def.typography,
  };
}
