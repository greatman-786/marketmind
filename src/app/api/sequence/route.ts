import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { draftEmailSequence } from "@/lib/anthropic";
import { sequenceSchema } from "@/lib/validation";
import { buildResearchContext } from "@/lib/research-context";

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

  const parsed = sequenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const researchId = input.researchId && input.researchId.length > 0 ? input.researchId : null;

  let researchContext: string | undefined;
  if (researchId) {
    const research = await prisma.research.findFirst({
      where: { id: researchId, userId: session.user.id },
    });
    if (!research) {
      return NextResponse.json({ error: "Research brief not found" }, { status: 404 });
    }
    researchContext = buildResearchContext(research.brand, research.brief);
  }

  try {
    const result = await draftEmailSequence({
      name: input.name,
      product: input.product,
      audience: input.audience,
      goal: input.goal,
      type: input.type,
      emailCount: input.emailCount,
      researchContext,
    });

    const saved = await prisma.emailSequence.create({
      data: {
        userId: session.user.id,
        name: input.name,
        product: input.product,
        audience: input.audience,
        goal: input.goal,
        type: input.type,
        emailCount: input.emailCount,
        sourceResearchId: researchId,
        sequence: JSON.stringify(result.sequence),
        modelUsed: result.modelUsed,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cacheReadTokens: result.cacheReadTokens,
      },
    });

    return NextResponse.json({
      id: saved.id,
      sequence: result.sequence,
      sourceResearchId: researchId,
      usage: {
        input: result.inputTokens,
        output: result.outputTokens,
        cacheRead: result.cacheReadTokens,
        cacheCreation: result.cacheCreationTokens,
      },
    });
  } catch (err) {
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

    console.error("Email sequence draft failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Email sequence draft failed" },
      { status: 500 },
    );
  }
}
