import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Initialize the Redis client
export const redis = new Redis(redisUrl, {
  enableOfflineQueue: false, // Fail fast if Redis is down
  // Retry strategy just in case Redis is temporarily down
  retryStrategy: (times) => {
    if (times > 3) return null; // Stop retrying and emit error
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('Successfully connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});
