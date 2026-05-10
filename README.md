# MarketMind

AI-powered marketing automation suite built on the Anthropic Claude API. Generate blog posts, social copy, email sequences, and ad campaigns — three angled variations per request, with a real history you can search, favorite, and export.

> **Status:** All 5 features shipped end-to-end. The full workflow runs: research → plan → draft → analyze.

## Stack

- **Framework:** Next.js 15 (App Router) + TypeScript + React 19
- **AI:** Claude Sonnet 4.6 via the official Anthropic TypeScript SDK
- **Auth:** Auth.js v5 (NextAuth) — Google OAuth + Resend magic links
- **Database:** Prisma + SQLite (dev) — Postgres-ready (swap `DATABASE_URL` and `provider`)
- **Styling:** Tailwind CSS v3 with hand-rolled UI primitives (no Radix dependency)
- **Validation:** Zod + React Hook Form

Single-language stack so a recruiter can read the whole repo in one sitting.

## Quick start

```bash
# 1. Install
cd marketmind
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — at minimum, add ANTHROPIC_API_KEY and AUTH_SECRET.
# Generate AUTH_SECRET with: openssl rand -base64 32

# 3. Initialize the database
npx prisma db push

# 4. Run
npm run dev
# → http://localhost:3000
```

You'll need at least one auth provider configured (Google OAuth, Resend, or both). The signin page surfaces a clear warning if nothing is set up.

## What's interesting in here

This is a portfolio piece, so a few choices are worth pointing at:

### 1. Prompt caching is wired up, not just mentioned

The system prompt in [`src/lib/prompts.ts`](src/lib/prompts.ts) is intentionally large (~2.5K tokens) and never changes between requests. We mark it with `cache_control: { type: "ephemeral" }` in [`src/lib/anthropic.ts`](src/lib/anthropic.ts), which means every generation after the first within a 5-minute window pays ~10% of the base input cost on the cached prefix. The UI surfaces `cache_read_input_tokens` after each generation so you can see it working.

The minimum cacheable prefix on Sonnet 4.6 is 2048 tokens — anything shorter silently doesn't cache. The system prompt is sized to clear that bar with margin.

### 2. Structured outputs, not regex

Instead of telling Claude "respond in JSON" and praying, we use `output_config.format` with a JSON schema. The API guarantees the response parses against the schema — so `JSON.parse(textBlock.text)` is safe, no fallback path needed.

### 3. Per-user data isolation

Every database query that touches user data is scoped by `session.user.id`. You can't PATCH or DELETE someone else's generation by guessing an ID — the `updateMany` / `deleteMany` filters by both `id` and `userId`, so a guessed ID against another user's row is a no-op rather than a leak.

### 4. The system prompt is the IP

Anyone can wire up the API. The thing that determines whether the output is recruiter-grade or AI slop is the prompt. [`src/lib/prompts.ts`](src/lib/prompts.ts) is a working marketer prompt with format-specific playbooks (LinkedIn algorithm awareness, Twitter thread structure, ad copy character limits) and a calibrated "what you NEVER do" section. That's the part that's easy to skip and shouldn't be.

### 5. Streamed agent UX in Feature 2

The Research Agent runs Claude with the server-side `web_search_20260209` tool plus adaptive thinking, which can take 30–90s. Instead of a spinner, the API ([`src/app/api/research/route.ts`](src/app/api/research/route.ts)) returns a Server-Sent Events stream and the UI shows each search as Claude runs it ("Searched: 'best B2B CRM 2025'"). On the wire that's an `event: search\ndata: {...}` record per query, parsed by a `fetch().getReader()` loop in the client. The full search trail also gets persisted alongside the brief — both for transparency ("did Claude actually research this?") and so the saved-research view can show what was searched.

Why streaming over a long-poll: a portfolio piece showing a real agent working live reads better than a 60-second spinner. Same total time, much better UX.

### 6. Composable agents — three features chain into a workflow

The whole project is structured around a single user workflow: **research → plan → draft → analyze**. Features 3, 4, and 5 each have an optional picker on their form that links to an upstream feature's output, and the upstream context flows into the downstream prompt as authoritative grounding.

| Feature | Optional input | What flows in |
|---|---|---|
| **3 — Plan** | Saved Research brief | persona, pain points, objections, competitor names, content angles |
| **4 — Sequences** | Saved Research brief | same as above |
| **5 — Analyze** | Saved Campaign | campaign goal, channels, planned KPIs |

The result: campaigns built from research name the real competitors. Cold-outreach subject lines reference real audience pains. Performance analyses can call out specific gaps between actuals and the campaign's planned KPIs ("you targeted +25% MQL but the data shows +8%").

Patterns worth pointing at:

- **Context lives in the user message, after the cache breakpoint.** Each feature's system prompt has `cache_control: ephemeral` and stays byte-identical across requests. The per-request upstream context goes in the user message, so injecting different research / different campaigns doesn't invalidate the system-prompt cache.
- **`sourceXId` is a plain string column, not a Prisma relation.** Deleting a research brief shouldn't cascade-delete a campaign or sequence that referenced it 6 months ago. Same logic for campaign → analysis. Loose coupling.
- **One context helper per source feature.** [`src/lib/research-context.ts`](src/lib/research-context.ts) compresses a research brief into a context block for downstream prompts. [`src/lib/campaign-context.ts`](src/lib/campaign-context.ts) does the same for campaigns. Same shape, named for the source.
- **Extract on the second use, not the first.** `buildResearchContext` was inline in Feature 3's route. When Feature 4 needed it, it got promoted to a shared helper and Feature 3 was refactored to import it. By that point you know the right shape — extract earlier and you guess.

This is what turns the project from "5 separate AI tools" into "a workflow." Recruiters reading the codebase see actual composition: one user can run a research brief on a real brand, plan a campaign from it, draft an email sequence in the same style, run the campaign externally, paste back the metrics, and get a verdict that compares results against the original plan.

## Architecture

```
src/
├── app/
│   ├── (auth)/signin/             Magic-link + Google sign-in
│   ├── (dashboard)/
│   │   ├── dashboard/             Stats overview
│   │   ├── generate/              Content Generator (Feature 1)
│   │   ├── history/               Searchable, exportable history
│   │   ├── research/              Audience & Competitor Research (Feature 2)
│   │   ├── research/[id]/         Saved research permalink
│   │   ├── plan/                  Campaign Planner (Feature 3)
│   │   ├── plan/[id]/             Saved campaign permalink
│   │   ├── sequences/             Email Sequence Builder (Feature 4)
│   │   ├── sequences/[id]/        Saved sequence permalink
│   │   ├── analyze/               Performance Analyzer (Feature 5)
│   │   └── analyze/[id]/          Saved analysis permalink
│   ├── api/
│   │   ├── auth/[...nextauth]     Auth.js route handler
│   │   ├── generate/              POST: generate + persist
│   │   ├── history/               PATCH/DELETE/export
│   │   ├── research/              POST: SSE-streamed research
│   │   ├── research/[id]/         DELETE
│   │   ├── campaign/              POST: plan + persist (composes with research)
│   │   ├── campaign/[id]/         DELETE
│   │   ├── sequence/              POST: draft sequence + persist (composes with research)
│   │   ├── sequence/[id]/         DELETE
│   │   ├── analysis/              POST: analyze metrics + persist (composes with campaign)
│   │   └── analysis/[id]/         DELETE
│   ├── layout.tsx                 Toast provider + base styles
│   └── page.tsx                   Landing
├── components/
│   ├── generator/                 Form, variation card, client wrapper
│   ├── history/                   List with filter + search
│   ├── research/                  Form, live-progress, brief renderer
│   ├── campaign/                  Form, calendar display, client wrapper
│   ├── sequence/                  Form, email cards, client wrapper
│   ├── analysis/                  Form, verdict + performers + recommendations renderer
│   ├── nav/                       Sidebar
│   └── ui/                        Button, Card, Input, Toast, etc.
├── lib/
│   ├── anthropic.ts               Claude client: 5 typed functions (one per feature)
│   ├── auth.ts                    Auth.js config (Prisma adapter)
│   ├── db.ts                      Prisma singleton
│   ├── prompts.ts                 System prompts (5 cached prefixes for the 5 features)
│   ├── research-context.ts        Shared helper — research brief → downstream prompt context
│   ├── campaign-context.ts        Shared helper — campaign → analyzer prompt context
│   ├── utils.ts                   cn(), formatDate, truncate
│   └── validation.ts              Zod schemas + UI labels
└── types/
    └── auth.d.ts                  user.id on Session
```

## Deploying

### Vercel (recommended)

1. Push to GitHub.
2. Import on [vercel.com/new](https://vercel.com/new).
3. Add env vars in the Vercel dashboard (`ANTHROPIC_API_KEY`, `AUTH_SECRET`, `AUTH_URL` = your deploy URL, plus auth provider keys).
4. Swap SQLite for Postgres — Vercel's serverless functions don't have a persistent filesystem. The change is two lines in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   Then point `DATABASE_URL` at a Vercel Postgres / Neon / Supabase instance and run `npx prisma db push` once.

### Railway

Railway works the same way and gives you Postgres in one click. Same env vars, same Prisma swap.

## Roadmap

- [x] **Feature 1 — Content Generator.** Blog/social/email/ad with tone presets and 3-variation output.
- [x] **Feature 2 — Audience & Competitor Research Agent.** Live-streamed web research with adaptive thinking → structured marketing brief (persona + competitors + trending topics + content angles + channels). Uses Claude's `web_search_20260209` server-side tool, streams searches to the UI as they happen, persists the full search trail.
- [x] **Feature 3 — Campaign Planner.** Multi-channel campaign calendar from brand/goal/duration/budget input. Adaptive thinking on. Optionally ingests a saved Research brief from Feature 2 — the persona/competitors/angles flow into the planning prompt, so campaigns built from research reference the actual audience and competition rather than generic placeholders.
- [x] **Feature 4 — Email Sequence Builder.** Drafts 3/5/7-email cold outreach or nurture sequences with subject-line A/B variants per email, send-day timing, follow-up conditions, and `{{personalization_tokens}}`. Two distinct prompt playbooks (cold ≠ nurture). Also composes with Feature 2's research output. The `buildResearchContext` helper got extracted to `src/lib/research-context.ts` once two features needed it.
- [x] **Feature 5 — Performance Analyzer.** Paste any shape of metrics (CSV / markdown table / spreadsheet copy / notes); get back a structured verdict (`strong`/`mixed`/`weak` + confidence calibrated to data quality), parsed metrics, top performers, underperformers, patterns with evidence, and prioritized recommendations. Optionally links to a saved Campaign — the planned KPIs flow into the analysis prompt so Claude can compare actuals against targets and call out gaps.

## License

MIT — do whatever you want with it.
