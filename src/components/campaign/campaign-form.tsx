"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  campaignSchema,
  type CampaignFormValues,
  GOALS,
  GOAL_LABELS,
  BUDGET_TIERS,
  BUDGET_LABELS,
  DURATIONS,
} from "@/lib/validation";
import { Calendar } from "lucide-react";

export interface ResearchOption {
  id: string;
  brand: string;
  niche: string;
  createdAt: string;
}

interface Props {
  isLoading: boolean;
  recentResearch: ResearchOption[];
  onSubmit: (values: CampaignFormValues) => void | Promise<void>;
}

export function CampaignForm({ isLoading, recentResearch, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      brand: "",
      goal: "lead_generation",
      durationWeeks: 8,
      budgetTier: "starter",
      audience: "",
      researchId: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="brand">
          Brand or product <span className="text-destructive">*</span>
        </Label>
        <Input
          id="brand"
          placeholder="e.g. MarketMind, your startup, the product launching"
          {...register("brand")}
        />
        {errors.brand ? <p className="text-xs text-destructive">{errors.brand.message}</p> : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="goal">Goal</Label>
          <Select id="goal" {...register("goal")}>
            {GOALS.map((g) => (
              <option key={g} value={g}>
                {GOAL_LABELS[g]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="durationWeeks">Duration</Label>
          <Select id="durationWeeks" {...register("durationWeeks", { valueAsNumber: true })}>
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d} weeks
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budgetTier">Budget tier</Label>
          <Select id="budgetTier" {...register("budgetTier")}>
            {BUDGET_TIERS.map((b) => (
              <option key={b} value={b}>
                {BUDGET_LABELS[b]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="audience">
            Audience <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="audience"
            placeholder="e.g. engineering managers at 50-500 person companies"
            {...register("audience")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="researchId">
          Pull from research <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Select id="researchId" {...register("researchId")}>
          <option value="">— None (plan from scratch) —</option>
          {recentResearch.map((r) => (
            <option key={r.id} value={r.id}>
              {r.brand} — {r.niche.length > 60 ? r.niche.slice(0, 60) + "…" : r.niche}
            </option>
          ))}
        </Select>
        <p className="text-xs text-muted-foreground">
          Selecting a saved research brief feeds the persona, competitors, and content angles into the planner.
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg" isLoading={isLoading}>
          {!isLoading ? <Calendar className="h-4 w-4" /> : null}
          {isLoading ? "Planning…" : "Plan campaign"}
        </Button>
      </div>
    </form>
  );
}
