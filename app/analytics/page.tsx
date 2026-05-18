'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, CheckCircle2, Clock, Users, WifiOff, RefreshCw,
  AlertTriangle, Timer,
} from 'lucide-react';
import Header from '@/components/Header';
import { api, dashboardApi } from '@/lib/api';

const STATUS_COLORS  = ['#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#a855f7'];

interface StatusItem   { name: string; value: number }
interface WeekItem     { week: string; created: number; completed: number }
interface WorkerItem   { id: string; name: string; role: string; completed: number }
interface PriorityItem { name: string; value: number; color: string }
interface AlertTypeItem{ name: string; value: number; color: string }
interface DailyItem    { day: string; completed: number; alerts: number }

export default function AnalyticsPage() {
  const [stats, setStats]             = useState({ totalJobs: 0, activeJobs: 0, completedJobs: 0, pendingJobs: 0, totalUsers: 0 });
  const [statusData, setStatusData]   = useState<StatusItem[]>([]);
  const [weeklyData, setWeeklyData]   = useState<WeekItem[]>([]);
  const [workers, setWorkers]         = useState<WorkerItem[]>([]);
  const [priorities, setPriorities]   = useState<PriorityItem[]>([]);
  const [alertTypes, setAlertTypes]   = useState<AlertTypeItem[]>([]);
  const [avgDays, setAvgDays]         = useState<number>(0);
  const [dailyData, setDailyData]     = useState<DailyItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState(false);

  const load = async () => {
    setLoading(true); setFetchError(false);
    try {
      const [dashRes, analyticsRes] = await Promise.all([
        dashboardApi.getStats(),
        api.get<{ success: boolean; data: {
          statusDistribution: StatusItem[];
          weeklyActivity: WeekItem[];
          workerProductivity: WorkerItem[];
          priorityDistribution: PriorityItem[];
          alertTypeDistribution: AlertTypeItem[];
          avgCompletionDays: number;
          dailyActivity: DailyItem[];
        } }>('/analytics'),
      ]);
      const s = dashRes.data.data.stats;
      setStats({ totalJobs: s.totalJobs, activeJobs: s.activeJobs, completedJobs: s.completedJobs, pendingJobs: s.pendingJobs, totalUsers: s.totalUsers });
      const d = analyticsRes.data.data;
      setStatusData(d.statusDistribution);
      setWeeklyData(d.weeklyActivity);
      setWorkers(d.workerProductivity);
      setPriorities(d.priorityDistribution);
      setAlertTypes(d.alertTypeDistribution);
      setAvgDays(d.avgCompletionDays);
      setDailyData(d.dailyActivity);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const completionRate = stats.totalJobs > 0 ? Math.round((stats.completedJobs / stats.totalJobs) * 100) : 0;
  const maxCompleted   = workers.length > 0 ? Math.max(...workers.map(w => w.completed), 1) : 1;
  const totalAlerts    = alertTypes.reduce((s, a) => s + a.value, 0);

  const formatAvgTime = (days: number) => {
    if (days < 0) return '—';                              // no completed jobs
    if (days < 1 / 24) return '< 1h';                     // less than 1 hour
    if (days < 1) return `${Math.round(days * 24)}h`;     // show in hours
    return `${Math.round(days * 10) / 10}d`;              // show in days
  };

  return (
    <>
      <Header
        title="Analytics"
        subtitle="Job performance and team productivity insights"
        action={
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      <main className="flex-1 p-6 overflow-y-auto" style={{ background: '#f1f5f9' }}>
        {fetchError && (
          <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <WifiOff size={16} className="flex-shrink-0" />
            <span>Cannot connect to backend. Make sure the server is running on port 4000.</span>
            <button onClick={load} className="ml-auto text-red-600 hover:underline font-medium">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-xl animate-pulse border border-slate-200" />)}
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── KPI row ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Completion Rate',   value: `${completionRate}%`, icon: TrendingUp,   color: 'text-green-600 bg-green-100' },
                { label: 'Total Jobs',        value: stats.totalJobs,      icon: CheckCircle2, color: 'text-amber-600 bg-amber-100' },
                { label: 'Active Now',        value: stats.activeJobs,     icon: Clock,        color: 'text-blue-600 bg-blue-100' },
                { label: 'Team Size',         value: stats.totalUsers,     icon: Users,        color: 'text-purple-600 bg-purple-100' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                    <Icon size={20} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* ── Extra KPIs: avg completion + active alerts ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
                  <Timer size={22} className="text-cyan-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{formatAvgTime(avgDays)}</p>
                  <p className="text-sm text-slate-500">Avg. Job Completion Time</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={22} className="text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalAlerts}</p>
                  <p className="text-sm text-slate-500">Total Active Alerts</p>
                </div>
              </div>
            </div>

            {/* ── Row 1: Status pie + Weekly bar ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 mb-4">Jobs by Status</h3>
                {statusData.every(s => s.value === 0) ? (
                  <div className="flex items-center justify-center h-60 text-slate-400 text-sm">No jobs yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value">
                        {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [v, 'jobs']} />
                      <Legend iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 mb-4">Weekly Job Activity</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={weeklyData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="created"   name="Created"   fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Row 2: Daily trend (area) + Alert types (donut) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 mb-1">Daily Activity (Last 7 Days)</h3>
                <p className="text-xs text-slate-400 mb-4">Steps completed vs alerts raised per day</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradAlerts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="completed" name="Steps Done" stroke="#f59e0b" strokeWidth={2} fill="url(#gradCompleted)" />
                    <Area type="monotone" dataKey="alerts"    name="Alerts"     stroke="#ef4444" strokeWidth={2} fill="url(#gradAlerts)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 mb-4">Alert Type Breakdown</h3>
                {totalAlerts === 0 ? (
                  <div className="flex items-center justify-center h-60">
                    <div className="text-center">
                      <CheckCircle2 size={32} className="text-green-400 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">No active alerts — all clear!</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={alertTypes} cx="50%" cy="50%" innerRadius={60} outerRadius={88} paddingAngle={5} dataKey="value">
                        {alertTypes.map((a, i) => <Cell key={i} fill={a.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [v, 'alerts']} />
                      <Legend iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── Row 3: Priority distribution (horizontal bar) ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 mb-5">Jobs by Priority</h3>
              {priorities.every(p => p.value === 0) ? (
                <p className="text-slate-400 text-sm text-center py-4">No jobs yet</p>
              ) : (
                <div className="space-y-3">
                  {priorities.map((p) => {
                    const max = Math.max(...priorities.map(x => x.value), 1);
                    return (
                      <div key={p.name} className="flex items-center gap-4">
                        <div className="w-16 text-sm font-medium text-slate-600 text-right flex-shrink-0">{p.name}</div>
                        <div className="flex-1 bg-slate-100 rounded-full h-3">
                          <div
                            className="h-3 rounded-full transition-all duration-700"
                            style={{ width: `${(p.value / max) * 100}%`, background: p.color }}
                          />
                        </div>
                        <div className="w-8 text-sm font-bold text-slate-700 flex-shrink-0">{p.value}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Row 4: Worker productivity ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 mb-5">Worker Productivity (Steps Completed)</h3>
              {workers.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">No workers or completed steps yet</p>
              ) : (
                <div className="space-y-3">
                  {workers.map((w, i) => (
                    <div key={w.id} className="flex items-center gap-3">
                      <div className="w-7 text-right text-sm font-medium text-slate-400">#{i + 1}</div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }}>
                        {w.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="w-32 flex-shrink-0">
                        <p className="text-sm font-medium text-slate-800 leading-none">{w.name}</p>
                        <p className="text-xs text-slate-400">{w.role}</p>
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full transition-all duration-700"
                            style={{ width: `${(w.completed / maxCompleted) * 100}%`, background: STATUS_COLORS[i % STATUS_COLORS.length] }}
                          />
                        </div>
                      </div>
                      <div className="w-12 text-right text-sm font-bold text-slate-700">{w.completed}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

