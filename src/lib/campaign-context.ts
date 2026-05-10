import type { CampaignPlan } from "@/lib/anthropic";

// Compress a stored Campaign row's plan JSON into a compact context block for
// the Performance Analyzer.
//
// The point of this isn't to replay the whole plan to Claude — it's to surface
// the bits that matter for "actuals vs plan" analysis: what the campaign was
// trying to do, on which channels, and against which KPIs. The KPIs in
// particular are gold — they're what lets the analyzer compare planned target
// against measured outcome.
//
// Sibling of src/lib/research-context.ts — same shape, named for the source
// feature it pulls from.

interface CampaignRow {
  brand: string;
  goal: string;
  durationWeeks: number;
  budgetTier: string;
  audience: string | null;
  plan: string; // JSON-serialized CampaignPlan
}

export function buildCampaignContext(campaign: CampaignRow): string {
  let plan: CampaignPlan;
  try {
    plan = JSON.parse(campaign.plan) as CampaignPlan;
  } catch {
    return ""; // graceful: a malformed cached plan shouldn't block analysis
  }

  const lines: string[] = [];
  lines.push(`Campaign: ${plan.campaign.name}`);
  lines.push(`Brand: ${campaign.brand}`);
  lines.push(`Goal: ${campaign.goal} · Budget tier: ${campaign.budgetTier} · Duration: ${campaign.durationWeeks} weeks`);
  if (campaign.audience) lines.push(`Target audience: ${campaign.audience}`);
  lines.push(`Plan summary: ${plan.campaign.summary}`);

  if (plan.channels.length) {
    const channelSummary = plan.channels.map((c) => `${c.name} (${c.role})`).join(", ");
    lines.push(`Channel mix: ${channelSummary}`);
  }

  if (plan.kpis.length) {
    lines.push("Planned KPIs (compare actuals against these):");
    for (const k of plan.kpis) {
      lines.push(`  - ${k.metric} → target ${k.target} (${k.why})`);
    }
  }

  return lines.join("\n");
}
