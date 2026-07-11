/**
 * Motion DNA Agent — extracts reusable, parameterized MotionPresets
 * from captured motion data and interaction patterns.
 *
 * Treats motion as first-class data: every animation, transition, and
 * interaction choreography becomes a named, reusable preset.
 */
import type {
  MotionDNA,
  MotionPreset,
  MotionCategory,
  MotionParameters,
  MotionTrigger,
  ScrollSmoothing,
  EasingPhilosophy,
  RevealSequencing,
  StickyLogic,
  PageTransitionProfile,
  CursorBehaviour,
  HoverInterpolation,
  LoaderChoreography,
  NavigationChoreography,
  VisualPacing,
  EmotionalRhythm,
  TransitionLanguage,
} from "../types.js";
import { kebabCase } from "../util.js";

export type MotionInput = {
  // From the compiler's motion capture
  waapiAnims?: Array<{ cid: string; keyframes: Array<Record<string, string | number>>; duration: number; delay: number; easing: string; iterations: number; direction: string; fill: string }>;
  rotators?: Array<{ cid: string; texts: string[]; intervalMs: number }>;
  reveals?: Array<{ cid: string; opacity: string; transform: string; transition: string; visibility?: string; animationName?: string; animationDuration?: string; animationDelay?: string; animationTiming?: string }>;
  marquees?: Array<{ cid: string; pxPerSec: number; periodPx: number }>;
  keyframes?: string[];
  // From the compiler's interaction capture
  interactions?: Array<{ type: string; selector: string; description: string }>;
  // From the compiler's CSS analysis
  transitions?: Array<{ property: string; duration: string; easing: string }>;
  stickyElements?: Array<{ selector: string; offset: number }>;
};

export function runMotionAgent(opts: {
  input: MotionInput;
  sectionMap?: Array<{ sectionId: string; name: string }>;
  log?: (e: Record<string, unknown>) => void;
}): MotionDNA {
  const { input, sectionMap = [], log = () => {} } = opts;
  log({ agent: "motion", waapiCount: input.waapiAnims?.length ?? 0, revealCount: input.reveals?.length ?? 0 });

  const presets: MotionPreset[] = [];

  // Extract WAAPI animations → MotionPresets
  for (const anim of input.waapiAnims ?? []) {
    const category = classifyWAAPI(anim);
    const name = `${category}-${anim.cid.slice(0, 8)}`;
    presets.push(buildPreset(name, category, anim, "intersection"));
  }

  // Extract reveals → MotionPresets
  for (const reveal of input.reveals ?? []) {
    const params = parseRevealParams(reveal);
    presets.push({
      id: `reveal-${reveal.cid.slice(0, 8)}`,
      name: `Reveal ${reveal.cid.slice(0, 6)}`,
      category: "reveal",
      description: `Scroll-triggered reveal: opacity ${reveal.opacity} → 1, transform ${reveal.transform} → none`,
      parameters: params,
      triggers: [{ event: "intersection", threshold: 0.15 }],
      cssCode: buildRevealCSS(reveal),
      jsCode: null,
      accessibility: {
        respectsReducedMotion: true,
        fallbackDescription: "Content appears immediately without animation",
      },
    });
  }

  // Extract rotators → MotionPresets
  for (const rotator of input.rotators ?? []) {
    presets.push({
      id: `rotator-${rotator.cid.slice(0, 8)}`,
      name: `Text Rotator ${rotator.cid.slice(0, 6)}`,
      category: "rotator",
      description: `Cycles through ${rotator.texts.length} text values every ${rotator.intervalMs}ms`,
      parameters: {
        duration: rotator.intervalMs,
        delay: 0,
        easing: "step-end",
        iterations: Infinity,
      },
      triggers: [{ event: "load" }],
      cssCode: "",
      jsCode: `// Rotator: cycles ${rotator.texts.length} values at ${rotator.intervalMs}ms intervals`,
      accessibility: {
        respectsReducedMotion: true,
        fallbackDescription: "Text is static; all values are readable in sequence",
      },
    });
  }

  // Extract marquees → MotionPresets
  for (const marquee of input.marquees ?? []) {
    presets.push({
      id: `marquee-${marquee.cid.slice(0, 8)}`,
      name: `Marquee ${marquee.cid.slice(0, 6)}`,
      category: "marquee",
      description: `Continuous horizontal scroll at ${marquee.pxPerSec}px/s`,
      parameters: {
        duration: Math.round((marquee.periodPx / marquee.pxPerSec) * 1000),
        delay: 0,
        easing: "linear",
        iterations: Infinity,
      },
      triggers: [{ event: "load" }],
      cssCode: `@keyframes marquee-${marquee.cid.slice(0, 8)} { from { transform: translateX(0); } to { transform: translateX(-${marquee.periodPx}px); } }`,
      jsCode: null,
      accessibility: {
        respectsReducedMotion: true,
        fallbackDescription: "Content is presented in a static list",
      },
    });
  }

  // Extract CSS transitions → hover presets
  for (const transition of input.transitions ?? []) {
    if (transition.property.includes("color") || transition.property.includes("transform") || transition.property.includes("all")) {
      presets.push({
        id: `hover-${kebabCase(transition.property)}-${presets.length}`,
        name: `Hover ${transition.property}`,
        category: "hover",
        description: `Smooth ${transition.property} transition on hover`,
        parameters: {
          duration: parseFloat(transition.duration) * 1000 || 300,
          delay: 0,
          easing: transition.easing || "ease",
        },
        triggers: [{ event: "hover" }],
        cssCode: `transition: ${transition.property} ${transition.duration} ${transition.easing};`,
        jsCode: null,
        accessibility: {
          respectsReducedMotion: false,
          fallbackDescription: "Hover effect applies instantly",
        },
      });
    }
  }

  // Deduplicate presets by category + parameters
  const uniquePresets = dedupePresets(presets);

  const scrollSmoothing: ScrollSmoothing = inferScrollSmoothing(input);
  const easingPhilosophy = inferEasingPhilosophy(uniquePresets, input);
  const revealSequencing = inferRevealSequencing(input);
  const stickyLogic: StickyLogic[] = (input.stickyElements ?? []).map((s) => ({
    selector: s.selector,
    offset: s.offset,
    behaviour: "stick" as const,
  }));
  const pageTransitions = inferPageTransitions(input);
  const cursorBehaviour = inferCursorBehaviour(input);
  const hoverInterpolation = inferHoverInterpolation(input);
  const loaderChoreography = inferLoaderChoreography(input);
  const navigationChoreography = inferNavigationChoreography(input);
  const visualPacing = inferVisualPacing(uniquePresets);
  const emotionalRhythm = inferEmotionalRhythm(uniquePresets);
  const transitionLanguage = inferTransitionLanguage(uniquePresets, sectionMap);

  log({ agent: "motion", presets: uniquePresets.length });

  return {
    presets: uniquePresets,
    scrollSmoothing,
    easingPhilosophy,
    revealSequencing,
    staggerCadence: revealSequencing.defaultStagger,
    viewportThresholds: [0.1, 0.25, 0.5, 0.75],
    stickyLogic,
    horizontalStorytelling: (input.marquees?.length ?? 0) > 0,
    pageTransitions,
    cursorBehaviour,
    hoverInterpolation,
    loaderChoreography,
    navigationChoreography,
    visualPacing,
    emotionalRhythm,
    transitionLanguage,
  };
}

function classifyWAAPI(anim: { keyframes: Array<Record<string, string | number>> }): MotionCategory {
  const props = new Set<string>();
  for (const kf of anim.keyframes) {
    for (const k of Object.keys(kf)) props.add(k);
  }
  if (props.has("opacity") && props.has("transform")) return "reveal";
  if (props.has("opacity")) return "fade";
  if (props.has("transform")) {
    const transforms = anim.keyframes.map((kf) => kf.transform).join(" ");
    if (/translateX/i.test(transforms)) return "slide";
    if (/scale/i.test(transforms)) return "scale";
    return "slide";
  }
  return "custom";
}

function buildPreset(name: string, category: MotionCategory, anim: { duration: number; delay: number; easing: string; iterations: number; direction: string; fill: string }, triggerEvent: MotionTrigger["event"]): MotionPreset {
  return {
    id: kebabCase(name),
    name,
    category,
    description: `${category} animation triggered on ${triggerEvent}`,
    parameters: {
      duration: anim.duration,
      delay: anim.delay,
      easing: anim.easing,
      iterations: anim.iterations === -1 ? Infinity : anim.iterations,
      direction: anim.direction,
      fill: anim.fill,
    },
    triggers: [{ event: triggerEvent }],
    cssCode: "",
    jsCode: `element.animate(keyframes, { duration: ${anim.duration}, delay: ${anim.delay}, easing: '${anim.easing}', iterations: ${anim.iterations}, direction: '${anim.direction}', fill: '${anim.fill}' })`,
    accessibility: {
      respectsReducedMotion: true,
      fallbackDescription: "Content appears without animation",
    },
  };
}

function parseRevealParams(reveal: { transition: string; animationDuration?: string; animationDelay?: string; animationTiming?: string }): MotionParameters {
  const durationMatch = /(\d+\.?\d*)s/.exec(reveal.animationDuration || reveal.transition || "");
  const delayMatch = /(\d+\.?\d*)s/.exec(reveal.animationDelay || "");
  const easingMatch = /cubic-bezier\([^)]+\)|ease[a-z-]*|linear/.exec(reveal.animationTiming || reveal.transition || "");
  return {
    duration: durationMatch ? parseFloat(durationMatch[1]!) * 1000 : 600,
    delay: delayMatch ? parseFloat(delayMatch[1]!) * 1000 : 0,
    easing: easingMatch?.[0] ?? "ease-out",
  };
}

function buildRevealCSS(reveal: { opacity: string; transform: string; transition: string }): string {
  return `.reveal { opacity: ${reveal.opacity}; transform: ${reveal.transform}; transition: ${reveal.transition}; }\n.reveal.is-visible { opacity: 1; transform: none; }`;
}

function dedupePresets(presets: MotionPreset[]): MotionPreset[] {
  const seen = new Set<string>();
  const out: MotionPreset[] = [];
  for (const p of presets) {
    const key = `${p.category}:${p.parameters.duration}:${p.parameters.easing}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(p);
    }
  }
  return out;
}

function inferScrollSmoothing(input: MotionInput): ScrollSmoothing {
  const hasSmooth = input.keyframes?.some((k) => /scroll/.test(k)) ?? false;
  return { enabled: hasSmooth, type: "native", parameters: { smoothness: hasSmooth ? 1 : 0 } };
}

function inferEasingPhilosophy(presets: MotionPreset[], input: MotionInput): EasingPhilosophy {
  const easings = presets.map((p) => p.parameters.easing).filter(Boolean);
  const primary = easings[0] ?? "ease-out";
  const secondary = easings[1] ?? "ease-in-out";
  return {
    primary,
    secondary,
    enter: easings.find((e) => /out/.test(e)) ?? "ease-out",
    exit: easings.find((e) => /in/.test(e)) ?? "ease-in",
    customCurves: [],
  };
}

function inferRevealSequencing(input: MotionInput): RevealSequencing {
  const revealCount = input.reveals?.length ?? 0;
  if (revealCount > 5) return { strategy: "staggered", defaultDelay: 0, defaultStagger: 100 };
  if (revealCount > 1) return { strategy: "cascade", defaultDelay: 0, defaultStagger: 150 };
  if (revealCount === 1) return { strategy: "threshold-gated", defaultDelay: 0, defaultStagger: 0 };
  return { strategy: "simultaneous", defaultDelay: 0, defaultStagger: 0 };
}

function inferPageTransitions(input: MotionInput): PageTransitionProfile | null {
  if ((input.waapiAnims?.length ?? 0) > 3) {
    return { type: "fade", duration: 300, easing: "ease-out" };
  }
  return null;
}

function inferCursorBehaviour(input: MotionInput): CursorBehaviour | null {
  const hasCursorEffect = input.interactions?.some((i) => /cursor|mouse/.test(i.description)) ?? false;
  if (hasCursorEffect) return { type: "custom", parameters: {} };
  return null;
}

function inferHoverInterpolation(input: MotionInput): HoverInterpolation {
  const transitions = input.transitions ?? [];
  const hoverTransitions = transitions.filter((t) => /color|transform|all/.test(t.property));
  if (hoverTransitions.length === 0) return { duration: 200, easing: "ease", properties: ["color"] };
  return {
    duration: parseFloat(hoverTransitions[0]!.duration) * 1000 || 300,
    easing: hoverTransitions[0]!.easing || "ease",
    properties: hoverTransitions.map((t) => t.property),
  };
}

function inferLoaderChoreography(input: MotionInput): LoaderChoreography | null {
  if ((input.waapiAnims?.length ?? 0) > 5) {
    return { type: "progress", duration: 1500, exitAnimation: "fade-out" };
  }
  return null;
}

function inferNavigationChoreography(input: MotionInput): NavigationChoreography {
  const hasDropdown = input.interactions?.some((i) => /dropdown|menu/.test(i.description)) ?? false;
  return {
    mobile: "slide-in",
    desktop: hasDropdown ? "dropdown" : "none",
    duration: 300,
    easing: "ease-out",
  };
}

function inferVisualPacing(presets: MotionPreset[]): VisualPacing {
  const avgDuration = presets.length > 0
    ? presets.reduce((sum, p) => sum + p.parameters.duration, 0) / presets.length
    : 0;
  if (avgDuration > 1000) return { rhythm: "slow", breathingRoom: 1.5, compressionExpansion: true };
  if (avgDuration > 500) return { rhythm: "medium", breathingRoom: 1.0, compressionExpansion: false };
  if (avgDuration > 0) return { rhythm: "fast", breathingRoom: 0.5, compressionExpansion: false };
  return { rhythm: "deliberate", breathingRoom: 2.0, compressionExpansion: false };
}

function inferEmotionalRhythm(presets: MotionPreset[]): EmotionalRhythm {
  const categories = new Set(presets.map((p) => p.category));
  if (categories.has("parallax") || categories.has("horizontal-scroll")) {
    return { tone: "dramatic", intensity: 0.8, peaks: presets.filter((p) => p.category === "parallax").map((p) => p.id) };
  }
  if (categories.has("marquee") || categories.has("rotator")) {
    return { tone: "energetic", intensity: 0.7, peaks: presets.filter((p) => /marquee|rotator/.test(p.category)).map((p) => p.id) };
  }
  if (presets.length > 10) {
    return { tone: "playful", intensity: 0.6, peaks: [] };
  }
  if (presets.length > 3) {
    return { tone: "corporate", intensity: 0.4, peaks: [] };
  }
  return { tone: "calm", intensity: 0.2, peaks: [] };
}

function inferTransitionLanguage(presets: MotionPreset[], sectionMap: Array<{ sectionId: string; name: string }>): TransitionLanguage {
  const shared = presets.filter((p) => p.category === "reveal" || p.category === "fade").map((p) => p.id);
  const perSection = sectionMap.map((s) => ({
    sectionId: s.sectionId,
    transitions: presets.filter((p) => p.name.includes(s.name)).map((p) => p.id),
  }));
  return { shared, perSection };
}
