/**
 * CMS Agent — generates schema definitions for multiple CMS platforms
 * (Payload, Sanity, Strapi, Contentful, JSON, Markdown) from the
 * placeholder catalog and component DNA.
 */
import type { CMSSchema, CMSPlatform, CMSCollection, CMSField, PlaceholderSchema, ComponentDNA, SectionDNA } from "../types.js";
import { camelCase, pascalCase, kebabCase } from "../util.js";

export function runCMSAgent(opts: {
  placeholders: PlaceholderSchema[];
  components: ComponentDNA[];
  sections: SectionDNA[];
  platforms?: CMSPlatform[];
  log?: (e: Record<string, unknown>) => void;
}): CMSSchema[] {
  const { placeholders, components, sections, platforms = ["payload", "sanity", "strapi", "contentful", "json", "markdown"], log = () => {} } = opts;
  log({ agent: "cms", platforms: platforms.length, placeholders: placeholders.length });

  // Build collections from sections + components
  const collections = buildCollections(sections, components, placeholders);
  const globals = buildGlobals(placeholders);

  const schemas: CMSSchema[] = platforms.map((platform) => {
    return adaptToPlatform(platform, collections, globals);
  });

  log({ agent: "cms", schemas: schemas.length });
  return schemas;
}

function buildCollections(sections: SectionDNA[], components: ComponentDNA[], placeholders: PlaceholderSchema[]): CMSCollection[] {
  const collections: CMSCollection[] = [];

  // Group sections by archetype to form collections
  const byArchetype = new Map<string, SectionDNA[]>();
  for (const section of sections) {
    const key = section.archetype;
    if (!byArchetype.has(key)) byArchetype.set(key, []);
    byArchetype.get(key)!.push(section);
  }

  for (const [archetype, sectionGroup] of byArchetype) {
    const name = pascalCase(archetype);
    const fields = buildFieldsFromPlaceholders(placeholders.filter((p) => sectionGroup.some((s) => s.placeholderSchemaIds.includes(p.id))));
    collections.push({
      name: camelCase(name),
      slug: kebabCase(name),
      label: name,
      fields,
    });
  }

  // Component-based collections
  for (const comp of components) {
    if (comp.instances < 2) continue; // Only create collections for repeated components
    const fields: CMSField[] = comp.props.map((p) => ({
      name: p.name,
      type: mapPropTypeToCMS(p.type),
      label: pascalCase(p.name),
      required: p.required,
      localized: false,
      defaultValue: p.defaultValue,
    }));
    collections.push({
      name: camelCase(comp.name),
      slug: kebabCase(comp.name),
      label: comp.name,
      fields,
    });
  }

  // Ensure at least a basic Page collection
  if (collections.length === 0) {
    collections.push({
      name: "page",
      slug: "page",
      label: "Page",
      fields: [
        { name: "title", type: "text", label: "Title", required: true, localized: true },
        { name: "slug", type: "text", label: "Slug", required: true, localized: false },
        { name: "content", type: "rich-text", label: "Content", required: false, localized: true },
      ],
    });
  }

  return collections;
}

function buildGlobals(placeholders: PlaceholderSchema[]): Array<{ name: string; label: string; fields: CMSField[] }> {
  const globalPlaceholders = placeholders.filter((p) => /footer|copyright|nav|brand/.test(p.key));
  const fields: CMSField[] = globalPlaceholders.map((p) => ({
    name: p.key.replace(/-/g, "_"),
    type: mapPlaceholderTypeToCMS(p.type),
    label: pascalCase(p.key),
    required: false,
    localized: false,
  }));

  if (fields.length === 0) {
    fields.push(
      { name: "site_name", type: "text", label: "Site Name", required: true, localized: false },
      { name: "site_description", type: "textarea", label: "Site Description", required: false, localized: false },
    );
  }

  return [{ name: "siteSettings", label: "Site Settings", fields }];
}

function buildFieldsFromPlaceholders(placeholders: PlaceholderSchema[]): CMSField[] {
  if (placeholders.length === 0) {
    return [{ name: "title", type: "text", label: "Title", required: true, localized: true }];
  }
  return placeholders.map((p) => ({
    name: p.key.replace(/-/g, "_"),
    type: mapPlaceholderTypeToCMS(p.type),
    label: pascalCase(p.key),
    required: p.type === "headline" || p.type === "button-text",
    localized: p.type === "headline" || p.type === "body" || p.type === "subheadline",
  }));
}

function mapPropTypeToCMS(type: string): string {
  const map: Record<string, string> = {
    string: "text",
    number: "number",
    boolean: "boolean",
    array: "array",
    object: "object",
    image: "image",
    link: "text",
    "rich-text": "rich-text",
  };
  return map[type] ?? "text";
}

function mapPlaceholderTypeToCMS(type: string): string {
  const map: Record<string, string> = {
    headline: "text",
    subheadline: "textarea",
    body: "rich-text",
    label: "text",
    "button-text": "text",
    "link-text": "text",
    caption: "text",
    "alt-text": "text",
    "meta-title": "text",
    "meta-description": "textarea",
    "nav-item": "text",
    tag: "text",
    quote: "textarea",
    author: "text",
    role: "text",
    date: "date",
    "stat-label": "text",
    "stat-value": "text",
    price: "text",
    "feature-title": "text",
    "feature-description": "textarea",
    custom: "text",
  };
  return map[type] ?? "text";
}

function adaptToPlatform(platform: CMSPlatform, collections: CMSCollection[], globals: Array<{ name: string; label: string; fields: CMSField[] }>): CMSSchema {
  // Platform-specific type mapping
  const typeMap: Record<CMSPlatform, Record<string, string>> = {
    payload: { "rich-text": "richText", image: "upload", "text": "text", textarea: "textarea", number: "number", boolean: "checkbox", array: "array", object: "group", date: "date" },
    sanity: { "rich-text": "array", image: "image", "text": "string", textarea: "text", number: "number", boolean: "boolean", array: "array", object: "object", date: "date" },
    strapi: { "rich-text": "richtext", image: "media", "text": "string", textarea: "text", number: "number", boolean: "boolean", array: "component", object: "component", date: "date" },
    contentful: { "rich-text": "RichText", image: "Asset", "text": "Symbol", textarea: "Text", number: "Number", boolean: "Boolean", array: "Array", object: "Object", date: "Date" },
    json: {}, // Keep original types for JSON
    markdown: { "rich-text": "markdown", image: "image_path", "text": "string", textarea: "string", number: "number", boolean: "boolean", array: "array", object: "object", date: "string" },
  };

  const mapping = typeMap[platform];
  const adaptedCollections = collections.map((c) => ({
    ...c,
    fields: c.fields.map((f) => ({ ...f, type: mapping[f.type] ?? f.type })),
  }));

  const adaptedGlobals = globals.map((g) => ({
    ...g,
    fields: g.fields.map((f) => ({ ...f, type: mapping[f.type] ?? f.type })),
  }));

  return {
    cms: platform,
    collections: adaptedCollections,
    globals: adaptedGlobals,
  };
}
