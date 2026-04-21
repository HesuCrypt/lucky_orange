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
      ? `You help non-technical stakeholders read a web analytics dashboard (Lucky Orange style).

Write output in ${lang} with this exact shape:
Summary: <3-5 concise sentences>
Findings:
- <finding 1 with metric>
- <finding 2 with metric>
- <finding 3 with metric>
Risks:
- <risk 1>
- <risk 2 optional>
Recommended Actions:
- <action 1>
- <action 2>
- <action 3 optional>

Rules:
- Use plain language first, then specifics.
- Do not invent numbers; only use facts from the inputs.
- If the data is "limited" (no health scores), explain limitations explicitly.

Automatic summary (may be English):
${summary ?? ''}

Bullet facts (English, from the app):
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}
`
      : `You help non-technical stakeholders read a web analytics dashboard (Lucky Orange style).

Write output in ${lang} with this exact shape:
Summary: <2 short sentences>
- <bullet 1>
- <bullet 2>
- <bullet 3>
- <bullet 4 optional>
- <bullet 5 optional>

Rules:
- Use plain language; avoid jargon unless you explain it in one short clause.
- Do not invent numbers; only use facts from the inputs.
- If the data is "limited" (no health scores), say what is missing and what they can still learn.

Automatic summary (may be English):
${summary ?? ''}

Bullet facts (English, from the app):
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

  const prompt = `Answer the user's question in ${lang} using ONLY the dashboard context below.
If context is insufficient, say so clearly and suggest what data is needed.
Keep response concise and practical (4-8 sentences or short bullets).

Dashboard summary:
${summary ?? ''}

Known facts:
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
