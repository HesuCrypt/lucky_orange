import React from 'react';
import { motion } from 'motion/react';
import { Activity, AlertTriangle, TrendingUp, TrendingDown, BarChart3, Sparkles, Users } from 'lucide-react';
import { DashboardData } from '../types';
import { cn } from '../lib/utils';
import { useLocale } from '../context/LocaleContext';

interface HeroHeaderProps {
  data: DashboardData;
}

export function HeroHeader({ data }: HeroHeaderProps) {
  const { t } = useLocale();
  const isLimited = data.isLimitedData;
  const ds = data.dataSource;
  const countLabel = ds?.countLabel || 'Views';
  const identifierLabel = ds?.identifierLabel || 'Page';

  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  const healthValue = isLimited ? 100 : data.overallHealth;
  const strokeDashoffset = circumference - (healthValue / 100) * circumference;

  return (
    <div className="mb-8 space-y-6">
      {ds?.summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-start gap-4 rounded-2xl border border-lo-border bg-lo-panel p-5"
          translate="yes"
        >
          <div className="shrink-0 rounded-xl bg-lo-accent-muted p-2">
            <Sparkles className="h-5 w-5 text-lo-accent" />
          </div>
          <div>
            <h3 className="mb-1 text-sm font-medium text-lo-text">{t('dataSummary')}</h3>
            <p className="text-sm leading-relaxed text-lo-muted">{ds.summary}</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-lo-border bg-lo-panel p-6 shadow-lg"
        >
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-lo-glow blur-2xl" />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="mb-1 text-xs font-medium uppercase tracking-wider text-lo-muted">
                {isLimited ? t('dataCoverage') : t('siteHealth')}
              </h2>
              <div className="text-4xl font-bold text-lo-text">
                {isLimited ? `${data.pages.length}` : `${data.overallHealth}%`}
              </div>
              <div className="mt-2 text-sm text-lo-muted">
                {isLimited
                  ? `${identifierLabel}s ${t('tracked')}`
                  : `${t('basedOn')} ${data.pages.length} ${identifierLabel.toLowerCase()}s`}
              </div>
            </div>

            {!isLimited ? (
              <div className="relative flex h-28 w-28 items-center justify-center">
                <svg className="h-28 w-28 -rotate-90 transform">
                  <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-lo-border"
                  />
                  <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                    cx="56"
                    cy="56"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    className={cn(
                      'transition-all duration-1000',
                      data.overallHealth > 80
                        ? 'text-emerald-400'
                        : data.overallHealth > 50
                          ? 'text-amber-400'
                          : 'text-rose-400',
                    )}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity
                    className={cn(
                      'h-8 w-8',
                      data.overallHealth > 80
                        ? 'text-emerald-400'
                        : data.overallHealth > 50
                          ? 'text-amber-400'
                          : 'text-rose-400',
                    )}
                  />
                </div>
              </div>
            ) : (
              <div className="relative flex h-28 w-28 items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-lo-border bg-lo-accent-muted">
                  <BarChart3 className="h-10 w-10 text-lo-accent" />
                </div>
              </div>
            )}
          </div>

          {!isLimited && (
            <div className="relative z-10 mt-auto border-t border-lo-border pt-3">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-wide text-lo-muted">
                {t('statusDistribution')}
              </div>
              <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(data.pages.filter((p) => p.status === 'Green').length / data.pages.length) * 100}%`,
                  }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-emerald-400"
                  title={`${t('legendHealthy')}: ${data.pages.filter((p) => p.status === 'Green').length}`}
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(data.pages.filter((p) => p.status === 'Yellow').length / data.pages.length) * 100}%`,
                  }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-amber-400"
                  title={`${t('legendWarning')}: ${data.pages.filter((p) => p.status === 'Yellow').length}`}
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(data.pages.filter((p) => p.status === 'Red').length / data.pages.length) * 100}%`,
                  }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-rose-400"
                  title={`${t('legendCritical')}: ${data.pages.filter((p) => p.status === 'Red').length}`}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] font-medium text-lo-muted">
                <span className="text-emerald-400/90">
                  {Math.round((data.pages.filter((p) => p.status === 'Green').length / data.pages.length) * 100)}%
                </span>
                <span className="text-amber-400/90">
                  {Math.round((data.pages.filter((p) => p.status === 'Yellow').length / data.pages.length) * 100)}%
                </span>
                <span className="text-rose-400/90">
                  {Math.round((data.pages.filter((p) => p.status === 'Red').length / data.pages.length) * 100)}%
                </span>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative flex flex-col justify-center overflow-hidden rounded-3xl border border-lo-border bg-lo-panel p-6 shadow-lg"
        >
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-lo-glow blur-2xl" />
          <div className="relative z-10 mb-2 flex items-center gap-4">
            <div className="rounded-2xl border border-lo-border bg-lo-elevated p-3">
              <TrendingUp className="h-6 w-6 text-lo-accent" />
            </div>
            <h2 className="text-xs font-medium uppercase tracking-wider text-lo-muted">
              {t('totalPrefix')} {countLabel}
            </h2>
          </div>
          <div className="relative z-10 text-4xl font-bold text-lo-text flex items-baseline gap-2">
            {new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(data.totalViews)}
            {data.viewsTrend !== undefined && (
              <span className={cn('text-sm font-medium flex items-center', data.viewsTrend > 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {data.viewsTrend > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {Math.abs(data.viewsTrend)}% vs last 7d
              </span>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative flex flex-col justify-center overflow-hidden rounded-3xl border border-lo-border bg-lo-panel p-6 shadow-lg"
        >
          {isLimited ? (
            <>
              <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-lo-glow blur-2xl" />
              <div className="relative z-10 mb-2 flex items-center gap-4">
                <div className="rounded-2xl border border-lo-border bg-lo-accent-muted p-3">
                  <TrendingUp className="h-6 w-6 text-lo-accent" />
                </div>
                <h2 className="text-xs font-medium uppercase tracking-wider text-lo-muted">
                  {t('topPrefix')} {identifierLabel}
                </h2>
              </div>
              <div className="relative z-10 truncate text-lg font-bold text-lo-text" title={data.pages[0]?.url}>
                {data.pages[0]?.url || '—'}
              </div>
              <div className="relative z-10 mt-1 text-sm text-lo-muted">
                {data.pages[0]
                  ? `${new Intl.NumberFormat('en-US').format(data.pages[0].views)} ${countLabel.toLowerCase()}`
                  : ''}
              </div>
            </>
          ) : (
            <>
              <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-rose-500/10 blur-2xl" />
              <div className="relative z-10 mb-2 flex items-center gap-4">
                <div className="relative rounded-2xl border border-rose-500/25 bg-rose-500/10 p-3">
                  {data.criticalPagesCount > 0 && (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ repeat: Infinity, duration: 2.5 }}
                      className="absolute inset-0 rounded-2xl bg-rose-500/20"
                    />
                  )}
                  <AlertTriangle className="relative z-10 h-6 w-6 text-rose-400" />
                </div>
                <h2 className="text-xs font-medium uppercase tracking-wider text-lo-muted">
                  {t('criticalPrefix')} {identifierLabel}s
                </h2>
              </div>
              <div className="relative z-10 text-4xl font-bold text-lo-text">{data.criticalPagesCount}</div>
            </>
          )}
        </motion.div>
        
        {data.activeUsers !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative flex flex-col justify-center overflow-hidden rounded-3xl border border-lo-border bg-lo-panel p-6 shadow-lg md:col-span-3 lg:col-span-1"
          >
            <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
            <div className="relative z-10 mb-2 flex items-center gap-4">
              <div className="relative rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 rounded-2xl bg-emerald-500/20"
                />
                <Users className="relative z-10 h-6 w-6 text-emerald-400" />
              </div>
              <h2 className="text-xs font-medium uppercase tracking-wider text-lo-muted">
                Active Users Right Now
              </h2>
            </div>
            <div className="relative z-10 text-4xl font-bold text-lo-text">
              {data.activeUsers}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
