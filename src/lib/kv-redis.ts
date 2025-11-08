import Redis from 'ioredis';

// Create Redis client from URL
let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
  }
  return redis;
}

/**
 * Get a value from Redis
 */
export async function kvGet<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    if (value === null) {
      return null;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`KV get error for key ${key}:`, error);
    throw error;
  }
}

/**
 * Set a value in Redis with optional TTL (time to live in seconds)
 */
export async function kvSet<T>(
  key: string,
  value: T,
  ttl?: number
): Promise<void> {
  try {
    const client = getRedisClient();
    const serialized = JSON.stringify(value);
    if (ttl) {
      await client.setex(key, ttl, serialized);
    } else {
      await client.set(key, serialized);
    }
  } catch (error) {
    console.error(`KV set error for key ${key}:`, error);
    throw error;
  }
}

/**
 * Increment a counter in Redis
 * Returns the new value after increment
 */
export async function kvIncr(key: string): Promise<number> {
  try {
    const client = getRedisClient();
    const newValue = await client.incr(key);
    return newValue;
  } catch (error) {
    console.error(`KV incr error for key ${key}:`, error);
    throw error;
  }
}

/**
 * Delete a key from Redis
 */
export async function kvDel(key: string): Promise<void> {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    console.error(`KV del error for key ${key}:`, error);
    throw error;
  }
}

/**
 * Check if a key exists in Redis
 */
export async function kvExists(key: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    console.error(`KV exists error for key ${key}:`, error);
    throw error;
  }
}

