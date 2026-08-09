import type { APIRoute } from 'astro';
import { lastNDates, redisKeyForDate } from '@/lib/date';
import { getRedis } from '@/lib/redis';
import type { DayMeta, DayResponse, LocalizedDay } from '@/lib/types';

export const prerender = false;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const META_PATHS = ['$.date', '$.generatedAt', '$.model', '$.stats'] as const;

export const GET: APIRoute = async ({ url }) => {
  const date = url.searchParams.get('date') ?? '';
  const lang = url.searchParams.get('lang') ?? 'es';

  if (lang !== 'es' && lang !== 'en') {
    return Response.json({ error: 'invalid_lang' }, { status: 400 });
  }
  // Solo formato válido Y dentro de la ventana de 7 días (evita sondear claves arbitrarias)
  if (!DATE_RE.test(date) || !lastNDates(7).includes(date)) {
    return Response.json({ error: 'invalid_date' }, { status: 400 });
  }

  try {
    // JSON.GET con paths: Redis solo envía la rama del idioma pedido, nunca el registro entero
    const raw = await getRedis().json.get<Record<string, unknown[]>>(
      redisKeyForDate(date),
      ...META_PATHS,
      `$.${lang}`,
    );

    if (!raw) {
      return Response.json(
        { error: 'not_found' },
        { status: 404, headers: { 'Cache-Control': 'public, s-maxage=60' } },
      );
    }

    const pick = (path: string) => raw[path]?.[0];
    const langData = pick(`$.${lang}`) as LocalizedDay | undefined;
    if (!langData) {
      return Response.json({ error: 'not_found' }, { status: 404 });
    }

    const body: DayResponse = {
      date: pick('$.date') as string,
      generatedAt: pick('$.generatedAt') as string,
      model: pick('$.model') as string,
      stats: pick('$.stats') as DayMeta['stats'],
      ...langData,
    };

    return Response.json(body, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
    });
  } catch (err) {
    console.error('[api/news]', err);
    return Response.json({ error: 'internal' }, { status: 500 });
  }
};
