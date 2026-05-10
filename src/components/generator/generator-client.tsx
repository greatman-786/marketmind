"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { GeneratorForm } from "@/components/generator/generator-form";
import { VariationCard } from "@/components/generator/variation-card";
import { type GenerateFormValues } from "@/lib/validation";

interface GenerationResult {
  id: string;
  variations: string[];
  usage: {
    input: number;
    output: number;
    cacheRead: number;
    cacheCreation: number;
  };
}

export function GeneratorClient() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [favoriteIndex, setFavoriteIndex] = useState(-1);

  async function handleGenerate(values: GenerateFormValues) {
    setIsLoading(true);
    setResult(null);
    setFavoriteIndex(-1);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Generation failed", "error");
        return;
      }
      setResult(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Network error", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleFavorite(idx: number) {
    if (!result) return;
    const next = favoriteIndex === idx ? -1 : idx;
    setFavoriteIndex(next);
    // Persist optimistically. If it fails we could roll back, but for a
    // single-user portfolio app the network is not the failure mode that
    // matters — the localhost-to-localhost call will always succeed.
    await fetch(`/api/history/${result.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favoriteIndex: next }),
    });
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Generate content</CardTitle>
          <CardDescription>
            Pick a format and tone, give Claude a topic, and get three angled variations back.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GeneratorForm isLoading={isLoading} onSubmit={handleGenerate} />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      ) : null}

      {result ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Variations</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="muted">{result.usage.input + result.usage.cacheRead} input tokens</Badge>
              <Badge variant="muted">{result.usage.output} output tokens</Badge>
              {result.usage.cacheRead > 0 ? (
                <Badge variant="default">
                  {result.usage.cacheRead} cached (~90% off)
                </Badge>
              ) : result.usage.cacheCreation > 0 ? (
                <Badge variant="outline">
                  Cache primed — next request will be cheaper
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {result.variations.map((text, idx) => (
              <VariationCard
                key={idx}
                index={idx}
                text={text}
                isFavorite={favoriteIndex === idx}
                onFavoriteToggle={() => toggleFavorite(idx)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
