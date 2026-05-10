import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HistoryClient } from "@/components/history/history-client";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const rows = await prisma.generation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const initialRows = rows.map((row) => ({
    id: row.id,
    contentType: row.contentType,
    tone: row.tone,
    topic: row.topic,
    keywords: row.keywords,
    audience: row.audience,
    variations: JSON.parse(row.variations) as string[],
    favoriteIndex: row.favoriteIndex,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-muted-foreground">
          Browse, search, favorite, and export everything you've generated.
        </p>
      </div>
      <HistoryClient initialRows={initialRows} />
    </div>
  );
}
