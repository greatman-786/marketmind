import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResearchClient } from "@/components/research/research-client";
import { formatDate, truncate } from "@/lib/utils";
import { ChevronRight, Search } from "lucide-react";

export default async function ResearchPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const recent = await prisma.research.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Audience & Competitor Research</h1>
        <p className="text-sm text-muted-foreground">
          A research agent that runs web searches, analyzes competitors, and outputs a structured brief.
        </p>
      </div>

      <ResearchClient />

      {recent.length > 0 ? (
        <div className="mt-12">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent research
          </h2>
          <div className="space-y-2">
            {recent.map((r) => (
              <Link key={r.id} href={`/research/${r.id}`}>
                <Card className="cursor-pointer transition-colors hover:bg-muted/40">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.brand}</p>
                      <p className="truncate text-xs text-muted-foreground">{truncate(r.niche, 100)}</p>
                    </div>
                    <Badge variant="muted">{r.webSearchCount} searches</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
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
