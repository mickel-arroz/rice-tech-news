import type { APIRoute } from 'astro';
import { DISPLAY_DAYS, LOOKBACK_DAYS, lastNDates, redisKeyForDate } from '@/lib/date';
import { getRedis } from '@/lib/redis';
import type { DateAvailability } from '@/lib/types';

export const prerender = false;

export const GET: APIRoute = async () => {
  const window = lastNDates(LOOKBACK_DAYS);

  try {
    // JSON.MGET de un solo campo: verifica existencia sin traer los documentos
    const values = await getRedis().json.mget<unknown[]>(
      window.map(redisKeyForDate),
      '$.date',
    );
    const result: DateAvailability[] = window
      .filter((_, i) => Array.isArray(values[i]) && (values[i] as unknown[]).length > 0)
      .slice(0, DISPLAY_DAYS)
      .map((date) => ({ date, available: true }));
    return Response.json(
      { dates: result },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
    );
  } catch (err) {
    console.error('[api/dates]', err);
    return Response.json({ error: 'internal' }, { status: 500 });
  }
};
