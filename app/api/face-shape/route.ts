import { NextRequest, NextResponse } from 'next/server';
import { analyzeFaceShape } from '@/lib/llm';
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
      const dailyKey = getRateLimitKey('face-shape:daily', ip, userAgent);
      await requireWithinLimitOrThrow(dailyKey, 5, 86400); // 5/day
    } catch (rateLimitError: any) {
      if (rateLimitError.statusCode === 429) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            retryAfter: rateLimitError.retryAfter,
            message: 'You\'ve reached the daily limit for face shape analysis. Please try again tomorrow.',
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
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Image file is too large (max 10MB).' },
        { status: 400 }
      );
    }

    // Convert file to buffer (no storage - process in memory)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Analyze face shape
    const result = await analyzeFaceShape(buffer, file.type);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Face shape API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze face shape',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

