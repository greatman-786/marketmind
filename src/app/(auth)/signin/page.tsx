import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Mail } from "lucide-react";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const hasGoogle = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const hasResend = Boolean(process.env.AUTH_RESEND_KEY);

  async function googleSignIn() {
    "use server";
    await signIn("google", { redirectTo: "/dashboard" });
  }

  async function emailSignIn(formData: FormData) {
    "use server";
    const email = formData.get("email");
    if (typeof email !== "string") return;
    await signIn("resend", { email, redirectTo: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold">MarketMind</span>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Pick how you want to authenticate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasGoogle && !hasResend ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-medium">No auth provider is configured.</p>
                <p className="mt-1 text-amber-800">
                  Add either <code className="rounded bg-amber-100 px-1">AUTH_GOOGLE_ID</code> +{" "}
                  <code className="rounded bg-amber-100 px-1">AUTH_GOOGLE_SECRET</code> or{" "}
                  <code className="rounded bg-amber-100 px-1">AUTH_RESEND_KEY</code> to your{" "}
                  <code className="rounded bg-amber-100 px-1">.env</code> file. See{" "}
                  <code className="rounded bg-amber-100 px-1">.env.example</code>.
                </p>
              </div>
            ) : null}

            {hasGoogle ? (
              <form action={googleSignIn}>
                <Button type="submit" variant="outline" className="w-full">
                  <GoogleIcon />
                  Continue with Google
                </Button>
              </form>
            ) : null}

            {hasGoogle && hasResend ? (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
            ) : null}

            {hasResend ? (
              <form action={emailSignIn} className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" name="email" placeholder="you@example.com" required />
                <Button type="submit" className="w-full">
                  <Mail className="h-4 w-4" />
                  Send magic link
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing in you agree to be sent occasional product updates. (Just kidding — this is a portfolio app.)
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
