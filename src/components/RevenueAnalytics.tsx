import React from 'react';
import { DashboardData } from '../types';
import { useLocale } from '../context/LocaleContext';
import {
  Banknote,
  Box,
  Globe2,
  PackageCheck,
  Percent,
  ShoppingCart,
  TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';

interface RevenueAnalyticsProps {
  data: DashboardData;
}

export function RevenueAnalytics({ data }: RevenueAnalyticsProps) {
  const { locale } = useLocale();
  const localeForFormatting = locale || 'en-US';
  const orders = data.ordersData;

  if (!orders) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-lo-border bg-lo-panel">
        <p className="text-lo-muted">Sales and revenue data is not available for this dataset. Please upload a Shopify Orders CSV.</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(localeForFormatting, {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat(localeForFormatting).format(value);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-lo-border/50 pb-6">
        <div>
          <h3 className="text-2xl font-bold text-lo-text flex items-center gap-2">
            <Banknote className="h-6 w-6 text-emerald-400" />
            Sales & Revenue Intelligence
          </h3>
          <p className="text-sm text-lo-muted mt-1">Order volume, product performance, and financial metrics.</p>
        </div>
        <button className="rounded-xl border border-lo-border bg-lo-panel px-4 py-2 text-sm font-medium transition-colors hover:bg-lo-elevated-hover" onClick={() => window.print()}>
          Print Financial Report
        </button>
      </div>

      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20 text-emerald-500">
            <TrendingUp className="h-16 w-16" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Total Revenue</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-emerald-400">{formatCurrency(orders.totalRevenue)}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-lo-border bg-lo-panel p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
            <ShoppingCart className="h-16 w-16" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-lo-muted">Average Order Value</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-lo-text">{formatCurrency(orders.averageOrderValue)}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-lo-border bg-lo-panel p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
            <PackageCheck className="h-16 w-16" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-lo-muted">Total Orders</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-lo-text">{formatNumber(orders.orderVolume)}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20 text-amber-500">
            <Percent className="h-16 w-16" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Discount Impact</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-amber-400">-{formatCurrency(orders.discountImpact)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Top Products (Takes up 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-lo-border bg-lo-panel overflow-hidden">
            <div className="border-b border-lo-border/50 bg-lo-elevated/30 px-6 py-4 flex items-center gap-2">
              <Box className="h-5 w-5 text-lo-accent" />
              <h4 className="font-bold text-lo-text">Product Revenue Leaderboard</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-lo-elevated text-lo-muted">
                  <tr>
                    <th className="px-6 py-3 font-medium">Product</th>
                    <th className="px-6 py-3 font-medium">SKU</th>
                    <th className="px-6 py-3 font-medium text-right">Units Sold</th>
                    <th className="px-6 py-3 font-medium text-right">Gross Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lo-border/50">
                  {orders.topProducts.slice(0, 10).map((product, idx) => (
                    <tr key={idx} className="hover:bg-lo-elevated/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-lo-text">
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded bg-lo-elevated text-xs text-lo-muted font-bold">
                            {idx + 1}
                          </span>
                          {product.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-lo-muted font-mono text-xs">{product.sku}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatNumber(product.quantity)}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-400">{formatCurrency(product.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Geo & Insights */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-lo-border bg-lo-panel p-6">
            <div className="flex items-center gap-2 mb-6">
              <Globe2 className="h-5 w-5 text-lo-accent" />
              <h4 className="font-bold text-lo-text">Geographic Distribution</h4>
            </div>
            <div className="space-y-4">
              {orders.geoDistribution.slice(0, 5).map((geo, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lo-text font-medium">{geo.country}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-lo-muted">{formatNumber(geo.count)} orders</span>
                    <div className="w-16 h-1.5 bg-lo-elevated rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-lo-accent" 
                        style={{ width: `${(geo.count / orders.geoDistribution[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-lo-accent/20 bg-lo-accent/5 p-6">
            <h4 className="font-bold text-lo-accent mb-2">CRO Data Merging</h4>
            <p className="text-sm text-lo-muted mb-4">
              Combine your Shopify Orders export with a Lucky Orange Heatmaps export to unlock "Traffic vs Conversion" insights.
            </p>
            <div className="text-xs font-mono text-lo-text/80 bg-lo-bg/50 p-3 rounded-lg border border-lo-border">
              Missing Lucky Orange behavioral data for these products to compute hidden friction.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
