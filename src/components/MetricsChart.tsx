import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  TooltipContentProps,
  AreaChart,
  Area,
} from 'recharts';
import { LayoutDashboard, PieChart as PieChartIcon, TrendingUp, Filter, Users, MousePointerClick, Presentation, Target, Banknote, ShieldCheck } from 'lucide-react';
import { DashboardData, ShopifyCategory } from '../types';
import { useLocale } from '../context/LocaleContext';
import { cn } from '../lib/utils';
import { ExecutiveAudit } from './ExecutiveAudit';
import { RevenueAnalytics } from './RevenueAnalytics';
import { ExecutiveCommandCenter } from './ExecutiveCommandCenter';

interface MetricsChartProps {
  data: DashboardData;
}

type TabType = 'command' | 'overview' | 'categories' | 'performance' | 'reporting' | 'executive' | 'revenue';

export function MetricsChart({ data }: MetricsChartProps) {
  const { t, locale } = useLocale();
  const [activeTab, setActiveTab] = useState<TabType>('command');
  const localeForFormatting = locale || 'en-US';

  // 1. Top 10 Pages Data
  const topPagesData = [...(data.pages || [])]
    .filter((page) => page && page.url && Number.isFinite(page.views))
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 10)
    .map((page) => ({
      name: (page.url || '').length > 20 ? (page.url || '').substring(0, 20) + '…' : (page.url || ''),
      fullUrl: page.url || 'Unknown',
      views: page.views ?? 0,
      bounceRate: page.bounceRate || 0,
      health: page.healthScore || 0,
    }));

  // 2. Category Distribution Data
  const COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#818cf8', '#f472b6', '#a78bfa', '#94a3b8'];
  const categoryData = (data.categories || []).map((cat, i) => ({
    name: cat.name,
    value: cat.views,
    color: COLORS[i % COLORS.length],
    bounce: cat.avgBounceRate,
    pages: cat.pageCount
  }));

  // 3. Device Breakdown Data
  const deviceData = [
    { name: 'Desktop', value: 0 },
    { name: 'Mobile', value: 0 },
    { name: 'Tablet', value: 0 },
  ];
  if (data.pages) {
    let desktop = 0, mobile = 0, tablet = 0;
    data.pages.forEach(p => {
      if (p.devices) {
        desktop += (p.views * p.devices.desktop) / 100;
        mobile += (p.views * p.devices.mobile) / 100;
        tablet += (p.views * p.devices.tablet) / 100;
      }
    });
    deviceData[0].value = Math.round(desktop);
    deviceData[1].value = Math.round(mobile);
    deviceData[2].value = Math.round(tablet);
  }

  // 4. Mock Daily Trend Data for Analyst Report
  const trendData = [
    { day: 'Mon', views: Math.round(data.totalViews * 0.1) },
    { day: 'Tue', views: Math.round(data.totalViews * 0.12) },
    { day: 'Wed', views: Math.round(data.totalViews * 0.15) },
    { day: 'Thu', views: Math.round(data.totalViews * 0.14) },
    { day: 'Fri', views: Math.round(data.totalViews * 0.18) },
    { day: 'Sat', views: Math.round(data.totalViews * 0.2) },
    { day: 'Sun', views: Math.round(data.totalViews * 0.11) },
  ];

  // 5. Mock Funnel Data
  const funnelData = [
    { step: 'Storefront', users: data.totalViews, dropoff: 0 },
    { step: 'Collections', users: Math.round(data.totalViews * 0.6), dropoff: 40 },
    { step: 'Products', users: Math.round(data.totalViews * 0.35), dropoff: 25 },
    { step: 'Cart', users: Math.round(data.totalViews * 0.12), dropoff: 23 },
    { step: 'Checkout', users: Math.round(data.totalViews * 0.05), dropoff: 7 },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="min-w-[180px] rounded-xl border border-lo-border bg-lo-panel/95 p-3 shadow-xl backdrop-blur-md">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-lo-text">{item.name || item.fullUrl || item.day || item.step}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-lo-muted">Views/Users:</span>
              <span className="font-medium text-lo-accent">{new Intl.NumberFormat(localeForFormatting).format(payload[0].value as number)}</span>
            </div>
            {item.bounce !== undefined && (
              <div className="flex justify-between">
                <span className="text-lo-muted">Avg Bounce:</span>
                <span className="font-medium text-rose-400">{item.bounce}%</span>
              </div>
            )}
            {item.dropoff !== undefined && (
              <div className="flex justify-between">
                <span className="text-lo-muted">Dropoff:</span>
                <span className="font-medium text-rose-400">{item.dropoff}%</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mb-10 rounded-3xl border border-lo-border bg-lo-panel overflow-hidden shadow-xl">
      {/* Header & Tabs */}
      <div className="flex flex-col border-b border-lo-border bg-lo-elevated/30 sm:flex-row sm:items-center sm:justify-between px-6 py-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-lo-accent/10 p-2">
            <LayoutDashboard className="h-5 w-5 text-lo-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-lo-text">Data Analyst Suite</h2>
            <p className="text-xs text-lo-muted">Deep dive into store performance</p>
          </div>
        </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Group 1: UX & Behavior */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-lo-panel/50 p-1 border border-lo-border">
          <button
            onClick={() => setActiveTab('command')}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              activeTab === 'command' ? "bg-lo-accent text-lo-bg shadow-lg" : "text-lo-muted hover:text-lo-text"
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Executive Pulse
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              activeTab === 'overview' ? "bg-lo-accent text-lo-bg shadow-lg" : "text-lo-muted hover:text-lo-text"
            )}
          >
            <TrendingUp className="h-3.5 w-3.5" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              activeTab === 'categories' ? "bg-lo-accent text-lo-bg shadow-lg" : "text-lo-muted hover:text-lo-text"
            )}
          >
            <PieChartIcon className="h-3.5 w-3.5" /> Segments
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              activeTab === 'performance' ? "bg-lo-accent text-lo-bg shadow-lg" : "text-lo-muted hover:text-lo-text"
            )}
          >
            <MousePointerClick className="h-3.5 w-3.5" /> Performance
          </button>
          <button
            onClick={() => setActiveTab('reporting')}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              activeTab === 'reporting' ? "bg-lo-accent text-lo-bg shadow-lg" : "text-lo-muted hover:text-lo-text"
            )}
          >
            <Presentation className="h-3.5 w-3.5" /> Analyst Report
          </button>
          <button
            onClick={() => setActiveTab('executive')}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              activeTab === 'executive' ? "bg-lo-accent text-lo-bg shadow-lg" : "text-lo-muted hover:text-lo-text"
            )}
          >
            <Target className="h-3.5 w-3.5" /> CRO Audit
          </button>
        </div>

        {/* Group 2: Financial & Sales */}
        {data.ordersData && (
          <div className="flex items-center gap-1 rounded-xl bg-emerald-500/5 p-1 border border-emerald-500/20">
            <button
              onClick={() => setActiveTab('revenue')}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                activeTab === 'revenue' ? "bg-emerald-500 text-lo-bg shadow-lg" : "text-emerald-400 hover:text-emerald-300"
              )}
            >
              <Banknote className="h-3.5 w-3.5" /> Sales & Revenue (PHP)
            </button>
          </div>
        )}
      </div>
    </div>

      {/* Content */}
      <div className="p-6 min-h-[400px]">
        {activeTab === 'command' && (
          <ExecutiveCommandCenter data={data} />
        )}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-lo-muted mb-6">Top Traffic Drivers</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topPagesData} layout="vertical" margin={{ left: 40, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100} 
                      axisLine={false} 
                      tickLine={false} 
                      fontSize={11} 
                      stroke="rgba(255,255,255,0.4)"
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="views" radius={[0, 4, 4, 0]} barSize={20}>
                      {topPagesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.health > 80 ? '#34d399' : entry.health > 50 ? '#fbbf24' : '#fb7185'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col justify-center space-y-6 border-l border-lo-border/50 pl-8">
              <div className="space-y-1">
                <p className="text-xs text-lo-muted uppercase tracking-widest">Total Coverage</p>
                <p className="text-3xl font-bold text-lo-text">{(data.pages || []).length} Pages</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-lo-muted uppercase tracking-widest">Avg. Engagement</p>
                <p className="text-3xl font-bold text-lo-accent">
                  {data.pages && data.pages.length > 0 
                    ? Math.round(data.pages.reduce((acc, p) => acc + (p.scrollDepth || 0), 0) / data.pages.length) 
                    : 0}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-lo-muted uppercase tracking-widest">Efficiency</p>
                <p className="text-3xl font-bold text-emerald-400">High</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 flex flex-col justify-center">
              <h4 className="text-sm font-bold text-lo-text mb-2">Category Performance Index</h4>
              {categoryData.slice(0, 5).map((cat) => (
                <div key={cat.name} className="flex items-center justify-between p-3 rounded-xl bg-lo-elevated/50 border border-lo-border/50">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-lo-muted uppercase">Bounce</p>
                      <p className={cn("text-xs font-bold", cat.bounce > 60 ? "text-rose-400" : "text-emerald-400")}>{cat.bounce}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-lo-muted uppercase">Share</p>
                      <p className="text-xs font-bold text-lo-text">{Math.round((cat.value / data.totalViews) * 100)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-lo-muted mb-6">Views vs Bounce Rate (Efficiency Matrix)</h3>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPagesData.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="views" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Volume" />
                  <Bar dataKey="bounceRate" fill="#fb7185" radius={[4, 4, 0, 0]} name="Friction (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 p-4 rounded-2xl bg-lo-accent/5 border border-lo-accent/10 flex items-start gap-4">
              <Filter className="h-5 w-5 text-lo-accent shrink-0 mt-1" />
              <p className="text-xs leading-relaxed text-lo-muted">
                <span className="font-bold text-lo-text">Analyst Note:</span> High bar volume (Blue) combined with high friction (Red) indicates significant revenue leak. Focus optimization on the top 3 red-spiked segments.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'reporting' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-lo-text">Executive Performance Report</h3>
                <p className="text-sm text-lo-muted">Comprehensive 360° view of traffic, acquisition, and funnel integrity.</p>
              </div>
              <button className="rounded-xl bg-lo-accent px-4 py-2 text-sm font-medium text-lo-bg transition-opacity hover:opacity-90" onClick={() => window.print()}>
                Export PDF
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Daily Trend */}
              <div className="rounded-2xl border border-lo-border bg-lo-elevated/20 p-5">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-lo-muted mb-4">7-Day Traffic Velocity</h4>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="day" fontSize={11} axisLine={false} tickLine={false} />
                      <YAxis fontSize={11} axisLine={false} tickLine={false} tickFormatter={(val) => new Intl.NumberFormat(localeForFormatting, { notation: 'compact' }).format(val)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="views" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Device Mix */}
              <div className="rounded-2xl border border-lo-border bg-lo-elevated/20 p-5">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-lo-muted mb-4">Hardware Segmentation</h4>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deviceData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} fontSize={12} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                        {deviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#818cf8' : index === 1 ? '#34d399' : '#fbbf24'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Funnel Dropoff */}
              <div className="lg:col-span-2 rounded-2xl border border-lo-border bg-lo-elevated/20 p-5">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-lo-muted mb-6">Macro Conversion Funnel (Estimated)</h4>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {funnelData.map((step, idx) => (
                    <React.Fragment key={step.step}>
                      <div className="flex-1 w-full flex flex-col items-center justify-center p-4 rounded-xl border border-lo-border bg-lo-panel relative overflow-hidden group">
                        <div className="absolute inset-0 bg-lo-accent/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <span className="text-xs font-semibold text-lo-muted uppercase tracking-wider mb-2 relative z-10">{step.step}</span>
                        <span className="text-2xl font-bold text-lo-text relative z-10">{new Intl.NumberFormat(localeForFormatting, { notation: 'compact' }).format(step.users)}</span>
                      </div>
                      {idx < funnelData.length - 1 && (
                        <div className="flex flex-col items-center text-rose-400">
                          <span className="text-[10px] font-bold mb-1">-{funnelData[idx + 1].dropoff}%</span>
                          <div className="w-8 h-px bg-lo-border hidden sm:block relative">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 border-t border-r border-lo-border rotate-45" />
                          </div>
                          <div className="h-4 w-px bg-lo-border block sm:hidden" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'executive' && (
          <ExecutiveAudit data={data} />
        )}

        {activeTab === 'revenue' && (
          <RevenueAnalytics data={data} />
        )}
      </div>
    </div>
  );
}
