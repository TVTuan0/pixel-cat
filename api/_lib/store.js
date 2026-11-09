// The contest database: Upstash Redis, connected through the Vercel Marketplace.
import { Redis } from '@upstash/redis';

let redis = null;

export function getStore() {
  redis ??= new Redis({
    url: process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return redis;
}
