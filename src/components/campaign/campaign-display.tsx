"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Calendar, Target, ShieldAlert, Copy, Layers } from "lucide-react";
import type { CampaignPlan } from "@/lib/anthropic";

interface Props {
  plan: CampaignPlan;
}

export function CampaignDisplay({ plan }: Props) {
  const { toast } = useToast();

  async function copyAsMarkdown() {
    const md = planToMarkdown(plan);
    await navigator.clipboard.writeText(md);
    toast("Plan copied as Markdown");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{plan.campaign.name}</h2>
        <Button size="sm" variant="outline" onClick={copyAsMarkdown}>
          <Copy className="h-3.5 w-3.5" />
          Copy as Markdown
        </Button>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Campaign summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base leading-relaxed">{plan.campaign.summary}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="muted">{plan.campaign.durationWeeks} weeks</Badge>
            <Badge variant="muted">{plan.campaign.budgetTier}</Badge>
            <Badge variant="muted">audience: {plan.campaign.audience}</Badge>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Objectives
            </p>
            <ul className="space-y-1.5">
              {plan.campaign.objectives.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Channels */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Channel mix ({plan.channels.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plan.channels.map((c, i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.role}</p>
                <p className="mt-2 text-xs">
                  <span className="font-medium">Cadence:</span> {c.cadence}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weeks */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Calendar — {plan.weeks.length} weeks, {countPosts(plan)} posts
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {plan.weeks.map((w) => (
            <WeekBlock key={w.week} week={w} />
          ))}
        </CardContent>
      </Card>

      {/* KPIs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              KPIs to track
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {plan.kpis.map((k, i) => (
              <li key={i} className="flex items-start gap-3">
                <Badge variant="default" className="shrink-0 mt-0.5">
                  {k.target}
                </Badge>
                <div>
                  <p className="font-medium">{k.metric}</p>
                  <p className="text-sm text-muted-foreground">{k.why}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Risks */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Things to watch
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {plan.risks.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                {r}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function WeekBlock({ week }: { week: CampaignPlan["weeks"][number] }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-baseline gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
        <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
          Week {week.week}
        </span>
        <p className="flex-1 text-sm font-medium">{week.theme}</p>
        <span className="text-xs text-muted-foreground">
          {week.posts.length} post{week.posts.length === 1 ? "" : "s"}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {week.posts.map((p, i) => (
          <li key={i} className="flex items-start gap-3 px-4 py-3">
            <span className="w-20 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {p.day}
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <Badge variant="outline">{p.channel}</Badge>
                <Badge variant="muted">{p.type}</Badge>
              </div>
              <p className="font-medium leading-snug">{p.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{p.brief}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function countPosts(plan: CampaignPlan): number {
  return plan.weeks.reduce((acc, w) => acc + w.posts.length, 0);
}

function planToMarkdown(plan: CampaignPlan): string {
  const lines: string[] = [];
  lines.push(`# ${plan.campaign.name}`, "");
  lines.push(plan.campaign.summary, "");
  lines.push(
    `**Duration:** ${plan.campaign.durationWeeks} weeks · **Budget:** ${plan.campaign.budgetTier} · **Audience:** ${plan.campaign.audience}`,
    "",
  );
  lines.push("## Objectives", "");
  for (const o of plan.campaign.objectives) lines.push(`- ${o}`);
  lines.push("", "## Channels", "");
  for (const c of plan.channels) lines.push(`- **${c.name}** — ${c.role} (${c.cadence})`);
  lines.push("", "## Calendar", "");
  for (const w of plan.weeks) {
    lines.push(`### Week ${w.week} — ${w.theme}`, "");
    for (const p of w.posts) {
      lines.push(`- **${p.day} · ${p.channel} · ${p.type}** — ${p.title}`);
      lines.push(`  ${p.brief}`);
    }
    lines.push("");
  }
  lines.push("## KPIs", "");
  for (const k of plan.kpis) lines.push(`- **${k.metric}** → ${k.target}. ${k.why}`);
  lines.push("", "## Risks", "");
  for (const r of plan.risks) lines.push(`- ${r}`);
  return lines.join("\n");
}
