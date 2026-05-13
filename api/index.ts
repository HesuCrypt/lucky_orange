/**
 * Vercel Serverless Entry Point
 * Combined logic to ensure no external module resolution issues in production.
 */
import express from 'express';
import { GoogleGenAI } from '@google/genai';

const looksLikeGroqKey = (key: string | undefined) => Boolean(key && key.startsWith('gsk_'));

const app = express();
app.use(express.json({ limit: '2mb' }));

async function generateWithProvider(
  provider: 'groq' | 'gemini',
  prompt: string,
  keys: { groqApiKey?: string; geminiApiKey?: string },
): Promise<string> {
  if (provider === 'groq') {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${keys.groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const body = (await response.json()) as {
      error?: { message?: string };
      choices?: { message?: { content?: string } }[];
    };
    if (!response.ok) {
      throw new Error(body.error?.message || `Groq request failed (${response.status})`);
    }
    const text = body.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty model response');
    return text;
  }

  const ai = new GoogleGenAI({ apiKey: keys.geminiApiKey! });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });
  const text = response.text?.trim();
  if (!text) throw new Error('Empty model response');
  return text;
}

app.get(['/api/health', '/health'], (_req, res) => {
  const groq = Boolean(process.env.GROQ_API_KEY?.trim());
  const geminiRaw = process.env.GEMINI_API_KEY?.trim();
  const gemini = Boolean(geminiRaw) && !looksLikeGroqKey(geminiRaw);
  res.json({
    ok: true,
    gemini: groq || gemini,
    provider: groq ? 'groq' : gemini ? 'gemini' : null,
  });
});

app.post(['/api/explain', '/explain'], async (req, res) => {
  const groqApiKey = process.env.GROQ_API_KEY?.trim();
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const provider = groqApiKey ? 'groq' : geminiApiKey ? 'gemini' : null;
  if (!provider) {
    res.status(503).json({ error: 'Set GROQ_API_KEY or GEMINI_API_KEY on the server' });
    return;
  }

  const { locale, summary, bullets, mode } = req.body as {
    locale?: string;
    summary?: string;
    bullets?: string[];
    mode?: 'quick' | 'detailed';
  };

  if (!Array.isArray(bullets)) {
    res.status(400).json({ error: 'Invalid payload: bullets[] required' });
    return;
  }

  const localeNames: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French' };
  const lang = localeNames[locale ?? 'en'] ?? 'English';

  const prompt =
    mode === 'detailed'
      ? `You are a Senior E-commerce CRO Analyst specializing in Shopify performance and Lucky Orange session data.
Summary: <3-5 concise sentences explaining the primary revenue leaks and overall store health>
High-Impact Revenue Leaks:
- <leak 1 based on high traffic/high friction pages or funnel dropoffs>
- <leak 2 based on segment/category data>
Strategic Roadmap (Action Plan):
- [Immediate] <What to look for in Lucky Orange Heatmaps/Recordings>
- [Short-Term] <Structural or UX fix for a specific page/funnel step>

Automatic summary:
${summary ?? ''}
Bullet facts:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}
`
      : `You are a Senior E-commerce CRO Analyst summarizing Shopify performance.
Summary: <2 short sentences identifying the biggest UX friction point>
- <Bullet 1: Top performing area>
- <Bullet 2: Biggest friction hotspot>

Automatic summary:
${summary ?? ''}
Bullet facts:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}
`;

  try {
    const text = await generateWithProvider(provider, prompt, { groqApiKey, geminiApiKey });
    res.json({ text, provider });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'AI request failed';
    res.status(502).json({ error: msg });
  }
});

app.post(['/api/chat', '/chat'], async (req, res) => {
  const groqApiKey = process.env.GROQ_API_KEY?.trim();
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const provider = groqApiKey ? 'groq' : geminiApiKey ? 'gemini' : null;
  if (!provider) {
    res.status(503).json({ error: 'Set GROQ_API_KEY or GEMINI_API_KEY on the server' });
    return;
  }

  const { locale, summary, bullets, question } = req.body as {
    locale?: string;
    summary?: string;
    bullets?: string[];
    question?: string;
  };
  if (!question?.trim()) {
    res.status(400).json({ error: 'Question is required' });
    return;
  }

  const localeNames: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French' };
  const lang = localeNames[locale ?? 'en'] ?? 'English';

  const prompt = `Answer the user's question in ${lang} about a Shopify store.
Dashboard summary:
${summary ?? ''}
Bullet facts:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}
User question:
${question}
`;

  try {
    const text = await generateWithProvider(provider, prompt, { groqApiKey, geminiApiKey });
    res.json({ text, provider });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'AI request failed';
    res.status(502).json({ error: msg });
  }
});

export default app;
