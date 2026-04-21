import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { TooltipContentProps } from 'recharts/types/component/Tooltip';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { DashboardData } from '../types';
import { useLocale } from '../context/LocaleContext';

interface MetricsChartProps {
  data: DashboardData;
}

export function MetricsChart({ data }: MetricsChartProps) {
  const { t, locale } = useLocale();
  const isLimited = data.isLimitedData;
  const ds = data.dataSource;
  const identifierLabel = ds?.identifierLabel || 'Page';
  const countLabel = ds?.countLabel || 'Views';
  const displayLabel = identifierLabel.endsWith('s') ? identifierLabel : `${identifierLabel}s`;
  const localeForFormatting = locale || 'en-US';

  const chartData = [...data.pages]
    .filter((page) => page && page.url && Number.isFinite(page.views))
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 10)
    .map((page, index) => ({
      name: page.url.length > 18 ? page.url.substring(0, 18) + '…' : page.url,
      fullUrl: page.url,
      views: page.views ?? 0,
      bounceRate: Number.isFinite(page.bounceRate) ? page.bounceRate : 0,
      status: page.status,
      rank: index + 1,
    }));

  const CustomTooltip = ({ active, payload }: Partial<TooltipContentProps<ValueType, NameType>>) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload as (typeof chartData)[0] | undefined;
      if (!item) return null;
      return (
        <div className="min-w-[200px] rounded-xl border border-lo-border bg-lo-bg-soft/95 p-4 shadow-xl backdrop-blur-md">
          <p className="mb-2 text-sm font-medium text-lo-text">{item.fullUrl}</p>
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-lo-muted">{countLabel}:</span>
              <span className="font-medium text-lo-accent">{new Intl.NumberFormat(localeForFormatting).format(item.views)}</span>
            </div>
            {!isLimited && (
              <div className="flex justify-between gap-4">
                <span className="text-lo-muted">{t('bounceRate')}:</span>
                <span className="font-medium text-rose-300">{item.bounceRate}%</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (entry: (typeof chartData)[0], index: number) => {
    if (isLimited) {
      const colors = ['#38bdf8', '#22d3ee', '#0ea5e9', '#7dd3fc', '#bae6fd'];
      return colors[index % colors.length];
    }
    return entry.status === 'Green' ? '#34d399' : entry.status === 'Yellow' ? '#fbbf24' : '#fb7185';
  };

  return (
    <div
      className="mb-10 rounded-3xl border border-lo-border bg-lo-panel p-6 shadow-lg"
      role="figure"
      aria-label={`Bar chart of top ${identifierLabel}s by ${countLabel}`}
    >
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-xl font-semibold text-lo-text">
          Top {displayLabel} by {countLabel}
        </h2>
        {!isLimited && (
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="text-lo-muted">{t('legendHealthy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="text-lo-muted">{t('legendWarning')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-400" />
              <span className="text-lo-muted">{t('legendCritical')}</span>
            </div>
          </div>
        )}
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-lo-border text-sm text-lo-muted">
          {t('noData') || `No ${displayLabel.toLowerCase()} available for charting.`}
        </div>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(255 255 255 / 0.06)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="rgb(255 255 255 / 0.25)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={10}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                stroke="rgb(255 255 255 / 0.25)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => new Intl.NumberFormat(localeForFormatting, { notation: 'compact' }).format(value)}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgb(255 255 255 / 0.04)' }} />
              <Bar dataKey="views" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry, index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
