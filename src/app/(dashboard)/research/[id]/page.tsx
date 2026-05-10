import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BriefDisplay } from "@/components/research/brief-display";
import type { ResearchBrief } from "@/lib/anthropic";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function SavedResearchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id } = await params;
  const row = await prisma.research.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!row) notFound();

  const brief = JSON.parse(row.brief) as ResearchBrief;
  const searchQueries = JSON.parse(row.searchQueries) as string[];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6">
        <Link href="/research">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Research
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{row.brand}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{row.niche}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge variant="muted">{formatDate(row.createdAt)}</Badge>
          <Badge variant="muted">{row.webSearchCount} web searches</Badge>
          <Badge variant="muted">{row.modelUsed}</Badge>
          {row.audience ? <Badge variant="muted">audience: {row.audience}</Badge> : null}
        </div>
      </div>

      <BriefDisplay brief={brief} searchQueries={searchQueries} />
    </div>
  );
}
