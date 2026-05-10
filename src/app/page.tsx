import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { Sparkles, Zap, History, Shield, ArrowRight, Github } from "lucide-react";

export default async function LandingPage() {
  const session = await auth();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 gradient-radial" />

      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">MarketMind</span>
        </div>
        <nav className="flex items-center gap-3">
          {session?.user ? (
            <Link href="/dashboard">
              <Button>Open dashboard</Button>
            </Link>
          ) : (
            <Link href="/signin">
              <Button>Sign in</Button>
            </Link>
          )}
        </nav>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16 text-center sm:pt-24">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Powered by Claude Sonnet 4.6
        </div>

        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          Marketing content that doesn't sound like a robot.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
          Generate blog intros, LinkedIn posts, Twitter threads, email sequences, and ad copy
          in seconds. Three angles per request, tone presets that actually differ, and a real
          history you can browse, favorite, and export.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={session?.user ? "/generate" : "/signin"}>
            <Button size="lg" className="w-full sm:w-auto">
              Start generating
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            <span className="inline-flex items-center gap-2">
              <Github className="h-4 w-4" />
              View source
            </span>
          </a>
        </div>

        {/* Feature row */}
        <div className="mx-auto mt-24 grid max-w-4xl gap-8 sm:grid-cols-3">
          <Feature
            icon={<Zap className="h-5 w-5" />}
            title="3 variations, real angles"
            body="Each request returns three drafts — direct, story-led, and curiosity-driven. Pick the one that lands."
          />
          <Feature
            icon={<History className="h-5 w-5" />}
            title="Searchable history"
            body="Every generation is saved. Filter by type, search across topics, favorite the keepers, export to CSV or Markdown."
          />
          <Feature
            icon={<Shield className="h-5 w-5" />}
            title="Your data, your account"
            body="OAuth + magic-link auth. Each user's history is isolated. SQLite locally, Postgres-ready in production."
          />
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>Built with Next.js, Claude API, and Prisma.</span>
          <span>© {new Date().getFullYear()} MarketMind</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        {icon}
      </div>
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
