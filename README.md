# 🧠 MarketMind

Marketing copy generation with a memory — blog intros, LinkedIn posts, Twitter threads, email sequences and ad copy, three angles per request, with every generation saved and searchable.

🌐 **Demo:** https://marketmind-gray.vercel.app

---

## What it does

- **Three drafts per request** — direct, story-led and curiosity-driven, so you pick rather than regenerate
- **Tone presets** that actually produce different output
- **Searchable history** — every generation saved, filterable by type, favourite the ones worth keeping
- **Export** to CSV or Markdown
- **Accounts** — OAuth and magic-link sign-in, each user's history isolated from everyone else's

---

## 🛠️ Built with

| Tool | Purpose |
|---|---|
| Next.js / TypeScript | Application |
| Prisma | Database layer — SQLite locally, Postgres in production |
| Tailwind CSS | Styling |
| Anthropic Claude | Generation |
| Vercel | Hosting |

---

## ⚙️ Running it locally

```bash
git clone https://github.com/greatman-786/marketmind.git
cd marketmind
npm install
cp .env.example .env
```

Fill in the values in `.env` — the file lists what's needed, including your Anthropic API key and a database URL.

```bash
npx prisma migrate dev
npm run dev
```

Then open `http://localhost:3000`.

---

## 📁 Structure

```
marketmind/
├── prisma/           # database schema and migrations
├── src/              # application code
├── .env.example      # copy this to .env
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## ⚡ Problems I hit, and what I did

**1. Ran out of Anthropic credits mid-testing.** Generation stopped dead. Switched to Gemini's free tier as a drop-in and moved the key into Vercel's environment variables rather than leaving it in the code.

**2. The first outputs were generic.** Advice that could apply to any business is advice that helps none of them. Reworked the prompting to ask for industry, budget and target location before generating anything, which is what made the output usable.

**3. Output came back as a wall of text.** Hard to read, harder to act on. Built a structured UI that breaks the result into sections rather than handing the user a paragraph to untangle.

**4. Vercel's serverless timeout.** Long generations exceeded the function limit. Switched to streaming, so content appears as it's produced and the request doesn't die waiting.

---

**Asad Ullah** — AI automation and QA engineer. [Portfolio](https://asad-portfolio-drab.vercel.app) · [GitHub](https://github.com/greatman-786)
