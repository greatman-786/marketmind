import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SequenceClient } from "@/components/sequence/sequence-client";
import { SEQUENCE_TYPE_LABELS } from "@/lib/validation";
import { formatDate } from "@/lib/utils";
import { ChevronRight, Mail } from "lucide-react";

export default async function SequencesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [recentSequences, recentResearch] = await Promise.all([
    prisma.emailSequence.findMany({
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
        <h1 className="text-2xl font-semibold tracking-tight">Email Sequences</h1>
        <p className="text-sm text-muted-foreground">
          Draft cold outreach or nurture sequences with subject A/B variants and follow-up logic. Optionally seed from a saved research brief.
        </p>
      </div>

      <SequenceClient recentResearch={researchOptions} />

      {recentSequences.length > 0 ? (
        <div className="mt-12">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent sequences
          </h2>
          <div className="space-y-2">
            {recentSequences.map((s) => (
              <Link key={s.id} href={`/sequences/${s.id}`}>
                <Card className="cursor-pointer transition-colors hover:bg-muted/40">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {SEQUENCE_TYPE_LABELS[s.type as keyof typeof SEQUENCE_TYPE_LABELS] ?? s.type} · {s.emailCount} emails · {s.audience.length > 60 ? s.audience.slice(0, 60) + "…" : s.audience}
                      </p>
                    </div>
                    {s.sourceResearchId ? <Badge variant="muted">from research</Badge> : null}
                    <span className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</span>
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
