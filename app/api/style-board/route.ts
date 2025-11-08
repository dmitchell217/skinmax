import { NextRequest, NextResponse } from 'next/server';
import { getStyleBoard, getMergedStyleBoard } from '@/lib/styleBoards';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shape = searchParams.get('shape') as 'oval' | 'round' | 'heart' | 'square' | null;
    const confidence = parseFloat(searchParams.get('confidence') || '1');

    if (!shape) {
      return NextResponse.json(
        { error: 'Shape parameter is required' },
        { status: 400 }
      );
    }

    // If confidence is low, merge with a similar shape
    if (confidence < 0.5) {
      // Map each shape to a similar alternative
      const alternatives: Record<string, 'oval' | 'round' | 'heart' | 'square'> = {
        oval: 'round',
        round: 'oval',
        heart: 'square',
        square: 'heart',
      };

      const altShape = alternatives[shape] || 'oval';
      const merged = await getMergedStyleBoard(shape, altShape);
      return NextResponse.json(merged.board);
    }

    const board = await getStyleBoard(shape);
    return NextResponse.json(board);
  } catch (error: any) {
    console.error('Style board API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to load style board',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

