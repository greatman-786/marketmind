import Anthropic from "@anthropic-ai/sdk";
import {
  SYSTEM_PROMPT,
  RESPONSE_SCHEMA,
  buildUserPrompt,
  RESEARCH_SYSTEM_PROMPT,
  RESEARCH_SCHEMA,
  buildResearchPrompt,
  CAMPAIGN_SYSTEM_PROMPT,
  CAMPAIGN_SCHEMA,
  buildCampaignPrompt,
  type CampaignPromptInput,
  EMAIL_SEQUENCE_SYSTEM_PROMPT,
  EMAIL_SEQUENCE_SCHEMA,
  buildEmailSequencePrompt,
  type EmailSequencePromptInput,
  ANALYSIS_SYSTEM_PROMPT,
  ANALYSIS_SCHEMA,
  buildAnalysisPrompt,
  type AnalysisPromptInput,
} from "@/lib/prompts";

// Singleton SDK client. The SDK handles retries, timeouts, and connection
// pooling — don't construct it per-request.
let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.",
      );
    }
    _client = new Anthropic();
  }
  return _client;
}

export const MODEL = "claude-sonnet-4-6";

export interface GenerateInput {
  contentType: string;
  tone: string;
  topic: string;
  keywords?: string;
  audience?: string;
}

export interface GenerateResult {
  variations: string[];
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  modelUsed: string;
}

export async function generateContent(input: GenerateInput): Promise<GenerateResult> {
  const client = getClient();

  // We use:
  //   1. system prompt with cache_control on its single text block — the
  //      prompt is large and identical across requests, so every call after
  //      the first in a 5-minute window pays ~10% of base input cost on it.
  //   2. output_config.format with our JSON schema — guarantees parseable
  //      output, so we don't have to hand-prompt "respond in JSON" or do
  //      brittle regex-based extraction.
  //
  // We are NOT using `thinking` here. Content generation isn't a reasoning
  // task — adaptive thinking would just spend tokens deliberating about
  // word choice. For the future Campaign Planner feature (multi-step
  // strategy), thinking is appropriate.
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: buildUserPrompt(input) }],
    output_config: {
      format: { type: "json_schema", schema: RESPONSE_SCHEMA },
    },
  });

  // The first text block contains the JSON when output_config.format is set.
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  let parsed: { variations: string[] };
  try {
    parsed = JSON.parse(textBlock.text);
  } catch (err) {
    throw new Error(`Failed to parse JSON response from Claude: ${(err as Error).message}`);
  }

  if (!Array.isArray(parsed.variations) || parsed.variations.length === 0) {
    throw new Error("Claude returned an empty or malformed variations array");
  }

  return {
    variations: parsed.variations,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
    modelUsed: response.model,
  };
}

// ===========================================================================
// FEATURE 2 — Audience & Competitor Research Agent
// ===========================================================================
//
// This is structurally different from generateContent above:
//
//  1. We give Claude the server-side `web_search_20260209` tool. Claude runs
//     searches itself; we don't execute anything client-side. The searches
//     happen on Anthropic's infra and the results land back in the conversation
//     as tool_result blocks.
//
//  2. We turn on adaptive thinking. Synthesizing competitor research IS a
//     reasoning task — adaptive thinking lets Claude decide when to think
//     between searches without us picking a fixed budget.
//
//  3. We stream. Web search + thinking + synthesis can take 30-90 seconds.
//     Streaming lets the UI show "Claude is searching for X" events live.
//     We extract the search queries from server_tool_use content blocks as
//     they complete and pipe them out via the `onEvent` callback.
//
//  4. We cap web searches with `max_uses: 5`. Without this, Claude can run
//     a dozen searches on hard topics and the bill scales linearly. 5 is
//     enough for a competent brief.

export interface ResearchInput {
  brand: string;
  niche: string;
  audience?: string;
}

export interface ResearchEvent {
  type: "search" | "thinking" | "status";
  query?: string;
  message?: string;
}

export interface ResearchBrief {
  summary: string;
  targetPersona: {
    name: string;
    demographics: string;
    painPoints: string[];
    goals: string[];
    objections: string[];
  };
  competitors: Array<{
    name: string;
    positioning: string;
    strengths: string[];
    gaps: string[];
    contentStrategy: string;
  }>;
  trendingTopics: Array<{ topic: string; why: string }>;
  contentAngles: Array<{ hook: string; angle: string; bestFormat: string }>;
  recommendedChannels: string[];
}

export interface ResearchResult {
  brief: ResearchBrief;
  searchQueries: string[];
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  modelUsed: string;
}

export async function researchAudience(
  input: ResearchInput,
  onEvent: (event: ResearchEvent) => void,
): Promise<ResearchResult> {
  const client = getClient();

  onEvent({ type: "status", message: "Connecting to Claude..." });

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 8192,
    system: [
      {
        type: "text",
        text: RESEARCH_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: buildResearchPrompt(input) }],
    thinking: { type: "adaptive" },
    tools: [
      {
        // The _20260209 version includes built-in dynamic filtering — Claude
        // writes code to filter search results before they enter context,
        // which keeps token usage bounded on broad queries.
        type: "web_search_20260209",
        name: "web_search",
        max_uses: 5,
      },
    ],
    output_config: {
      format: { type: "json_schema", schema: RESEARCH_SCHEMA },
    },
  });

  const searchQueries: string[] = [];
  let thinkingAnnounced = false;

  // The SDK exposes higher-level event callbacks alongside the raw async
  // iterator. `contentBlock` fires AFTER a content block completes — at that
  // point a server_tool_use block has its full `input` populated, so we can
  // safely extract the query.
  stream.on("contentBlock", (block) => {
    if (
      block.type === "server_tool_use" &&
      block.name === "web_search" &&
      block.input &&
      typeof (block.input as { query?: unknown }).query === "string"
    ) {
      const query = (block.input as { query: string }).query;
      searchQueries.push(query);
      onEvent({ type: "search", query });
    }
  });

  // Surface a "Claude is thinking..." indicator the first time a thinking
  // block appears. We don't surface the thinking text itself — for synthesis
  // tasks it's noisy and the user really wants the final output.
  stream.on("streamEvent", (event) => {
    if (
      !thinkingAnnounced &&
      event.type === "content_block_start" &&
      event.content_block.type === "thinking"
    ) {
      thinkingAnnounced = true;
      onEvent({ type: "thinking" });
    }
  });

  // `finalMessage()` resolves once the stream completes with the fully
  // accumulated Message. Per the claude-api skill, this is the right
  // primitive — wrapping `.on()` events in a manual Promise is an anti-pattern.
  const message = await stream.finalMessage();

  // Find the final JSON output. With output_config.format set, Claude returns
  // a single text block containing the JSON.
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content for the brief");
  }

  let brief: ResearchBrief;
  try {
    brief = JSON.parse(textBlock.text) as ResearchBrief;
  } catch (err) {
    throw new Error(
      `Failed to parse research brief JSON: ${(err as Error).message}`,
    );
  }

  return {
    brief,
    searchQueries,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
    cacheCreationTokens: message.usage.cache_creation_input_tokens ?? 0,
    modelUsed: message.model,
  };
}

// ===========================================================================
// FEATURE 3 — Campaign Planner
// ===========================================================================
//
// Differences from researchAudience:
//
//  - No tools. The planner doesn't search the web; it composes from training
//    knowledge plus optional research context the user provides upstream.
//  - Non-streaming. Without web search there's nothing to narrate live; a
//    skeleton loader is the right UX. ~20-40s end-to-end on Sonnet 4.6.
//  - Adaptive thinking ON. Multi-week multi-channel planning IS a reasoning
//    task — letting Claude think between drafts of the schedule meaningfully
//    improves the narrative arc across weeks.
//  - max_tokens bumped to 8192. A 12-week plan with 30+ posts is dense.

export interface CampaignPlan {
  campaign: {
    name: string;
    summary: string;
    objectives: string[];
    durationWeeks: number;
    budgetTier: string;
    audience: string;
  };
  channels: Array<{ name: string; role: string; cadence: string }>;
  weeks: Array<{
    week: number;
    theme: string;
    posts: Array<{
      day: string;
      channel: string;
      type: string;
      title: string;
      brief: string;
    }>;
  }>;
  kpis: Array<{ metric: string; target: string; why: string }>;
  risks: string[];
}

export interface CampaignResult {
  plan: CampaignPlan;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  modelUsed: string;
}

export async function planCampaign(input: CampaignPromptInput): Promise<CampaignResult> {
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: [
      {
        type: "text",
        text: CAMPAIGN_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: buildCampaignPrompt(input) }],
    thinking: { type: "adaptive" },
    output_config: {
      format: { type: "json_schema", schema: CAMPAIGN_SCHEMA },
    },
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content for the campaign plan");
  }

  let plan: CampaignPlan;
  try {
    plan = JSON.parse(textBlock.text) as CampaignPlan;
  } catch (err) {
    throw new Error(
      `Failed to parse campaign plan JSON: ${(err as Error).message}`,
    );
  }

  return {
    plan,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
    modelUsed: response.model,
  };
}

// ===========================================================================
// FEATURE 4 — Email Sequence Builder
// ===========================================================================
//
// Same shape as planCampaign: non-streaming, adaptive thinking, no tools,
// structured output, optional research context. Different prompt + schema.
//
// max_tokens at 8192 because a 7-email nurture sequence can run long
// (each email body is 150-250 words; sequence body alone is ~5K tokens).

export interface EmailSequence {
  sequence: {
    name: string;
    type: "cold_outreach" | "nurture";
    summary: string;
    audience: string;
    goal: string;
    emailCount: number;
    durationDays: number;
    personalizationTokens: string[];
  };
  emails: Array<{
    number: number;
    sendDay: number;
    sendCondition: string;
    angle: string;
    subjectVariants: string[];
    preheader: string;
    body: string;
    cta: string;
  }>;
  testingTips: string[];
}

export interface EmailSequenceResult {
  sequence: EmailSequence;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  modelUsed: string;
}

export async function draftEmailSequence(
  input: EmailSequencePromptInput,
): Promise<EmailSequenceResult> {
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: [
      {
        type: "text",
        text: EMAIL_SEQUENCE_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: buildEmailSequencePrompt(input) }],
    thinking: { type: "adaptive" },
    output_config: {
      format: { type: "json_schema", schema: EMAIL_SEQUENCE_SCHEMA },
    },
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content for the email sequence");
  }

  let sequence: EmailSequence;
  try {
    sequence = JSON.parse(textBlock.text) as EmailSequence;
  } catch (err) {
    throw new Error(
      `Failed to parse email sequence JSON: ${(err as Error).message}`,
    );
  }

  return {
    sequence,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
    modelUsed: response.model,
  };
}

// ===========================================================================
// FEATURE 5 — Performance Analyzer
// ===========================================================================
//
// Diagnostic, not generative. Same plumbing (cached system prompt + structured
// output + adaptive thinking + non-streaming) but the prompt and schema are
// shaped for analysis rather than creation.
//
// max_tokens at 6144 — verdict + parsed metrics table + recommendations is
// dense JSON; need headroom but don't need 8K.

export interface PerformanceAnalysis {
  verdict: {
    rating: "strong" | "mixed" | "weak";
    summary: string;
    confidence: "high" | "medium" | "low";
  };
  parsedMetrics: Array<{
    label: string;
    metric: string;
    value: string;
    note: string;
  }>;
  topPerformers: Array<{ item: string; why: string; metric: string }>;
  underperformers: Array<{ item: string; why: string; metric: string }>;
  patterns: Array<{ pattern: string; evidence: string }>;
  recommendations: Array<{
    action: string;
    rationale: string;
    priority: "high" | "medium" | "low";
  }>;
  dataQualityNotes: string[];
}

export interface AnalysisResult {
  analysis: PerformanceAnalysis;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  modelUsed: string;
}

export async function analyzePerformance(
  input: AnalysisPromptInput,
): Promise<AnalysisResult> {
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 6144,
    system: [
      {
        type: "text",
        text: ANALYSIS_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: buildAnalysisPrompt(input) }],
    thinking: { type: "adaptive" },
    output_config: {
      format: { type: "json_schema", schema: ANALYSIS_SCHEMA },
    },
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content for the analysis");
  }

  let analysis: PerformanceAnalysis;
  try {
    analysis = JSON.parse(textBlock.text) as PerformanceAnalysis;
  } catch (err) {
    throw new Error(
      `Failed to parse analysis JSON: ${(err as Error).message}`,
    );
  }

  return {
    analysis,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
    modelUsed: response.model,
  };
}
