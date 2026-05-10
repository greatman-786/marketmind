"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { researchSchema, type ResearchFormValues } from "@/lib/validation";
import { Search } from "lucide-react";

interface Props {
  isLoading: boolean;
  onSubmit: (values: ResearchFormValues) => void | Promise<void>;
}

export function ResearchForm({ isLoading, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResearchFormValues>({
    resolver: zodResolver(researchSchema),
    defaultValues: { brand: "", niche: "", audience: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="brand">
          Brand or product <span className="text-destructive">*</span>
        </Label>
        <Input
          id="brand"
          placeholder="e.g. Linear, Notion, your-startup-name"
          {...register("brand")}
        />
        {errors.brand ? (
          <p className="text-xs text-destructive">{errors.brand.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="niche">
          Niche or category <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="niche"
          placeholder="e.g. Project management software for engineering teams. We're going after the segment that finds Jira too heavy and Trello too light."
          rows={3}
          {...register("niche")}
        />
        {errors.niche ? (
          <p className="text-xs text-destructive">{errors.niche.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            The more specific you are about positioning, the more useful the brief.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="audience">
          Suspected audience <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="audience"
          placeholder="e.g. engineering managers at 50-500 person SaaS companies"
          {...register("audience")}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg" isLoading={isLoading}>
          {!isLoading ? <Search className="h-4 w-4" /> : null}
          {isLoading ? "Researching…" : "Run research"}
        </Button>
      </div>
    </form>
  );
}
