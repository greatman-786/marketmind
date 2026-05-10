import type { ResearchBrief } from "@/lib/anthropic";

// Compress a stored Research brief JSON into a short context block for
// downstream prompts (Campaign Planner, Email Sequence Builder, etc.).
//
// We deliberately don't pass the full brief — most fields are noise for
// downstream tasks. Persona + top pain points + competitor names + content
// angle hooks is the dense, useful subset. If a third feature ever needs a
// different cut (e.g. trending topics for content generation), it should add
// its own helper rather than expand this one.

export function buildResearchContext(brand: string, briefJson: string): string {
  let brief: ResearchBrief;
  try {
    brief = JSON.parse(briefJson) as ResearchBrief;
  } catch {
    return ""; // graceful: a malformed cached brief shouldn't block the caller
  }

  const lines: string[] = [];
  lines.push(`Source brand researched: ${brand}`);
  lines.push(`Persona: ${brief.targetPersona.name} — ${brief.targetPersona.demographics}`);

  const topPains = brief.targetPersona.painPoints.slice(0, 4);
  if (topPains.length) lines.push(`Top pain points: ${topPains.join(" / ")}`);

  const objections = brief.targetPersona.objections.slice(0, 3);
  if (objections.length) lines.push(`Common objections: ${objections.join(" / ")}`);

  const competitorNames = brief.competitors.map((c) => c.name).slice(0, 5);
  if (competitorNames.length) lines.push(`Key competitors: ${competitorNames.join(", ")}`);

  const angleHooks = brief.contentAngles.map((a) => a.hook).slice(0, 5);
  if (angleHooks.length) lines.push(`Content angles already identified: ${angleHooks.join(" • ")}`);

  return lines.join("\n");
}
