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
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Hero Pulse Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-10 relative overflow-hidden group border-white/5">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-lo-accent/10 rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lo-accent">Executive Command Center</span>
            </div>
            
            <div className="mb-2">
              <p className="text-sm font-bold text-lo-muted mb-1">Total Revenue (Period)</p>
              <h2 className="text-7xl font-black text-white tracking-tighter">
                {orders ? formatCurrency(orders.totalRevenue) : '₱0'}
              </h2>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">+12.5%</span>
              </div>
              <span className="text-xs text-lo-muted font-medium italic">Projected Growth vs Last Month</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mt-16">
              <KPI label="Health Score" value={`${data.overallHealth}%`} color={data.overallHealth > 80 ? "emerald" : "amber"} />
              <KPI label="Avg Order" value={orders ? formatCurrency(orders.averageOrderValue) : '₱0'} />
              <KPI label="Conversion" value={`${orders && data.totalViews > 0 ? ((orders.orderVolume / data.totalViews) * 100).toFixed(1) : '0'}%`} />
              <KPI label="Retention" value={`${orders?.retentionMetrics?.repeatCustomerRate.toFixed(1) || '0'}%`} color="emerald" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-[2.5rem] p-10 flex flex-col justify-between group border-white/5">
          <div className="relative z-10">
            <h3 className="font-black text-white flex items-center gap-3 mb-8 uppercase tracking-widest text-xs">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Risk Mitigation
            </h3>
            <div className="space-y-6">
              <div className="p-6 rounded-[1.5rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-default">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-lo-muted">Abandoned Value</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">CRITICAL</span>
                </div>
                <p className="text-3xl font-black text-white tracking-tight">
                  {formatCurrency(linked.reduce((sum, item) => sum + (item.revenue * 0.22), 0))}
                </p>
              </div>
              <div className="p-6 rounded-[1.5rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-default">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-lo-muted">Active Friction</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">STABLE</span>
                </div>
                <p className="text-3xl font-black text-white tracking-tight">{audit?.frictionPulse || 0} <span className="text-xs font-normal text-lo-muted ml-1 italic font-medium">Events</span></p>
              </div>
            </div>
          </div>
          <button className="relative z-10 w-full mt-10 py-5 rounded-2xl bg-lo-accent text-white font-black text-xs hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all active:scale-95 uppercase tracking-[0.2em]">
            Execute Full Audit
          </button>
        </div>
      </div>

      {/* Linked Intelligence: Revenue Leaks */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 px-2">
          <h3 className="text-2xl font-black text-white tracking-tight">Revenue Blockers</h3>
          <div className="h-[1px] flex-1 bg-lo-border" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {linked.slice(0, 3).map((item, idx) => (
            <div key={idx} className="group rounded-[2rem] bg-lo-panel border border-lo-border p-8 hover:border-lo-accent/40 transition-all duration-500 hover:-translate-y-1">
              <div className="flex justify-between items-start mb-6">
                <div className="h-12 w-12 rounded-2xl bg-lo-accent/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-lo-accent" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-black text-lo-muted tracking-widest mb-1">Lost Potenital</p>
                  <p className="text-xl font-black text-rose-400 tracking-tighter">₱{Math.round(item.revenue * 0.2).toLocaleString()}</p>
                </div>
              </div>
              <h4 className="font-bold text-white text-lg line-clamp-1 mb-1 tracking-tight">{item.productName}</h4>
              <p className="text-xs text-lo-muted mb-8 truncate font-medium">{item.url}</p>
              
              <div className="grid grid-cols-2 gap-6 border-t border-lo-border pt-6">
                <div>
                  <p className="text-[10px] uppercase text-lo-muted font-black tracking-widest mb-1">Friction</p>
                  <p className="text-base font-black text-amber-400 tracking-tight">{item.frictionScore} Events</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-lo-muted font-black tracking-widest mb-1">Bounce Rate</p>
                  <p className="text-base font-black text-rose-400 tracking-tight">{item.bounceRate}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Pulse Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Reach" value={data.totalViews.toLocaleString()} unit="Views" icon={<Users className="h-4 w-4" />} color="emerald" />
        <StatCard title="UX Sentiment" value={(data.overallHealth / 10).toFixed(1)} unit="/10" icon={<Heart className="h-4 w-4" />} color="rose" />
        <StatCard title="Avg Session" value={Math.round(audit?.sessionDurationAvg || 124).toString()} unit="sec" icon={<Zap className="h-4 w-4" />} color="amber" />
        <StatCard title="Segments" value={data.categories.length.toString()} unit="active" icon={<Layers className="h-4 w-4" />} color="lo-accent" />
      </div>
    </div>
  );
}

function KPI({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] text-lo-muted uppercase font-black tracking-[0.15em] mb-2">{label}</p>
      <p className={cn(
        "text-4xl font-black tracking-tighter",
        color === 'emerald' ? "text-emerald-400" :
        color === 'amber' ? "text-amber-400" :
        "text-white"
      )}>{value}</p>
    </div>
  );
}</div>
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
