"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { AnalysisForm, type CampaignOption } from "@/components/analysis/analysis-form";
import { AnalysisDisplay } from "@/components/analysis/analysis-display";
import type { PerformanceAnalysis } from "@/lib/anthropic";
import type { AnalysisFormValues } from "@/lib/validation";

interface AnalysisResponse {
  id: string;
  analysis: PerformanceAnalysis;
  sourceCampaignId: string | null;
  usage: { input: number; output: number; cacheRead: number; cacheCreation: number };
}

export function AnalysisClient({ recentCampaigns }: { recentCampaigns: CampaignOption[] }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  async function handleSubmit(values: AnalysisFormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Analysis failed", "error");
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
          <CardTitle>Analyze performance</CardTitle>
          <CardDescription>
            Paste metrics from any source. Returns a verdict, performers, patterns, and prioritized next steps.
            Typical run time: 20-40 seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnalysisForm
            isLoading={isLoading}
            recentCampaigns={recentCampaigns}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>

      {isLoading ? <AnalysisSkeleton /> : null}

      {result ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Saved.{" "}
              <Link href={`/analyze/${result.id}`} className="text-primary hover:underline">
                View permalink →
              </Link>
              {result.sourceCampaignId ? " · Compared against linked campaign." : ""}
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
          <AnalysisDisplay analysis={result.analysis} />
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={() => setResult(null)}>
              Run another analysis
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-24 animate-pulse rounded-xl border border-border bg-card" />
      <div className="h-48 animate-pulse rounded-xl border border-border bg-card" />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    </div>
  );
}
