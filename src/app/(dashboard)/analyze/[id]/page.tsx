import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalysisDisplay } from "@/components/analysis/analysis-display";
import type { PerformanceAnalysis } from "@/lib/anthropic";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function SavedAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id } = await params;
  const row = await prisma.analysis.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!row) notFound();

  const analysis = JSON.parse(row.analysis) as PerformanceAnalysis;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6">
        <Link href="/analyze">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Analyze
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{row.title}</h1>
        {row.contextNote ? (
          <p className="mt-1 text-sm text-muted-foreground">{row.contextNote}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge variant="muted">{formatDate(row.createdAt)}</Badge>
          {row.sourceCampaignId ? (
            <Link href={`/plan/${row.sourceCampaignId}`}>
              <Badge variant="default">Compared against campaign →</Badge>
            </Link>
          ) : null}
          <Badge variant="muted">{row.modelUsed}</Badge>
        </div>
      </div>

      {/* Raw metrics — collapsed by default. Useful for re-running the analysis
          later or for auditing what Claude was given to work with. */}
      <details className="mb-5 rounded-lg border border-border">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium hover:bg-muted/40">
          View raw pasted metrics
        </summary>
        <Card className="rounded-t-none border-0 border-t border-border">
          <CardContent className="p-4">
            <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-muted-foreground">
              {row.rawMetrics}
            </pre>
          </CardContent>
        </Card>
      </details>

      <AnalysisDisplay analysis={analysis} />
    </div>
  );
}
