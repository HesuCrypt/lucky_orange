import React from 'react';
import { motion } from 'motion/react';
import { AlertOctagon, MousePointerClick, Clock, ArrowDownToLine, ShieldCheck, Lightbulb } from 'lucide-react';
import { PageMetrics } from '../types';
import { useLocale } from '../context/LocaleContext';

interface AlertFeedProps {
  pages: PageMetrics[];
  isLimited: boolean;
}

export function AlertFeed({ pages, isLimited }: AlertFeedProps) {
  const { t } = useLocale();

  if (isLimited) {
    return (
      <div className="mb-10">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-lo-border bg-lo-panel p-8 text-center">
          <div className="mb-4 rounded-2xl bg-lo-accent-muted p-4">
            <ShieldCheck className="h-8 w-8 text-lo-accent" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-lo-text">{t('healthUnavailable')}</h3>
          <p className="max-w-md text-sm leading-relaxed text-lo-muted" translate="yes">
            {t('healthUnavailableBody')}
          </p>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="mb-10">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-8 text-center">
          <div className="mb-4 rounded-2xl bg-emerald-500/10 p-4">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-lo-text">{t('allClear')}</h3>
          <p className="max-w-md text-sm leading-relaxed text-lo-muted" translate="yes">
            {t('allClearBody')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="relative inline-flex h-3 w-3 shrink-0 rounded-full bg-rose-400 ring-2 ring-rose-400/30" />
        <h2 className="text-2xl font-semibold tracking-tight text-lo-text">{t('criticalAlerts')}</h2>
        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-200">
          {pages.length} {pages.length === 1 ? t('issue') : t('issues')}
        </span>
      </div>

      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-6 hide-scrollbar snap-x md:mx-0 md:px-0">
        {pages.map((page, index) => (
          <motion.div
            key={page.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
            className="group relative flex min-w-[320px] snap-center flex-col overflow-hidden rounded-3xl border border-rose-500/25 bg-lo-panel p-6 shadow-md md:min-w-[400px]"
          >
            <div className="absolute bottom-0 left-0 top-0 w-1 bg-rose-400/90" />

            <div className="mb-4 flex justify-between items-start">
              <div className="truncate pr-4">
                <h3 className="truncate font-medium text-lo-text" title={page.url}>
                  {page.url}
                </h3>
                <div className="mt-1 text-sm font-medium text-rose-300">
                  {t('healthCol')}: {page.healthScore}
                </div>
              </div>
              <div className="shrink-0 rounded-xl border border-rose-500/25 bg-rose-500/10 p-2">
                <AlertOctagon className="h-5 w-5 text-rose-400" />
              </div>
            </div>

            <p className="mb-4 flex-grow text-sm leading-relaxed text-lo-muted" translate="yes">
              {page.explanation}
            </p>

            {page.actionItem && (
              <div className="mb-6 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                    {t('suggestedFix')}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-amber-100/90" translate="yes">
                  {page.actionItem}
                </p>
              </div>
            )}

            <div className="mt-auto grid grid-cols-3 gap-2 border-t border-lo-border pt-4">
              <div className="flex flex-col items-center justify-center rounded-xl border border-lo-border bg-lo-elevated p-2">
                <MousePointerClick className="mb-1 h-4 w-4 text-rose-400" />
                <span className="text-xs text-lo-muted">{t('rageCol')}</span>
                <span className="font-semibold text-lo-text">{page.rageClicks}</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl border border-lo-border bg-lo-elevated p-2">
                <ArrowDownToLine className="mb-1 h-4 w-4 text-amber-400" />
                <span className="text-xs text-lo-muted">{t('scrollCol')}</span>
                <span className="font-semibold text-lo-text">{page.scrollDepth}%</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl border border-lo-border bg-lo-elevated p-2">
                <Clock className="mb-1 h-4 w-4 text-lo-accent" />
                <span className="text-xs text-lo-muted">{t('avgTime')}</span>
                <span className="font-semibold text-lo-text">{page.avgTimeOnPage}s</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
