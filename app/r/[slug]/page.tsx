import { notFound } from 'next/navigation';
import { kvGet } from '@/lib/kv';
import { RoutineSchema, Routine } from '@/lib/schema';
import RoutineScreen from '@/components/RoutineScreen';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getRoutine(slug: string): Promise<Routine | null> {
  try {
    const routine = await kvGet<Routine>(`routine:${slug}`);
    if (!routine) {
      return null;
    }
    
    // Validate the routine matches schema
    const parseResult = RoutineSchema.safeParse(routine);
    if (!parseResult.success) {
      console.error('Invalid routine schema:', parseResult.error);
      return null;
    }
    
    return parseResult.data;
  } catch (error) {
    console.error('Error fetching routine:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const routine = await getRoutine(slug);
  
  if (!routine) {
    return {
      title: 'Routine Not Found',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const ogImageUrl = `${siteUrl}/api/og/routine?slug=${slug}`;

  return {
    title: `Skincare Routine - ${routine.profile.goal}`,
    description: `Personalized ${routine.profile.skin_type} skin routine for ${routine.profile.goal}`,
    openGraph: {
      title: `Skincare Routine - ${routine.profile.goal}`,
      description: `${routine.profile.skin_type} skin • ${routine.morning.length} AM steps • ${routine.evening.length} PM steps`,
      images: [ogImageUrl],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Skincare Routine - ${routine.profile.goal}`,
      description: `${routine.profile.skin_type} skin routine`,
      images: [ogImageUrl],
    },
  };
}

export default async function RoutinePage({ params }: PageProps) {
  const { slug } = await params;
  const routine = await getRoutine(slug);

  if (!routine) {
    notFound();
  }

  return <RoutineScreen routine={routine} slug={slug} />;
}

