"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Copy, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  index: number;
  text: string;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
}

const angleLabels = ["Direct / value-first", "Story / hook-driven", "Question / curiosity-led"];

export function VariationCard({ index, text, isFavorite, onFavoriteToggle }: Props) {
  const { toast } = useToast();

  async function copy() {
    await navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
  }

  return (
    <Card className={cn("transition-shadow", isFavorite && "ring-2 ring-primary/40")}>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <span className="text-xs text-muted-foreground">{angleLabels[index] ?? `Variation ${index + 1}`}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={onFavoriteToggle}
              aria-label={isFavorite ? "Unfavorite" : "Favorite"}
              title={isFavorite ? "Unfavorite" : "Favorite"}
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-colors",
                  isFavorite ? "fill-amber-400 text-amber-500" : "text-muted-foreground",
                )}
              />
            </Button>
            <Button size="icon" variant="ghost" onClick={copy} aria-label="Copy" title="Copy">
              <Copy className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
        <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground">{text}</pre>
      </CardContent>
    </Card>
  );
}
