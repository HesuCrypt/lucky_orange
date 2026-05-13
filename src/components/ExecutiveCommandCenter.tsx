import React from 'react';
import { DashboardData } from '../types';
import { 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  Heart,
  Layers,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ExecutiveCommandCenterProps {
  data: DashboardData;
}

export function ExecutiveCommandCenter({ data }: ExecutiveCommandCenterProps) {
  const orders = data.ordersData;
  const audit = data.executiveAudit;
  const linked = data.linkedInsights || [];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Hero Pulse Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-[2rem] p-8 relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-lo-accent/20 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-widest text-lo-accent">Executive Command Center</span>
            </div>
            
            <h2 className="text-6xl font-black text-lo-text mb-2 tracking-tight">
              <span className="text-gradient-lo">{orders ? formatCurrency(orders.totalRevenue) : '₱0'}</span>
            </h2>
            <p className="text-lo-muted flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400 font-bold">+12.5%</span> <span className="text-lo-muted text-xs">Projected Revenue Growth</span>
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mt-12">
              <div>
                <p className="text-[10px] text-lo-muted uppercase font-bold tracking-widest mb-1">Health Score</p>
                <p className={cn(
                  "text-3xl font-black",
                  data.overallHealth > 80 ? "text-emerald-400" : "text-amber-400"
                )}>{data.overallHealth}%</p>
              </div>
              <div>
                <p className="text-[10px] text-lo-muted uppercase font-bold tracking-widest mb-1">Avg Order</p>
                <p className="text-3xl font-black text-lo-text">{orders ? formatCurrency(orders.averageOrderValue) : '₱0'}</p>
              </div>
              <div>
                <p className="text-[10px] text-lo-muted uppercase font-bold tracking-widest mb-1">Conversion</p>
                <p className="text-3xl font-black text-lo-text">
                  {orders && data.totalViews > 0 ? ((orders.orderVolume / data.totalViews) * 100).toFixed(1) : '0'}%
                </p>
              </div>
              <div>
                <p className="text-[10px] text-lo-muted uppercase font-bold tracking-widest mb-1">Retention</p>
                <p className="text-3xl font-black text-emerald-400">{orders?.retentionMetrics?.repeatCustomerRate.toFixed(1) || '0'}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-8 flex flex-col justify-between group">
          <div className="absolute inset-0 bg-lo-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <h3 className="font-bold text-lo-text flex items-center gap-2 mb-6">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Risk Mitigation
            </h3>
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 glass-card-hover">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-lo-muted">Abandoned Value</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">CRITICAL</span>
                </div>
                <p className="text-2xl font-black text-lo-text">
                  {formatCurrency(linked.reduce((sum, item) => sum + (item.revenue * 0.22), 0))}
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 glass-card-hover">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-lo-muted">Active Friction</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">STABLE</span>
                </div>
                <p className="text-2xl font-black text-lo-text">{audit?.frictionPulse || 0} <span className="text-xs font-normal text-lo-muted ml-1">Events</span></p>
              </div>
            </div>
          </div>
          <button className="relative z-10 w-full mt-8 py-4 rounded-2xl bg-lo-accent text-lo-bg font-black text-sm hover:scale-[1.02] transition-all active:scale-95 shadow-xl shadow-lo-accent/30 uppercase tracking-widest">
            Execute Full Audit
          </button>
        </div>
      </div>

      {/* Linked Intelligence: Revenue Leaks */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-lo-text px-2">Top Revenue Blockers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {linked.slice(0, 3).map((item, idx) => (
            <div key={idx} className="group rounded-[1.5rem] bg-lo-panel border border-lo-border p-6 hover:border-lo-accent/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 rounded-xl bg-lo-accent/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-lo-accent" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-black text-lo-muted tracking-tighter">Lost Potenital</p>
                  <p className="text-lg font-bold text-rose-400">₱{Math.round(item.revenue * 0.2).toLocaleString()}</p>
                </div>
              </div>
              <h4 className="font-bold text-lo-text line-clamp-1 mb-1">{item.productName}</h4>
              <p className="text-xs text-lo-muted mb-6 truncate">{item.url}</p>
              
              <div className="grid grid-cols-2 gap-4 border-t border-lo-border pt-4">
                <div>
                  <p className="text-[10px] uppercase text-lo-muted font-bold">Friction</p>
                  <p className="text-sm font-bold text-amber-400">{item.frictionScore} Events</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-lo-muted font-bold">Bounce Rate</p>
                  <p className="text-sm font-bold text-rose-400">{item.bounceRate}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Pulse Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Reach" 
          value={data.totalViews.toLocaleString()} 
          unit="Views" 
          icon={<Users className="h-4 w-4" />} 
          color="emerald" 
        />
        <StatCard 
          title="UX Sentiment" 
          value={(data.overallHealth / 10).toFixed(1)} 
          unit="/10" 
          icon={<Heart className="h-4 w-4" />} 
          color="rose" 
        />
        <StatCard 
          title="Avg Session" 
          value={Math.round(audit?.sessionDurationAvg || 124).toString()} 
          unit="sec" 
          icon={<Zap className="h-4 w-4" />} 
          color="amber" 
        />
        <StatCard 
          title="Segments" 
          value={data.categories.length.toString()} 
          unit="active" 
          icon={<Layers className="h-4 w-4" />} 
          color="lo-accent" 
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, unit, icon, color }: { title: string; value: string; unit: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-2xl bg-lo-panel border border-lo-border p-4 flex items-center gap-4">
      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center",
        color === 'emerald' ? "bg-emerald-500/10 text-emerald-400" :
        color === 'rose' ? "bg-rose-500/10 text-rose-400" :
        color === 'amber' ? "bg-amber-500/10 text-amber-400" :
        "bg-lo-accent/10 text-lo-accent"
      )}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase font-bold text-lo-muted tracking-tight">{title}</p>
        <div className="flex items-baseline gap-1">
          <p className="text-lg font-bold text-lo-text">{value}</p>
          <p className="text-[10px] text-lo-muted font-bold">{unit}</p>
        </div>
      </div>
    </div>
  );
}
