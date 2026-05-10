import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnalysisClient } from "@/components/analysis/analysis-client";
import { GOAL_LABELS } from "@/lib/validation";
import { formatDate, truncate } from "@/lib/utils";
import { ChevronRight, BarChart3 } from "lucide-react";

export default async function AnalyzePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [recentAnalyses, recentCampaigns] = await Promise.all([
    prisma.analysis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.campaign.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, brand: true, goal: true, durationWeeks: true, createdAt: true },
    }),
  ]);

  const campaignOptions = recentCampaigns.map((c) => ({
    id: c.id,
    brand: c.brand,
    goal: GOAL_LABELS[c.goal as keyof typeof GOAL_LABELS] ?? c.goal,
    durationWeeks: c.durationWeeks,
  }));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Performance Analyzer</h1>
        <p className="text-sm text-muted-foreground">
          Paste engagement metrics from any source. Optionally link to a saved campaign to compare actuals against the planned KPIs.
        </p>
      </div>

      <AnalysisClient recentCampaigns={campaignOptions} />

      {recentAnalyses.length > 0 ? (
        <div className="mt-12">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent analyses
          </h2>
          <div className="space-y-2">
            {recentAnalyses.map((a) => (
              <Link key={a.id} href={`/analyze/${a.id}`}>
                <Card className="cursor-pointer transition-colors hover:bg-muted/40">
                  <CardContent className="flex items-center gap-3 p-4">
                    <BarChart3 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      {a.contextNote ? (
                        <p className="truncate text-xs text-muted-foreground">{truncate(a.contextNote, 100)}</p>
                      ) : null}
                    </div>
                    {a.sourceCampaignId ? <Badge variant="muted">vs campaign</Badge> : null}
                    <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
