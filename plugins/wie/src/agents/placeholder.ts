/**
 * Placeholder Agent — replaces every editable value with a semantic
 * placeholder that carries purpose, tone, length, accessibility, and
 * SEO guidance. This is the core of the "analyze, don't copy" principle.
 */
import type { PlaceholderSchema, PlaceholderType, PlaceholderCatalog } from "../types.js";
import { kebabCase } from "../util.js";

export type PlaceholderInput = {
  sections: Array<{
    id: string;
    role: string;
    text: string;
    order: number;
  }>;
  components?: Array<{
    name: string;
    props: Array<{ name: string; type: string; description: string }>;
  }>;
};

export function runPlaceholderAgent(opts: {
  input: PlaceholderInput;
  log?: (e: Record<string, unknown>) => void;
}): PlaceholderCatalog {
  const { input, log = () => {} } = opts;
  log({ agent: "placeholder", sections: input.sections.length });

  const placeholders: PlaceholderSchema[] = [];
  let idx = 0;

  // Section-level placeholders
  for (const section of input.sections) {
    const sectionPlaceholders = extractPlaceholdersFromSection(section, idx);
    placeholders.push(...sectionPlaceholders);
    idx += sectionPlaceholders.length;
  }

  // Component-level placeholders
  for (const comp of input.components ?? []) {
    for (const prop of comp.props) {
      if (prop.type === "string" || prop.type === "rich-text") {
        placeholders.push({
          id: `ph-${kebabCase(comp.name)}-${kebabCase(prop.name)}`,
          key: `${kebabCase(comp.name)}.${kebabCase(prop.name)}`,
          purpose: prop.description,
          type: inferPlaceholderType(prop.name),
          recommendedLength: inferRecommendedLength(prop.name),
          tone: inferTone(prop.name),
          accessibilityGuidance: inferA11yGuidance(prop.name),
          seoGuidance: inferSEOGuidance(prop.name),
          example: generateExample(prop.name, comp.name),
          componentId: comp.name,
        });
      }
    }
  }

  // Deduplicate by key
  const seen = new Set<string>();
  const unique = placeholders.filter((p) => {
    if (seen.has(p.key)) return false;
    seen.add(p.key);
    return true;
  });

  log({ agent: "placeholder", total: unique.length });
  return { placeholders: unique };
}

function extractPlaceholdersFromSection(section: { id: string; role: string; text: string; order: number }, startIdx: number): PlaceholderSchema[] {
  const out: PlaceholderSchema[] = [];
  const role = section.role.toLowerCase();

  // Hero section
  if (/hero/.test(role)) {
    out.push(
      createPlaceholder("headline", "headline", "Primary headline that captures attention and communicates value", "headline", "6-12 words", "confident and direct", "Screen readers announce this first; ensure it conveys the page's purpose", "Include primary keyword; this is the H1", "Build Better Websites, Faster"),
      createPlaceholder("subheadline", "subheadline", "Supporting text that elaborates on the headline", "subheadline", "12-25 words", "informative and supportive", "Should complement the headline for screen reader users", "Include secondary keywords naturally", "An AI-native platform that turns any reference site into a reusable template ecosystem"),
      createPlaceholder("cta-text", "cta-text", "Primary call-to-action button text", "button-text", "2-4 words", "action-oriented and urgent", "Button text must be descriptive, not generic", "N/A", "Get Started"),
    );
  }

  // Feature grid
  if (/feature|service|grid/.test(role)) {
    out.push(
      createPlaceholder("feature-title", "feature-title", "Title for a feature or capability", "feature-title", "2-5 words", "clear and benefit-focused", "Heading level 3; must be descriptive", "Include feature-related keywords", "Lightning Fast"),
      createPlaceholder("feature-description", "feature-description", "Description of a feature or capability", "feature-description", "15-30 words", "informative and concise", "Provide enough context for screen reader users", "Use natural language with relevant terms", "Experience blazing-fast performance with our optimized rendering engine that loads in under a second."),
    );
  }

  // Testimonial
  if (/testimonial|review/.test(role)) {
    out.push(
      createPlaceholder("quote", "quote", "Customer testimonial quote", "quote", "20-60 words", "authentic and enthusiastic", "Attribute the quote to a real person with name and role", "N/A", "This platform transformed our workflow. We shipped in days, not months."),
      createPlaceholder("author-name", "author-name", "Name of the testimonial author", "author", "2-3 words", "professional", "Pair with role for context", "N/A", "Jane Smith"),
      createPlaceholder("author-role", "author-role", "Role or title of the testimonial author", "role", "3-6 words", "professional", "Provides context for the quote", "N/A", "VP of Engineering, Acme Corp"),
    );
  }

  // Pricing
  if (/pricing|plan/.test(role)) {
    out.push(
      createPlaceholder("plan-name", "plan-name", "Name of the pricing plan", "label", "1-3 words", "aspirational and clear", "Use semantic heading for plan name", "N/A", "Pro"),
      createPlaceholder("plan-price", "plan-price", "Price of the pricing plan", "price", "2-6 characters", "clear and direct", "Ensure price is announced clearly to screen readers", "N/A", "$29"),
      createPlaceholder("plan-description", "plan-description", "Description of what the plan includes", "body", "10-20 words", "informative and concise", "List features clearly", "N/A", "Everything you need for a growing team."),
    );
  }

  // CTA
  if (/cta|call-to-action/.test(role)) {
    out.push(
      createPlaceholder("cta-headline", "cta-headline", "Headline for the call-to-action section", "headline", "4-8 words", "persuasive and direct", "Clear heading that describes the action", "Include conversion keyword", "Ready to Get Started?"),
      createPlaceholder("cta-button-text", "cta-button-text", "Text for the CTA button", "button-text", "2-4 words", "action-oriented", "Descriptive button text", "N/A", "Start Free Trial"),
    );
  }

  // Stats
  if (/stat|metric|counter/.test(role)) {
    out.push(
      createPlaceholder("stat-value", "stat-value", "Numerical value for a statistic", "stat-value", "1-6 characters", "impactful", "Ensure numeric value is readable by screen readers", "N/A", "99%"),
      createPlaceholder("stat-label", "stat-label", "Label describing what the statistic measures", "stat-label", "2-5 words", "clear and descriptive", "Label must be self-explanatory", "N/A", "Uptime SLA"),
    );
  }

  // Footer
  if (/footer/.test(role)) {
    out.push(
      createPlaceholder("footer-description", "footer-description", "Brief company description for the footer", "body", "10-20 words", "professional and concise", "Provides context at the end of the page", "Include brand name and primary keyword", "Building the future of web development."),
      createPlaceholder("copyright-text", "copyright-text", "Copyright notice", "label", "5-10 words", "formal", "N/A", "N/A", "(c) 2025 Your Company. All rights reserved."),
    );
  }

  // Contact
  if (/contact/.test(role)) {
    out.push(
      createPlaceholder("contact-heading", "contact-heading", "Heading for the contact section", "headline", "3-6 words", "welcoming", "Clear section heading", "Include 'contact' keyword", "Get in Touch"),
      createPlaceholder("email-label", "email-label", "Label for email contact field", "label", "1-2 words", "clear", "Associated label for input", "N/A", "Email"),
    );
  }

  // Generic content fallback
  if (out.length === 0) {
    out.push(
      createPlaceholder("section-title", "section-title", `Title for the ${section.role} section`, "headline", "3-6 words", "clear and descriptive", "Section heading for navigation", "Include relevant keywords", pascalCaseRole(section.role)),
      createPlaceholder("section-body", "section-body", `Body content for the ${section.role} section`, "body", "20-50 words", "informative", "Provide meaningful content", "Use natural language with keywords", `This section provides important information about ${section.role.replace(/-/g, " ")}.`),
    );
  }

  return out;
}

function createPlaceholder(id: string, key: string, purpose: string, type: PlaceholderType, recommendedLength: string, tone: string, accessibilityGuidance: string, seoGuidance: string, example: string): PlaceholderSchema {
  return { id: `ph-${id}`, key, purpose, type, recommendedLength, tone, accessibilityGuidance, seoGuidance, example };
}

function inferPlaceholderType(propName: string): PlaceholderType {
  const n = propName.toLowerCase();
  if (/title|headline|heading/.test(n)) return "headline";
  if (/sub/.test(n)) return "subheadline";
  if (/body|description|content|text/.test(n)) return "body";
  if (/label/.test(n)) return "label";
  if (/button|cta|action/.test(n)) return "button-text";
  if (/link|href|url/.test(n)) return "link-text";
  if (/caption/.test(n)) return "caption";
  if (/alt/.test(n)) return "alt-text";
  if (/meta.*title/.test(n)) return "meta-title";
  if (/meta.*desc/.test(n)) return "meta-description";
  if (/nav/.test(n)) return "nav-item";
  if (/tag/.test(n)) return "tag";
  if (/author/.test(n)) return "author";
  if (/role/.test(n)) return "role";
  if (/date/.test(n)) return "date";
  if (/price/.test(n)) return "price";
  if (/stat.*val/.test(n)) return "stat-value";
  if (/stat.*lab/.test(n)) return "stat-label";
  return "custom";
}

function inferRecommendedLength(propName: string): string {
  const n = propName.toLowerCase();
  if (/title|headline|heading/.test(n)) return "4-10 words";
  if (/sub|description|body/.test(n)) return "15-40 words";
  if (/button|cta/.test(n)) return "2-4 words";
  if (/label|tag/.test(n)) return "1-3 words";
  if (/price/.test(n)) return "2-6 characters";
  return "10-30 words";
}

function inferTone(propName: string): string {
  const n = propName.toLowerCase();
  if (/button|cta|action/.test(n)) return "action-oriented and urgent";
  if (/headline|title/.test(n)) return "confident and clear";
  if (/description|body|content/.test(n)) return "informative and engaging";
  if (/author|role/.test(n)) return "professional";
  if (/price/.test(n)) return "clear and direct";
  return "professional and on-brand";
}

function inferA11yGuidance(propName: string): string {
  const n = propName.toLowerCase();
  if (/headline|title|heading/.test(n)) return "Use semantic heading tags; ensure heading hierarchy is logical";
  if (/button|cta/.test(n)) return "Button text must be descriptive, not generic like 'Click Here'";
  if (/alt/.test(n)) return "Describe the image purpose, not just its appearance";
  if (/link|href/.test(n)) return "Link text should be meaningful out of context";
  if (/label/.test(n)) return "Associate label with form control via for/id";
  return "Ensure content is perceivable by screen readers";
}

function inferSEOGuidance(propName: string): string {
  const n = propName.toLowerCase();
  if (/headline|title/.test(n)) return "Include primary keyword; this is likely an H1 or H2";
  if (/description|body/.test(n)) return "Use natural language with relevant secondary keywords";
  if (/meta.*title/.test(n)) return "Keep under 60 characters; front-load primary keyword";
  if (/meta.*desc/.test(n)) return "Keep under 160 characters; include a compelling call to action";
  if (/button|cta|label|tag/.test(n)) return "N/A (not indexed as content)";
  return "Include relevant keywords naturally";
}

function generateExample(propName: string, componentName: string): string {
  const n = propName.toLowerCase();
  if (/title|headline/.test(n)) return `Your ${componentName} Title Here`;
  if (/description|body|content/.test(n)) return `This is where your ${componentName} content goes. Make it compelling and relevant to your audience.`;
  if (/button|cta/.test(n)) return "Learn More";
  if (/image|src/.test(n)) return "https://example.com/image.jpg";
  if (/href|link|url/.test(n)) return "https://example.com";
  if (/alt/.test(n)) return `Descriptive text for the ${componentName} image`;
  return `Sample ${propName}`;
}

function pascalCaseRole(role: string): string {
  return role
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
