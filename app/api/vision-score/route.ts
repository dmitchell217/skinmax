import { NextRequest, NextResponse } from 'next/server';
import { analyzeVision } from '@/lib/llm';
import { getRateLimitKey, requireWithinLimitOrThrow } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5/day per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               null;
    const userAgent = request.headers.get('user-agent') || null;
    
    try {
      const dailyKey = getRateLimitKey('vision-score:daily', ip, userAgent);
      await requireWithinLimitOrThrow(dailyKey, 5, 86400); // 5/day
    } catch (rateLimitError: any) {
      if (rateLimitError.statusCode === 429) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            retryAfter: rateLimitError.retryAfter,
            message: 'You\'ve reached the daily limit for vision analysis. Please try again tomorrow.',
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fitzpatrick = formData.get('fitzpatrick') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer (no storage - process in memory)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Analyze vision
    const summary = await analyzeVision(
      buffer,
      file.type,
      fitzpatrick || undefined
    );

    return NextResponse.json({
      summary,
    });
  } catch (error: any) {
    console.error('Vision score API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze image',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

