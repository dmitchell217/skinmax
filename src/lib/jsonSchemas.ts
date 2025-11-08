/**
 * JSON Schema definitions for OpenAI structured outputs
 * These are used with response_format: { type: "json_schema" }
 */

export const RoutineJSONSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    version: { type: 'string' },
    profile: {
      type: 'object',
      additionalProperties: false,
      properties: {
        age_range: { type: 'string' },
        skin_type: { type: 'string', enum: ['oily', 'combination', 'dry', 'sensitive'] },
        fitzpatrick: { type: 'string' },
        goal: { type: 'string' },
        budget_per_month_cents: { type: 'integer' },
        fragrance_ok: { type: 'boolean' },
        max_steps_am: { type: 'integer', minimum: 2, maximum: 6 },
        max_steps_pm: { type: 'integer', minimum: 2, maximum: 6 },
        actives_in_use: { type: 'array', items: { type: 'string' } },
      },
      required: ['age_range', 'skin_type', 'goal', 'budget_per_month_cents', 'fragrance_ok', 'max_steps_am', 'max_steps_pm'],
    },
    morning: { type: 'array', items: { $ref: '#/$defs/Step' }, minItems: 1 },
    evening: { type: 'array', items: { $ref: '#/$defs/Step' }, minItems: 1 },
    conflicts: { type: 'array', items: { type: 'string' } },
    cautions: { type: 'array', items: { type: 'string' } },
  },
  required: ['version', 'profile', 'morning', 'evening', 'conflicts', 'cautions'],
  $defs: {
    ProductOption: {
      type: 'object',
      additionalProperties: false,
      properties: {
        product_id: { type: 'integer' },
        brand: { type: 'string' },
        name: { type: 'string' },
        url: { type: 'string' },
        price_cents: { type: 'integer' },
      },
      required: ['product_id', 'brand', 'name', 'url', 'price_cents'],
    },
    Step: {
      type: 'object',
      additionalProperties: false,
      properties: {
        step_id: { type: 'string' },
        title: { type: 'string' },
        actives: { type: 'array', items: { type: 'string' } },
        why: { type: 'string', maxLength: 180 },
        options: { type: 'array', items: { $ref: '#/$defs/ProductOption' }, minItems: 0, maxItems: 3 },
      },
      required: ['step_id', 'title', 'actives', 'why', 'options'],
    },
  },
} as const;

export const VisionSummaryJSONSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    glow_score: { type: 'integer', minimum: 0, maximum: 100 },
    subscores: {
      type: 'object',
      additionalProperties: false,
      properties: {
        acne: { type: 'number', minimum: 0, maximum: 5 },
        redness: { type: 'number', minimum: 0, maximum: 5 },
        oil_dry: { type: 'number', minimum: 0, maximum: 5 },
        irritation: { type: 'number', minimum: 0, maximum: 5 },
      },
      required: ['acne', 'redness', 'oil_dry', 'irritation'],
    },
    issues: { type: 'array', items: { type: 'string' }, maxItems: 3 },
    badges: { type: 'array', items: { type: 'string' }, maxItems: 3 },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    needs_better_photo: { type: 'boolean' },
  },
  required: ['glow_score', 'subscores', 'issues', 'badges', 'confidence', 'needs_better_photo'],
} as const;

export const TonightPlanJSONSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    version: { type: 'string' },
    plan: {
      type: 'array',
      items: { $ref: '#/$defs/TonightPlanStep' },
      minItems: 3,
      maxItems: 3,
    },
  },
  required: ['version', 'plan'],
  $defs: {
    ProductOption: {
      type: 'object',
      additionalProperties: false,
      properties: {
        product_id: { type: 'integer' },
        brand: { type: 'string' },
        name: { type: 'string' },
        url: { type: 'string' },
        price_cents: { type: 'integer' },
      },
      required: ['product_id', 'brand', 'name', 'url', 'price_cents'],
    },
    TonightPlanStep: {
      type: 'object',
      additionalProperties: false,
      properties: {
        step: { type: 'string' },
        actives: { type: 'array', items: { type: 'string' } },
        why: { type: 'string' },
        product_options: { type: 'array', items: { $ref: '#/$defs/ProductOption' } },
      },
      required: ['step', 'actives', 'why', 'product_options'],
    },
  },
} as const;

export const SelfieResultJSONSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    redness: { type: 'number', minimum: 0, maximum: 3 },
    dryness: { type: 'number', minimum: 0, maximum: 3 },
    acne: { type: 'number', minimum: 0, maximum: 3 },
    notes: { type: 'array', items: { type: 'string' }, maxItems: 6 },
    advice: { type: 'string', maxLength: 240 },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
  required: ['redness', 'dryness', 'acne', 'notes', 'advice', 'confidence'],
} as const;

export const FaceShapeJSONSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    shape: { type: 'string', enum: ['oval', 'round', 'heart', 'square'] },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    notes: { type: 'array', items: { type: 'string' } },
  },
  required: ['shape', 'confidence', 'notes'],
} as const;

