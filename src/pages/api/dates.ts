import type { APIRoute } from 'astro';
import { lastNDates, redisKeyForDate } from '@/lib/date';
import { getRedis } from '@/lib/redis';
import type { DateAvailability } from '@/lib/types';

export const prerender = false;

export const GET: APIRoute = async () => {
  const dates = lastNDates(7);

  try {
    // JSON.MGET de un solo campo: verifica existencia sin traer los documentos
    const values = await getRedis().json.mget<unknown[]>(
      dates.map(redisKeyForDate),
      '$.date',
    );
    const result: DateAvailability[] = dates.map((date, i) => ({
      date,
      available: Array.isArray(values[i]) && (values[i] as unknown[]).length > 0,
    }));
    return Response.json(
      { dates: result },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    );
  } catch (err) {
    console.error('[api/dates]', err);
    return Response.json({ error: 'internal' }, { status: 500 });
  }
};
