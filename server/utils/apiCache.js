/**
 * Cache JSON léger avec Redis (si configuré) + fallback mémoire.
 * Objectif: améliorer la perf perçue sans complexité.
 */

import { getRedisClient } from './redisClient.js';

const cacheStore = new Map();

async function getMemoryCache(key) {
  const cached = cacheStore.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return cached.data;
}

async function setMemoryCache(key, data, ttlMs) {
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttlMs
  });
}

export async function getCache(key) {
  const redis = await getRedisClient();
  if (redis) {
    try {
      const raw = await redis.get(key);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (error) {
      // Fallback mémoire si Redis échoue
    }
  }
  return getMemoryCache(key);
}

export async function setCache(key, data, ttlMs) {
  const redis = await getRedisClient();
  if (redis) {
    try {
      const ttlSeconds = Math.max(1, Math.floor(ttlMs / 1000));
      await redis.set(key, JSON.stringify(data), { EX: ttlSeconds });
      return;
    } catch (error) {
      // Fallback mémoire si Redis échoue
    }
  }
  await setMemoryCache(key, data, ttlMs);
}

export async function invalidateCacheByPrefix(prefix) {
  const redis = await getRedisClient();
  if (redis) {
    try {
      let cursor = 0;
      do {
        const result = await redis.scan(cursor, { MATCH: `${prefix}*`, COUNT: 100 });
        cursor = Number(result.cursor);
        const keys = result.keys || [];
        if (keys.length > 0) {
          await redis.del(keys);
        }
      } while (cursor !== 0);
    } catch (error) {
      // Fallback mémoire si Redis échoue
    }
  }

  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
}

export function cacheMiddleware({ keyPrefix, ttlMs = 60 * 1000, cacheControl = 'public, max-age=60' }) {
  return async (req, res, next) => {
    const key = `${keyPrefix}:${req.originalUrl}`;
    const cached = await getCache(key);
    if (cached) {
      res.set('Cache-Control', cacheControl);
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      setCache(key, body, ttlMs);
      res.set('Cache-Control', cacheControl);
      return originalJson(body);
    };

    next();
  };
}
