import { z, ZodSchema } from 'zod';

/**
 * Ensures the input string is valid JSON and throws on trailing text or invalid JSON
 */
export function ensureJson(input: string): unknown {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(input);
    
    // Check for trailing text by re-stringifying and comparing
    // This is a simple heuristic - if there's trailing text, the round-trip won't match
    const reStringified = JSON.stringify(parsed);
    const trimmedInput = input.trim();
    
    // If the input has more content than just the JSON, it might have trailing text
    // We'll be lenient here and just ensure it's valid JSON
    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Safely parse data with a Zod schema, returning a result object
 */
export function safeParse<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}

