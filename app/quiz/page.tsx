'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuizInputSchema, type QuizInput } from '@/lib/inputSchema';
import Link from 'next/link';

export default function QuizPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<QuizInput>({
    resolver: zodResolver(QuizInputSchema),
    defaultValues: {
      max_steps_am: undefined,
      max_steps_pm: undefined,
      fragrance_ok: false,
      actives_in_use: [],
    },
  });

  // Load from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('skinmax_quiz_inputs');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Note: react-hook-form's reset would be used here, but we'll handle it in the form
        } catch (e) {
          // Ignore invalid saved data
        }
      }
    }
  }, []);

  // Calculate progress based on filled fields
  const watchedFields = watch();
  useEffect(() => {
    const requiredFields: Array<{ key: keyof QuizInput; validator: (val: any) => boolean }> = [
      { key: 'age_range', validator: (v) => typeof v === 'string' && v.length > 0 },
      { key: 'skin_type', validator: (v) => typeof v === 'string' && v.length > 0 },
      { key: 'goal', validator: (v) => typeof v === 'string' && v.length > 0 },
      { key: 'budget_per_month_cents', validator: (v) => typeof v === 'number' && v > 0 },
      { key: 'max_steps_am', validator: (v) => typeof v === 'number' && v >= 2 && v <= 6 },
      { key: 'max_steps_pm', validator: (v) => typeof v === 'number' && v >= 2 && v <= 6 },
    ];
    
    const filled = requiredFields.filter(({ key, validator }) => {
      const value = watchedFields[key];
      return validator(value);
    }).length;
    
    setProgress(Math.round((filled / requiredFields.length) * 100));
  }, [watchedFields]);

  // Save to sessionStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const subscription = watch((value) => {
        sessionStorage.setItem('skinmax_quiz_inputs', JSON.stringify(value));
      });
      return () => subscription.unsubscribe();
    }
  }, [watch]);

  const onSubmit = async (data: QuizInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Convert budget from dollars to cents if needed
      const payload = {
        ...data,
        budget_per_month_cents: typeof data.budget_per_month_cents === 'number' 
          ? Math.round(data.budget_per_month_cents * 100)
          : data.budget_per_month_cents,
      };

      const response = await fetch('/api/generate-routine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: payload }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        setError(`Server error: Received ${response.status} ${response.statusText}. Please check the console for details.`);
        setIsSubmitting(false);
        return;
      }

      if (!response.ok) {
        try {
          const errorData = await response.json();
          if (response.status === 429) {
            setError(`Rate limit exceeded. Please try again in ${errorData.retryAfter || 24} hours.`);
          } else if (response.status === 400) {
            setError('Invalid input. Please check your answers.');
          } else {
            setError(errorData.error || 'Failed to generate routine. Please try again.');
          }
        } catch (parseError) {
          setError(`Server error: ${response.status} ${response.statusText}`);
        }
        setIsSubmitting(false);
        return;
      }

      const result = await response.json();
      
      // Clear sessionStorage on success
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('skinmax_quiz_inputs');
      }

      // Navigate to routine page
      router.push(`/r/${result.slug}`);
    } catch (err) {
      console.error('Quiz submission error:', err);
      setError('Network error. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            ← Back to home
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-zinc-900">
            Create Your Routine
          </h1>
          <p className="mt-2 text-zinc-600">
            Answer a few questions to get your personalized skincare routine
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-700">Progress</span>
            <span className="text-sm text-zinc-600">{progress}%</span>
          </div>
          <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Age Range */}
          <div>
            <label htmlFor="age_range" className="block text-sm font-medium text-zinc-900 mb-2">
              Age Range *
            </label>
            <select
              id="age_range"
              {...register('age_range')}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-black focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="">Select age range</option>
              <option value="14-18">14-18</option>
              <option value="19-24">19-24</option>
              <option value="25-35">25-35</option>
              <option value="36-45">36-45</option>
              <option value="46+">46+</option>
            </select>
            {errors.age_range && (
              <p className="mt-1 text-sm text-red-600">{errors.age_range.message}</p>
            )}
          </div>

          {/* Skin Type */}
          <div>
            <label htmlFor="skin_type" className="block text-sm font-medium text-zinc-900 mb-2">
              Skin Type *
            </label>
            <select
              id="skin_type"
              {...register('skin_type')}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-black focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="">Select skin type</option>
              <option value="oily">Oily</option>
              <option value="combination">Combination</option>
              <option value="dry">Dry</option>
              <option value="sensitive">Sensitive</option>
            </select>
            {errors.skin_type && (
              <p className="mt-1 text-sm text-red-600">{errors.skin_type.message}</p>
            )}
          </div>

          {/* Fitzpatrick Scale (Optional) */}
          <div>
            <label htmlFor="fitzpatrick" className="block text-sm font-medium text-zinc-900 mb-2">
              Fitzpatrick Scale (Optional)
            </label>
            <select
              id="fitzpatrick"
              {...register('fitzpatrick')}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-black focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="">Select if known</option>
              <option value="I">I - Always burns, never tans</option>
              <option value="II">II - Burns easily, tans minimally</option>
              <option value="III">III - Burns moderately, tans gradually</option>
              <option value="IV">IV - Burns minimally, tans well</option>
              <option value="V">V - Rarely burns, tans very well</option>
              <option value="VI">VI - Never burns, deeply pigmented</option>
            </select>
          </div>

          {/* Primary Goal */}
          <div>
            <label htmlFor="goal" className="block text-sm font-medium text-zinc-900 mb-2">
              Primary Goal *
            </label>
            <select
              id="goal"
              {...register('goal')}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-black focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="">Select primary goal</option>
              <option value="acne">Acne</option>
              <option value="hyperpigmentation">Hyperpigmentation</option>
              <option value="anti-aging">Anti-aging</option>
              <option value="barrier">Barrier repair</option>
              <option value="hydration">Hydration</option>
              <option value="general">General maintenance</option>
            </select>
            {errors.goal && (
              <p className="mt-1 text-sm text-red-600">{errors.goal.message}</p>
            )}
          </div>

          {/* Budget */}
          <div>
            <label htmlFor="budget_per_month_cents" className="block text-sm font-medium text-zinc-900 mb-2">
              Monthly Budget ($) *
            </label>
            <input
              type="number"
              id="budget_per_month_cents"
              {...register('budget_per_month_cents', { valueAsNumber: true })}
              min="0"
              step="5"
              placeholder="50"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-black focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            <p className="mt-1 text-sm text-zinc-500">
              Enter your monthly budget in dollars
            </p>
            {errors.budget_per_month_cents && (
              <p className="mt-1 text-sm text-red-600">{errors.budget_per_month_cents.message}</p>
            )}
          </div>

          {/* Max Steps AM */}
          <div>
            <label htmlFor="max_steps_am" className="block text-sm font-medium text-zinc-900 mb-2">
              Max Steps (Morning) *
            </label>
            <input
              type="number"
              id="max_steps_am"
              {...register('max_steps_am', { valueAsNumber: true })}
              min="2"
              max="6"
              placeholder="4"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-black focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            <p className="mt-1 text-sm text-zinc-500">Between 2 and 6 steps</p>
            {errors.max_steps_am && (
              <p className="mt-1 text-sm text-red-600">{errors.max_steps_am.message}</p>
            )}
          </div>

          {/* Max Steps PM */}
          <div>
            <label htmlFor="max_steps_pm" className="block text-sm font-medium text-zinc-900 mb-2">
              Max Steps (Evening) *
            </label>
            <input
              type="number"
              id="max_steps_pm"
              {...register('max_steps_pm', { valueAsNumber: true })}
              min="2"
              max="6"
              placeholder="4"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-black focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            <p className="mt-1 text-sm text-zinc-500">Between 2 and 6 steps</p>
            {errors.max_steps_pm && (
              <p className="mt-1 text-sm text-red-600">{errors.max_steps_pm.message}</p>
            )}
          </div>

          {/* Fragrance Tolerance */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="fragrance_ok"
              {...register('fragrance_ok')}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
            />
            <label htmlFor="fragrance_ok" className="ml-2 text-sm text-zinc-700">
              I'm okay with fragranced products
            </label>
          </div>

          {/* Prescription Use (Optional) */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="prescription_use"
              {...register('prescription_use')}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
            />
            <label htmlFor="prescription_use" className="ml-2 text-sm text-zinc-700">
              I currently use prescription skincare (e.g., tretinoin)
            </label>
          </div>

          {/* Actives in Use (Optional) */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Current Actives (Optional)
            </label>
            <div className="space-y-2">
              {['tretinoin', 'AHA/BHA', 'vitamin C', 'niacinamide', 'BPO', 'azelaic acid'].map((active) => (
                <label key={active} className="flex items-center">
                  <input
                    type="checkbox"
                    value={active}
                    {...register('actives_in_use')}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                  />
                  <span className="ml-2 text-sm text-zinc-700 capitalize">{active}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-zinc-900 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Generating your routine...' : 'Generate My Routine'}
            </button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-zinc-500 text-center mt-6">
            Educational only, not medical advice. For persistent or severe issues, see a board-certified dermatologist.
          </p>
        </form>
      </div>
    </div>
  );
}

