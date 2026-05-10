import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { researchAudience, type ResearchEvent } from "@/lib/anthropic";
import { researchSchema } from "@/lib/validation";

// Why SSE instead of a plain JSON POST:
//
// Web search + adaptive thinking + synthesis can take 30-90 seconds. A blocking
// POST would leave the user staring at a spinner. With SSE we surface live
// events ("Searching for: best B2B SaaS marketing 2025"...) so the UX feels
// like watching the agent work, which is also more honest about what's
// actually happening.
//
// Note: we use POST + ReadableStream rather than EventSource because EventSource
// only does GET. The client uses fetch() with a stream reader instead.

export const runtime = "nodejs"; // SQLite needs node, not edge

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = researchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const userId = session.user.id;
  const input = parsed.data;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        send("status", { message: "Connecting to Claude…" });

        const onEvent = (e: ResearchEvent) => send(e.type, e);
        const result = await researchAudience(input, onEvent);

        // Persist before announcing completion so the client gets a usable id.
        const saved = await prisma.research.create({
          data: {
            userId,
            brand: input.brand,
            niche: input.niche,
            audience: input.audience ?? null,
            brief: JSON.stringify(result.brief),
            searchQueries: JSON.stringify(result.searchQueries),
            modelUsed: result.modelUsed,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            cacheReadTokens: result.cacheReadTokens,
            webSearchCount: result.searchQueries.length,
          },
        });

        send("result", {
          id: saved.id,
          brief: result.brief,
          searchQueries: result.searchQueries,
          usage: {
            input: result.inputTokens,
            output: result.outputTokens,
            cacheRead: result.cacheReadTokens,
            cacheCreation: result.cacheCreationTokens,
            webSearches: result.searchQueries.length,
          },
        });
      } catch (err) {
        // Map SDK exceptions to user-friendly messages. The same pattern as the
        // /api/generate route, just routed through SSE.
        let message = "Research failed";
        if (err instanceof Anthropic.AuthenticationError) {
          message = "Invalid Anthropic API key. Check your ANTHROPIC_API_KEY env var.";
        } else if (err instanceof Anthropic.RateLimitError) {
          message = "Rate limited by Anthropic. Try again in a minute.";
        } else if (err instanceof Anthropic.APIError) {
          message = `Anthropic API error: ${err.message}`;
        } else if (err instanceof Error) {
          message = err.message;
        }
        console.error("Research failed:", err);
        send("error", { message });
      } finally {
        send("done", {});
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Defeats Next.js's default response buffering so events flush as they're
      // emitted rather than batching at the end.
      "X-Accel-Buffering": "no",
    },
  });
}
