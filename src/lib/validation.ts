import { z } from "zod";

export const CONTENT_TYPES = ["blog", "linkedin", "twitter", "instagram", "email", "ad"] as const;
export const TONES = ["professional", "witty", "casual", "persuasive", "storytelling"] as const;

export const CONTENT_TYPE_LABELS: Record<(typeof CONTENT_TYPES)[number], string> = {
  blog: "Blog post",
  linkedin: "LinkedIn post",
  twitter: "Twitter / X",
  instagram: "Instagram caption",
  email: "Email / Newsletter",
  ad: "Ad copy",
};

export const TONE_LABELS: Record<(typeof TONES)[number], string> = {
  professional: "Professional",
  witty: "Witty",
  casual: "Casual",
  persuasive: "Persuasive",
  storytelling: "Storytelling",
};

export const generateSchema = z.object({
  contentType: z.enum(CONTENT_TYPES),
  tone: z.enum(TONES),
  topic: z.string().min(3, "Topic must be at least 3 characters").max(500),
  keywords: z.string().max(300).optional(),
  audience: z.string().max(300).optional(),
});

export type GenerateFormValues = z.infer<typeof generateSchema>;

export const researchSchema = z.object({
  brand: z.string().min(2, "Brand name is required").max(120),
  niche: z.string().min(3, "Niche must be at least 3 characters").max(200),
  audience: z.string().max(300).optional(),
});

export type ResearchFormValues = z.infer<typeof researchSchema>;

// Feature 3 — Campaign Planner

export const GOALS = [
  "awareness",
  "lead_generation",
  "launch",
  "retention",
  "sales",
] as const;
export const BUDGET_TIERS = ["scrappy", "starter", "growth", "enterprise"] as const;
export const DURATIONS = [4, 8, 12] as const;

export const GOAL_LABELS: Record<(typeof GOALS)[number], string> = {
  awareness: "Awareness",
  lead_generation: "Lead generation",
  launch: "Product launch",
  retention: "Retention / expansion",
  sales: "Sales / pipeline",
};

export const BUDGET_LABELS: Record<(typeof BUDGET_TIERS)[number], string> = {
  scrappy: "Scrappy (no paid spend)",
  starter: "Starter ($1K–5K/mo)",
  growth: "Growth ($5K–25K/mo)",
  enterprise: "Enterprise ($25K+/mo)",
};

export const campaignSchema = z.object({
  brand: z.string().min(2, "Brand name is required").max(200),
  goal: z.enum(GOALS),
  durationWeeks: z.coerce.number().refine((n) => DURATIONS.includes(n as 4 | 8 | 12), {
    message: "Duration must be 4, 8, or 12 weeks",
  }),
  budgetTier: z.enum(BUDGET_TIERS),
  audience: z.string().max(300).optional(),
  // Optional cuid from /research — server validates ownership before using.
  researchId: z.string().min(1).optional().or(z.literal("")),
});

export type CampaignFormValues = z.infer<typeof campaignSchema>;

// Feature 4 — Email Sequence Builder

export const SEQUENCE_TYPES = ["cold_outreach", "nurture"] as const;
export const EMAIL_COUNTS = [3, 5, 7] as const;

export const SEQUENCE_TYPE_LABELS: Record<(typeof SEQUENCE_TYPES)[number], string> = {
  cold_outreach: "Cold outreach",
  nurture: "Nurture",
};

export const sequenceSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  product: z.string().min(3, "Describe the product").max(400),
  audience: z.string().min(3, "Describe the audience").max(400),
  goal: z.string().min(3, "Describe the goal").max(200),
  type: z.enum(SEQUENCE_TYPES),
  emailCount: z.coerce.number().refine((n) => EMAIL_COUNTS.includes(n as 3 | 5 | 7), {
    message: "Email count must be 3, 5, or 7",
  }),
  researchId: z.string().min(1).optional().or(z.literal("")),
});

export type SequenceFormValues = z.infer<typeof sequenceSchema>;

// Feature 5 — Performance Analyzer

export const analysisSchema = z.object({
  title: z.string().min(2, "Title is required").max(120),
  rawMetrics: z.string().min(20, "Paste at least some metrics (≥20 characters)").max(20_000),
  contextNote: z.string().max(500).optional(),
  campaignId: z.string().min(1).optional().or(z.literal("")),
});

export type AnalysisFormValues = z.infer<typeof analysisSchema>;
