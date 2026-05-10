"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  CONTENT_TYPES,
  CONTENT_TYPE_LABELS,
  TONE_LABELS,
} from "@/lib/validation";
import { formatDate } from "@/lib/utils";
import {
  Search,
  Star,
  Copy,
  Trash2,
  Download,
  ChevronDown,
  ChevronRight,
  FileText,
  Wand2,
} from "lucide-react";
import Link from "next/link";

interface HistoryRow {
  id: string;
  contentType: string;
  tone: string;
  topic: string;
  keywords: string;
  audience: string | null;
  variations: string[];
  favoriteIndex: number;
  createdAt: string;
}

export function HistoryClient({ initialRows }: { initialRows: HistoryRow[] }) {
  const { toast } = useToast();
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (typeFilter !== "all" && row.contentType !== typeFilter) return false;
      if (favoritesOnly && row.favoriteIndex < 0) return false;
      if (!q) return true;
      const haystack = [row.topic, row.keywords, row.audience ?? "", ...row.variations]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, search, typeFilter, favoritesOnly]);

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
  }

  async function deleteRow(id: string) {
    if (!confirm("Delete this generation? This can't be undone.")) return;
    const prev = rows;
    setRows((r) => r.filter((row) => row.id !== id));
    const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setRows(prev);
      toast("Failed to delete", "error");
    } else {
      toast("Deleted");
    }
  }

  async function setFavorite(id: string, index: number, currentFavorite: number) {
    const next = currentFavorite === index ? -1 : index;
    const prev = rows;
    setRows((r) => r.map((row) => (row.id === id ? { ...row, favoriteIndex: next } : row)));
    const res = await fetch(`/api/history/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favoriteIndex: next }),
    });
    if (!res.ok) {
      setRows(prev);
      toast("Failed to update favorite", "error");
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search topics, keywords, or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="sm:w-48">
            <option value="all">All types</option>
            {CONTENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {CONTENT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
          <Button
            variant={favoritesOnly ? "default" : "outline"}
            onClick={() => setFavoritesOnly((v) => !v)}
            size="default"
          >
            <Star className={favoritesOnly ? "h-4 w-4 fill-current" : "h-4 w-4"} />
            Favorites
          </Button>
        </div>

        <div className="flex gap-2">
          <a href="/api/history/export?format=csv" download>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              CSV
            </Button>
          </a>
          <a href="/api/history/export?format=markdown" download>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              Markdown
            </Button>
          </a>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {rows.length}
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            {rows.length === 0 ? (
              <>
                <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">No generations yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Start creating to see your history here.</p>
                <Link href="/generate" className="mt-4">
                  <Button size="sm">
                    <Wand2 className="h-4 w-4" />
                    Generate
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Search className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">No results</p>
                <p className="mt-1 text-sm text-muted-foreground">Try clearing your search or filter.</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const expanded = expandedId === row.id;
            return (
              <Card key={row.id}>
                <CardContent className="p-0">
                  <button
                    onClick={() => setExpandedId(expanded ? null : row.id)}
                    className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/40"
                  >
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge>{CONTENT_TYPE_LABELS[row.contentType as keyof typeof CONTENT_TYPE_LABELS]}</Badge>
                        <Badge variant="muted">{TONE_LABELS[row.tone as keyof typeof TONE_LABELS]}</Badge>
                        {row.favoriteIndex >= 0 ? (
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        ) : null}
                      </div>
                      <p className="truncate text-sm font-medium">{row.topic}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</p>
                    </div>
                  </button>

                  {expanded ? (
                    <div className="border-t border-border bg-muted/30 p-4">
                      <div className="grid gap-3 md:grid-cols-3">
                        {row.variations.map((text, idx) => (
                          <div key={idx} className="rounded-md border border-border bg-card p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-medium text-muted-foreground">
                                Variation {idx + 1}
                              </span>
                              <div className="flex">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setFavorite(row.id, idx, row.favoriteIndex)}
                                  aria-label="Favorite"
                                >
                                  <Star
                                    className={
                                      row.favoriteIndex === idx
                                        ? "h-3.5 w-3.5 fill-amber-400 text-amber-500"
                                        : "h-3.5 w-3.5 text-muted-foreground"
                                    }
                                  />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => copy(text)}
                                  aria-label="Copy"
                                >
                                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>
                            <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-foreground">
                              {text}
                            </pre>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <div>
                          {row.keywords ? <span>Keywords: {row.keywords}</span> : null}
                          {row.keywords && row.audience ? <span> · </span> : null}
                          {row.audience ? <span>Audience: {row.audience}</span> : null}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => deleteRow(row.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
