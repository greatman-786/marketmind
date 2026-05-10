import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTENT_TYPE_LABELS, GOAL_LABELS, SEQUENCE_TYPE_LABELS } from "@/lib/validation";
import { formatDate, truncate } from "@/lib/utils";
import { Wand2, FileText, Search, Calendar, Mail, BarChart3 } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  // Layout already gates this — this is for the type narrow.
  if (!session?.user?.id) return null;

  const [
    generationCount,
    recentGenerations,
    researchCount,
    recentResearch,
    campaignCount,
    recentCampaigns,
    sequenceCount,
    recentSequences,
    analysisCount,
    recentAnalyses,
  ] = await Promise.all([
    prisma.generation.count({ where: { userId: session.user.id } }),
    prisma.generation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.research.count({ where: { userId: session.user.id } }),
    prisma.research.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.campaign.count({ where: { userId: session.user.id } }),
    prisma.campaign.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.emailSequence.count({ where: { userId: session.user.id } }),
    prisma.emailSequence.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.analysis.count({ where: { userId: session.user.id } }),
    prisma.analysis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}.
          </h1>
          <p className="text-sm text-muted-foreground">Here's what you've been creating.</p>
        </div>
        <Link href="/generate">
          <Button>
            <Wand2 className="h-4 w-4" />
            New generation
          </Button>
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Generations" value={generationCount} icon={<FileText className="h-4 w-4" />} />
        <StatCard label="Research briefs" value={researchCount} icon={<Search className="h-4 w-4" />} />
        <StatCard label="Campaigns" value={campaignCount} icon={<Calendar className="h-4 w-4" />} />
        <StatCard label="Email sequences" value={sequenceCount} icon={<Mail className="h-4 w-4" />} />
        <StatCard label="Analyses" value={analysisCount} icon={<BarChart3 className="h-4 w-4" />} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent generations</CardTitle>
            {recentGenerations.length > 0 ? (
              <Link href="/history" className="text-sm text-primary hover:underline">
                View all →
              </Link>
            ) : null}
          </CardHeader>
          <CardContent>
            {recentGenerations.length === 0 ? (
              <EmptyState
                icon={<Wand2 className="mb-3 h-8 w-8 text-muted-foreground" />}
                label="Nothing here yet"
                hint="Generate your first piece of content."
                ctaHref="/generate"
                ctaLabel="Generate"
              />
            ) : (
              <ul className="divide-y divide-border">
                {recentGenerations.map((g) => (
                  <li key={g.id} className="flex items-start justify-between py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                          {CONTENT_TYPE_LABELS[g.contentType as keyof typeof CONTENT_TYPE_LABELS]}
                        </span>
                        <span className="text-xs text-muted-foreground">{g.tone}</span>
                      </div>
                      <p className="truncate text-sm font-medium">{truncate(g.topic, 60)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(g.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent research</CardTitle>
            {recentResearch.length > 0 ? (
              <Link href="/research" className="text-sm text-primary hover:underline">
                View all →
              </Link>
            ) : null}
          </CardHeader>
          <CardContent>
            {recentResearch.length === 0 ? (
              <EmptyState
                icon={<Search className="mb-3 h-8 w-8 text-muted-foreground" />}
                label="No research yet"
                hint="Run your first competitor brief."
                ctaHref="/research"
                ctaLabel="Run research"
              />
            ) : (
              <ul className="divide-y divide-border">
                {recentResearch.map((r) => (
                  <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                    <Link href={`/research/${r.id}`} className="block hover:opacity-80">
                      <p className="truncate text-sm font-medium">{r.brand}</p>
                      <p className="truncate text-xs text-muted-foreground">{truncate(r.niche, 70)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(r.createdAt)} · {r.webSearchCount} searches
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent campaigns</CardTitle>
            {recentCampaigns.length > 0 ? (
              <Link href="/plan" className="text-sm text-primary hover:underline">
                View all →
              </Link>
            ) : null}
          </CardHeader>
          <CardContent>
            {recentCampaigns.length === 0 ? (
              <EmptyState
                icon={<Calendar className="mb-3 h-8 w-8 text-muted-foreground" />}
                label="No campaigns yet"
                hint="Plan your first multi-channel campaign."
                ctaHref="/plan"
                ctaLabel="Plan campaign"
              />
            ) : (
              <ul className="divide-y divide-border">
                {recentCampaigns.map((c) => (
                  <li key={c.id} className="py-3 first:pt-0 last:pb-0">
                    <Link href={`/plan/${c.id}`} className="block hover:opacity-80">
                      <p className="truncate text-sm font-medium">{c.brand}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {GOAL_LABELS[c.goal as keyof typeof GOAL_LABELS] ?? c.goal} · {c.durationWeeks} weeks
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent sequences</CardTitle>
            {recentSequences.length > 0 ? (
              <Link href="/sequences" className="text-sm text-primary hover:underline">
                View all →
              </Link>
            ) : null}
          </CardHeader>
          <CardContent>
            {recentSequences.length === 0 ? (
              <EmptyState
                icon={<Mail className="mb-3 h-8 w-8 text-muted-foreground" />}
                label="No sequences yet"
                hint="Draft your first email sequence."
                ctaHref="/sequences"
                ctaLabel="Draft sequence"
              />
            ) : (
              <ul className="divide-y divide-border">
                {recentSequences.map((s) => (
                  <li key={s.id} className="py-3 first:pt-0 last:pb-0">
                    <Link href={`/sequences/${s.id}`} className="block hover:opacity-80">
                      <p className="truncate text-sm font-medium">{s.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {SEQUENCE_TYPE_LABELS[s.type as keyof typeof SEQUENCE_TYPE_LABELS] ?? s.type} · {s.emailCount} emails
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent analyses</CardTitle>
            {recentAnalyses.length > 0 ? (
              <Link href="/analyze" className="text-sm text-primary hover:underline">
                View all →
              </Link>
            ) : null}
          </CardHeader>
          <CardContent>
            {recentAnalyses.length === 0 ? (
              <EmptyState
                icon={<BarChart3 className="mb-3 h-8 w-8 text-muted-foreground" />}
                label="No analyses yet"
                hint="Paste metrics to get a verdict."
                ctaHref="/analyze"
                ctaLabel="Run analysis"
              />
            ) : (
              <ul className="divide-y divide-border">
                {recentAnalyses.map((a) => (
                  <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                    <Link href={`/analyze/${a.id}`} className="block hover:opacity-80">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      {a.contextNote ? (
                        <p className="truncate text-xs text-muted-foreground">{truncate(a.contextNote, 70)}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {formatDate(a.createdAt)}
                        {a.sourceCampaignId ? " · vs campaign" : ""}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  label,
  hint,
  ctaHref,
  ctaLabel,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
      {icon}
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      <Link href={ctaHref} className="mt-4">
        <Button size="sm">{ctaLabel}</Button>
      </Link>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <p className="text-2xl font-semibold">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
