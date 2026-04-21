import React, { useState, useEffect } from 'react';
import { BookOpen, Languages, Sparkles, Loader2 } from 'lucide-react';
import { DashboardData } from '../types';
import { buildPlainInsights, buildReviewSummary } from '../lib/plainInsights';
import { explainDashboardWithMode, askDashboardQuestion, checkExplainApi } from '../lib/geminiExplain';
import { useLocale } from '../context/LocaleContext';

interface InsightsPanelProps {
  data: DashboardData;
}

export function InsightsPanel({ data }: InsightsPanelProps) {
  const { t, locale } = useLocale();
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [explainOk, setExplainOk] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const ok = await checkExplainApi();
      if (active) setExplainOk(ok);
    };

    // Initial check + periodic retry so UI recovers if API starts later.
    refresh();
    const id = window.setInterval(refresh, 5000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);

    return () => {
      active = false;
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    setAiText(null);
    setAiErr(null);
    setChatAnswer(null);
    setQuestion('');
  }, [locale, data.dataSource?.fileName, data.pages.length, data.overallHealth, data.isLimitedData]);

  const bullets = buildPlainInsights(data);
  const reviewSummary = buildReviewSummary(data);
  const aiLines = aiText
    ? aiText
        .split(/\n+/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [];
  const aiSummaryLine = aiLines.find((l) => /^summary\s*:/i.test(l)) ?? aiLines[0];
  const aiSummary = aiSummaryLine ? aiSummaryLine.replace(/^summary\s*:/i, '').trim() : '';
  const aiBullets = aiLines
    .filter((l) => l !== aiSummaryLine)
    .map((l) => l.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);

  const runAi = async (mode: 'quick' | 'detailed') => {
    setAiErr(null);
    setAiLoading(true);
    try {
      const text = await explainDashboardWithMode(data, locale, mode);
      setAiText(text);
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : t('aiError'));
      setAiText(null);
    } finally {
      setAiLoading(false);
    }
  };

  const runChat = async () => {
    if (!question.trim()) return;
    setAiErr(null);
    setChatLoading(true);
    try {
      const text = await askDashboardQuestion(data, locale, question.trim());
      setChatAnswer(text);
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : t('aiError'));
      setChatAnswer(null);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <section
      className="mb-8 rounded-2xl border border-lo-border bg-lo-panel p-5 md:p-6 print:hidden"
      aria-labelledby="insights-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-lo-accent-muted p-2.5 text-lo-accent">
            <BookOpen className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 id="insights-heading" className="text-base font-semibold text-lo-text">
              {t('insightsTitle')}
            </h2>
            <p className="mt-1 text-sm text-lo-muted">{t('insightsHint')}</p>
          </div>
        </div>
        {explainOk ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => runAi('quick')}
              disabled={aiLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-lo-border bg-lo-elevated px-3 py-2 text-sm font-medium text-lo-text hover:bg-lo-elevated-hover disabled:opacity-60"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4 text-lo-accent" aria-hidden />}
              {aiLoading ? t('aiGenerating') : t('aiExplain')}
            </button>
            <button
              type="button"
              onClick={() => runAi('detailed')}
              disabled={aiLoading}
              className="inline-flex items-center justify-center rounded-xl border border-lo-border bg-lo-elevated px-3 py-2 text-sm font-medium text-lo-text hover:bg-lo-elevated-hover disabled:opacity-60"
            >
              Detailed report
            </button>
          </div>
        ) : (
          <p className="max-w-xs text-right text-xs text-lo-muted">
            AI explanation unavailable (start <code className="rounded bg-lo-elevated px-1">npm run dev:api</code> with{' '}
            <code className="rounded bg-lo-elevated px-1">GROQ_API_KEY</code> or{' '}
            <code className="rounded bg-lo-elevated px-1">GEMINI_API_KEY</code>).
          </p>
        )}
      </div>

      <div className="mt-5 rounded-xl border border-lo-border bg-lo-elevated p-4" translate="yes">
        <h3 className="text-sm font-semibold text-lo-text">{t('reviewSummaryTitle')}</h3>
        <p className="mt-2 text-sm leading-relaxed text-lo-muted">{reviewSummary}</p>
      </div>

      {aiText ? (
        <div className="mt-4 rounded-xl border border-lo-border bg-lo-elevated p-4" translate="yes">
          <h3 className="text-sm font-semibold text-lo-text">{t('aiReviewTitle')}</h3>
          {aiSummary && <p className="mt-2 text-sm leading-relaxed text-lo-muted">{aiSummary}</p>}
          {aiBullets.length > 0 && (
            <>
              <h4 className="mt-3 text-xs font-semibold uppercase tracking-wide text-lo-muted">{t('keyTakeaways')}</h4>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-lo-text/90">
                {aiBullets.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : (
        <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-relaxed text-lo-text/90" translate="yes">
          {bullets.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}

      {aiErr && (
        <p className="mt-3 text-sm text-rose-300" translate="yes">
          {aiErr}
        </p>
      )}
      {explainOk && !aiErr && <p className="mt-3 text-xs text-lo-muted">{t('aiExplainNote')}</p>}

      {explainOk && (
        <div className="mt-5 rounded-xl border border-lo-border bg-lo-elevated p-4" translate="yes">
          <h3 className="text-sm font-semibold text-lo-text">Ask AI a question</h3>
          <p className="mt-1 text-xs text-lo-muted">
            Example: Which top 3 pages should I fix first and why?
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about this dashboard data..."
              className="w-full rounded-xl border border-lo-border bg-lo-panel px-3 py-2 text-sm text-lo-text placeholder:text-lo-muted focus:outline-none focus:ring-2 focus:ring-lo-accent/40"
            />
            <button
              type="button"
              onClick={runChat}
              disabled={chatLoading || !question.trim()}
              className="rounded-xl border border-lo-border bg-lo-panel px-4 py-2 text-sm font-medium text-lo-text hover:bg-lo-elevated-hover disabled:opacity-60"
            >
              {chatLoading ? 'Asking…' : 'Ask'}
            </button>
          </div>
          {chatAnswer && (
            <div className="mt-3 rounded-lg border border-lo-border bg-lo-panel p-3 text-sm leading-relaxed text-lo-muted whitespace-pre-wrap">
              {chatAnswer}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 border-t border-lo-border pt-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-lo-text">
          <Languages className="h-4 w-4 text-lo-muted" aria-hidden />
          {t('glossaryTitle')}
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-3" translate="yes">
          <div className="rounded-xl border border-lo-border bg-lo-elevated p-3">
            <dt className="font-medium text-lo-accent">{t('termHealthScore')}</dt>
            <dd className="mt-1 text-lo-muted">{t('termHealthScoreDef')}</dd>
          </div>
          <div className="rounded-xl border border-lo-border bg-lo-elevated p-3">
            <dt className="font-medium text-lo-accent">{t('termRageClicks')}</dt>
            <dd className="mt-1 text-lo-muted">{t('termRageClicksDef')}</dd>
          </div>
          <div className="rounded-xl border border-lo-border bg-lo-elevated p-3">
            <dt className="font-medium text-lo-accent">{t('termScrollDepth')}</dt>
            <dd className="mt-1 text-lo-muted">{t('termScrollDepthDef')}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
