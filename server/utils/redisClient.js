import { createClient } from 'redis';
import logger from './logger.js';

let redisClient = null;
let redisReady = false;

export async function getRedisClient() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return null;
  }

  if (redisClient && redisReady) {
    return redisClient;
  }

  if (!redisClient) {
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (err) => {
      redisReady = false;
      logger.error('Redis error:', err?.message || err);
    });
    redisClient.on('ready', () => {
      redisReady = true;
      logger.info('Redis connected');
    });
    try {
      await redisClient.connect();
    } catch (error) {
      redisReady = false;
      logger.error('Redis connection failed:', error?.message || error);
      return null;
    }
  }

  return redisClient;
}
