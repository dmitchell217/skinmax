/**
 * Generate a random slug in the format: adjective-noun-number
 * Example: calm-sun-otter, bright-moon-42
 */
export function randomSlug(): string {
  const adjectives = [
    'calm', 'bright', 'gentle', 'smooth', 'radiant', 'clear', 'fresh',
    'pure', 'soft', 'glowing', 'vital', 'serene', 'luminous', 'silky',
    'balanced', 'harmonious', 'nourished', 'renewed', 'refined', 'elegant'
  ];
  
  const nouns = [
    'sun', 'moon', 'star', 'wave', 'breeze', 'dew', 'mist', 'dawn',
    'dusk', 'glow', 'beam', 'ray', 'spark', 'gleam', 'shine', 'glint',
    'pearl', 'crystal', 'opal', 'jade', 'silk', 'velvet', 'cloud', 'sky'
  ];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);
  
  return `${adjective}-${noun}-${number}`;
}

/**
 * Generate a UUID v4
 */
export function uuid(): string {
  // Use crypto.randomUUID if available (Node.js 19.6+, browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Check if a slug already exists in KV (for collision checking)
 */
export async function slugExists(slug: string): Promise<boolean> {
  const { kvExists } = await import('./kv');
  return kvExists(`routine:${slug}`);
}

/**
 * Generate a unique slug by checking for collisions
 */
export async function generateUniqueSlug(maxAttempts = 10): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const slug = randomSlug();
    const exists = await slugExists(slug);
    if (!exists) {
      return slug;
    }
  }
  
  // If all attempts failed, append timestamp to ensure uniqueness
  const baseSlug = randomSlug();
  return `${baseSlug}-${Date.now()}`;
}

