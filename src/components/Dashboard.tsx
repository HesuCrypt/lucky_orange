import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import {
  Upload,
  Printer,
  FileSpreadsheet,
  AlertOctagon,
  RotateCcw,
  CheckCircle2,
  FileText,
  Info,
  RefreshCw,
  Cloud,
} from 'lucide-react';
import { DashboardData } from '../types';
import { getMockData, parseCSV, processAnalyticsData } from '../utils/dataProcessor';
import { HeroHeader } from './HeroHeader';
import { AlertFeed } from './AlertFeed';
import { InsightsPanel } from './InsightsPanel';
import { ImportIssuesPanel } from './ImportIssuesPanel';
import { AuditLogPanel } from './AuditLogPanel';
import { useLocale } from '../context/LocaleContext';
import { appendAudit } from '../lib/auditLog';
import {
  getLuckyOrangeConfigFromEnv,
  getLuckyOrangeStatus,
  getLuckyOrangeAdapterFromEnv,
  fetchLuckyOrangeAnalyticsWithRetry,
} from '../services/luckyOrangeClient';

const MetricsChart = lazy(() => import('./MetricsChart').then((m) => ({ default: m.MetricsChart })));
const PageList = lazy(() => import('./PageList').then((m) => ({ default: m.PageList })));

function ChartFallback() {
  return (
    <div
      className="mb-10 flex h-[300px] items-center justify-center rounded-3xl border border-lo-border bg-lo-panel text-sm text-lo-muted"
      role="status"
      aria-live="polite"
    >
      Loading chart…
    </div>
  );
}

export function Dashboard() {
  const { t } = useLocale();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUserData, setIsUserData] = useState(false);
  const [isSyncingApi, setIsSyncingApi] = useState(false);
  const [lastApiSyncAt, setLastApiSyncAt] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const cachedData = localStorage.getItem('lo_dashboard_data');
        const cachedIsUserData = localStorage.getItem('lo_dashboard_is_user_data');

        if (cachedData) {
          setData(JSON.parse(cachedData));
          setIsUserData(cachedIsUserData === 'true');
        } else {
          const mockData = getMockData();
          setData(mockData);
        }
      } catch (err) {
        setError('Failed to load initial data. Falling back to sample data.');
        setData(getMockData());
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setShowSuccess(false);

    try {
      const text = await file.text();
      const parsedData = await parseCSV(text, file.name);
      setData(parsedData);
      setIsUserData(true);
      appendAudit('upload', file.name);

      try {
        localStorage.setItem('lo_dashboard_data', JSON.stringify(parsedData));
        localStorage.setItem('lo_dashboard_is_user_data', 'true');
      } catch (e) {
        console.warn('Could not save to localStorage (file might be too large)');
      }
      setError(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to parse CSV file.';
      setError(message);
      console.error('CSV Parsing Error:', err);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    const mockData = getMockData();
    if (mockData.dataSource) {
      mockData.dataSource.sourceKind = 'sample';
      mockData.dataSource.syncedAt = undefined;
    }
    setData(mockData);
    setIsUserData(false);
    setError(null);
    setShowSuccess(false);
    appendAudit('reset', 'Sample data');

    try {
      localStorage.removeItem('lo_dashboard_data');
      localStorage.removeItem('lo_dashboard_is_user_data');
    } catch {
      // ignore
    }
  };

  const handlePrint = () => {
    appendAudit('export_print', 'Print / save as PDF');
    window.print();
  };

  const handleLuckyOrangeSync = async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    setIsSyncingApi(true);
    if (!silent) {
      setError(null);
      setShowSuccess(false);
    }
    setSyncState('Connecting to Lucky Orange API…');
    try {
      const config = getLuckyOrangeConfigFromEnv();
      if (getLuckyOrangeStatus(config) !== 'ready') {
        throw new Error(
          'Lucky Orange API is not configured yet. Add LO_API_BASE_URL and LO_API_KEY to .env when your API plan is active.',
        );
      }
      const adapter = getLuckyOrangeAdapterFromEnv();
      setSyncState(`Fetching ${adapter.endpointPath} (with retry/backoff)…`);
      const result = await fetchLuckyOrangeAnalyticsWithRetry(config, adapter, { retries: 3, initialBackoffMs: 800 });
      const processed = processAnalyticsData(result.rows, false);
      const total = new Intl.NumberFormat('en-US').format(processed.totalViews);
      const summary = `${processed.pages.length} pages synced from Lucky Orange API with ${total} total pageviews.`;
      const apiData: DashboardData = {
        ...processed,
        dataSource: {
          fileName: 'Lucky Orange API',
          dataType: 'full-analytics',
          dataTypeLabel: 'Full Analytics',
          identifierLabel: 'Page',
          countLabel: 'Pageviews',
          summary,
          uploadedAt: new Date(),
          sourceKind: 'lucky-orange-api',
          syncedAt: result.fetchedAt,
        },
      };
      setData(apiData);
      setIsUserData(true);
      setLastApiSyncAt(result.fetchedAt);
      appendAudit('upload', `Lucky Orange API sync (${result.attempts} attempt${result.attempts > 1 ? 's' : ''})`);
      try {
        localStorage.setItem('lo_dashboard_data', JSON.stringify(apiData));
        localStorage.setItem('lo_dashboard_is_user_data', 'true');
      } catch {
        // ignore localStorage limits
      }
      setSyncState(`Sync successful via ${result.endpoint} (${result.attempts} attempt${result.attempts > 1 ? 's' : ''})`);
      if (!silent) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 4000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lucky Orange API sync failed.';
      setSyncState(`Sync failed: ${msg}`);
      if (!silent) setError(msg);
    } finally {
      setIsSyncingApi(false);
    }
  };

  useEffect(() => {
    const config = getLuckyOrangeConfigFromEnv();
    if (getLuckyOrangeStatus(config) !== 'ready') return;
    if (data?.dataSource?.sourceKind !== 'lucky-orange-api') return;
    const everyMs = 15 * 60 * 1000;
    const id = window.setInterval(() => {
      void handleLuckyOrangeSync({ silent: true });
    }, everyMs);
    return () => window.clearInterval(id);
  }, [data?.dataSource?.sourceKind]);

  if (isLoading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-lo-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-lo-border border-t-lo-accent" />
          <p className="animate-pulse text-sm text-lo-muted">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lo-bg p-4 font-sans text-lo-text selection:bg-lo-accent-muted md:p-8">
      <a
        href="#dashboard-main"
        className="fixed left-4 top-4 z-[100] -translate-y-full rounded-lg bg-lo-accent px-4 py-2 text-sm font-medium text-lo-bg opacity-0 transition-opacity focus:translate-y-0 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-lo-accent"
      >
        Skip to main content
      </a>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-15%] top-[-20%] h-[45%] w-[50%] rounded-full bg-lo-glow blur-[100px]" />
        <div className="absolute bottom-[-25%] right-[-10%] h-[40%] w-[45%] rounded-full bg-lo-glow blur-[120px]" />
      </div>

      <header className="relative z-10 mx-auto max-w-7xl print:hidden" role="banner">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-lo-text">{t('dashboardTitle')}</h1>
            <p className="mt-1 text-lo-muted">{t('dashboardSubtitle')}</p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:w-auto">
            <button
              type="button"
              onClick={handleLuckyOrangeSync}
              disabled={isSyncingApi}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-lo-border bg-lo-panel px-4 py-2.5 text-sm font-medium text-lo-text transition-colors hover:bg-lo-elevated-hover disabled:opacity-60 sm:flex-none"
              title="Sync latest metrics from Lucky Orange API"
            >
              {isSyncingApi ? <RefreshCw className="h-4 w-4 animate-spin text-lo-accent" /> : <Cloud className="h-4 w-4 text-lo-accent" />}
              <span>{isSyncingApi ? 'Syncing API…' : 'Sync Lucky Orange API'}</span>
            </button>

            {isUserData && (
              <button
                type="button"
                onClick={handleReset}
                className="flex-none cursor-pointer rounded-xl border border-lo-border bg-lo-panel px-3 py-2.5 transition-colors hover:bg-lo-elevated-hover"
                title={t('resetSample')}
                aria-label={t('resetSample')}
              >
                <RotateCcw className="mx-auto h-4 w-4 text-lo-muted" />
              </button>
            )}

            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-lo-border bg-lo-elevated px-4 py-2.5 text-sm font-medium transition-colors hover:bg-lo-elevated-hover sm:flex-none md:flex-none">
              <Upload className="h-4 w-4 text-lo-accent" aria-hidden />
              <span>{t('uploadCsv')}</span>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>

            <button
              type="button"
              onClick={handlePrint}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-lo-accent px-4 py-2.5 text-sm font-medium text-lo-bg transition-opacity hover:opacity-90 sm:flex-none"
            >
              <Printer className="h-4 w-4" aria-hidden />
              <span>{t('exportReport')}</span>
            </button>
          </div>
        </div>
      </header>

      <main id="dashboard-main" className="relative z-10 mx-auto max-w-7xl" tabIndex={-1}>
        {showSuccess && data?.dataSource && (
          <div className="toast-enter mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-4 text-emerald-100 print:hidden">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div translate="yes">
              <p className="font-medium">
                {t('loadSuccess')}: {data.dataSource.fileName}
              </p>
              <p className="mt-1 text-sm text-emerald-200/85">
                {t('detectedAs')} <span className="font-semibold">{data.dataSource.dataTypeLabel}</span> —{' '}
                {data.pages.length} {data.dataSource.identifierLabel.toLowerCase()}s {t('found')}
              </p>
            </div>
          </div>
        )}

        {data?.dataSource && isUserData && (
          <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
            <div className="flex items-center gap-2 rounded-xl border border-lo-border bg-lo-panel px-4 py-2">
              <FileText className="h-4 w-4 text-lo-accent" aria-hidden />
              <span className="text-sm text-lo-muted">{data.dataSource.fileName}</span>
              <span className="rounded-full bg-lo-accent-muted px-2 py-0.5 text-xs font-medium text-lo-accent">
                {data.dataSource.dataTypeLabel}
              </span>
            </div>
            {data.dataSource.sourceKind === 'lucky-orange-api' && (
              <div className="rounded-xl border border-lo-border bg-lo-panel px-3 py-2 text-xs text-lo-muted">
                Live API source{(data.dataSource.syncedAt || lastApiSyncAt) ? ` · Synced ${new Date(data.dataSource.syncedAt || lastApiSyncAt || '').toLocaleString()}` : ''}
              </div>
            )}
            {syncState && (
              <div className="rounded-xl border border-lo-border bg-lo-panel px-3 py-2 text-xs text-lo-muted">
                {syncState}
              </div>
            )}
          </div>
        )}

        {error && (
          <div
            className="mb-8 flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-100 print:hidden"
            role="alert"
          >
            <AlertOctagon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <p translate="yes">{error}</p>
          </div>
        )}

        {data?.isLimitedData && isUserData && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-lo-border bg-lo-panel p-4 print:hidden">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-lo-accent" aria-hidden />
            <div>
              <p className="font-medium text-lo-text">{t('limitedTitle')}</p>
              <p className="mt-1 text-sm text-lo-muted" translate="yes">
                {t('limitedBody')}
              </p>
            </div>
          </div>
        )}

        {data?.importMeta && isUserData && <ImportIssuesPanel meta={data.importMeta} />}

        {data && (
          <div className="print-container">
            <div className="mb-8 hidden border-b pb-4 print:block">
              <h1 className="text-3xl font-bold text-black">Analytics Health Report</h1>
              <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
            </div>

            <InsightsPanel data={data} />
            <HeroHeader data={data} />
            <AlertFeed pages={data.topCriticalPages} isLimited={data.isLimitedData} />
            <Suspense fallback={<ChartFallback />}>
              <MetricsChart data={data} />
              <PageList pages={data.pages} dataSource={data.dataSource} isLimited={data.isLimitedData} />
            </Suspense>
          </div>
        )}

        {!data && !isLoading && !error && (
          <div className="rounded-3xl border border-lo-border bg-lo-panel p-10 text-center">
            <FileSpreadsheet className="mx-auto mb-4 h-16 w-16 text-lo-muted" aria-hidden />
            <h3 className="mb-2 text-xl font-medium text-lo-text">{t('uploadPromptTitle')}</h3>
            <p className="mx-auto mb-6 max-w-md text-lo-muted" translate="yes">
              {t('uploadPromptBody')}
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-lo-muted">
              <span className="rounded-full border border-lo-border bg-lo-elevated px-3 py-1">{t('tagHeatmaps')}</span>
              <span className="rounded-full border border-lo-border bg-lo-elevated px-3 py-1">{t('tagForms')}</span>
              <span className="rounded-full border border-lo-border bg-lo-elevated px-3 py-1">{t('tagSessions')}</span>
              <span className="rounded-full border border-lo-border bg-lo-elevated px-3 py-1">{t('tagCustom')}</span>
            </div>
          </div>
        )}

        <AuditLogPanel />
      </main>
    </div>
  );
}
