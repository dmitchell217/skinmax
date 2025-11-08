import { z } from 'zod';

/**
 * Zod schema for quiz input payload
 * Mirrors PRD fields with step caps 2-6
 */
export const QuizInputSchema = z.object({
  age_range: z.string().min(1, 'Age range is required'),
  skin_type: z.enum(['oily', 'combination', 'dry', 'sensitive']),
  fitzpatrick: z.string().optional(),
  goal: z.string().min(1, 'Goal is required'),
  budget_per_month_cents: z.number().int().min(0, 'Budget must be non-negative'),
  fragrance_ok: z.boolean(),
  max_steps_am: z.number().int().min(2).max(6, 'Max steps AM must be between 2 and 6'),
  max_steps_pm: z.number().int().min(2).max(6, 'Max steps PM must be between 2 and 6'),
  actives_in_use: z.array(z.string()).optional(),
  prescription_use: z.boolean().optional(),
});

export type QuizInput = z.infer<typeof QuizInputSchema>;

