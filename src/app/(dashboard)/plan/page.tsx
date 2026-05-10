import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CampaignClient } from "@/components/campaign/campaign-client";
import { GOAL_LABELS } from "@/lib/validation";
import { formatDate } from "@/lib/utils";
import { ChevronRight, Calendar } from "lucide-react";

export default async function PlanPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Fetch in parallel: campaigns for the recent list, research briefs for
  // the form's "Pull from research" picker.
  const [recentCampaigns, recentResearch] = await Promise.all([
    prisma.campaign.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.research.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, brand: true, niche: true, createdAt: true },
    }),
  ]);

  const researchOptions = recentResearch.map((r) => ({
    id: r.id,
    brand: r.brand,
    niche: r.niche,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Campaign Planner</h1>
        <p className="text-sm text-muted-foreground">
          Build a multi-channel campaign calendar from a brand, goal, and budget. Optionally seed it with a saved research brief.
        </p>
      </div>

      <CampaignClient recentResearch={researchOptions} />

      {recentCampaigns.length > 0 ? (
        <div className="mt-12">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent campaigns
          </h2>
          <div className="space-y-2">
            {recentCampaigns.map((c) => (
              <Link key={c.id} href={`/plan/${c.id}`}>
                <Card className="cursor-pointer transition-colors hover:bg-muted/40">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.brand}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {GOAL_LABELS[c.goal as keyof typeof GOAL_LABELS] ?? c.goal} · {c.durationWeeks} weeks · {c.budgetTier}
                      </p>
                    </div>
                    {c.sourceResearchId ? <Badge variant="muted">from research</Badge> : null}
                    <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
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
