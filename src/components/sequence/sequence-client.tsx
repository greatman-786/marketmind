"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { SequenceForm } from "@/components/sequence/sequence-form";
import { SequenceDisplay } from "@/components/sequence/sequence-display";
import type { EmailSequence } from "@/lib/anthropic";
import type { SequenceFormValues } from "@/lib/validation";
import type { ResearchOption } from "@/components/campaign/campaign-form";

interface SequenceResponse {
  id: string;
  sequence: EmailSequence;
  sourceResearchId: string | null;
  usage: { input: number; output: number; cacheRead: number; cacheCreation: number };
}

export function SequenceClient({ recentResearch }: { recentResearch: ResearchOption[] }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SequenceResponse | null>(null);

  async function handleSubmit(values: SequenceFormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Sequence draft failed", "error");
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
          <CardTitle>Draft an email sequence</CardTitle>
          <CardDescription>
            Returns a fully drafted sequence with subject A/B variants, send timing, and follow-up logic.
            Typical run time: 20-40 seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SequenceForm
            isLoading={isLoading}
            recentResearch={recentResearch}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>

      {isLoading ? <SequenceSkeleton /> : null}

      {result ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Saved.{" "}
              <Link href={`/sequences/${result.id}`} className="text-primary hover:underline">
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
          <SequenceDisplay sequence={result.sequence} />
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={() => setResult(null)}>
              Draft another sequence
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function SequenceSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-32 animate-pulse rounded-xl border border-border bg-card" />
      <div className="h-56 animate-pulse rounded-xl border border-border bg-card" />
      <div className="h-56 animate-pulse rounded-xl border border-border bg-card" />
    </div>
  );
}
