import { z } from 'zod';

export const ProductOption = z.object({
  product_id: z.number(),
  brand: z.string(),
  name: z.string(),
  url: z.string().url(),
  price_cents: z.number(),
});

export const Step = z.object({
  step_id: z.string(),
  title: z.string(),
  actives: z.array(z.string()),
  why: z.string().max(180),
  options: z.array(ProductOption).min(0).max(3), // Allow empty arrays - UI will handle gracefully
});

export const RoutineSchema = z.object({
  version: z.string(),
  profile: z.object({
    age_range: z.string(),
    skin_type: z.enum(['oily', 'combination', 'dry', 'sensitive']),
    fitzpatrick: z.string().optional(),
    goal: z.string(),
    budget_per_month_cents: z.number(),
    fragrance_ok: z.boolean(),
    max_steps_am: z.number().int().min(2).max(6),
    max_steps_pm: z.number().int().min(2).max(6),
    actives_in_use: z.array(z.string()).optional(),
  }),
  morning: z.array(Step),
  evening: z.array(Step),
  conflicts: z.array(z.string()),
  cautions: z.array(z.string()),
});

export const SelfieResult = z.object({
  redness: z.number().min(0).max(3),
  dryness: z.number().min(0).max(3),
  acne: z.number().min(0).max(3),
  notes: z.array(z.string()).max(6),
  advice: z.string().max(240),
  confidence: z.number().min(0).max(1),
});

export const VisionSummarySchema = z.object({
  glow_score: z.number().min(0).max(100),
  subscores: z.object({
    acne: z.number().min(0).max(5),
    redness: z.number().min(0).max(5),
    oil_dry: z.number().min(0).max(5),
    irritation: z.number().min(0).max(5),
  }),
  issues: z.array(z.string()).max(3),
  badges: z.array(z.string()).max(3),
  confidence: z.number().min(0).max(1),
  needs_better_photo: z.boolean(),
});

export const TonightPlanStepSchema = z.object({
  step: z.string(),
  actives: z.array(z.string()),
  why: z.string(),
  product_options: z.array(ProductOption),
});

export const TonightPlanSchema = z.object({
  version: z.string(),
  plan: z.array(TonightPlanStepSchema).length(3),
});

export const FaceShapeSchema = z.object({
  shape: z.enum(['oval', 'round', 'heart', 'square']),
  confidence: z.number().min(0).max(1),
  notes: z.array(z.string()),
});

// Type exports via z.infer
export type ProductOption = z.infer<typeof ProductOption>;
export type Step = z.infer<typeof Step>;
export type Routine = z.infer<typeof RoutineSchema>;
export type SelfieResult = z.infer<typeof SelfieResult>;
export type VisionSummary = z.infer<typeof VisionSummarySchema>;
export type TonightPlanStep = z.infer<typeof TonightPlanStepSchema>;
export type TonightPlan = z.infer<typeof TonightPlanSchema>;
export type FaceShape = z.infer<typeof FaceShapeSchema>;

