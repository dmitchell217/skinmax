import { NextRequest, NextResponse } from 'next/server';
import { kvGet } from '@/lib/kv';
import { chat } from '@/lib/llm';
import { loadCatalog } from '@/lib/catalog';
import { RoutineSchema, Routine } from '@/lib/schema';
import { getRateLimitKey, requireWithinLimitOrThrow } from '@/lib/ratelimit';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 30;

const ChatRequestSchema = z.object({
  slug: z.string(),
  message: z.string().min(1).max(500),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  mode: z.enum(['normal', 'looksmaxx']).optional().default('normal'),
  sessionId: z.string().optional(), // Client-generated session ID for per-session limits
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = ChatRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { slug, message, history = [], mode = 'normal', sessionId } = parseResult.data;

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               null;
    const userAgent = request.headers.get('user-agent') || null;

    try {
      // 1. Per-session limit: 20 messages per 1-hour window
      if (sessionId) {
        const sessionKey = `chat:session:${sessionId}`;
        await requireWithinLimitOrThrow(sessionKey, 20, 3600); // 20/hour
      }

      // 2. Daily limit: 100 messages per IP
      const dailyKey = getRateLimitKey('chat:daily', ip, userAgent);
      await requireWithinLimitOrThrow(dailyKey, 100, 86400); // 100/day

      // 3. Per-routine limit: 50 messages per slug per day
      const routineKey = `chat:routine:${slug}`;
      await requireWithinLimitOrThrow(routineKey, 50, 86400); // 50/day
    } catch (rateLimitError: any) {
      if (rateLimitError.statusCode === 429) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            retryAfter: rateLimitError.retryAfter,
            message: 'You\'ve reached the chat limit. Please try again later.',
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

    // Load routine from KV
    const routine = await kvGet<Routine>(`routine:${slug}`);
    if (!routine) {
      return NextResponse.json(
        { error: 'Routine not found' },
        { status: 404 }
      );
    }

    // Validate routine schema
    const routineParseResult = RoutineSchema.safeParse(routine);
    if (!routineParseResult.success) {
      return NextResponse.json(
        { error: 'Invalid routine data' },
        { status: 500 }
      );
    }

    // Load catalog for context
    const catalog = await loadCatalog();

    // Call chat function with routine, catalog, history, and mode
    const reply = await chat(message, routineParseResult.data, catalog, history, mode);

    return NextResponse.json({
      reply,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process chat message',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

