"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Copy, Lightbulb, Mail } from "lucide-react";
import type { EmailSequence } from "@/lib/anthropic";

interface Props {
  sequence: EmailSequence;
}

export function SequenceDisplay({ sequence }: Props) {
  const { toast } = useToast();

  async function copyAll() {
    await navigator.clipboard.writeText(sequenceToMarkdown(sequence));
    toast("Sequence copied as Markdown");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{sequence.sequence.name}</h2>
        <Button size="sm" variant="outline" onClick={copyAll}>
          <Copy className="h-3.5 w-3.5" />
          Copy as Markdown
        </Button>
      </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Sequence summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base leading-relaxed">{sequence.sequence.summary}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="default">
              {sequence.sequence.type === "cold_outreach" ? "Cold outreach" : "Nurture"}
            </Badge>
            <Badge variant="muted">{sequence.sequence.emailCount} emails</Badge>
            <Badge variant="muted">{sequence.sequence.durationDays}-day span</Badge>
            <Badge variant="muted">goal: {sequence.sequence.goal}</Badge>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Audience
            </p>
            <p className="text-sm">{sequence.sequence.audience}</p>
          </div>
          {sequence.sequence.personalizationTokens.length ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Personalization tokens
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sequence.sequence.personalizationTokens.map((t) => (
                  <code
                    key={t}
                    className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
                  >
                    {t}
                  </code>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Emails */}
      <div className="space-y-4">
        {sequence.emails.map((email) => (
          <EmailCard key={email.number} email={email} />
        ))}
      </div>

      {/* Testing tips */}
      {sequence.testingTips.length ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Testing tips
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {sequence.testingTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function EmailCard({ email }: { email: EmailSequence["emails"][number] }) {
  const { toast } = useToast();

  async function copyEmail() {
    const text = [
      `Subject: ${email.subjectVariants[0] ?? ""}`,
      `Preheader: ${email.preheader}`,
      "",
      email.body,
      "",
      `CTA: ${email.cta}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    toast(`Email ${email.number} copied`);
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-baseline gap-3 border-b border-border bg-muted/40 px-5 py-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
            {email.number}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug">{email.angle}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Day {email.sendDay} · {email.sendCondition}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={copyEmail} aria-label="Copy email">
            <Copy className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <div className="space-y-4 p-5">
          {/* Subject lines */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Subject lines (A/B)
            </p>
            <ul className="space-y-1.5">
              {email.subjectVariants.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span
                    className={
                      i === 0
                        ? "mt-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary"
                        : "mt-0.5 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="leading-snug">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Preheader */}
          {email.preheader ? (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Preheader
              </p>
              <p className="text-sm italic text-muted-foreground">{email.preheader}</p>
            </div>
          ) : null}

          {/* Body */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Body
            </p>
            <pre className="whitespace-pre-wrap break-words rounded-md border border-border bg-muted/30 p-3 font-sans text-sm leading-relaxed">
              {email.body}
            </pre>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-primary" />
            <p className="text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CTA: </span>
              {email.cta}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function sequenceToMarkdown(s: EmailSequence): string {
  const lines: string[] = [];
  lines.push(`# ${s.sequence.name}`, "");
  lines.push(s.sequence.summary, "");
  lines.push(
    `**Type:** ${s.sequence.type === "cold_outreach" ? "Cold outreach" : "Nurture"} · **Emails:** ${s.sequence.emailCount} · **Span:** ${s.sequence.durationDays} days · **Goal:** ${s.sequence.goal}`,
    "",
  );
  lines.push(`**Audience:** ${s.sequence.audience}`, "");
  if (s.sequence.personalizationTokens.length) {
    lines.push(`**Tokens used:** ${s.sequence.personalizationTokens.join(", ")}`, "");
  }
  lines.push("---", "");
  for (const e of s.emails) {
    lines.push(`## Email ${e.number} — Day ${e.sendDay}`, "");
    lines.push(`*${e.angle}*`, "");
    lines.push(`**Send:** ${e.sendCondition}`, "");
    lines.push(`**Subject lines:**`);
    e.subjectVariants.forEach((sv, i) => lines.push(`- ${String.fromCharCode(65 + i)}: ${sv}`));
    lines.push("");
    if (e.preheader) lines.push(`**Preheader:** ${e.preheader}`, "");
    lines.push(`**Body:**`, "", e.body, "");
    lines.push(`**CTA:** ${e.cta}`, "", "---", "");
  }
  if (s.testingTips.length) {
    lines.push("## Testing tips", "");
    for (const tip of s.testingTips) lines.push(`- ${tip}`);
  }
  return lines.join("\n");
}
