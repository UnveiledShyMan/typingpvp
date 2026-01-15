import logger from './logger.js';

let redisClient = null;
let redisReady = false;
let createRedisClient = null;

async function loadRedisClientFactory() {
  if (createRedisClient) {
    return createRedisClient;
  }

  try {
    // Import dynamique pour éviter un crash au démarrage si Redis n'est pas utilisé
    // ou si le runtime Node ne supporte pas la version du package.
    const redisModule = await import('redis');
    createRedisClient = redisModule.createClient;
    return createRedisClient;
  } catch (error) {
    logger.error('Redis module load failed:', error?.message || error);
    return null;
  }
}

export async function getRedisClient() {
  const redisUrl = process.env.REDIS_URL;

  // Pas de Redis configuré -> on reste en cache mémoire.
  if (!redisUrl) {
    return null;
  }

  const factory = await loadRedisClientFactory();
  if (!factory) {
    return null;
  }

  // Si déjà connecté, on réutilise la connexion.
  if (redisClient && redisReady) {
    return redisClient;
  }

  if (!redisClient) {
    redisClient = factory({ url: redisUrl });
    redisClient.on('error', (err) => {
      redisReady = false;
      logger.error('Redis error:', err?.message || err);
    });
    redisClient.on('ready', () => {
      redisReady = true;
      logger.info('Redis connected');
    });
  }

  // Si la connexion n'est pas prête, on tente une reconnexion.
  if (!redisReady) {
    try {
      await redisClient.connect();
    } catch (error) {
      redisReady = false;
      logger.error('Redis connection failed:', error?.message || error);
      return null;
    }
  }

  return redisReady ? redisClient : null;
}
