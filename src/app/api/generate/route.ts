import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateContent } from "@/lib/anthropic";
import { generateSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await generateContent(parsed.data);

    const saved = await prisma.generation.create({
      data: {
        userId: session.user.id,
        contentType: parsed.data.contentType,
        tone: parsed.data.tone,
        topic: parsed.data.topic,
        keywords: parsed.data.keywords ?? "",
        audience: parsed.data.audience ?? null,
        variations: JSON.stringify(result.variations),
        modelUsed: result.modelUsed,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cacheReadTokens: result.cacheReadTokens,
      },
    });

    return NextResponse.json({
      id: saved.id,
      variations: result.variations,
      usage: {
        input: result.inputTokens,
        output: result.outputTokens,
        cacheRead: result.cacheReadTokens,
        cacheCreation: result.cacheCreationTokens,
      },
    });
  } catch (err) {
    // Use the SDK's typed exceptions instead of string matching — this is
    // what the claude-api skill recommends.
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Invalid Anthropic API key. Check your ANTHROPIC_API_KEY env var." },
        { status: 500 },
      );
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Rate limited by Anthropic. Try again in a minute." },
        { status: 429 },
      );
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Anthropic API error: ${err.message}` },
        { status: err.status ?? 500 },
      );
    }

    console.error("Generation failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 },
    );
  }
}
