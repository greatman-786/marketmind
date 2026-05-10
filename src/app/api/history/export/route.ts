import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CONTENT_TYPE_LABELS, TONE_LABELS } from "@/lib/validation";

// Why a route handler instead of a server action: actions can't set the
// Content-Disposition header for downloads. Plain GET with format query
// param is simpler.

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const format = req.nextUrl.searchParams.get("format") ?? "csv";
  if (format !== "csv" && format !== "markdown") {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }

  const generations = await prisma.generation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  if (format === "csv") {
    const csv = toCsv(generations);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="marketmind-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const md = toMarkdown(generations);
  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="marketmind-export-${new Date().toISOString().slice(0, 10)}.md"`,
    },
  });
}

interface GenerationRow {
  id: string;
  contentType: string;
  tone: string;
  topic: string;
  keywords: string;
  audience: string | null;
  variations: string;
  favoriteIndex: number;
  createdAt: Date;
}

function csvEscape(s: string): string {
  // RFC 4180: wrap in quotes if the field contains comma, quote, or newline;
  // double any embedded quotes.
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: GenerationRow[]): string {
  const header = [
    "Created",
    "Content type",
    "Tone",
    "Topic",
    "Keywords",
    "Audience",
    "Favorite #",
    "Variation 1",
    "Variation 2",
    "Variation 3",
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    const variations: string[] = JSON.parse(row.variations);
    lines.push(
      [
        row.createdAt.toISOString(),
        CONTENT_TYPE_LABELS[row.contentType as keyof typeof CONTENT_TYPE_LABELS] ?? row.contentType,
        TONE_LABELS[row.tone as keyof typeof TONE_LABELS] ?? row.tone,
        row.topic,
        row.keywords ?? "",
        row.audience ?? "",
        row.favoriteIndex >= 0 ? String(row.favoriteIndex + 1) : "",
        variations[0] ?? "",
        variations[1] ?? "",
        variations[2] ?? "",
      ]
        .map((v) => csvEscape(String(v)))
        .join(","),
    );
  }
  return lines.join("\n");
}

function toMarkdown(rows: GenerationRow[]): string {
  const out: string[] = ["# MarketMind export", "", `Generated ${new Date().toLocaleString()}.`, ""];
  for (const row of rows) {
    const variations: string[] = JSON.parse(row.variations);
    const typeLabel = CONTENT_TYPE_LABELS[row.contentType as keyof typeof CONTENT_TYPE_LABELS] ?? row.contentType;
    const toneLabel = TONE_LABELS[row.tone as keyof typeof TONE_LABELS] ?? row.tone;

    out.push(`## ${row.topic}`);
    out.push("");
    out.push(`**Type:** ${typeLabel} · **Tone:** ${toneLabel} · **Date:** ${row.createdAt.toLocaleString()}`);
    if (row.keywords) out.push(`**Keywords:** ${row.keywords}`);
    if (row.audience) out.push(`**Audience:** ${row.audience}`);
    out.push("");
    variations.forEach((v, idx) => {
      const star = row.favoriteIndex === idx ? " ⭐" : "";
      out.push(`### Variation ${idx + 1}${star}`);
      out.push("");
      out.push(v);
      out.push("");
    });
    out.push("---");
    out.push("");
  }
  return out.join("\n");
}
