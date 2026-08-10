import { GoogleGenAI, Type } from '@google/genai';
import type { RawItem } from './types';

export interface GeminiStory {
  title: { es: string; en: string };
  shortSummary: { es: string; en: string };
  longSummary: { es: string[]; en: string[] };
  tags: { es: string[]; en: string[] };
  sourceIndexes: number[];
}

export interface GeminiResult {
  model: string;
  summary: { es: string; en: string };
  stories: GeminiStory[];
}

const DEFAULT_MODELS = ['gemini-2.5-pro', 'gemini-3.5-flash', 'gemini-2.5-flash'];

const bilingualString = {
  type: Type.OBJECT,
  properties: { es: { type: Type.STRING }, en: { type: Type.STRING } },
  required: ['es', 'en'],
};

const bilingualStringArray = {
  type: Type.OBJECT,
  properties: {
    es: { type: Type.ARRAY, items: { type: Type.STRING } },
    en: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['es', 'en'],
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: bilingualString,
    stories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: bilingualString,
          shortSummary: bilingualString,
          longSummary: bilingualStringArray,
          tags: bilingualStringArray,
          sourceIndexes: { type: Type.ARRAY, items: { type: Type.INTEGER } },
        },
        required: ['title', 'shortSummary', 'longSummary', 'tags', 'sourceIndexes'],
      },
    },
  },
  required: ['summary', 'stories'],
};

function buildPrompt(items: RawItem[]): string {
  const list = items
    .map((i) =>
      JSON.stringify({
        index: i.index,
        source: i.source,
        title: i.title,
        publishedAt: i.publishedAt,
        excerpt: i.excerpt,
      }),
    )
    .join('\n');

  return `You are the editor-in-chief of "Rice Tech News", a daily tech & programming news digest.

Below is today's list of news items collected from Hacker News, TechCrunch, The Verge and Ars Technica. Each line is a JSON object with a unique "index".

YOUR TASK — return a single JSON object following the response schema exactly:

1. FILTER by relevance: your audience is professional software developers. ONLY include stories useful to someone who programs for a living: programming languages, frameworks, libraries, developer tools, AI/ML models and tooling, open source projects, APIs and platforms, software engineering practices, security vulnerabilities and technical incidents, operating systems, databases, infrastructure/cloud. DISCARD stories about: business deals, acquisitions, mergers, funding rounds, monetization or creator-reward programs, lawsuits and legal disputes, stock/market news, consumer gadget reviews, company politics or executive changes — unless the story has a direct, concrete technical impact on developers.
2. MERGE duplicates: if two or more relevant items report the same story or something very similar, output ONE story whose "sourceIndexes" contains the indexes of ALL matching items. Items about distinct topics must never be merged.
3. INCLUDE every RELEVANT story: each relevant input item must end up in exactly one output story (merged or alone). Among relevant stories do not rank-and-cut; only the off-topic ones from rule 1 are discarded.
4. ORDER by importance: sort the "stories" array from most to least important/impactful for professional software developers. The FIRST element must be the single most relevant, newsworthy or high-impact story of the day; the LAST, the least. Judge importance by technical significance, breadth of impact on developers, novelty and urgency — NOT by recency or by the number of sources. Output the array already in that order.
5. "summary": a substantial single-paragraph digest of the day per language, roughly 500 to 900 characters: state the day's most important developments and WHAT HAPPENED in each, so the reader learns the essentials of the whole day from this paragraph alone.
6. Per story:
   - "title": a clear, concise headline.
   - "shortSummary": ONE paragraph (3-5 sentences) stating the concrete facts and takeaways of the story.
   - "longSummary": 4 paragraphs (each 3-5 sentences) with the full substance: what happened, key technical details, numbers, causes, and the conclusions of the original piece. Return each paragraph as a separate array element.
   - "tags": 1 to 4 short topic tags suitable for UI badges (e.g. "AI", "Open Source", "Security", "DevTools").
   - "sourceIndexes": the input indexes this story is based on. NEVER invent indexes; only use indexes that exist in the input.
7. INFORMATIVE STYLE — deliver the content, never an introduction to it. Every summary (global, short and long) must directly answer "what does this news say?" and "what does it conclude?": facts, decisions, numbers, causes, outcomes. The reader must understand the substance without opening the original article. FORBIDDEN: meta-phrases like "this article talks about", "the story presents", "the author explains", "se habla de", "la noticia trata sobre" — go straight to the information itself.
8. BILINGUAL: every text field must be written in BOTH Spanish ("es") and English ("en"). Write natural, journalistic prose in each language — not literal word-by-word translations. Tags must also be translated.
9. PLAIN TEXT ONLY: no markdown, no asterisks, no bullet characters, no links, no HTML, no emoji in any text field.
10. Base every statement ONLY on the provided titles and excerpts. Do not invent facts, numbers or names that are not present.

INPUT ITEMS (${items.length} total):
${list}`;
}

function isModelUnavailable(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? err);
  return /\b404\b|NOT_FOUND|not found|PERMISSION_DENIED|\b403\b/i.test(msg);
}

function isQuotaError(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? err);
  return /\b429\b|RESOURCE_EXHAUSTED|quota/i.test(msg);
}

function validate(result: unknown, itemCount: number): asserts result is Omit<GeminiResult, 'model'> {
  const r = result as Omit<GeminiResult, 'model'>;
  if (!r || typeof r !== 'object') throw new Error('Respuesta no es un objeto');
  if (!r.summary?.es || !r.summary?.en) throw new Error('summary incompleto');
  if (!Array.isArray(r.stories) || r.stories.length === 0) throw new Error('stories vacío');
  for (const s of r.stories) {
    if (!s.title?.es || !s.title?.en) throw new Error('title incompleto en una historia');
    if (!s.shortSummary?.es || !s.shortSummary?.en) throw new Error('shortSummary incompleto');
    if (!s.longSummary?.es?.length || !s.longSummary?.en?.length)
      throw new Error('longSummary vacío');
    if (!Array.isArray(s.sourceIndexes)) throw new Error('sourceIndexes ausente');
    s.sourceIndexes = s.sourceIndexes.filter(
      (i) => Number.isInteger(i) && i >= 0 && i < itemCount,
    );
  }
  const withSources = r.stories.filter((s) => s.sourceIndexes.length > 0);
  if (withSources.length === 0) throw new Error('ninguna historia con sourceIndexes válidos');
  r.stories = withSources;
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function summarizeWithGemini(items: RawItem[]): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Falta GEMINI_API_KEY');

  // GEMINI_MODELS vacío (p.ej. una Variable de repo sin definir llega como "") cae a DEFAULT_MODELS.
  const configured = (process.env.GEMINI_MODELS ?? '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  const models = configured.length > 0 ? configured : DEFAULT_MODELS;

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(items);
  const errors: string[] = [];

  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[gemini] modelo=${model} intento=${attempt}`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema,
            temperature: 0.3,
            maxOutputTokens: 65536,
          },
        });
        const text = response.text;
        if (!text) throw new Error('respuesta vacía');
        const parsed = JSON.parse(text);
        validate(parsed, items.length);
        return { model, ...parsed };
      } catch (err) {
        const msg = String((err as Error)?.message ?? err);
        errors.push(`${model}#${attempt}: ${msg.slice(0, 200)}`);
        console.warn(`[gemini] fallo ${model} intento ${attempt}: ${msg.slice(0, 300)}`);
        if (isModelUnavailable(err)) break; // modelo no existe → siguiente
        if (isQuotaError(err) && attempt >= 2) break; // cuota agotada → siguiente
        if (attempt < 3) await sleep(attempt === 1 ? 15_000 : 45_000);
      }
    }
  }

  throw new Error(`Todos los modelos fallaron:\n${errors.join('\n')}`);
}
