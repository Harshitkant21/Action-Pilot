import Redis from 'ioredis';
import { appConfig } from './appConfig';

const redisUrl = appConfig.redisUrl;

export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

redisConnection.on('connect', () => {
  console.log('[Redis] Shared connection established successfully.');
});

redisConnection.on('error', (err) => {
  console.error('[Redis] Shared connection error:', err);
});
