"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Compass,
  AlertCircle,
  Copy,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PerformanceAnalysis } from "@/lib/anthropic";

interface Props {
  analysis: PerformanceAnalysis;
}

export function AnalysisDisplay({ analysis }: Props) {
  const { toast } = useToast();

  async function copyAll() {
    await navigator.clipboard.writeText(analysisToMarkdown(analysis));
    toast("Analysis copied as Markdown");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Analysis</h2>
        <Button size="sm" variant="outline" onClick={copyAll}>
          <Copy className="h-3.5 w-3.5" />
          Copy as Markdown
        </Button>
      </div>

      {/* Verdict */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <VerdictBadge rating={analysis.verdict.rating} />
            <Badge variant="muted">confidence: {analysis.verdict.confidence}</Badge>
          </div>
          <p className="text-base leading-relaxed">{analysis.verdict.summary}</p>
        </CardContent>
      </Card>

      {/* Parsed metrics */}
      {analysis.parsedMetrics.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Metrics Claude parsed ({analysis.parsedMetrics.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 pr-4 font-medium">Item</th>
                    <th className="pb-2 pr-4 font-medium">Metric</th>
                    <th className="pb-2 pr-4 font-medium">Value</th>
                    <th className="pb-2 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.parsedMetrics.map((m, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-b-0">
                      <td className="py-2 pr-4 font-medium">{m.label}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{m.metric}</td>
                      <td className="py-2 pr-4 font-mono">{m.value}</td>
                      <td className="py-2 text-xs text-muted-foreground">{m.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Top / underperformers */}
      <div className="grid gap-4 md:grid-cols-2">
        <PerformerCard
          title="Top performers"
          items={analysis.topPerformers}
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
          accent="emerald"
        />
        <PerformerCard
          title="Underperformers"
          items={analysis.underperformers}
          icon={<TrendingDown className="h-4 w-4 text-red-600" />}
          accent="red"
        />
      </div>

      {/* Patterns */}
      {analysis.patterns.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Patterns
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.patterns.map((p, i) => (
                <li key={i}>
                  <p className="font-medium">{p.pattern}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="text-xs uppercase tracking-wide">Evidence:</span> {p.evidence}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* Recommendations — sorted high → low */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recommendations ({analysis.recommendations.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {[...analysis.recommendations]
              .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority))
              .map((r, i) => (
                <li key={i} className="border-l-2 border-primary/40 pl-4">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={r.priority} />
                  </div>
                  <p className="font-medium leading-snug">{r.action}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.rationale}</p>
                </li>
              ))}
          </ul>
        </CardContent>
      </Card>

      {/* Data quality notes */}
      {analysis.dataQualityNotes.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Data caveats
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {analysis.dataQualityNotes.map((n, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                  {n}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function VerdictBadge({ rating }: { rating: PerformanceAnalysis["verdict"]["rating"] }) {
  const styles =
    rating === "strong"
      ? "bg-emerald-100 text-emerald-800"
      : rating === "weak"
        ? "bg-red-100 text-red-800"
        : "bg-amber-100 text-amber-800";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-sm font-semibold uppercase tracking-wide",
        styles,
      )}
    >
      {rating}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: PerformanceAnalysis["recommendations"][number]["priority"] }) {
  const variant: "default" | "muted" | "outline" =
    priority === "high" ? "default" : priority === "medium" ? "muted" : "outline";
  return <Badge variant={variant}>{priority} priority</Badge>;
}

function priorityWeight(p: "high" | "medium" | "low"): number {
  return p === "high" ? 3 : p === "medium" ? 2 : 1;
}

function PerformerCard({
  title,
  items,
  icon,
  accent,
}: {
  title: string;
  items: Array<{ item: string; why: string; metric: string }>;
  icon: React.ReactNode;
  accent: "emerald" | "red";
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">None identified.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((p, i) => (
              <li key={i}>
                <p className="font-medium leading-snug">{p.item}</p>
                <p className="mt-0.5 text-xs">
                  <span className={cn("font-medium", accent === "emerald" ? "text-emerald-700" : "text-red-700")}>
                    {p.metric}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{p.why}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function analysisToMarkdown(a: PerformanceAnalysis): string {
  const lines: string[] = [];
  lines.push(`# Analysis`, "");
  lines.push(
    `**Verdict:** ${a.verdict.rating.toUpperCase()} (${a.verdict.confidence} confidence)`,
    "",
  );
  lines.push(a.verdict.summary, "");
  if (a.parsedMetrics.length) {
    lines.push("## Metrics", "");
    lines.push("| Item | Metric | Value | Note |");
    lines.push("| --- | --- | --- | --- |");
    for (const m of a.parsedMetrics) lines.push(`| ${m.label} | ${m.metric} | ${m.value} | ${m.note} |`);
    lines.push("");
  }
  if (a.topPerformers.length) {
    lines.push("## Top performers", "");
    for (const p of a.topPerformers) lines.push(`- **${p.item}** (${p.metric}) — ${p.why}`);
    lines.push("");
  }
  if (a.underperformers.length) {
    lines.push("## Underperformers", "");
    for (const p of a.underperformers) lines.push(`- **${p.item}** (${p.metric}) — ${p.why}`);
    lines.push("");
  }
  if (a.patterns.length) {
    lines.push("## Patterns", "");
    for (const p of a.patterns) lines.push(`- **${p.pattern}** — Evidence: ${p.evidence}`);
    lines.push("");
  }
  lines.push("## Recommendations", "");
  for (const r of [...a.recommendations].sort((x, y) => priorityWeight(y.priority) - priorityWeight(x.priority))) {
    lines.push(`- [${r.priority.toUpperCase()}] **${r.action}** — ${r.rationale}`);
  }
  if (a.dataQualityNotes.length) {
    lines.push("", "## Data caveats", "");
    for (const n of a.dataQualityNotes) lines.push(`- ${n}`);
  }
  return lines.join("\n");
}
