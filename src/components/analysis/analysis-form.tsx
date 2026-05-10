"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { analysisSchema, type AnalysisFormValues } from "@/lib/validation";
import { BarChart3 } from "lucide-react";

export interface CampaignOption {
  id: string;
  brand: string;
  goal: string;
  durationWeeks: number;
}

interface Props {
  isLoading: boolean;
  recentCampaigns: CampaignOption[];
  onSubmit: (values: AnalysisFormValues) => void | Promise<void>;
}

export function AnalysisForm({ isLoading, recentCampaigns, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisSchema),
    defaultValues: {
      title: "",
      rawMetrics: "",
      contextNote: "",
      campaignId: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">
          Analysis title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g. Q2 LinkedIn campaign — first 30 days"
          {...register("title")}
        />
        {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rawMetrics">
          Metrics data <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="rawMetrics"
          rows={10}
          className="font-mono text-xs"
          placeholder={`Paste anything — CSV, markdown table, raw spreadsheet copy, or just notes.

Example:
Channel,Post,Impressions,CTR,Replies
LinkedIn,"Why we ripped out HubSpot",4200,5.8%,12
LinkedIn,"5 tips for marketers",1800,1.2%,1
Twitter,"Pricing thread",6400,3.4%,8`}
          {...register("rawMetrics")}
        />
        {errors.rawMetrics ? (
          <p className="text-xs text-destructive">{errors.rawMetrics.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Claude parses whatever shape comes in. The messier the data, the more honest the verdict.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contextNote">
          Context note <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="contextNote"
          placeholder="e.g. First 30 days of the LinkedIn-led campaign; no paid spend yet."
          {...register("contextNote")}
        />
        <p className="text-xs text-muted-foreground">
          Tell Claude anything that isn't in the data — channel, time period, baseline, what was new.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaignId">
          Analyze against campaign <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Select id="campaignId" {...register("campaignId")}>
          <option value="">— None (analyze standalone) —</option>
          {recentCampaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.brand} — {c.goal} ({c.durationWeeks}w)
            </option>
          ))}
        </Select>
        <p className="text-xs text-muted-foreground">
          Selecting a campaign lets Claude compare actuals against the planned KPIs from that campaign.
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg" isLoading={isLoading}>
          {!isLoading ? <BarChart3 className="h-4 w-4" /> : null}
          {isLoading ? "Analyzing…" : "Analyze performance"}
        </Button>
      </div>
    </form>
  );
}
