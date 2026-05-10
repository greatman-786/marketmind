import { GeneratorClient } from "@/components/generator/generator-client";

export default function GeneratePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Content Generator</h1>
        <p className="text-sm text-muted-foreground">
          Three distinct angles per request. Generated content is auto-saved to your history.
        </p>
      </div>
      <GeneratorClient />
    </div>
  );
}
