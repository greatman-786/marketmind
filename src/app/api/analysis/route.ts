import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { analyzePerformance } from "@/lib/anthropic";
import { analysisSchema } from "@/lib/validation";
import { buildCampaignContext } from "@/lib/campaign-context";

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

  const parsed = analysisSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const campaignId = input.campaignId && input.campaignId.length > 0 ? input.campaignId : null;

  let campaignContext: string | undefined;
  if (campaignId) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId: session.user.id },
    });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    campaignContext = buildCampaignContext(campaign);
  }

  try {
    const result = await analyzePerformance({
      title: input.title,
      rawMetrics: input.rawMetrics,
      contextNote: input.contextNote,
      campaignContext,
    });

    const saved = await prisma.analysis.create({
      data: {
        userId: session.user.id,
        title: input.title,
        rawMetrics: input.rawMetrics,
        contextNote: input.contextNote ?? null,
        sourceCampaignId: campaignId,
        analysis: JSON.stringify(result.analysis),
        modelUsed: result.modelUsed,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cacheReadTokens: result.cacheReadTokens,
      },
    });

    return NextResponse.json({
      id: saved.id,
      analysis: result.analysis,
      sourceCampaignId: campaignId,
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

    console.error("Analysis failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 },
    );
  }
}
