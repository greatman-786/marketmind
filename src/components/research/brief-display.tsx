"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  User,
  Building2,
  TrendingUp,
  Lightbulb,
  Megaphone,
  Target,
  AlertCircle,
  Copy,
} from "lucide-react";
import type { ResearchBrief } from "@/lib/anthropic";

interface Props {
  brief: ResearchBrief;
  searchQueries?: string[];
}

export function BriefDisplay({ brief, searchQueries }: Props) {
  const { toast } = useToast();

  async function copyAsMarkdown() {
    const md = briefToMarkdown(brief);
    await navigator.clipboard.writeText(md);
    toast("Brief copied as Markdown");
  }

  return (
    <div className="space-y-5">
      {/* Header with copy action */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Marketing brief</h2>
        <Button size="sm" variant="outline" onClick={copyAsMarkdown}>
          <Copy className="h-3.5 w-3.5" />
          Copy as Markdown
        </Button>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Market summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed text-foreground">{brief.summary}</p>
        </CardContent>
      </Card>

      {/* Persona */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Target persona
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold">{brief.targetPersona.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{brief.targetPersona.demographics}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <PersonaList
              icon={<AlertCircle className="h-3.5 w-3.5" />}
              label="Pain points"
              items={brief.targetPersona.painPoints}
              accent="text-red-700"
            />
            <PersonaList
              icon={<Target className="h-3.5 w-3.5" />}
              label="Goals"
              items={brief.targetPersona.goals}
              accent="text-emerald-700"
            />
            <PersonaList
              icon={<AlertCircle className="h-3.5 w-3.5" />}
              label="Objections"
              items={brief.targetPersona.objections}
              accent="text-amber-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Competitors */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Competitors ({brief.competitors.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {brief.competitors.map((c, i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="font-semibold">{c.name}</h3>
                <p className="mt-1 text-sm italic text-muted-foreground">"{c.positioning}"</p>
                <div className="mt-3 grid gap-3">
                  <CompetitorList label="Strengths" items={c.strengths} dotColor="bg-emerald-500" />
                  <CompetitorList label="Gaps" items={c.gaps} dotColor="bg-red-500" />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Content:</span> {c.contentStrategy}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trending topics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Trending topics
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {brief.trendingTopics.map((t, i) => (
              <li key={i}>
                <p className="font-medium">{t.topic}</p>
                <p className="text-sm text-muted-foreground">{t.why}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Content angles */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Content angles ({brief.contentAngles.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {brief.contentAngles.map((a, i) => (
              <li key={i} className="border-l-2 border-primary/40 pl-4">
                <p className="font-medium leading-snug">{a.hook}</p>
                <p className="mt-1 text-sm text-muted-foreground">{a.angle}</p>
                <Badge variant="muted" className="mt-2">
                  {a.bestFormat}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Channels */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recommended channels
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {brief.recommendedChannels.map((ch, i) => (
              <Badge key={i} variant="default">
                {i + 1}. {ch}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search trail (debug / transparency) */}
      {searchQueries && searchQueries.length > 0 ? (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">
            Sources — Claude ran {searchQueries.length} web search{searchQueries.length === 1 ? "" : "es"}
          </summary>
          <ul className="mt-2 space-y-1 pl-4">
            {searchQueries.map((q, i) => (
              <li key={i} className="font-mono">{q}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function PersonaList({
  icon,
  label,
  items,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
  accent: string;
}) {
  return (
    <div>
      <div className={`mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${accent}`}>
        {icon}
        {label}
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CompetitorList({ label, items, dotColor }: { label: string; items: string[]; dotColor: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
            <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${dotColor}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function briefToMarkdown(b: ResearchBrief): string {
  const lines: string[] = [];
  lines.push("# Marketing brief", "", "## Market summary", "", b.summary, "");
  lines.push("## Target persona", "", `**${b.targetPersona.name}**`, "", b.targetPersona.demographics, "");
  lines.push("**Pain points:**", ...b.targetPersona.painPoints.map((p) => `- ${p}`), "");
  lines.push("**Goals:**", ...b.targetPersona.goals.map((g) => `- ${g}`), "");
  lines.push("**Objections:**", ...b.targetPersona.objections.map((o) => `- ${o}`), "");
  lines.push("## Competitors", "");
  for (const c of b.competitors) {
    lines.push(`### ${c.name}`, "", `*${c.positioning}*`, "");
    lines.push("**Strengths:**", ...c.strengths.map((s) => `- ${s}`), "");
    lines.push("**Gaps:**", ...c.gaps.map((g) => `- ${g}`), "");
    lines.push(`**Content strategy:** ${c.contentStrategy}`, "");
  }
  lines.push("## Trending topics", "");
  for (const t of b.trendingTopics) lines.push(`- **${t.topic}** — ${t.why}`);
  lines.push("", "## Content angles", "");
  for (const a of b.contentAngles) {
    lines.push(`### ${a.hook}`, "", a.angle, "", `*Format: ${a.bestFormat}*`, "");
  }
  lines.push("## Recommended channels", "");
  b.recommendedChannels.forEach((ch, i) => lines.push(`${i + 1}. ${ch}`));
  return lines.join("\n");
}
