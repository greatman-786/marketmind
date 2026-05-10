import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SequenceDisplay } from "@/components/sequence/sequence-display";
import type { EmailSequence } from "@/lib/anthropic";
import { SEQUENCE_TYPE_LABELS } from "@/lib/validation";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function SavedSequencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id } = await params;
  const row = await prisma.emailSequence.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!row) notFound();

  const sequence = JSON.parse(row.sequence) as EmailSequence;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6">
        <Link href="/sequences">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Sequences
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{row.name}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge variant="muted">{formatDate(row.createdAt)}</Badge>
          <Badge variant="muted">
            {SEQUENCE_TYPE_LABELS[row.type as keyof typeof SEQUENCE_TYPE_LABELS] ?? row.type}
          </Badge>
          <Badge variant="muted">{row.emailCount} emails</Badge>
          <Badge variant="muted">goal: {row.goal}</Badge>
          {row.sourceResearchId ? (
            <Link href={`/research/${row.sourceResearchId}`}>
              <Badge variant="default">Built from research →</Badge>
            </Link>
          ) : null}
          <Badge variant="muted">{row.modelUsed}</Badge>
        </div>
      </div>

      <SequenceDisplay sequence={sequence} />
    </div>
  );
}
