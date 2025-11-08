import { ImageResponse } from 'next/og';
import { kvGet } from '@/lib/kv';
import { RoutineSchema } from '@/lib/schema';

export const runtime = 'nodejs'; // Need Node.js for Redis connection
export const alt = 'Skincare Routine';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return new Response('Missing slug parameter', { status: 400 });
    }

    const routine = await kvGet(`routine:${slug}`);
    if (!routine) {
      return new Response('Routine not found', { status: 404 });
    }

    const parseResult = RoutineSchema.safeParse(routine);
    if (!parseResult.success) {
      return new Response('Invalid routine', { status: 400 });
    }

    const data = parseResult.data;
    const goal = data.profile.goal;
    const skinType = data.profile.skin_type;
    const amSteps = data.morning.length;
    const pmSteps = data.evening.length;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fafafa',
            backgroundImage: 'linear-gradient(to bottom, #fafafa, #ffffff)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px',
              width: '100%',
            }}
          >
            <h1
              style={{
                fontSize: 64,
                fontWeight: 'bold',
                color: '#18181b',
                marginBottom: 20,
                textAlign: 'center',
              }}
            >
              Skincare Routine
            </h1>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 40,
                marginTop: 40,
                fontSize: 32,
                color: '#52525b',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 48, fontWeight: 'bold', color: '#18181b' }}>
                  {amSteps}
                </div>
                <div>AM Steps</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 48, fontWeight: 'bold', color: '#18181b' }}>
                  {pmSteps}
                </div>
                <div>PM Steps</div>
              </div>
            </div>
            <div
              style={{
                marginTop: 40,
                fontSize: 28,
                color: '#71717a',
                textTransform: 'capitalize',
              }}
            >
              {skinType} skin • {goal}
            </div>
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (e: any) {
    console.error('OG image generation error:', e);
    return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
  }
}

