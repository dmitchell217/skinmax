import { NextRequest, NextResponse } from 'next/server';
import { generateTonightPlan } from '@/lib/llm';
import { loadCatalog } from '@/lib/catalog';
import { VisionSummarySchema, TonightPlanSchema } from '@/lib/schema';
import { z } from 'zod';
import { getRateLimitKey, requireWithinLimitOrThrow } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const maxDuration = 30;

const TonightPlanRequestSchema = z.object({
  vision_summary: VisionSummarySchema,
  budget_cents: z.number().optional(),
  fragrance_ok: z.boolean().optional(),
  skin_type: z.enum(['oily', 'combination', 'dry', 'sensitive']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 20/day per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               null;
    const userAgent = request.headers.get('user-agent') || null;
    
    try {
      const dailyKey = getRateLimitKey('tonight-plan:daily', ip, userAgent);
      await requireWithinLimitOrThrow(dailyKey, 20, 86400); // 20/day
    } catch (rateLimitError: any) {
      if (rateLimitError.statusCode === 429) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            retryAfter: rateLimitError.retryAfter,
            message: 'You\'ve reached the daily limit for plan generation. Please try again tomorrow.',
          },
          { 
            status: 429,
            headers: {
              'Retry-After': rateLimitError.retryAfter.toString(),
            },
          }
        );
      }
      throw rateLimitError;
    }

    const body = await request.json();
    const parseResult = TonightPlanRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { vision_summary, budget_cents, fragrance_ok, skin_type } = parseResult.data;

    // Load catalog
    const catalog = await loadCatalog();

    // Generate tonight's plan
    const plan = await generateTonightPlan(
      vision_summary,
      catalog,
      budget_cents,
      fragrance_ok,
      skin_type
    );

    // Validate plan schema (should already be validated in generateTonightPlan, but double-check)
    const planParseResult = TonightPlanSchema.safeParse(plan);
    if (!planParseResult.success) {
      console.error('[Tonight Plan API] Schema validation failed:', planParseResult.error.issues);
      return NextResponse.json(
        { 
          error: 'Invalid plan data',
          details: planParseResult.error.issues,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(planParseResult.data);
  } catch (error: any) {
    console.error('[Tonight Plan API] Error:', error);
    console.error('[Tonight Plan API] Error stack:', error.stack);
    return NextResponse.json(
      {
        error: 'Failed to generate plan',
        message: error.message || 'Unknown error',
        details: error.details || undefined,
      },
      { status: 500 }
    );
  }
}

