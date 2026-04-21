/**
 * Lucky Orange API integration scaffolding.
 *
 * This is intentionally conservative because the team does not yet have paid API access.
 * Once API access is available, confirm endpoint paths/field names and adjust mapping.
 */

import { RawPageData } from '../types';

export interface LuckyOrangeConfig {
  /** e.g. https://api.luckyorange.com (placeholder until official docs are available). */
  baseUrl?: string;
  apiKey?: string;
  endpointPath?: string;
}

export type LuckyOrangeConnectionStatus = 'unconfigured' | 'ready';

export function getLuckyOrangeStatus(config: LuckyOrangeConfig = {}): LuckyOrangeConnectionStatus {
  if (config.baseUrl?.trim() && config.apiKey?.trim()) return 'ready';
  return 'unconfigured';
}

export interface LuckyOrangeSyncResult {
  rows: RawPageData[];
  fetchedAt: string;
  attempts: number;
  endpoint: string;
}

export interface LuckyOrangeFetchOptions {
  retries?: number;
  initialBackoffMs?: number;
}

export interface LuckyOrangeAdapter {
  endpointPath: string;
  fields: {
    url: string[];
    views: string[];
    bounceRate: string[];
    rageClicks: string[];
    scrollDepth: string[];
    avgTimeOnPage: string[];
  };
}

/**
 * Fetches analytics rows from Lucky Orange API and maps to dashboard-friendly metrics.
 * NOTE: Endpoint path and response keys are a best-effort placeholder until API access is granted.
 */
export async function fetchLuckyOrangeAnalytics(config: LuckyOrangeConfig): Promise<LuckyOrangeSyncResult> {
  return fetchLuckyOrangeAnalyticsWithRetry(config, getLuckyOrangeAdapterFromEnv(), {
    retries: 3,
    initialBackoffMs: 800,
  });
}

export async function fetchLuckyOrangeAnalyticsWithRetry(
  config: LuckyOrangeConfig,
  adapter: LuckyOrangeAdapter,
  options: LuckyOrangeFetchOptions = {},
): Promise<LuckyOrangeSyncResult> {
  const status = getLuckyOrangeStatus(config);
  if (status !== 'ready') {
    throw new Error('Lucky Orange API is not configured. Set LO_API_BASE_URL and LO_API_KEY.');
  }

  const retries = Math.max(0, options.retries ?? 0);
  const initialBackoffMs = Math.max(100, options.initialBackoffMs ?? 700);

  const baseUrl = config.baseUrl!.replace(/\/+$/, '');
  const endpointPath = (config.endpointPath || adapter.endpointPath).replace(/^\/?/, '/');
  const endpoint = `${baseUrl}${endpointPath}`;

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => '');
        throw new Error(
          `Lucky Orange API request failed (${response.status}). ${bodyText?.slice(0, 180) || 'Check key/plan/access.'}`,
        );
      }

      const payload = (await response.json()) as {
        data?: Array<Record<string, unknown>>;
        rows?: Array<Record<string, unknown>>;
      };

      const rows = (payload.data || payload.rows || [])
        .map((r) => mapLuckyOrangeRow(r, adapter))
        .filter(Boolean) as RawPageData[];
      if (rows.length === 0) {
        throw new Error(
          'Lucky Orange API returned no rows (or unknown fields). Confirm endpoint path and response schema.',
        );
      }

      return {
        rows,
        fetchedAt: new Date().toISOString(),
        attempts: attempt,
        endpoint,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Lucky Orange API request failed');
      if (attempt <= retries) {
        const backoff = initialBackoffMs * Math.pow(2, attempt - 1);
        await sleep(backoff);
      }
    }
  }

  throw lastError || new Error('Lucky Orange API request failed');
}

function mapLuckyOrangeRow(row: Record<string, unknown>, adapter: LuckyOrangeAdapter): RawPageData | null {
  const url =
    pickString(row, adapter.fields.url) ||
    'Unknown';

  const views = pickNumber(row, adapter.fields.views) ?? 0;
  const bounceRate = pickNumber(row, adapter.fields.bounceRate) ?? 0;
  const rageClicks = pickNumber(row, adapter.fields.rageClicks) ?? 0;
  const scrollDepth = pickNumber(row, adapter.fields.scrollDepth) ?? 0;
  const avgTimeOnPage = pickNumber(row, adapter.fields.avgTimeOnPage) ?? 0;

  if (!url && views === 0 && bounceRate === 0 && rageClicks === 0 && scrollDepth === 0 && avgTimeOnPage === 0) {
    return null;
  }

  return { url, views, bounceRate, rageClicks, scrollDepth, avgTimeOnPage };
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = Number(String(v).replace(/[%,$\s]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim();
  return null;
}

function pickString(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = str(row[key]);
    if (v) return v;
  }
  return null;
}

function pickNumber(row: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const v = num(row[key]);
    if (v !== null) return v;
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getDefaultLuckyOrangeAdapter(): LuckyOrangeAdapter {
  return {
    endpointPath: '/v1/analytics/pages',
    fields: {
      url: ['pageUrl', 'url', 'path', 'page_path', 'pageName'],
      views: ['pageviews', 'views', 'sessions'],
      bounceRate: ['bounceRate', 'bounce_rate'],
      rageClicks: ['rageClicks', 'rage_clicks', 'frustrationClicks'],
      scrollDepth: ['scrollDepth', 'scroll_depth', 'avgScrollDepth'],
      avgTimeOnPage: ['avgTimeOnPage', 'avg_time_on_page_seconds', 'timeOnPageSeconds'],
    },
  };
}

export function getLuckyOrangeAdapterFromEnv(): LuckyOrangeAdapter {
  const env = import.meta.env as Record<string, string | undefined>;
  const adapter = getDefaultLuckyOrangeAdapter();
  if (env.LO_API_ENDPOINT?.trim()) {
    adapter.endpointPath = env.LO_API_ENDPOINT.trim();
  }
  return adapter;
}

export function getLuckyOrangeConfigFromEnv(): LuckyOrangeConfig {
  const env = import.meta.env as Record<string, string | undefined>;
  return {
    baseUrl: env.LO_API_BASE_URL,
    apiKey: env.LO_API_KEY,
    endpointPath: env.LO_API_ENDPOINT,
  };
}
