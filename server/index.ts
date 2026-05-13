/**
 * Local API server: keeps provider API keys off the client bundle.
 * Supports GROQ_API_KEY (preferred) and GEMINI_API_KEY (fallback).
 * Run: npm run dev:api  (or use npm run dev:full with Vite + this server)
 */
import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from '@google/genai';

const PORT = Number(process.env.API_PORT) || 8787;
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

  const ai = new GoogleGenAI({ apiKey: keys.geminiApiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });
  const text = response.text?.trim();
  if (!text) throw new Error('Empty model response');
  return text;
}

app.get('/api/health', (_req, res) => {
  const groq = Boolean(process.env.GROQ_API_KEY?.trim());
  const geminiRaw = process.env.GEMINI_API_KEY?.trim();
  const gemini = Boolean(geminiRaw) && !looksLikeGroqKey(geminiRaw);
  res.json({
    ok: true,
    gemini: groq || gemini,
    provider: groq ? 'groq' : gemini ? 'gemini' : null,
    warning: !groq && looksLikeGroqKey(geminiRaw) ? 'Groq-style key found in GEMINI_API_KEY; move it to GROQ_API_KEY' : null,
  });
});

app.post('/api/explain', async (req, res) => {
  const groqApiKey = process.env.GROQ_API_KEY?.trim();
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const provider = groqApiKey ? 'groq' : geminiApiKey ? 'gemini' : null;
  if (!provider) {
    res.status(503).json({ error: 'Set GROQ_API_KEY or GEMINI_API_KEY on the server' });
    return;
  }
  if (!groqApiKey && looksLikeGroqKey(geminiApiKey)) {
    res.status(400).json({
      error: 'Detected a Groq key in GEMINI_API_KEY. Put it in GROQ_API_KEY instead.',
    });
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

  const localeNames: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
  };
  const lang = localeNames[locale ?? 'en'] ?? 'English';

  const prompt =
    mode === 'detailed'
      ? `You are a Senior E-commerce CRO Analyst specializing in Shopify performance and Lucky Orange session data. You help non-technical stakeholders understand where they are losing revenue.

Write output in ${lang} using this exact structured framework:
Summary: <3-5 concise sentences explaining the primary revenue leaks and overall store health>
High-Impact Revenue Leaks:
- <leak 1 based on high traffic/high friction pages or funnel dropoffs>
- <leak 2 based on segment/category data>
- <leak 3 based on specific UX friction like Shaky Mouse or Rage Clicks>
Strategic Roadmap (Action Plan):
- [Immediate] <What to look for in Lucky Orange Heatmaps/Recordings>
- [Short-Term] <Structural or UX fix for a specific page/funnel step>
- [Ongoing] <General optimization strategy>

Rules:
- Adopt a professional, consultative tone. Focus on "conversion blockers" and "revenue".
- Do not invent numbers; only use facts from the Bullet Facts below.
- Specifically mention Shopify concepts (Products, Checkout, Collections, Cart) if they appear in the data.
- If data mentions "Shaky Mouse" or "Rage Clicks", explain why this indicates user frustration.

Automatic summary:
${summary ?? ''}

Bullet facts (Analyzed from the dashboard):
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}
`
      : `You are a Senior E-commerce CRO Analyst summarizing Shopify performance and UX friction.

Write output in ${lang} with this exact shape:
Summary: <2 short sentences identifying the biggest UX friction point or funnel dropoff>
- <Bullet 1: Top performing area or category>
- <Bullet 2: Biggest friction hotspot (e.g. Rage clicks, High bounce)>
- <Bullet 3: Next step (e.g. "Review Lucky Orange recordings for the Checkout page")>

Rules:
- Focus on actionable insights related to UX friction, funnel dropoffs, or category performance.
- Do not invent numbers; only use facts from the inputs.
- Keep it punchy and focused on revenue optimization.

Automatic summary:
${summary ?? ''}

Bullet facts (Analyzed from the dashboard):
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

app.post('/api/chat', async (req, res) => {
  const groqApiKey = process.env.GROQ_API_KEY?.trim();
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const provider = groqApiKey ? 'groq' : geminiApiKey ? 'gemini' : null;
  if (!provider) {
    res.status(503).json({ error: 'Set GROQ_API_KEY or GEMINI_API_KEY on the server' });
    return;
  }
  if (!groqApiKey && looksLikeGroqKey(geminiApiKey)) {
    res.status(400).json({ error: 'Detected a Groq key in GEMINI_API_KEY. Put it in GROQ_API_KEY instead.' });
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
  if (!Array.isArray(bullets)) {
    res.status(400).json({ error: 'Invalid payload: bullets[] required' });
    return;
  }

  const localeNames: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French' };
  const lang = localeNames[locale ?? 'en'] ?? 'English';

  const prompt = `You are a Senior E-commerce CRO Analyst answering a question about a Shopify store's performance.
Answer the user's question in ${lang} using ONLY the dashboard context below.
If context is insufficient, say so clearly and suggest what Lucky Orange recording or heatmap they should review.
Keep response concise, consultative, and practical (4-8 sentences or short bullets).

Dashboard summary:
${summary ?? ''}

Known facts (Analyzed from the dashboard):
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

app.listen(PORT, () => {
  console.log(`[api] http://localhost:${PORT}  (POST /api/explain, GET /api/health)`);
});
