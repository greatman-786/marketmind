# MarketMind — Demo

A walkthrough of the shipped feature with example outputs. Add screenshots after running the app for the first time.

## Running the demo

```bash
npm install
cp .env.example .env  # then fill in ANTHROPIC_API_KEY + AUTH_SECRET
npx prisma db push
npm run dev
```

## Walkthrough

### 1. Landing page

> **Screenshot:** `docs/screenshots/01-landing.png`

The landing page describes the product and routes signed-out users to `/signin`, signed-in users to `/dashboard`.

### 2. Sign in

> **Screenshot:** `docs/screenshots/02-signin.png`

Two flows out of the box:
- **Google OAuth** — single click, requires `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`
- **Email magic link** — requires `AUTH_RESEND_KEY` (free tier: 100/day)

If neither is configured, the page surfaces a clear warning rather than silently breaking.

### 3. Dashboard

> **Screenshot:** `docs/screenshots/03-dashboard.png`

After signing in, you land on a stats overview: total generations, favorites, top format, and the 5 most recent items.

### 4. Generate content

> **Screenshot:** `docs/screenshots/04-generate-form.png`

Pick a content type (Blog, LinkedIn, Twitter/X, Instagram, Email, Ad), pick a tone (Professional, Witty, Casual, Persuasive, Storytelling), and give Claude a topic.

> **Screenshot:** `docs/screenshots/05-generate-output.png`

Three variations come back — each taking a different angle (direct, story-led, curiosity-led). Copy any to clipboard, or favorite the keeper. Token usage and cache savings are shown so you can see prompt caching working.

### 5. History

> **Screenshot:** `docs/screenshots/06-history.png`

Every generation is auto-saved. Search across topics, keywords, or content. Filter by format. Show favorites only. Expand any row to see all three variations side-by-side. Export to CSV (for spreadsheets) or Markdown (for documents).

## Example outputs

### LinkedIn post — professional tone

**Topic:** "How early-stage founders should think about pricing"

> **Variation 1 (direct):**
> Most early-stage SaaS founders price too low and call it strategy.
>
> The math: if you're charging $29/mo when your competitors charge $99/mo, you're not "winning on price." You're signaling that you're worth less than them.
>
> Three pricing frameworks worth more than any guru's playbook:
> 1. Value-based — what does the outcome cost the customer if they DON'T buy?
> 2. Cost-plus — what's your unit economics floor?
> 3. Anchor-relative — what does the closest competitor charge, and what's your delta justified by?
>
> Pick one. Stick with it for 90 days. Then iterate.

> **Variation 2 (story-led):**
> A founder I know spent six months building a B2B tool. Launch day, he priced it at $19/mo. ...

*(real generations will vary — Claude rotates angles per request)*

### Twitter thread — witty tone

**Topic:** "Why 'AI marketing tools' all sound the same"

> **Variation 1:**
> 1/ every "AI marketing tool" right now sounds exactly the same.
>
> "Generate compelling content in seconds!"
>
> compelling, according to whom. you, the model that has read every brand blog ever written, including the bad ones?
>
> 2/ the dirty secret: 90% of these tools are wrappers around the same three model APIs with slightly different system prompts.
> ...

### 6. Run research (Feature 2)

> **Screenshot:** `docs/screenshots/07-research-form.png`

Type in a brand and a niche. Optionally narrow with a suspected audience. Click "Run research."

> **Screenshot:** `docs/screenshots/08-research-progress.png`

The UI streams Claude's progress live: "Connecting to Claude…" → "Searched: 'best B2B project management tools 2025'" → "Searched: 'Linear vs Jira reviews'" → "Thinking through what it found…" → done. Each search shows up as a separate row as Claude runs it. Typical run time is 30–90 seconds for 3–5 searches plus synthesis.

> **Screenshot:** `docs/screenshots/09-research-brief.png`

The final brief renders as a structured card stack:

- **Market summary** — 2–3 sentences on the shape of the market
- **Target persona** — name, demographics, 5–7 pain points, goals, objections
- **Competitors** — 3–5 real, named competitors with positioning, strengths, gaps, content strategy
- **Trending topics** — 3–5 topics with a "why now" for each
- **Content angles** — 5–7 specific hooks with format recommendations
- **Recommended channels** — ranked

Plus an expandable "Sources" section listing exactly which queries Claude ran, so you can verify the brief is grounded in real searches rather than hallucinated.

Hit "Copy as Markdown" to drop the whole brief into a doc. Each brief is auto-saved to `/research` with a permalink.

### 7. Plan a campaign (Feature 3)

> **Screenshot:** `docs/screenshots/10-plan-form.png`

Pick a brand/product, a goal (awareness, lead gen, launch, retention, sales), a duration (4 / 8 / 12 weeks), and a budget tier (scrappy → enterprise). Optionally select a saved research brief from the "Pull from research" picker — this is the part that turns the project from five disconnected tools into a workflow.

> **Screenshot:** `docs/screenshots/11-plan-output.png`

After ~20–40 seconds of adaptive-thinking-driven planning, you get back:

- **Campaign summary** — name, positioning, 2–4 specific objectives
- **Channel mix** — 2–6 channels sized to your budget, each with a role and a realistic cadence
- **Calendar** — week-by-week, every week has a theme and a list of dated, channel-tagged posts with hooks and briefs
- **KPIs** — 3–5 metrics appropriate to the goal (awareness ≠ sales)
- **Risks** — 2–4 things to watch

Hit "Copy as Markdown" to drop the entire calendar into a doc / Notion / wherever your team lives.

If you built this campaign from a saved research brief, the saved permalink at `/plan/[id]` shows a "Built from research →" badge that links back to the research source.

> **Screenshot:** `docs/screenshots/12-plan-from-research.png`

The composability story: run a Research brief on a real brand (e.g. Linear), then plan a campaign with the brief selected — the resulting campaign references Linear's actual competitors by name, mirrors the persona's pain points in the post titles, and threads the research's content angles through the calendar.

### 8. Draft an email sequence (Feature 4)

> **Screenshot:** `docs/screenshots/13-sequences-form.png`

Pick a name, describe your product/service, identify the audience, name the goal (e.g. "book a 15-min discovery call"), choose a sequence type (cold outreach or nurture) and email count (3, 5, or 7). Optionally select a saved research brief — the persona's pain points and objections feed into the email-writing prompt.

> **Screenshot:** `docs/screenshots/14-sequence-output.png`

After ~20–40 seconds you get back:

- **Sequence summary** — name, type, audience, goal, total span in days, plus the list of `{{personalization_tokens}}` actually used
- **Per email** (numbered cards): send day, send condition (e.g. "Send if no reply to email 1"), strategic angle, **2–3 subject-line A/B variants** (variant A is the recommended default), preheader text, full body with tokens embedded, and the primary CTA
- **Testing tips** — 2–4 specific optimization recommendations

Each email card has its own copy button. The whole sequence has a "Copy as Markdown" button that drops a clean structured doc into your clipboard.

The two playbooks are genuinely different:

- **Cold outreach** caps at 5 emails (the prompt internally rejects 7 as harassment), uses a Day 0 / Day 3 / Day 7 / Day 14 cadence, ≤120-word bodies, single low-friction CTAs, and avoids the spam-pattern subject lines ("Quick question", "BUMP", "Just following up").
- **Nurture** runs longer (Day 0 / 3 / 7 / 14 / 21 / 30), warmer tone, 150–250 word bodies, mixed CTA difficulty across the sequence.

> **Screenshot:** `docs/screenshots/15-sequence-from-research.png`

The composability story: with a research brief selected, subject lines reference the persona's actual pain points (e.g. for an engineering-manager audience, "the standup-fatigue question" instead of generic "Quick question"), and mid-sequence emails address the objections from the brief directly.

### 9. Analyze a campaign's performance (Feature 5)

> **Screenshot:** `docs/screenshots/16-analyze-form.png`

Pick an analysis title, paste your metrics in any shape (CSV, markdown table, raw spreadsheet copy/paste, or even free-form notes), optionally add a context note, optionally link a saved campaign for KPI comparison.

> **Screenshot:** `docs/screenshots/17-analyze-output.png`

After ~20–40 seconds you get back:

- **Verdict** — `strong` / `mixed` / `weak`, plus a `confidence` rating (`high` / `medium` / `low`) calibrated to the *quality* of the data, not the desired conclusion. Pasting 3 data points will never produce a "strong + high confidence" verdict — the prompt is honest about that.
- **Parsed metrics** — a table of what Claude actually extracted from your paste. Useful as an audit ("did Claude understand what I gave it?") and as a structured representation for downstream tooling.
- **Top performers / Underperformers** — 1–3 of each, named specifically with the metric that stood out and a falsifiable hypothesis on why.
- **Patterns** — themes seen across multiple items, with cited evidence. Empty array if nothing real emerges.
- **Recommendations** — up to 7, each with an action, rationale, and `high` / `medium` / `low` priority. The display sorts them high → low.
- **Data caveats** — 0–3 things that limit the analysis ("only 5 data points", "impressions missing for blog rows").

> **Screenshot:** `docs/screenshots/18-analyze-vs-campaign.png`

If you linked a campaign, the analysis compares actuals against the planned KPIs from that campaign. The verdict will explicitly call out gaps ("you targeted +25% MQL; the data shows +8% — concentrated in LinkedIn underperformance").

The saved permalink also includes a collapsible "View raw pasted metrics" panel so you can audit later what Claude was given to work with.

## The full workflow loop

With Feature 5 done, MarketMind runs end-to-end as a single workflow:

1. **Research** a brand on `/research` → saved structured brief
2. **Plan** a campaign from that brief on `/plan` → saved multi-week calendar with KPIs
3. **Draft** content with `/generate` and email sequences with `/sequences` → both can pull from the same research
4. **Execute** externally (publish posts, send emails, run ads — outside the app)
5. **Analyze** the results on `/analyze`, linking back to the original campaign → verdict that references the planned KPIs

That's the demo to show recruiters: not "here are 5 AI tools", but "here's a workflow where each step grounds the next."

## Cost notes

**Content Generator (Feature 1):** ~3,000 input tokens (mostly cached system prompt) + ~600 output tokens.

- First request in a session: ~$0.013
- Subsequent requests within 5 min: ~$0.005 (system prompt served from cache at ~10%)
- A $5 Anthropic credit ≈ 1,000 generations.

**Research Agent (Feature 2):** Significantly more expensive per request because of web search results landing in context.

- Typical request: 15K–30K input tokens (search results + thinking) + ~1,500 output tokens
- ~$0.05–$0.10 per research run on Sonnet 4.6
- `max_uses: 5` cap on web searches keeps cost bounded
- A $5 credit ≈ 50–100 research runs.

**Campaign Planner (Feature 3):** No web search, but adaptive thinking + dense JSON output makes it pricier than Feature 1.

- Typical request: ~3K input tokens (cached system prompt + brand/goal + optional research context) + 4K–6K output tokens
- ~$0.07–$0.10 per planning run on Sonnet 4.6
- A $5 credit ≈ 60–80 plans.

**Email Sequence Builder (Feature 4):** Similar shape to Feature 3.

- Typical request: ~3K input tokens (cached system prompt + product/audience/goal + optional research context) + 3K–5K output tokens (depends on email count and type — 7 nurture emails > 3 cold ones)
- ~$0.05–$0.09 per sequence draft on Sonnet 4.6
- A $5 credit ≈ 70–100 sequences.

**Performance Analyzer (Feature 5):** Variable, depends mostly on how much data is pasted.

- Typical request: 3K–5K input tokens (cached system prompt + pasted metrics + optional campaign context) + 2K–4K output tokens
- ~$0.04–$0.08 per analysis on Sonnet 4.6
- A $5 credit ≈ 80–120 analyses.

If you want to push cost down further, swap `claude-sonnet-4-6` to `claude-haiku-4-5` in [`src/lib/anthropic.ts`](src/lib/anthropic.ts) — but quality drops noticeably on Features 2–5 (anything synthesis-heavy). Sonnet is the right tier here.
