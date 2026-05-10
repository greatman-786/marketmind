import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { planCampaign } from "@/lib/anthropic";
import { campaignSchema } from "@/lib/validation";
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

  const parsed = campaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  // Treat empty string as "no research selected" — the form serializes the
  // <select> default that way and zod accepts it via `.or(z.literal(""))`.
  const researchId = input.researchId && input.researchId.length > 0 ? input.researchId : null;

  let researchContext: string | undefined;
  if (researchId) {
    // Scope by userId so guessing another user's research id is a 404, not a leak.
    const research = await prisma.research.findFirst({
      where: { id: researchId, userId: session.user.id },
    });
    if (!research) {
      return NextResponse.json({ error: "Research brief not found" }, { status: 404 });
    }
    researchContext = buildResearchContext(research.brand, research.brief);
  }

  try {
    const result = await planCampaign({
      brand: input.brand,
      goal: input.goal,
      durationWeeks: input.durationWeeks,
      budgetTier: input.budgetTier,
      audience: input.audience,
      researchContext,
    });

    const saved = await prisma.campaign.create({
      data: {
        userId: session.user.id,
        brand: input.brand,
        goal: input.goal,
        durationWeeks: input.durationWeeks,
        budgetTier: input.budgetTier,
        audience: input.audience ?? null,
        sourceResearchId: researchId,
        plan: JSON.stringify(result.plan),
        modelUsed: result.modelUsed,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cacheReadTokens: result.cacheReadTokens,
      },
    });

    return NextResponse.json({
      id: saved.id,
      plan: result.plan,
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

    console.error("Campaign planning failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Campaign planning failed" },
      { status: 500 },
    );
  }
}

