"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Globe, Brain, Loader2, CheckCircle2 } from "lucide-react";

export interface ProgressEvent {
  type: "status" | "search" | "thinking";
  message?: string;
  query?: string;
}

interface Props {
  events: ProgressEvent[];
  finished: boolean;
}

export function ResearchProgress({ events, finished }: Props) {
  if (events.length === 0 && !finished) return null;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          {finished ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Research complete
            </>
          ) : (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              The agent is working…
            </>
          )}
        </div>
        <ol className="space-y-2">
          {events.map((event, i) => (
            <li key={i} className="flex items-start gap-2 text-sm animate-fade-in">
              <Icon type={event.type} />
              <span className="text-foreground">
                {event.type === "search" ? (
                  <>
                    Searched: <span className="font-medium">"{event.query}"</span>
                  </>
                ) : event.type === "thinking" ? (
                  <span className="text-muted-foreground">Thinking through what it found…</span>
                ) : (
                  <span className="text-muted-foreground">{event.message}</span>
                )}
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function Icon({ type }: { type: ProgressEvent["type"] }) {
  if (type === "search")
    return <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" />;
  if (type === "thinking")
    return <Brain className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />;
  return <Loader2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />;
}
