"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  sequenceSchema,
  type SequenceFormValues,
  SEQUENCE_TYPES,
  SEQUENCE_TYPE_LABELS,
  EMAIL_COUNTS,
} from "@/lib/validation";
import { Mail } from "lucide-react";
import type { ResearchOption } from "@/components/campaign/campaign-form";

interface Props {
  isLoading: boolean;
  recentResearch: ResearchOption[];
  onSubmit: (values: SequenceFormValues) => void | Promise<void>;
}

export function SequenceForm({ isLoading, recentResearch, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SequenceFormValues>({
    resolver: zodResolver(sequenceSchema),
    defaultValues: {
      name: "",
      product: "",
      audience: "",
      goal: "",
      type: "cold_outreach",
      emailCount: 5,
      researchId: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">
          Sequence name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="e.g. Cold outreach to engineering managers — Q2"
          {...register("name")}
        />
        {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="product">
          Product / service <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="product"
          rows={2}
          placeholder="e.g. MarketMind — an AI marketing automation suite that helps founders generate content, research audiences, plan campaigns, and draft email sequences."
          {...register("product")}
        />
        {errors.product ? <p className="text-xs text-destructive">{errors.product.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="audience">
          Audience <span className="text-destructive">*</span>
        </Label>
        <Input
          id="audience"
          placeholder="e.g. founders running their own marketing without a marketing team"
          {...register("audience")}
        />
        {errors.audience ? <p className="text-xs text-destructive">{errors.audience.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal">
          Goal <span className="text-destructive">*</span>
        </Label>
        <Input
          id="goal"
          placeholder="e.g. book a 15-min discovery call"
          {...register("goal")}
        />
        {errors.goal ? <p className="text-xs text-destructive">{errors.goal.message}</p> : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Sequence type</Label>
          <Select id="type" {...register("type")}>
            {SEQUENCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {SEQUENCE_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="emailCount">Number of emails</Label>
          <Select id="emailCount" {...register("emailCount", { valueAsNumber: true })}>
            {EMAIL_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n} emails
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="researchId">
          Pull from research <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Select id="researchId" {...register("researchId")}>
          <option value="">— None (draft from scratch) —</option>
          {recentResearch.map((r) => (
            <option key={r.id} value={r.id}>
              {r.brand} — {r.niche.length > 60 ? r.niche.slice(0, 60) + "…" : r.niche}
            </option>
          ))}
        </Select>
        <p className="text-xs text-muted-foreground">
          Selecting a research brief feeds the persona's pain points and objections into the email-writing prompt.
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg" isLoading={isLoading}>
          {!isLoading ? <Mail className="h-4 w-4" /> : null}
          {isLoading ? "Drafting…" : "Draft sequence"}
        </Button>
      </div>
    </form>
  );
}
