/**
 * Component Agent — extracts reusable component DNA from detected
 * component clusters and section-level repeated patterns.
 *
 * Every component becomes a self-describing DNA record with props, slots,
 * variants, states, token references, animation hooks, and ARIA profiles.
 */
import type { ComponentDNA, ComponentProp, ComponentSlot, ComponentVariant, ARIAProfile } from "../types.js";
import { uuid, pascalCase, kebabCase } from "../util.js";

export type ComponentInput = {
  // From the compiler's component extraction
  clusters?: Array<{
    baseName: string;
    rootCids: string[];
    dataModel?: string;
    recipeKind?: string;
  }>;
  // From the compiler's primitive inventory
  primitives?: Array<{
    tag: string;
    role: string;
    count: number;
  }>;
  // From section data
  sections?: Array<{
    id: string;
    role: string;
    components?: string[];
  }>;
};

export function runComponentAgent(opts: {
  input: ComponentInput;
  tokenIds?: string[];
  motionPresetIds?: string[];
  log?: (e: Record<string, unknown>) => void;
}): ComponentDNA[] {
  const { input, tokenIds = [], motionPresetIds = [], log = () => {} } = opts;
  log({ agent: "component", clusters: input.clusters?.length ?? 0, primitives: input.primitives?.length ?? 0 });

  const components: ComponentDNA[] = [];

  // Process extracted component clusters
  for (const cluster of input.clusters ?? []) {
    const name = pascalCase(cluster.baseName);
    const props = inferProps(cluster);
    const slots = inferSlots(cluster);
    const variants = inferVariants(cluster);
    const aria = inferARIA(cluster);

    components.push({
      uuid: uuid(`component:${cluster.baseName}:${cluster.rootCids.join(",")}`),
      name,
      category: cluster.recipeKind ?? cluster.dataModel ?? "reusable",
      props,
      slots,
      variants,
      states: inferStates(cluster),
      tokenIds: tokenIds.slice(0, 10),
      animationHookIds: motionPresetIds.slice(0, 3),
      aria,
      responsiveBehaviour: inferResponsiveBehaviour(cluster),
      themeSupport: ["editorial", "minimal", "corporate", "glass"],
      instances: cluster.rootCids.length,
      sourceSections: input.sections?.filter((s) => s.components?.includes(cluster.baseName)).map((s) => s.id) ?? [],
    });
  }

  // Process primitives as lightweight components
  for (const prim of input.primitives ?? []) {
    const name = pascalCase(prim.role || prim.tag);
    if (components.some((c) => c.name === name)) continue;
    components.push({
      uuid: uuid(`primitive:${prim.tag}:${prim.role}`),
      name,
      category: "primitive",
      props: inferPrimitiveProps(prim),
      slots: [],
      variants: [],
      states: ["default"],
      tokenIds: tokenIds.slice(0, 5),
      animationHookIds: [],
      aria: { role: prim.tag, labels: [], patterns: [], issues: [] },
      responsiveBehaviour: "scales with container",
      themeSupport: ["editorial", "minimal", "corporate", "glass", "luxury", "fashion", "cyber", "brutalist", "monochrome", "museum"],
      instances: prim.count,
      sourceSections: [],
    });
  }

  log({ agent: "component", total: components.length });
  return components;
}

function inferProps(cluster: { baseName: string; dataModel?: string; rootCids: string[] }): ComponentProp[] {
  const props: ComponentProp[] = [];
  const dataModel = cluster.dataModel ?? cluster.baseName;

  // Common props based on data model
  if (/card|item|feature/.test(dataModel)) {
    props.push(
      { name: "title", type: "string", required: true, description: "Card title text" },
      { name: "description", type: "string", required: false, description: "Card body text" },
      { name: "image", type: "image", required: false, description: "Card image" },
      { name: "href", type: "link", required: false, description: "Optional link URL" },
    );
  } else if (/nav|menu|link/.test(dataModel)) {
    props.push(
      { name: "label", type: "string", required: true, description: "Navigation item label" },
      { name: "href", type: "link", required: true, description: "Navigation item URL" },
    );
  } else if (/logo/.test(dataModel)) {
    props.push(
      { name: "src", type: "image", required: true, description: "Logo image source" },
      { name: "alt", type: "string", required: true, description: "Logo alt text" },
    );
  } else if (/testimonial|quote/.test(dataModel)) {
    props.push(
      { name: "quote", type: "rich-text", required: true, description: "Testimonial quote text" },
      { name: "author", type: "string", required: true, description: "Author name" },
      { name: "role", type: "string", required: false, description: "Author role/title" },
      { name: "avatar", type: "image", required: false, description: "Author photo" },
    );
  } else if (/stat/.test(dataModel)) {
    props.push(
      { name: "value", type: "string", required: true, description: "Stat value (e.g., '99%')" },
      { name: "label", type: "string", required: true, description: "Stat label/description" },
    );
  } else {
    props.push(
      { name: "content", type: "rich-text", required: true, description: "Primary content" },
    );
  }

  return props;
}

function inferSlots(cluster: { baseName: string }): ComponentSlot[] {
  if (/card|container|section/.test(cluster.baseName)) {
    return [{ name: "children", type: "multiple", required: false, acceptedComponents: ["*"] }];
  }
  return [];
}

function inferVariants(cluster: { baseName: string; rootCids: string[] }): ComponentVariant[] {
  const variants: ComponentVariant[] = [];
  if (cluster.rootCids.length > 3) {
    variants.push(
      { name: "default", description: "Standard appearance", tokenOverrides: {} },
      { name: "compact", description: "Reduced padding and font size", tokenOverrides: { spacing: "0.5x", fontSize: "0.875x" } },
      { name: "featured", description: "Emphasized with larger scale and accent color", tokenOverrides: { fontSize: "1.25x", color: "accent" } },
    );
  } else {
    variants.push({ name: "default", description: "Standard appearance", tokenOverrides: {} });
  }
  return variants;
}

function inferStates(cluster: { baseName: string }): string[] {
  if (/button|link|nav/.test(cluster.baseName)) {
    return ["default", "hover", "focus", "active", "disabled"];
  }
  if (/input|field/.test(cluster.baseName)) {
    return ["empty", "filled", "focus", "error", "disabled"];
  }
  return ["default"];
}

function inferARIA(cluster: { baseName: string; recipeKind?: string }): ARIAProfile {
  const role = inferRole(cluster);
  const patterns: string[] = [];
  if (/nav|menu/.test(cluster.baseName)) patterns.push("navigation");
  if (/tab/.test(cluster.baseName)) patterns.push("tabs");
  if (/accordion/.test(cluster.baseName)) patterns.push("accordion");
  if (/carousel|slider/.test(cluster.baseName)) patterns.push("carousel");
  if (/dialog|modal/.test(cluster.baseName)) patterns.push("dialog");

  return {
    role,
    labels: [],
    patterns,
    issues: role ? [] : ["Missing explicit ARIA role"],
  };
}

function inferRole(cluster: { baseName: string; recipeKind?: string }): string | null {
  if (/nav|menu/.test(cluster.baseName)) return "navigation";
  if (/button/.test(cluster.baseName)) return "button";
  if (/link/.test(cluster.baseName)) return "link";
  if (/img|logo/.test(cluster.baseName)) return "img";
  if (/list/.test(cluster.baseName)) return "list";
  if (/tab/.test(cluster.baseName)) return "tablist";
  if (/accordion/.test(cluster.baseName)) return "region";
  if (/carousel|slider/.test(cluster.baseName)) return "group";
  if (/form/.test(cluster.baseName)) return "form";
  if (/heading/.test(cluster.baseName)) return "heading";
  return null;
}

function inferResponsiveBehaviour(cluster: { baseName: string }): string {
  if (/grid|cards|features/.test(cluster.baseName)) {
    return "Grid collapses to single column on mobile, 2-column on tablet, full grid on desktop";
  }
  if (/nav|menu/.test(cluster.baseName)) {
    return "Desktop: horizontal bar; Mobile: hamburger menu triggering slide-in drawer";
  }
  if (/hero/.test(cluster.baseName)) {
    return "Full-width with responsive padding and fluid typography";
  }
  return "Scales with container, maintains aspect ratio";
}

function inferPrimitiveProps(prim: { tag: string; role: string }): ComponentProp[] {
  const props: ComponentProp[] = [];
  if (/img|svg/.test(prim.tag)) {
    props.push(
      { name: "src", type: "image", required: true, description: "Image source URL" },
      { name: "alt", type: "string", required: true, description: "Alt text for accessibility" },
    );
  } else if (/a/.test(prim.tag)) {
    props.push(
      { name: "href", type: "link", required: true, description: "Link URL" },
      { name: "label", type: "string", required: true, description: "Link text" },
    );
  } else if (/button/.test(prim.tag)) {
    props.push(
      { name: "label", type: "string", required: true, description: "Button text" },
      { name: "variant", type: "string", required: false, defaultValue: "primary", description: "Button style variant" },
    );
  } else {
    props.push({ name: "content", type: "string", required: true, description: "Text content" });
  }
  return props;
}
