import OpenAI from 'openai';
import { ROUTINE_SYSTEM, CHAT_SYSTEM, LOOKSMAXX_CHAT_SYSTEM, VISION_SCORE_SYSTEM, SELFIE_SYSTEM, FACE_SHAPE_SYSTEM } from './prompts';
import { RoutineSchema, SelfieResult, Routine, VisionSummary, VisionSummarySchema, TonightPlan, TonightPlanSchema, FaceShape, FaceShapeSchema } from './schema';
import { ensureJson, safeParse } from './json';
import { RoutineJSONSchema, VisionSummaryJSONSchema, TonightPlanJSONSchema, SelfieResultJSONSchema, FaceShapeJSONSchema } from './jsonSchemas';
import type { CatalogItem } from './catalog';

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({
      apiKey,
    });
  }
  return openai;
}

export interface RoutineInputs {
  age_range: string;
  skin_type: 'oily' | 'combination' | 'dry' | 'sensitive';
  fitzpatrick?: string;
  goal: string;
  budget_per_month_cents: number;
  fragrance_ok: boolean;
  max_steps_am: number;
  max_steps_pm: number;
  actives_in_use?: string[];
}

/**
 * Generate a skincare routine from user inputs and catalog
 */
export async function generateRoutine(
  inputs: RoutineInputs,
  catalog: CatalogItem[]
): Promise<Routine> {
  // Organize catalog by step type for easier LLM matching
  const catalogByStep: Record<string, CatalogItem[]> = {};
  catalog.forEach((item) => {
    if (!catalogByStep[item.step]) {
      catalogByStep[item.step] = [];
    }
    // Filter by skin type compatibility
    if (item.skin_types.includes(inputs.skin_type)) {
      catalogByStep[item.step].push(item);
    }
  });
  
  // Format catalog for LLM - organized by step with skin type compatibility
  const catalogFormatted = Object.entries(catalogByStep)
    .map(([step, items]) => {
      return `\n${step.toUpperCase()} products (compatible with ${inputs.skin_type} skin):\n${items.map(item => 
        `  - product_id: ${item.id}, ${item.brand} ${item.name}, $${(item.price_cents / 100).toFixed(2)}, actives: ${item.actives.join(', ')}`
      ).join('\n')}`;
    })
    .join('\n');
  
  const catalogJson = JSON.stringify(catalog, null, 2);
  
  // Sample routine structure for LLM reference
  const sampleJson = `{
  "version": "1.0.0",
  "profile": {
    "age_range": "25-35",
    "skin_type": "combination",
    "fitzpatrick": "III",
    "goal": "acne",
    "budget_per_month_cents": 5000,
    "fragrance_ok": false,
    "max_steps_am": 4,
    "max_steps_pm": 4,
    "actives_in_use": ["niacinamide"]
  },
  "morning": [
    {
      "step_id": "am_cleanser",
      "title": "Gentle Cleanser",
      "actives": ["ceramides"],
      "why": "Removes overnight oil and prepares skin for morning routine without stripping.",
      "options": [
        {
          "product_id": 1,
          "brand": "CeraVe",
          "name": "Hydrating Facial Cleanser",
          "url": "https://example.com/cerave-cleanser",
          "price_cents": 1500
        }
      ]
    }
  ],
  "evening": [
    {
      "step_id": "pm_cleanser",
      "title": "Double Cleanse - Oil First",
      "actives": ["squalane"],
      "why": "Removes makeup and sunscreen. Oil cleanser breaks down SPF and makeup.",
      "options": [
        {
          "product_id": 5,
          "brand": "The Ordinary",
          "name": "Squalane Cleanser",
          "url": "https://example.com/to-squalane",
          "price_cents": 900
        }
      ]
    }
  ],
  "conflicts": ["Avoid using vitamin C and niacinamide at the same time"],
  "cautions": ["Start with every other day for the niacinamide serum if you experience any irritation"]
}`;
  
  const userPrompt = `Generate a personalized skincare routine based on these requirements:

USER REQUIREMENTS:
- Age range: ${inputs.age_range}
- Skin type: ${inputs.skin_type}
${inputs.fitzpatrick ? `- Fitzpatrick scale: ${inputs.fitzpatrick}` : ''}
- Primary goal: ${inputs.goal}
- Budget: $${(inputs.budget_per_month_cents / 100).toFixed(2)}/month
- Fragrance tolerance: ${inputs.fragrance_ok ? 'Yes' : 'No'}
- Max steps AM: ${inputs.max_steps_am}
- Max steps PM: ${inputs.max_steps_pm}
${inputs.actives_in_use?.length ? `- Current actives in use: ${inputs.actives_in_use.join(', ')}` : ''}

AVAILABLE PRODUCT CATALOG (organized by step type, pre-filtered for ${inputs.skin_type} skin):
${catalogFormatted}

FULL CATALOG JSON (for reference - use product_id to match):
${catalogJson}

GUIDELINES:
- Use products from the catalog that match the step type and skin type
- Each step should have 0-3 product options (empty array is allowed if no suitable product exists)
- "why" field should be concise (max 180 characters)
- Include relevant conflicts and cautions based on ingredient interactions
- Match products by step type (cleanser, serum, moisturizer, sunscreen) and skin_type compatibility`;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4o-2024-08-06', // Model that supports structured outputs
      messages: [
        { role: 'system', content: ROUTINE_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'routine',
          strict: true,
          schema: RoutineJSONSchema,
        },
      },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in LLM response');
    }

    // Parse JSON - guaranteed to conform to schema when not a refusal
    const jsonData = JSON.parse(content);
    
    // Validate with Zod schema (double-check, but should always pass with structured outputs)
    const parseResult = safeParse(RoutineSchema, jsonData);
    if (!parseResult.success) {
      console.error('[Routine] Unexpected validation error with structured outputs:', parseResult.error.issues);
      throw new Error(`Schema validation failed: ${JSON.stringify(parseResult.error.issues)}`);
    }

    return parseResult.data;
  } catch (error) {
    console.error('Error generating routine:', error);
    throw error;
  }
}

/**
 * Chat with the AI coach about the routine
 * Includes routine context and full catalog for product recommendations
 * @param mode - 'normal' for educational mode, 'looksmaxx' for raunchy/unhinged mode
 */
export async function chat(
  message: string,
  routine: Routine,
  catalog: CatalogItem[],
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  mode: 'normal' | 'looksmaxx' = 'normal'
): Promise<string> {
  // Build comprehensive routine context
  const routineSummary = `
USER'S SKINCARE ROUTINE:
- Skin Type: ${routine.profile.skin_type}
- Primary Goal: ${routine.profile.goal}
- Age Range: ${routine.profile.age_range}
- Monthly Budget: $${(routine.profile.budget_per_month_cents / 100).toFixed(2)}
- Fragrance Tolerance: ${routine.profile.fragrance_ok ? 'Yes' : 'No'}
${routine.profile.fitzpatrick ? `- Fitzpatrick Scale: ${routine.profile.fitzpatrick}` : ''}
${routine.profile.actives_in_use && routine.profile.actives_in_use.length > 0 
  ? `- Current Actives in Use: ${routine.profile.actives_in_use.join(', ')}` 
  : ''}

MORNING ROUTINE (${routine.morning.length} steps):
${routine.morning.map((step, idx) => {
  const products = step.options.map(opt => `${opt.brand} ${opt.name}`).join(', ');
  return `${idx + 1}. ${step.title}
     - Actives: ${step.actives.join(', ') || 'none'}
     - Products: ${products || 'none'}
     - Why: ${step.why}`;
}).join('\n')}

EVENING ROUTINE (${routine.evening.length} steps):
${routine.evening.map((step, idx) => {
  const products = step.options.map(opt => `${opt.brand} ${opt.name}`).join(', ');
  return `${idx + 1}. ${step.title}
     - Actives: ${step.actives.join(', ') || 'none'}
     - Products: ${products || 'none'}
     - Why: ${step.why}`;
}).join('\n')}

${routine.conflicts.length > 0 ? `\nCONFLICTS TO AVOID:\n${routine.conflicts.map(c => `- ${c}`).join('\n')}` : ''}
${routine.cautions.length > 0 ? `\nCAUTIONS:\n${routine.cautions.map(c => `- ${c}`).join('\n')}` : ''}
`.trim();

  // Build catalog context organized by step type
  const catalogByStep: Record<string, CatalogItem[]> = {};
  catalog.forEach((item) => {
    if (!catalogByStep[item.step]) {
      catalogByStep[item.step] = [];
    }
    catalogByStep[item.step].push(item);
  });

  const catalogSummary = `
AVAILABLE PRODUCT CATALOG (${catalog.length} products total):

${Object.entries(catalogByStep).map(([step, items]) => {
  return `${step.toUpperCase()} (${items.length} products):
${items.map(item => {
  const actives = item.actives.length > 0 ? item.actives.join(', ') : 'none';
  const strength = item.strength ? ` (${item.strength})` : '';
  return `  - ${item.brand} ${item.name}${strength}
    • Actives: ${actives}
    • Compatible with: ${item.skin_types.join(', ')}
    • Price: $${(item.price_cents / 100).toFixed(2)}
    • ID: ${item.id}`;
}).join('\n')}`;
}).join('\n\n')}
`.trim();

  try {
    const client = getOpenAIClient();
    
    // Choose system prompt based on mode
    const systemPrompt = mode === 'looksmaxx' ? LOOKSMAXX_CHAT_SYSTEM : CHAT_SYSTEM;
    
    // For looksmaxx mode, use a more condensed context (less educational detail)
    const contextSummary = mode === 'looksmaxx' 
      ? `Their routine: ${routine.profile.skin_type} skin, goal: ${routine.profile.goal}. Morning: ${routine.morning.length} steps. Evening: ${routine.evening.length} steps. Products available in catalog.`
      : `${routineSummary}\n\n${catalogSummary}`;
    
    // Build comprehensive system context
    const systemContext = `${systemPrompt}\n\n${contextSummary}`;
    
    // Build message history with system context
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { 
        role: 'system', 
        content: systemContext
      },
      // Add conversation history (last 5 messages to keep context manageable)
      ...conversationHistory.slice(-5).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: mode === 'looksmaxx' ? 0.9 : 0.7, // Higher temperature for more unhinged responses
      max_tokens: mode === 'looksmaxx' ? 250 : 300,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in chat response');
    }

    return content;
  } catch (error) {
    console.error('Error in chat:', error);
    throw error;
  }
}

/**
 * Analyze vision/selfie image and return glow score summary
 * Processes image in memory - no storage
 */
export async function analyzeVision(
  imageBuffer: Buffer,
  imageMimeType: string,
  fitzpatrick?: string
): Promise<VisionSummary> {
  // Convert buffer to base64 data URL
  const base64Image = imageBuffer.toString('base64');
  const dataUrl = `data:${imageMimeType};base64,${base64Image}`;

  const userPrompt = `Analyze this face photo and return the JSON assessment.${fitzpatrick ? ` Fitzpatrick scale: ${fitzpatrick}` : ''}`;

  try {
    const client = getOpenAIClient();
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o-2024-08-06', // Model that supports structured outputs
      messages: [
        { role: 'system', content: VISION_SCORE_SYSTEM },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'vision_summary',
          strict: true,
          schema: VisionSummaryJSONSchema,
        },
      },
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in vision analysis response');
    }

    // Parse JSON - guaranteed to conform to schema
    const jsonData = JSON.parse(content);
    
    // Validate with Zod schema (double-check, but should always pass)
    const parseResult = safeParse(VisionSummarySchema, jsonData);
    if (!parseResult.success) {
      console.error('[Vision] Unexpected validation error with structured outputs:', parseResult.error.issues);
      throw new Error(`Schema validation failed: ${JSON.stringify(parseResult.error.issues)}`);
    }

    return parseResult.data;
  } catch (error) {
    console.error('Error analyzing vision:', error);
    throw error;
  }
}

/**
 * Analyze face shape from image
 */
export async function analyzeFaceShape(
  imageBuffer: Buffer,
  imageMimeType: string
): Promise<FaceShape> {
  const base64Image = imageBuffer.toString('base64');
  const dataUrl = `data:${imageMimeType};base64,${base64Image}`;

  const userPrompt = `Analyze this face photo and determine the face shape. Consider the overall proportions, jawline, cheekbones, and forehead width.`;

  try {
    const client = getOpenAIClient();
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o-2024-08-06', // Model that supports structured outputs
      messages: [
        { role: 'system', content: FACE_SHAPE_SYSTEM },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'face_shape',
          strict: true,
          schema: FaceShapeJSONSchema,
        },
      },
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in face shape analysis response');
    }

    // Parse JSON - guaranteed to conform to schema
    const jsonData = JSON.parse(content);
    
    // Validate with Zod schema (double-check, but should always pass)
    const parseResult = safeParse(FaceShapeSchema, jsonData);
    if (!parseResult.success) {
      console.error('[Face Shape] Unexpected validation error with structured outputs:', parseResult.error.issues);
      throw new Error(`Schema validation failed: ${JSON.stringify(parseResult.error.issues)}`);
    }

    return parseResult.data;
  } catch (error) {
    console.error('Error analyzing face shape:', error);
    throw error;
  }
}

/**
 * Generate tonight's plan based on vision summary
 */
export async function generateTonightPlan(
  visionSummary: VisionSummary,
  catalog: CatalogItem[],
  budgetCents?: number,
  fragranceOk?: boolean,
  skinType?: string
): Promise<TonightPlan> {
  // Filter catalog by skin type if provided
  let filteredCatalog = catalog;
  if (skinType) {
    filteredCatalog = catalog.filter(item => item.skin_types.includes(skinType));
  }

  // Filter by budget if provided
  if (budgetCents) {
    const targetPrice = budgetCents / 3; // Rough estimate per step
    filteredCatalog = filteredCatalog.filter(item => item.price_cents <= targetPrice * 1.5);
  }

  // Filter by fragrance preference if provided
  if (fragranceOk === false) {
    // In a real implementation, we'd have a fragrance flag in catalog
    // For now, we'll just use the filtered catalog
  }

  const catalogJson = JSON.stringify(filteredCatalog, null, 2);

  const userPrompt = `Generate a 3-step "Tonight's Plan" skincare routine based on this vision analysis:

VISION SUMMARY:
- Glow Score: ${visionSummary.glow_score}/100
- Acne: ${visionSummary.subscores.acne}/5
- Redness: ${visionSummary.subscores.redness}/5
- Oil/Dry Balance: ${visionSummary.subscores.oil_dry}/5
- Irritation: ${visionSummary.subscores.irritation}/5
- Issues: ${visionSummary.issues.join(', ')}
- Badges: ${visionSummary.badges.join(', ')}

GUARDRAILS:
- If oil_dry >= 4, avoid harsh acids
- If irritation >= 3, bias toward barrier repair products
- Always include SPF in the "protect" step

AVAILABLE CATALOG:
${catalogJson}

Generate exactly 3 steps:
1. "cleanse" - cleansing step
2. "treat" - treatment step (serum/active)
3. "protect" - protection step (must include SPF)

Use products from the catalog that match the user's needs. Copy all product fields (product_id, brand, name, url, price_cents) from the catalog entry.`;

  try {
    const client = getOpenAIClient();
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o-2024-08-06', // Model that supports structured outputs
      messages: [
        { role: 'system', content: ROUTINE_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'tonight_plan',
          strict: true,
          schema: TonightPlanJSONSchema,
        },
      },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in tonight plan response');
    }

    // Parse JSON - guaranteed to conform to schema
    const jsonData = JSON.parse(content);
    
    // Validate with Zod schema (double-check, but should always pass)
    const parseResult = safeParse(TonightPlanSchema, jsonData);
    if (!parseResult.success) {
      console.error('[Tonight Plan] Unexpected validation error with structured outputs:', parseResult.error.issues);
      throw new Error(`Schema validation failed: ${JSON.stringify(parseResult.error.issues)}`);
    }

    return parseResult.data;
  } catch (error) {
    console.error('Error generating tonight plan:', error);
    throw error;
  }
}

/**
 * Analyze selfie images and return skincare assessment
 */
export async function analyzeSelfie(
  imageUrls: string[],
  routine: Routine
): Promise<SelfieResult> {
  const routineContext = `User's current routine:
${JSON.stringify(routine, null, 2)}

Analyze the provided face photos and return a JSON assessment.`;

  try {
    const client = getOpenAIClient();
    const imageContent = imageUrls.map((url) => ({
      type: 'image_url' as const,
      image_url: { url },
    }));

    const response = await client.chat.completions.create({
      model: 'gpt-4o-2024-08-06', // Model that supports structured outputs
      messages: [
        { role: 'system', content: SELFIE_SYSTEM },
        {
          role: 'user',
          content: [
            { type: 'text', text: routineContext },
            ...imageContent,
          ],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'selfie_result',
          strict: true,
          schema: SelfieResultJSONSchema,
        },
      },
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in selfie analysis response');
    }

    // Parse JSON - guaranteed to conform to schema
    const jsonData = JSON.parse(content);
    
    // Validate with Zod schema (double-check, but should always pass)
    const parseResult = safeParse(SelfieResult, jsonData);
    if (!parseResult.success) {
      console.error('[Selfie] Unexpected validation error with structured outputs:', parseResult.error.issues);
      throw new Error(`Schema validation failed: ${parseResult.error.message}`);
    }

    return parseResult.data;
  } catch (error) {
    console.error('Error analyzing selfie:', error);
    throw error;
  }
}

