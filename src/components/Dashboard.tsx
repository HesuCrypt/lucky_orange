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
  LayoutGrid,
  ShoppingBag,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronRight,
  Search,
} from 'lucide-react';
import { DashboardData } from '../types';
import { parseCSV, mergeDashboardData } from '../utils/dataProcessor';
import { HeroHeader } from './HeroHeader';
import { AlertFeed } from './AlertFeed';
import { InsightsPanel } from './InsightsPanel';
import { ImportIssuesPanel } from './ImportIssuesPanel';
import { AuditLogPanel } from './AuditLogPanel';
import { ExecutiveCommandCenter } from './ExecutiveCommandCenter';
import { useLocale } from '../context/LocaleContext';
import { appendAudit } from '../lib/auditLog';
import { cn } from '../lib/utils';

const MetricsChart = lazy(() => import('./MetricsChart').then((m) => ({ default: m.MetricsChart })));
const PageList = lazy(() => import('./PageList').then((m) => ({ default: m.PageList })));

function ChartFallback() {
  return (
    <div className="flex h-[300px] items-center justify-center rounded-3xl border border-lo-border bg-lo-panel text-sm text-lo-muted">
      Loading analytics...
    </div>
  );
}

export function Dashboard() {
  const { t } = useLocale();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'executive' | 'pages' | 'sales' | 'audit'>('executive');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const cachedData = localStorage.getItem('lo_dashboard_data');
        if (cachedData) {
          setData(JSON.parse(cachedData));
        }
      } catch (err) {
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsLoading(true);
    setError(null);
    setShowSuccess(false);

    try {
      const parsedDatasets: DashboardData[] = [];
      const fileNames: string[] = [];

      for (const file of files) {
        const text = await file.text();
        const parsedData = await parseCSV(text, file.name);
        parsedDatasets.push(parsedData);
        fileNames.push(file.name);
      }

      const mergedData = mergeDashboardData(parsedDatasets);
      setData(mergedData);
      appendAudit('upload', fileNames.join(', '));

      try {
        localStorage.setItem('lo_dashboard_data', JSON.stringify(mergedData));
      } catch (e) {
        console.warn('Could not save to localStorage');
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file(s).');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    if (!window.confirm('Are you sure you want to clear all dashboard data?')) return;
    setData(null);
    setError(null);
    localStorage.removeItem('lo_dashboard_data');
    appendAudit('reset', 'Clear data');
  };

  if (isLoading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-lo-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-lo-border border-t-lo-accent" />
          <p className="animate-pulse text-sm text-lo-muted">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-lo-bg text-lo-text font-sans selection:bg-lo-accent/30 selection:text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-lo-border bg-lo-bg-soft/50 backdrop-blur-xl print:hidden">
        <div className="flex h-full flex-col p-6">
          <div className="mb-12 flex items-center gap-4 group cursor-default">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-lo-accent to-blue-700 shadow-[0_0_20px_rgba(59,130,246,0.2)] group-hover:scale-105 transition-transform duration-500">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white leading-none">LUCKY<span className="text-lo-accent">BI</span></h1>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-lo-muted mt-1 opacity-70">Executive Suite</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <SidebarItem 
              active={activeTab === 'executive'} 
              onClick={() => setActiveTab('executive')} 
              icon={<LayoutGrid className="h-5 w-5" />} 
              label="Command Center" 
            />
            <SidebarItem 
              active={activeTab === 'sales'} 
              onClick={() => setActiveTab('sales')} 
              icon={<ShoppingBag className="h-5 w-5" />} 
              label="Sales & Revenue" 
            />
            <SidebarItem 
              active={activeTab === 'pages'} 
              onClick={() => setActiveTab('pages')} 
              icon={<BarChart3 className="h-5 w-5" />} 
              label="Page Insights" 
            />
            <SidebarItem 
              active={activeTab === 'audit'} 
              onClick={() => setActiveTab('audit')} 
              icon={<FileText className="h-5 w-5" />} 
              label="System Logs" 
            />
          </nav>

          <div className="mt-auto pt-8 border-t border-white/5">
            <button 
              onClick={handleReset}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Feed
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen transition-all duration-300">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/5 bg-lo-bg/40 px-10 backdrop-blur-2xl print:hidden">
          <div className="flex items-center gap-6">
            {data?.dataSource ? (
              <div className="flex items-center gap-3 rounded-2xl border border-lo-accent/20 bg-lo-accent/5 px-5 py-2 text-xs font-black uppercase tracking-widest text-lo-accent animate-in fade-in zoom-in duration-500">
                <FileSpreadsheet className="h-4 w-4" />
                <span className="opacity-80">Source:</span>
                <span className="text-white">{data.dataSource.fileName}</span>
                <div className="h-4 w-[1px] bg-lo-accent/20 mx-1" />
                <span className="bg-lo-accent/20 px-2 py-0.5 rounded text-[10px]">{data.dataSource.dataTypeLabel}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-lo-muted/40 animate-pulse" />
                <div className="text-[10px] font-black text-lo-muted uppercase tracking-[0.2em]">Awaiting Intelligence Feed</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {data && (
              <button 
                onClick={() => window.print()}
                className="p-3 rounded-xl border border-white/5 bg-white/[0.03] text-lo-muted hover:text-white hover:bg-white/5 transition-all"
                title="Generate Print Report"
              >
                <Printer className="h-5 w-5" />
              </button>
            )}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="group flex items-center gap-3 rounded-2xl bg-lo-accent px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-lo-accent/20 hover:shadow-lo-accent/40 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <Upload className="h-4 w-4 group-hover:bounce" />
              Upload Feed
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".csv"
              multiple
            />
          </div>
        </header>

        <div className="p-10 pb-24 mx-auto max-w-screen-2xl">
          {error && (
            <div className="mb-8 flex items-center gap-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-rose-400 animate-in slide-in-from-top-4">
              <AlertOctagon className="h-6 w-6 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold">Processing Error</p>
                <p className="text-xs opacity-80 mt-0.5">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest hover:bg-rose-500/20"
              >
                Dismiss
              </button>
            </div>
          )}

          {!data ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-lo-accent/10 border border-lo-accent/20">
                <Cloud className="h-12 w-12 text-lo-accent animate-bounce" />
              </div>
              <h2 className="text-5xl font-black tracking-tight text-white mb-4">Command Center</h2>
              <p className="max-w-md text-lo-muted text-lg leading-relaxed mb-10">
                Upload your Shopify Orders or Lucky Orange CSVs to generate a high-performance BI report.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-card rounded-[1.5rem] p-8 text-left hover:border-lo-accent/50 transition-all cursor-pointer group"
                >
                  <ShoppingBag className="h-8 w-8 text-emerald-400 mb-6 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold text-white mb-2">Shopify Orders</h3>
                  <p className="text-sm text-lo-muted">Map revenue to UX friction and find your most leaky product pages.</p>
                </div>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-card rounded-[1.5rem] p-8 text-left hover:border-lo-accent/50 transition-all cursor-pointer group"
                >
                  <BarChart3 className="h-8 w-8 text-blue-400 mb-6 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold text-white mb-2">Behavioral Health</h3>
                  <p className="text-sm text-lo-muted">Analyze rage clicks, dead clicks, and bounce rates site-wide.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === 'executive' && (
                <>
                  <div className="flex flex-col gap-2">
                    <h2 className="text-4xl font-black tracking-tight text-white">Executive Pulse</h2>
                    <p className="text-lo-muted text-sm font-medium">Cross-functional audit of revenue and behavioral health.</p>
                  </div>
                  <ExecutiveCommandCenter data={data} />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <InsightsPanel data={data} />
                      <AlertFeed pages={data.topCriticalPages} isLimited={data.isLimitedData} />
                    </div>
                    <div className="space-y-8">
                      {data.importMeta && <ImportIssuesPanel meta={data.importMeta} />}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'sales' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-4xl font-black tracking-tight text-white mb-2">Sales Intelligence</h2>
                    <p className="text-lo-muted text-sm font-medium">Product performance and revenue distribution.</p>
                  </div>
                  <Suspense fallback={<ChartFallback />}>
                    <MetricsChart data={data} />
                  </Suspense>
                </div>
              )}

              {activeTab === 'pages' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-4xl font-black tracking-tight text-white mb-2">Experience Audit</h2>
                    <p className="text-lo-muted text-sm font-medium">Deep-dive into page-level friction and health.</p>
                  </div>
                  <Suspense fallback={<ChartFallback />}>
                    <PageList data={data} />
                  </Suspense>
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-4xl font-black tracking-tight text-white mb-2">System Activity</h2>
                    <p className="text-lo-muted text-sm font-medium">Audit trail of data imports and modifications.</p>
                  </div>
                  <AuditLogPanel />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all group overflow-hidden",
        active 
          ? "text-white bg-lo-accent/10 border border-lo-accent/20" 
          : "text-lo-muted hover:bg-white/5 hover:text-white"
      )}
    >
      {active && (
        <div className="absolute left-0 top-0 h-full w-1 bg-lo-accent shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
      )}
      <span className={cn(
        "transition-transform group-hover:scale-110 duration-300",
        active ? "text-lo-accent" : "text-lo-muted group-hover:text-lo-accent"
      )}>
        {icon}
      </span>
      <span className="tracking-tight">{label}</span>
    </button>
  );
}
