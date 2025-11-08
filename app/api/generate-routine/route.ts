import { NextRequest, NextResponse } from 'next/server';
import { QuizInputSchema } from '@/lib/inputSchema';
import { loadCatalog } from '@/lib/catalog';
import { generateRoutine } from '@/lib/llm';
import { generateUniqueSlug, uuid } from '@/lib/slug';
import { kvSet } from '@/lib/kv';
import { getRateLimitKey, requireWithinLimitOrThrow } from '@/lib/ratelimit';

export const runtime = 'nodejs'; // OpenAI SDK requires Node.js runtime
export const maxDuration = 30; // 30 seconds max for LLM call

export async function POST(request: NextRequest) {
  const requestId = uuid();
  const startTime = Date.now();

  try {
    // Rate limiting (20/day per IP)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               null;
    const userAgent = request.headers.get('user-agent') || null;
    const rateLimitKey = getRateLimitKey('generate', ip, userAgent);
    
    await requireWithinLimitOrThrow(rateLimitKey, 20, 86400); // 20/day, 24h window

    // Parse and validate input
    const body = await request.json();
    const parseResult = QuizInputSchema.safeParse(body.inputs || body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: parseResult.error.issues,
          requestId,
        },
        { status: 400 }
      );
    }

    const inputs = parseResult.data;

    // Load and filter catalog
    const catalog = await loadCatalog();
    
    // Generate routine using LLM
    const routine = await generateRoutine(inputs, catalog);

    // Create unique slug
    const slug = await generateUniqueSlug();

    // Store routine in KV with 30 day TTL (2592000 seconds)
    // This prevents unbounded growth while keeping routines shareable
    await kvSet(`routine:${slug}`, routine, 2592000);

    const latency = Date.now() - startTime;
    console.log(`[generate-routine] ${requestId} - slug: ${slug}, latency: ${latency}ms`);

    return NextResponse.json({
      slug,
      routine,
      requestId,
    });
  } catch (error: any) {
    const latency = Date.now() - startTime;
    
    // Handle rate limit errors
    if (error.statusCode === 429) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: error.retryAfter,
          requestId,
        },
        { status: 429 }
      );
    }

    // Handle timeout errors
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      console.error(`[generate-routine] ${requestId} - Timeout after ${latency}ms`);
      return NextResponse.json(
        {
          error: 'Request timeout',
          requestId,
        },
        { status: 504 }
      );
    }

    // Handle LLM/API errors
    if (error.message?.includes('API') || error.message?.includes('OpenAI')) {
      console.error(`[generate-routine] ${requestId} - LLM error:`, error);
      return NextResponse.json(
        {
          error: 'Failed to generate routine',
          message: error.message,
          requestId,
        },
        { status: 502 }
      );
    }

    // Generic error
    console.error(`[generate-routine] ${requestId} - Error:`, error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Unknown error',
        requestId,
      },
      { status: 500 }
    );
  }
}

