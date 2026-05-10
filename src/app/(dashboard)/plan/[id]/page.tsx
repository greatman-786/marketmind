import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CampaignDisplay } from "@/components/campaign/campaign-display";
import type { CampaignPlan } from "@/lib/anthropic";
import { GOAL_LABELS, BUDGET_LABELS } from "@/lib/validation";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function SavedCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id } = await params;
  const row = await prisma.campaign.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!row) notFound();

  const plan = JSON.parse(row.plan) as CampaignPlan;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6">
        <Link href="/plan">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Plan
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{row.brand}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge variant="muted">{formatDate(row.createdAt)}</Badge>
          <Badge variant="muted">{GOAL_LABELS[row.goal as keyof typeof GOAL_LABELS] ?? row.goal}</Badge>
          <Badge variant="muted">{row.durationWeeks} weeks</Badge>
          <Badge variant="muted">{BUDGET_LABELS[row.budgetTier as keyof typeof BUDGET_LABELS] ?? row.budgetTier}</Badge>
          {row.audience ? <Badge variant="muted">audience: {row.audience}</Badge> : null}
          {row.sourceResearchId ? (
            <Link href={`/research/${row.sourceResearchId}`}>
              <Badge variant="default">Built from research →</Badge>
            </Link>
          ) : null}
          <Badge variant="muted">{row.modelUsed}</Badge>
        </div>
      </div>

      <CampaignDisplay plan={plan} />
    </div>
  );
}
