import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  MousePointerClick,
  ArrowDownToLine,
  Activity,
  AlertOctagon,
  ArrowUpDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';
import { PageMetrics, HealthStatus, DataSource } from '../types';
import { cn } from '../lib/utils';
import { useLocale } from '../context/LocaleContext';

interface PageListProps {
  pages: PageMetrics[];
  dataSource?: DataSource;
  isLimited: boolean;
}

type SortColumn = 'url' | 'healthScore' | 'views' | 'rageClicks' | 'scrollDepth';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'All' | HealthStatus;

const statusColors: Record<HealthStatus, string> = {
  Red: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  Yellow: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const statusDots: Record<HealthStatus, string> = {
  Red: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.45)]',
  Yellow: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.45)]',
  Green: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.45)]',
};

const healthText: Record<HealthStatus, string> = {
  Red: 'text-rose-400',
  Yellow: 'text-amber-400',
  Green: 'text-emerald-400',
};

export function PageList({ pages, dataSource, isLimited }: PageListProps) {
  const { t } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>(isLimited ? 'views' : 'healthScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const identifierLabel = dataSource?.identifierLabel || 'Page';
  const countLabel = dataSource?.countLabel || 'Views';

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'url' ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column)
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40 transition-opacity group-hover:opacity-100" />;
    return sortDirection === 'asc' ? (
      <ChevronUp className="ml-1 h-3 w-3 text-lo-accent" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3 text-lo-accent" />
    );
  };

  const filterLabel = (status: FilterStatus) => {
    if (status === 'All') return t('filterAll');
    if (status === 'Red') return t('filterCritical');
    if (status === 'Yellow') return t('filterWarning');
    return t('filterHealthy');
  };

  const processedPages = useMemo(() => {
    let result = [...pages];

    if (searchTerm) {
      result = result.filter((page) => page.url.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (statusFilter !== 'All') {
      result = result.filter((page) => page.status === statusFilter);
    }

    result.sort((a, b) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return sortDirection === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return result;
  }, [pages, searchTerm, statusFilter, sortColumn, sortDirection]);

  const totalPages = Math.ceil(processedPages.length / itemsPerPage);
  const paginatedPages = processedPages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  return (
    <div className="overflow-hidden rounded-3xl border border-lo-border bg-lo-panel shadow-xl">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-lo-border p-6 lg:flex-row lg:items-center">
        <h2 className="text-xl font-semibold text-lo-text">
          {identifierLabel}s{' '}
          <span className="font-normal text-lo-muted">({processedPages.length})</span>
        </h2>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          {!isLimited && (
            <div className="flex rounded-xl border border-lo-border bg-lo-elevated p-1">
              {(['All', 'Red', 'Yellow', 'Green'] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                    statusFilter === status
                      ? 'bg-lo-panel text-lo-text shadow-sm'
                      : 'text-lo-muted hover:bg-lo-elevated-hover hover:text-lo-text',
                  )}
                >
                  {filterLabel(status)}
                </button>
              ))}
            </div>
          )}

          <div className="relative w-full sm:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-lo-muted" />
            </div>
            <input
              type="text"
              className="block w-full rounded-xl border border-lo-border bg-lo-elevated py-2 pl-9 pr-3 text-sm leading-5 text-lo-text placeholder:text-lo-muted/70 transition-all focus:border-lo-accent focus:outline-none focus:ring-2 focus:ring-lo-accent/40"
              placeholder={`${t('searchPlaceholder')} ${identifierLabel.toLowerCase()}…`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLimited ? (
        <div className="hidden select-none grid-cols-12 gap-4 border-b border-lo-border bg-lo-elevated p-4 text-xs font-medium uppercase tracking-wider text-lo-muted md:grid">
          <div className="col-span-1 flex items-center justify-center">#</div>
          <div
            className="group col-span-8 flex cursor-pointer items-center pl-2 transition-colors hover:text-lo-text"
            onClick={() => handleSort('url')}
          >
            {identifierLabel} <SortIcon column="url" />
          </div>
          <div
            className="group col-span-3 flex cursor-pointer items-center justify-center transition-colors hover:text-lo-text"
            onClick={() => handleSort('views')}
          >
            {countLabel} <SortIcon column="views" />
          </div>
        </div>
      ) : (
        <div className="hidden select-none grid-cols-12 gap-4 border-b border-lo-border bg-lo-elevated p-4 text-xs font-medium uppercase tracking-wider text-lo-muted md:grid">
          <div
            className="group col-span-4 flex cursor-pointer items-center pl-4 transition-colors hover:text-lo-text"
            onClick={() => handleSort('url')}
          >
            {identifierLabel} <SortIcon column="url" />
          </div>
          <div
            className="group col-span-2 flex cursor-pointer items-center justify-center transition-colors hover:text-lo-text"
            onClick={() => handleSort('healthScore')}
          >
            {t('healthCol')} <SortIcon column="healthScore" />
          </div>
          <div
            className="group col-span-2 flex cursor-pointer items-center justify-center transition-colors hover:text-lo-text"
            onClick={() => handleSort('views')}
          >
            {countLabel} <SortIcon column="views" />
          </div>
          <div
            className="group col-span-1 flex cursor-pointer items-center justify-center transition-colors hover:text-lo-text"
            onClick={() => handleSort('rageClicks')}
            title={t('rageCol')}
          >
            {t('rageCol')} <SortIcon column="rageClicks" />
          </div>
          <div
            className="group col-span-2 flex cursor-pointer items-center justify-center transition-colors hover:text-lo-text"
            onClick={() => handleSort('scrollDepth')}
          >
            {t('scrollCol')} <SortIcon column="scrollDepth" />
          </div>
          <div className="col-span-1 text-center" />
        </div>
      )}

      <div className="min-h-[400px] divide-y divide-lo-border">
        <AnimatePresence mode="popLayout">
          {paginatedPages.map((page, index) => {
            const globalRank = (currentPage - 1) * itemsPerPage + index + 1;

            return (
              <motion.div
                key={page.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className="flex flex-col"
              >
                {isLimited ? (
                  <div className="flex flex-col gap-2 p-4 transition-colors hover:bg-lo-elevated/50 md:grid md:grid-cols-12 md:items-center md:gap-4">
                    <div className="hidden justify-center md:col-span-1 md:flex">
                      <span className="font-mono text-sm text-lo-muted">#{globalRank}</span>
                    </div>
                    <div className="col-span-8 flex items-center gap-3 pl-0 md:pl-2">
                      <span className="mr-1 font-mono text-sm text-lo-muted md:hidden">#{globalRank}</span>
                      <span className="truncate font-medium text-lo-text" title={page.url}>
                        {page.url}
                      </span>
                    </div>
                    <div className="col-span-3 text-center">
                      <span className="font-semibold text-lo-text">
                        {new Intl.NumberFormat('en-US').format(page.views)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleExpand(page.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleExpand(page.id);
                        }
                      }}
                      className="flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:bg-lo-elevated/50 md:grid md:grid-cols-12 md:items-center md:gap-4"
                    >
                      <div className="col-span-4 flex items-center justify-between gap-3 pl-0 md:justify-start md:pl-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={cn('h-2.5 w-2.5 shrink-0 rounded-full', statusDots[page.status])} />
                          <span className="truncate font-medium text-lo-text">{page.url}</span>
                        </div>
                        <div
                          className={cn(
                            'rounded-lg border px-2.5 py-1 text-xs font-medium md:hidden',
                            statusColors[page.status],
                          )}
                        >
                          {page.healthScore}
                        </div>
                      </div>

                      <div className="hidden justify-center md:col-span-2 md:flex">
                        <div
                          className={cn(
                            'flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium',
                            statusColors[page.status],
                          )}
                        >
                          <Activity className="h-3 w-3" />
                          {page.healthScore}
                        </div>
                      </div>

                      <div className="hidden text-center text-sm text-lo-muted md:col-span-2 md:block">
                        {new Intl.NumberFormat('en-US').format(page.views)}
                      </div>

                      <div className="hidden text-center text-sm text-lo-muted md:col-span-1 md:block">
                        {page.rageClicks > 10 ? (
                          <span className="font-bold text-rose-400">{page.rageClicks}</span>
                        ) : (
                          page.rageClicks
                        )}
                      </div>

                      <div className="hidden items-center justify-center gap-2 md:col-span-2 md:flex">
                        <div className="h-1.5 w-full max-w-[80px] rounded-full bg-lo-border">
                          <div
                            className={cn(
                              'h-1.5 rounded-full',
                              page.scrollDepth > 60
                                ? 'bg-emerald-400'
                                : page.scrollDepth > 30
                                  ? 'bg-amber-400'
                                  : 'bg-rose-400',
                            )}
                            style={{ width: `${page.scrollDepth}%` }}
                          />
                        </div>
                        <span className="w-8 text-xs text-lo-muted">{page.scrollDepth}%</span>
                      </div>

                      <div className="hidden justify-end pr-4 md:col-span-1 md:flex">
                        {expandedId === page.id ? (
                          <ChevronUp className="h-5 w-5 text-lo-muted" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-lo-muted" />
                        )}
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-2 md:hidden">
                        <div className="flex items-center gap-1.5 rounded-lg border border-lo-border bg-lo-elevated p-2 text-xs text-lo-muted">
                          <MousePointerClick className="h-3.5 w-3.5" />
                          <span>
                            {page.rageClicks} {t('rageCol')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg border border-lo-border bg-lo-elevated p-2 text-xs text-lo-muted">
                          <ArrowDownToLine className="h-3.5 w-3.5" />
                          <span>
                            {page.scrollDepth}% {t('scrollCol')}
                          </span>
                        </div>
                        <div className="flex items-center justify-center rounded-lg border border-lo-border bg-lo-elevated p-2 text-xs text-lo-muted">
                          {expandedId === page.id ? t('hideDetails') : t('viewDetails')}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedId === page.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden bg-lo-elevated/80"
                        >
                          <div className="border-t border-lo-border p-4 md:p-6">
                            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                              <div className="rounded-xl border border-lo-border bg-lo-panel p-4">
                                <div className="mb-1 text-xs uppercase tracking-wider text-lo-muted">{t('bounceRate')}</div>
                                <div
                                  className={cn(
                                    'text-xl font-semibold',
                                    page.bounceRate > 60 ? 'text-rose-400' : 'text-lo-text',
                                  )}
                                >
                                  {page.bounceRate}%
                                </div>
                              </div>
                              <div className="rounded-xl border border-lo-border bg-lo-panel p-4">
                                <div className="mb-1 text-xs uppercase tracking-wider text-lo-muted">{t('avgTime')}</div>
                                <div
                                  className={cn(
                                    'text-xl font-semibold',
                                    page.avgTimeOnPage < 30 ? 'text-rose-400' : 'text-lo-text',
                                  )}
                                >
                                  {page.avgTimeOnPage}s
                                </div>
                              </div>
                              <div className="rounded-xl border border-lo-border bg-lo-panel p-4 md:hidden">
                                <div className="mb-1 text-xs uppercase tracking-wider text-lo-muted">{countLabel}</div>
                                <div className="text-xl font-semibold text-lo-text">
                                  {new Intl.NumberFormat('en-US').format(page.views)}
                                </div>
                              </div>
                              <div className="rounded-xl border border-lo-border bg-lo-panel p-4 md:hidden">
                                <div className="mb-1 text-xs uppercase tracking-wider text-lo-muted">{t('healthCol')}</div>
                                <div className={cn('text-xl font-semibold', healthText[page.status])}>
                                  {page.healthScore}
                                </div>
                              </div>
                            </div>

                            {page.explanation && (
                              <div className="flex flex-col gap-3">
                                <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-4">
                                  <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold text-rose-300">
                                    <AlertOctagon className="h-4 w-4" />
                                    {t('analysis')}
                                  </h4>
                                  <p className="text-sm leading-relaxed text-lo-muted" translate="yes">
                                    {page.explanation}
                                  </p>
                                </div>
                                {page.actionItem && (
                                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
                                    <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold text-amber-300">
                                      <Lightbulb className="h-4 w-4" />
                                      {t('suggestedFix')}
                                    </h4>
                                    <p className="text-sm leading-relaxed text-amber-100/85" translate="yes">
                                      {page.actionItem}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {paginatedPages.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-lo-muted">
            <Filter className="mb-4 h-12 w-12 opacity-20" />
            <p translate="yes">{t('noResults')}</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-lo-border bg-lo-elevated p-4">
          <div className="text-sm text-lo-muted">
            {t('showing')}{' '}
            <span className="font-medium text-lo-text">{(currentPage - 1) * itemsPerPage + 1}</span> {t('to')}{' '}
            <span className="font-medium text-lo-text">
              {Math.min(currentPage * itemsPerPage, processedPages.length)}
            </span>{' '}
            {t('of')} <span className="font-medium text-lo-text">{processedPages.length}</span> {t('results')}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-lo-border bg-lo-panel p-2 transition-colors hover:bg-lo-elevated-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="px-2 text-sm text-lo-muted">
              {t('page')} {currentPage} {t('of')} {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-lo-border bg-lo-panel p-2 transition-colors hover:bg-lo-elevated-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
