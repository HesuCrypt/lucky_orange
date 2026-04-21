import type { DashboardData } from '../types';
import { buildPlainInsights } from './plainInsights';
import type { Locale } from './i18n';

/** True when the local API reports Gemini is configured (server-only key). */
export async function checkExplainApi(): Promise<boolean> {
  try {
    const r = await fetch('/api/health');
    if (!r.ok) return false;
    const j = (await r.json()) as { gemini?: boolean };
    return Boolean(j.gemini);
  } catch {
    return false;
  }
}

/** Calls POST /api/explain — key stays on the server. */
export async function explainDashboardWithGemini(data: DashboardData, locale: Locale): Promise<string> {
  return explainDashboardWithMode(data, locale, 'quick');
}

export async function explainDashboardWithMode(
  data: DashboardData,
  locale: Locale,
  mode: 'quick' | 'detailed',
): Promise<string> {
  const bullets = buildPlainInsights(data);
  const summary = data.dataSource?.summary ?? '';

  const r = await fetch('/api/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locale, summary, bullets, mode }),
  });

  const j = (await r.json()) as { text?: string; error?: string };
  if (!r.ok) {
    throw new Error(j.error || `Request failed (${r.status})`);
  }
  if (!j.text?.trim()) {
    throw new Error('Empty response from explain API');
  }
  return j.text.trim();
}

export async function askDashboardQuestion(
  data: DashboardData,
  locale: Locale,
  question: string,
): Promise<string> {
  const bullets = buildPlainInsights(data);
  const summary = data.dataSource?.summary ?? '';

  const r = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locale, summary, bullets, question }),
  });
  const j = (await r.json()) as { text?: string; error?: string };
  if (!r.ok) {
    throw new Error(j.error || `Request failed (${r.status})`);
  }
  if (!j.text?.trim()) {
    throw new Error('Empty response from chat API');
  }
  return j.text.trim();
}
