"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  CONTENT_TYPES,
  CONTENT_TYPE_LABELS,
  TONES,
  TONE_LABELS,
  generateSchema,
  type GenerateFormValues,
} from "@/lib/validation";
import { Wand2 } from "lucide-react";

interface Props {
  isLoading: boolean;
  onSubmit: (values: GenerateFormValues) => void | Promise<void>;
}

export function GeneratorForm({ isLoading, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GenerateFormValues>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      contentType: "linkedin",
      tone: "professional",
      topic: "",
      keywords: "",
      audience: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contentType">Content type</Label>
          <Select id="contentType" {...register("contentType")}>
            {CONTENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {CONTENT_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tone">Tone</Label>
          <Select id="tone" {...register("tone")}>
            {TONES.map((tone) => (
              <option key={tone} value={tone}>
                {TONE_LABELS[tone]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="topic">
          Topic <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="topic"
          placeholder="e.g. How early-stage founders should think about pricing — three frameworks and where each one breaks."
          rows={3}
          {...register("topic")}
        />
        {errors.topic ? (
          <p className="text-xs text-destructive">{errors.topic.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            The more specific you are, the less generic the output. Aim for one concrete claim or angle.
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="keywords">SEO keywords <span className="text-muted-foreground">(optional)</span></Label>
          <Input id="keywords" placeholder="pricing strategy, B2B SaaS" {...register("keywords")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audience">Audience <span className="text-muted-foreground">(optional)</span></Label>
          <Input id="audience" placeholder="early-stage SaaS founders" {...register("audience")} />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg" isLoading={isLoading}>
          {!isLoading ? <Wand2 className="h-4 w-4" /> : null}
          {isLoading ? "Generating…" : "Generate 3 variations"}
        </Button>
      </div>
    </form>
  );
}
