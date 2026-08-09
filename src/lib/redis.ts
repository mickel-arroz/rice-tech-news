import { Redis } from '@upstash/redis';

// En astro dev las credenciales llegan por import.meta.env; en Vercel por process.env
export function getRedis(): Redis {
  const url =
    import.meta.env?.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    import.meta.env?.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Faltan UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN');
  }
  return new Redis({ url, token });
}
