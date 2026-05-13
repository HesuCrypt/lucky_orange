import React from 'react';
import { DashboardData } from '../types';
import { useLocale } from '../context/LocaleContext';
import {
  Activity,
  AlertTriangle,
  Clock,
  Compass,
  FileDigit,
  Flame,
  LayoutTemplate,
  Map,
  MousePointer2,
  TrendingDown,
  UserCheck,
  UserPlus,
  ArrowRight,
  MonitorPlay,
  Lightbulb
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ExecutiveAuditProps {
  data: DashboardData;
}

export function ExecutiveAudit({ data }: ExecutiveAuditProps) {
  const { locale } = useLocale();
  const localeForFormatting = locale || 'en-US';
  const audit = data.executiveAudit;

  if (!audit) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-lo-border bg-lo-panel">
        <p className="text-lo-muted">Audit data is not available for this dataset.</p>
      </div>
    );
  }

  // Get the critical 4 pages from data.pages
  const criticalFour = [
    { name: 'Landing / Home', keyword: '/home', fallbackIndex: 0 },
    { name: 'Product Page', keyword: '/product', fallbackIndex: 1 },
    { name: 'Checkout', keyword: '/checkout', fallbackIndex: 2 },
    { name: 'Sign Up', keyword: '/signup', fallbackIndex: 3 },
  ].map((target) => {
    const page = data.pages.find((p) => p.url.includes(target.keyword)) || data.pages[target.fallbackIndex];
    return { name: target.name, page };
  }).filter(t => t.page !== undefined);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-lo-border/50 pb-6">
        <div>
          <h3 className="text-2xl font-bold text-lo-text flex items-center gap-2">
            <Compass className="h-6 w-6 text-lo-accent" />
            CRO Intelligence & Executive Audit
          </h3>
          <p className="text-sm text-lo-muted mt-1">Deep-dive structural audit for UX friction and conversion bottlenecks.</p>
        </div>
        <button className="rounded-xl border border-lo-border bg-lo-panel px-4 py-2 text-sm font-medium transition-colors hover:bg-lo-elevated-hover" onClick={() => window.print()}>
          Print Audit Report
        </button>
      </div>

      {/* Zone A: UX Friction Scorecard */}
      <div>
        <h4 className="text-sm font-semibold uppercase tracking-widest text-lo-muted mb-4">UX Friction Scorecard</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-lo-border bg-lo-panel p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
              <Activity className="h-16 w-16" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-lo-muted">Overall Health</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-bold text-emerald-400">{data.overallHealth}</p>
              <p className="text-sm text-emerald-500/80">/ 100</p>
            </div>
          </div>

          <div className="rounded-2xl border border-lo-border bg-lo-panel p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
              <Map className="h-16 w-16" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-lo-muted">Navigation Clarity</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className={cn("text-3xl font-bold", audit.navigationClarity > 70 ? "text-emerald-400" : "text-amber-400")}>
                {audit.navigationClarity}
              </p>
              <p className="text-sm text-lo-muted">/ 100</p>
            </div>
          </div>

          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20 text-rose-500">
              <AlertTriangle className="h-16 w-16" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-300">Friction Pulse</p>
            <div className="mt-2 flex flex-col">
              <p className="text-3xl font-bold text-rose-400">{new Intl.NumberFormat(localeForFormatting).format(audit.frictionPulse)}</p>
              <p className="text-xs text-rose-400/80 mt-1">Dead & Rage Clicks Detected</p>
            </div>
          </div>

          <div className="rounded-2xl border border-lo-border bg-lo-panel p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
              <Clock className="h-16 w-16" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-lo-muted">Input Efficiency</p>
            <div className="mt-2 flex flex-col">
              <p className="text-3xl font-bold text-lo-text">{audit.inputEfficiency}s</p>
              <p className="text-xs text-lo-muted mt-1">Avg Form Completion Time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Zone B: Dual-Path Funnel Report */}
      <div>
        <h4 className="text-sm font-semibold uppercase tracking-widest text-lo-muted mb-4">Dual-Path Funnel Analytics</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Existing Customers */}
          <div className="rounded-2xl border border-lo-border bg-lo-elevated/30 p-6">
            <div className="flex items-center gap-2 mb-6">
              <UserCheck className="h-5 w-5 text-lo-accent" />
              <h5 className="font-bold text-lo-text">Existing Customers</h5>
            </div>
            <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[15px] before:w-px before:bg-lo-border">
              {audit.funnelExisting.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-4 border-lo-elevated bg-lo-panel shadow-sm">
                    <div className={cn("h-2 w-2 rounded-full", step.dropoff > 50 ? "bg-rose-500" : "bg-lo-accent")} />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-lo-text">{step.step}</p>
                      <p className="text-sm font-bold">{new Intl.NumberFormat(localeForFormatting).format(step.users)}</p>
                    </div>
                    {step.dropoff > 0 && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5">
                        <TrendingDown className="h-3 w-3 text-rose-400" />
                        <p className="text-xs font-medium text-rose-300">-{step.dropoff}% Falloff</p>
                        {step.dropoff > 50 && <span className="ml-auto text-[10px] uppercase font-bold text-rose-400 tracking-wider">Blocker</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Customers */}
          <div className="rounded-2xl border border-lo-border bg-lo-elevated/30 p-6">
            <div className="flex items-center gap-2 mb-6">
              <UserPlus className="h-5 w-5 text-emerald-400" />
              <h5 className="font-bold text-lo-text">New/Potential Customers</h5>
            </div>
            <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[15px] before:w-px before:bg-lo-border">
              {audit.funnelNew.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-4 border-lo-elevated bg-lo-panel shadow-sm">
                    <div className={cn("h-2 w-2 rounded-full", step.dropoff > 50 ? "bg-rose-500" : "bg-emerald-400")} />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-lo-text">{step.step}</p>
                      <p className="text-sm font-bold">{new Intl.NumberFormat(localeForFormatting).format(step.users)}</p>
                    </div>
                    {step.dropoff > 0 && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5">
                        <TrendingDown className="h-3 w-3 text-rose-400" />
                        <p className="text-xs font-medium text-rose-300">-{step.dropoff}% Falloff</p>
                        {step.dropoff > 50 && <span className="ml-auto text-[10px] uppercase font-bold text-rose-400 tracking-wider">Blocker</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Zone C: Page Drill-down Matrix */}
      <div>
        <h4 className="text-sm font-semibold uppercase tracking-widest text-lo-muted mb-4">Critical 4: Focus Drill-Down</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criticalFour.map((item, i) => (
            <div key={i} className="flex flex-col justify-between rounded-xl border border-lo-border bg-lo-panel p-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-bold text-lo-text text-base">{item.name}</h5>
                  <span className="text-xs text-lo-muted font-mono">{item.page?.url.substring(0,25)}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-lo-muted mb-4">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {item.page?.avgTimeOnPage}s Avg</span>
                  <span className="flex items-center gap-1"><ArrowRight className="h-3 w-3" /> {item.page?.bounceRate}% Bounce</span>
                </div>
              </div>
              
              <div className="space-y-3 mt-4">
                <p className="text-[10px] uppercase tracking-widest text-lo-muted/80 font-bold">Identified Friction</p>
                <div className="flex flex-wrap gap-2">
                  {(item.page?.friction?.rageClicks || 0) > 10 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-400 border border-rose-500/20">
                      <Flame className="h-3 w-3" /> High Rage Clicks
                    </span>
                  )}
                  {(item.page?.friction?.shakyMouse || 0) > 40 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
                      <MousePointer2 className="h-3 w-3" /> Shaky Mouse Detection
                    </span>
                  )}
                  {(item.page?.friction?.repeatedField || 0) > 5 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-400 border border-purple-500/20">
                      <FileDigit className="h-3 w-3" /> Repeated Fields
                    </span>
                  )}
                  {(!item.page?.friction || (item.page.friction.rageClicks <= 10 && item.page.friction.shakyMouse <= 40)) && (
                     <span className="text-xs text-lo-muted italic">No major friction detected</span>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-lo-border/50 flex gap-3">
                {item.page?.heatmapUrl && (
                  <a href={item.page.heatmapUrl} target="_blank" rel="noreferrer" className="flex-1 flex justify-center items-center gap-1 text-xs font-medium text-lo-text bg-lo-elevated hover:bg-lo-elevated-hover py-2 rounded-lg transition-colors">
                    <LayoutTemplate className="h-3.5 w-3.5 text-lo-accent" /> View Heatmap
                  </a>
                )}
                {item.page?.recordingUrl && (
                  <a href={item.page.recordingUrl} target="_blank" rel="noreferrer" className="flex-1 flex justify-center items-center gap-1 text-xs font-medium text-lo-text bg-lo-elevated hover:bg-lo-elevated-hover py-2 rounded-lg transition-colors">
                    <MonitorPlay className="h-3.5 w-3.5 text-lo-accent" /> Play Sessions
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone D: Strategic Roadmap */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-emerald-400" />
          <h4 className="text-base font-bold text-emerald-100">Key Findings & Next Steps</h4>
        </div>
        <div className="space-y-4">
          <div>
            <h5 className="text-sm font-semibold text-lo-text mb-1">1. Severe Checkout Dropoff (New Users)</h5>
            <p className="text-sm text-lo-muted">We identified an 80% dropoff at the Purchase step for New Users, heavily correlated with "Shaky Mouse" events. Consider adding Trust Badges and reviewing guest checkout flow.</p>
          </div>
          <div>
            <h5 className="text-sm font-semibold text-lo-text mb-1">2. High Input Friction on Signup</h5>
            <p className="text-sm text-lo-muted">Average input efficiency is sluggish ({audit.inputEfficiency}s), with Repeated Field errors detected. Suggest enabling social login or removing non-essential fields.</p>
          </div>
          <div>
            <h5 className="text-sm font-semibold text-lo-text mb-1">3. Navigation Clarity is {audit.navigationClarity > 70 ? 'Healthy' : 'Sub-optimal'}</h5>
            <p className="text-sm text-lo-muted">Overall pathing indicates {audit.navigationClarity > 70 ? 'users are finding what they need' : 'confusion in the header menu'}. We recommend reviewing the top dead clicks via the Heatmap links above.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
