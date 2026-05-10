"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CampaignForm, type ResearchOption } from "@/components/campaign/campaign-form";
import { CampaignDisplay } from "@/components/campaign/campaign-display";
import type { CampaignPlan } from "@/lib/anthropic";
import type { CampaignFormValues } from "@/lib/validation";

interface CampaignResult {
  id: string;
  plan: CampaignPlan;
  sourceResearchId: string | null;
  usage: { input: number; output: number; cacheRead: number; cacheCreation: number };
}

export function CampaignClient({ recentResearch }: { recentResearch: ResearchOption[] }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CampaignResult | null>(null);

  async function handleSubmit(values: CampaignFormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Campaign planning failed", "error");
        return;
      }
      setResult(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Network error", "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plan a campaign</CardTitle>
          <CardDescription>
            Returns a multi-channel calendar with weekly themes, posts, KPIs, and risks.
            Typical run time: 20-40 seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignForm
            isLoading={isLoading}
            recentResearch={recentResearch}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>

      {isLoading ? <CampaignSkeleton /> : null}

      {result ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Saved.{" "}
              <Link href={`/plan/${result.id}`} className="text-primary hover:underline">
                View permalink →
              </Link>
              {result.sourceResearchId ? " · Built from saved research." : ""}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="muted">
                {result.usage.input + result.usage.cacheRead} in / {result.usage.output} out
              </Badge>
              {result.usage.cacheRead > 0 ? (
                <Badge variant="default">{result.usage.cacheRead} cached (~90% off)</Badge>
              ) : null}
            </div>
          </div>
          <CampaignDisplay plan={result.plan} />
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={() => setResult(null)}>
              Plan another campaign
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function CampaignSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-32 animate-pulse rounded-xl border border-border bg-card" />
      <div className="h-24 animate-pulse rounded-xl border border-border bg-card" />
      <div className="h-72 animate-pulse rounded-xl border border-border bg-card" />
    </div>
  );
}
