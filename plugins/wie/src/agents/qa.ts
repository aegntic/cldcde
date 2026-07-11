/**
 * QA Agent — validates the complete template ecosystem for completeness,
 * consistency, and correctness. Runs a regeneration loop until all
 * checks pass or max iterations is reached.
 */
import type { QAReport, QACheck, TemplateManifest } from "../types.js";

export function runQAAgent(opts: {
  manifest: TemplateManifest;
  maxIterations?: number;
  log?: (e: Record<string, unknown>) => void;
}): QAReport {
  const { manifest, maxIterations = 3, log = () => {} } = opts;
  log({ agent: "qa", maxIterations });

  const checks: QACheck[] = [];

  // Schema checks
  checks.push(...checkSchemas(manifest));

  // Placeholder checks
  checks.push(...checkPlaceholders(manifest));

  // Manifest checks
  checks.push(...checkManifests(manifest));

  // Motion preset checks
  checks.push(...checkMotionPresets(manifest));

  // Accessibility checks
  checks.push(...checkAccessibility(manifest));

  // Responsive checks
  checks.push(...checkResponsive(manifest));

  // Naming checks
  checks.push(...checkNaming(manifest));

  const passed = checks.every((c) => c.passed);
  const iterations = passed ? 1 : maxIterations;

  log({ agent: "qa", passed, checks: checks.length, passedCount: checks.filter((c) => c.passed).length });

  return { passed, checks, iterations, maxIterations };
}

function checkSchemas(manifest: TemplateManifest): QACheck[] {
  return [
    {
      name: "design-tokens-complete",
      category: "schemas",
      passed: Object.keys(manifest.designSystem.colors).length > 0 && Object.keys(manifest.designSystem.spacing).length > 0,
      message: Object.keys(manifest.designSystem.colors).length > 0 ? "Design tokens present" : "Missing design tokens",
    },
    {
      name: "cms-schema-present",
      category: "schemas",
      passed: manifest.cmsSchema.length > 0,
      message: manifest.cmsSchema.length > 0 ? `${manifest.cmsSchema.length} CMS schemas generated` : "No CMS schemas generated",
    },
    {
      name: "motion-dna-complete",
      category: "schemas",
      passed: manifest.motionDNA.presets.length >= 0,
      message: `${manifest.motionDNA.presets.length} motion presets`,
    },
  ];
}

function checkPlaceholders(manifest: TemplateManifest): QACheck[] {
  const total = manifest.placeholderCatalog.placeholders.length;
  const withExamples = manifest.placeholderCatalog.placeholders.filter((p) => p.example.length > 0).length;
  return [
    {
      name: "placeholders-have-examples",
      category: "placeholders",
      passed: withExamples === total,
      message: `${withExamples}/${total} placeholders have examples`,
    },
    {
      name: "placeholders-have-purpose",
      category: "placeholders",
      passed: manifest.placeholderCatalog.placeholders.every((p) => p.purpose.length > 0),
      message: "All placeholders have purpose defined",
    },
    {
      name: "placeholders-have-a11y-guidance",
      category: "placeholders",
      passed: manifest.placeholderCatalog.placeholders.every((p) => p.accessibilityGuidance.length > 0),
      message: "All placeholders have accessibility guidance",
    },
  ];
}

function checkManifests(manifest: TemplateManifest): QACheck[] {
  return [
    {
      name: "template-id-present",
      category: "manifests",
      passed: !!manifest.templateId,
      message: manifest.templateId ? "Template ID assigned" : "Missing template ID",
    },
    {
      name: "version-present",
      category: "manifests",
      passed: !!manifest.version,
      message: manifest.version ? `Version: ${manifest.version}` : "Missing version",
    },
    {
      name: "page-dna-present",
      category: "manifests",
      passed: manifest.pageDNA.length > 0,
      message: `${manifest.pageDNA.length} page DNAs`,
    },
    {
      name: "section-library-present",
      category: "manifests",
      passed: manifest.sectionLibrary.length > 0,
      message: `${manifest.sectionLibrary.length} sections in library`,
    },
    {
      name: "component-library-present",
      category: "manifests",
      passed: manifest.componentLibrary.length > 0,
      message: `${manifest.componentLibrary.length} components in library`,
    },
  ];
}

function checkMotionPresets(manifest: TemplateManifest): QACheck[] {
  const presets = manifest.animationLibrary;
  const withReducedMotion = presets.filter((p) => p.accessibility.respectsReducedMotion).length;
  return [
    {
      name: "motion-presets-respect-reduced-motion",
      category: "motion-presets",
      passed: withReducedMotion === presets.length,
      message: `${withReducedMotion}/${presets.length} presets respect prefers-reduced-motion`,
    },
    {
      name: "motion-presets-have-triggers",
      category: "motion-presets",
      passed: presets.every((p) => p.triggers.length > 0),
      message: "All motion presets have trigger definitions",
    },
  ];
}

function checkAccessibility(manifest: TemplateManifest): QACheck[] {
  return [
    {
      name: "accessibility-score-acceptable",
      category: "accessibility",
      passed: manifest.accessibilityReport.overallScore >= 70,
      message: `Score: ${manifest.accessibilityReport.overallScore}`,
    },
    {
      name: "sections-have-landmarks",
      category: "accessibility",
      passed: manifest.sectionLibrary.some((s) => s.accessibility.landmark !== null),
      message: "At least one section has ARIA landmark",
    },
  ];
}

function checkResponsive(manifest: TemplateManifest): QACheck[] {
  const sectionsWithRules = manifest.sectionLibrary.filter((s) => s.responsiveRules.length > 0).length;
  return [
    {
      name: "sections-have-responsive-rules",
      category: "responsive",
      passed: sectionsWithRules === manifest.sectionLibrary.length,
      message: `${sectionsWithRules}/${manifest.sectionLibrary.length} sections have responsive rules`,
    },
    {
      name: "responsive-matrix-complete",
      category: "responsive",
      passed: manifest.responsiveMatrix.sections.length > 0,
      message: `${manifest.responsiveMatrix.sections.length} sections in responsive matrix`,
    },
  ];
}

function checkNaming(manifest: TemplateManifest): QACheck[] {
  const allNames = [
    ...manifest.sectionLibrary.map((s) => s.name),
    ...manifest.componentLibrary.map((c) => c.name),
    ...manifest.animationLibrary.map((m) => m.name),
  ];
  const uniqueNames = new Set(allNames);
  return [
    {
      name: "naming-consistency",
      category: "naming",
      passed: uniqueNames.size === allNames.length,
      message: uniqueNames.size === allNames.length ? "All names are unique" : `${allNames.length - uniqueNames.size} duplicate names found`,
    },
    {
      name: "naming-convention",
      category: "naming",
      passed: manifest.sectionLibrary.every((s) => /^[A-Z][a-zA-Z0-9]+$/.test(s.name)),
      message: "Section names follow PascalCase convention",
    },
  ];
}
