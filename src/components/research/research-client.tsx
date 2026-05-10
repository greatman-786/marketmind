"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ResearchForm } from "@/components/research/research-form";
import { ResearchProgress, type ProgressEvent } from "@/components/research/research-progress";
import { BriefDisplay } from "@/components/research/brief-display";
import type { ResearchBrief } from "@/lib/anthropic";
import type { ResearchFormValues } from "@/lib/validation";

interface ResearchResult {
  id: string;
  brief: ResearchBrief;
  searchQueries: string[];
  usage: {
    input: number;
    output: number;
    cacheRead: number;
    cacheCreation: number;
    webSearches: number;
  };
}

export function ResearchClient() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [result, setResult] = useState<ResearchResult | null>(null);

  async function handleSubmit(values: ResearchFormValues) {
    setIsLoading(true);
    setEvents([]);
    setResult(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      // Non-2xx responses come back as plain JSON, not SSE — handle that.
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        toast(errorBody.error ?? "Research failed", "error");
        setIsLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        toast("No response stream", "error");
        setIsLoading(false);
        return;
      }

      // Parse the SSE stream chunk by chunk. We accumulate a buffer and split
      // on the SSE record separator (\n\n) — a single TCP chunk can contain
      // multiple events, or a single event split across chunks.
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const records = buffer.split("\n\n");
        buffer = records.pop() ?? ""; // keep the (possibly incomplete) tail
        for (const record of records) {
          handleSseRecord(record);
        }
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Network error", "error");
    } finally {
      setIsLoading(false);
    }

    function handleSseRecord(record: string) {
      let event = "message";
      let data = "";
      for (const line of record.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (!data) return;

      let payload: unknown;
      try {
        payload = JSON.parse(data);
      } catch {
        return;
      }

      switch (event) {
        case "status":
        case "search":
        case "thinking":
          setEvents((prev) => [...prev, { type: event, ...(payload as object) } as ProgressEvent]);
          break;
        case "result":
          setResult(payload as ResearchResult);
          break;
        case "error":
          toast((payload as { message: string }).message ?? "Research failed", "error");
          break;
        case "done":
          // Stream is over; loop will exit on next reader.read().
          break;
      }
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Research a brand or niche</CardTitle>
          <CardDescription>
            Claude will run web searches, synthesize what it finds, and return a structured marketing brief.
            Typical run time: 30-90 seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResearchForm isLoading={isLoading} onSubmit={handleSubmit} />
        </CardContent>
      </Card>

      {events.length > 0 || isLoading ? (
        <ResearchProgress events={events} finished={!isLoading && Boolean(result)} />
      ) : null}

      {result ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Saved to history.{" "}
              <Link href={`/research/${result.id}`} className="text-primary hover:underline">
                View permalink →
              </Link>
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="muted">
                {result.usage.webSearches} web search{result.usage.webSearches === 1 ? "" : "es"}
              </Badge>
              <Badge variant="muted">
                {result.usage.input + result.usage.cacheRead} in / {result.usage.output} out
              </Badge>
              {result.usage.cacheRead > 0 ? (
                <Badge variant="default">{result.usage.cacheRead} cached (~90% off)</Badge>
              ) : null}
            </div>
          </div>
          <BriefDisplay brief={result.brief} searchQueries={result.searchQueries} />
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setEvents([]);
              }}
            >
              Run another research
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
