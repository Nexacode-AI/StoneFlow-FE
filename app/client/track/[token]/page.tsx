'use client';

import { use, useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2, Clock, AlertTriangle, HelpCircle, PlayCircle,
  SkipForward, Bell, Layers, Calendar, Package, Ruler,
  Palette, RefreshCw, Loader2, XCircle,
} from 'lucide-react';
import { clientPortalApi, ClientJob, StepStatus } from '@/lib/api';

// ─── Step status config ────────────────────────────────────────────────────────
const stepConfig: Record<StepStatus, {
  icon: typeof CheckCircle2;
  color: string;
  bg: string;
  ring: string;
  label: string;
}> = {
  WAITING:     { icon: Clock,         color: 'text-slate-400', bg: 'bg-slate-100',   ring: 'border-slate-200', label: 'Waiting' },
  NOTIFIED:    { icon: Bell,          color: 'text-blue-600',  bg: 'bg-blue-100',    ring: 'border-blue-300',  label: 'Notified' },
  IN_PROGRESS: { icon: PlayCircle,    color: 'text-amber-600', bg: 'bg-amber-100',   ring: 'border-amber-400', label: 'In Progress' },
  ISSUE:       { icon: AlertTriangle, color: 'text-red-600',   bg: 'bg-red-100',     ring: 'border-red-400',   label: 'Issue Reported' },
  HELP_NEEDED: { icon: HelpCircle,    color: 'text-orange-600',bg: 'bg-orange-100',  ring: 'border-orange-400',label: 'Help Needed' },
  COMPLETED:   { icon: CheckCircle2,  color: 'text-green-600', bg: 'bg-green-100',   ring: 'border-green-400', label: 'Completed' },
  SKIPPED:     { icon: SkipForward,   color: 'text-slate-400', bg: 'bg-slate-100',   ring: 'border-slate-200', label: 'Skipped' },
};

const jobStatusStyles: Record<string, { label: string; cls: string }> = {
  PENDING:     { label: 'Pending',     cls: 'bg-slate-100 text-slate-600' },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-amber-100 text-amber-700' },
  PAUSED:      { label: 'Paused',      cls: 'bg-yellow-100 text-yellow-700' },
  COMPLETED:   { label: 'Completed',   cls: 'bg-green-100 text-green-700' },
  CANCELLED:   { label: 'Cancelled',   cls: 'bg-red-100 text-red-600' },
};

// ─── Progress Ring ─────────────────────────────────────────────────────────────
function ProgressRing({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#e2e8f0" strokeWidth="9" />
        <circle
          cx="56" cy="56" r={r} fill="none"
          stroke={pct === 100 ? '#22c55e' : '#f59e0b'} strokeWidth="9"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 56 56)"
          style={{ transition: 'stroke-dasharray 0.7s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: pct === 100 ? '#22c55e' : '#f59e0b' }}>
          {Math.round(pct)}%
        </span>
        <span className="text-xs text-slate-400 mt-0.5">{value}/{total}</span>
      </div>
    </div>
  );
}

// ─── Step timeline item ────────────────────────────────────────────────────────
function StepItem({ step, isLast }: { step: ClientJob['workflowSteps'][number]; isLast: boolean }) {
  const cfg = stepConfig[step.status] ?? stepConfig.WAITING;
  const Icon = cfg.icon;
  const isActive = step.status === 'IN_PROGRESS' || step.status === 'NOTIFIED';

  return (
    <div className="flex gap-4">
      {/* connector */}
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${cfg.bg} ${cfg.ring} ${isActive ? 'shadow-md' : ''}`}
        >
          <Icon size={18} className={cfg.color} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
      </div>

      {/* content */}
      <div className={`pb-6 flex-1 ${isLast ? '' : ''}`}>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Step {step.stepNumber}
            </span>
            <h3 className={`font-semibold text-slate-800 text-sm mt-0.5 ${isActive ? 'text-amber-700' : ''}`}>
              {step.name}
            </h3>
            {step.description && (
              <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
            )}
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.bg} ${cfg.color} border ${cfg.ring}`}>
            {cfg.label}
          </span>
        </div>

        {/* timestamps */}
        <div className="flex flex-wrap gap-3 mt-2">
          {step.startedAt && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <PlayCircle size={11} /> Started {new Date(step.startedAt).toLocaleString()}
            </span>
          )}
          {step.completedAt && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 size={11} /> Done {new Date(step.completedAt).toLocaleString()}
            </span>
          )}
          {step.dueAt && step.status !== 'COMPLETED' && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock size={11} /> Due {new Date(step.dueAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ClientTrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [job, setJob] = useState<ClientJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await clientPortalApi.track(token);
      setJob(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: unknown) {
      setError((err as Error).message || 'Could not load tracking data.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
    // Auto-refresh every 30 seconds
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#f59e0b' }}>
            <Layers size={28} className="text-white" />
          </div>
          <Loader2 size={24} className="animate-spin text-amber-500" />
          <p className="text-slate-500 text-sm">Loading your job tracker…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f8fafc' }}>
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
            <XCircle size={28} className="text-red-500" />
          </div>
          <h2 className="font-bold text-slate-800 text-lg">Link Not Found</h2>
          <p className="text-slate-500 text-sm">
            {error || 'This tracking link is invalid or has been revoked. Please contact us for your job reference.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2 text-sm text-slate-400">
            <Layers size={14} className="text-amber-500" />
            <span className="font-semibold text-slate-600">Stone Co.</span>
          </div>
        </div>
      </div>
    );
  }

  const pct = job.totalSteps > 0 ? Math.round((job.completedSteps / job.totalSteps) * 100) : 0;
  const activeStep = job.workflowSteps.find(
    (s) => s.status === 'IN_PROGRESS' || s.status === 'NOTIFIED'
  );
  const jobStatus = jobStatusStyles[job.status] ?? { label: job.status, cls: 'bg-slate-100 text-slate-600' };
  const isOverdue = new Date(job.deadline) < new Date() && job.status !== 'COMPLETED';

  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
      {/* ── Top header bar ── */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 shadow-sm"
        style={{ background: '#0f172a' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: '#f59e0b' }}
          >
            <Layers size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-tight">Stone Co.</span>
          <span className="text-slate-600 text-sm hidden sm:block">· Job Tracker</span>
        </div>

        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={13} />
          <span className="hidden sm:inline">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Refresh'}
          </span>
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* ── Hero card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* amber accent bar */}
          <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono font-semibold text-slate-400 tracking-wider uppercase">
                    {job.jobNumber}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${jobStatus.cls}`}>
                    {jobStatus.label}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-slate-800 leading-snug">{job.title}</h1>
                <p className="text-sm text-slate-500 mt-0.5">For {job.clientName}</p>
              </div>
              <ProgressRing value={job.completedSteps} total={job.totalSteps} />
            </div>

            {/* Active step banner */}
            {activeStep && (
              <div className="mt-4 flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0 animate-pulse" />
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Currently working on:</span>{' '}
                  Step {activeStep.stepNumber} – {activeStep.name}
                </p>
              </div>
            )}

            {job.status === 'COMPLETED' && (
              <div className="mt-4 flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800 font-medium">
                  Your job is complete!
                  {job.completedAt && ` Finished on ${new Date(job.completedAt).toLocaleDateString()}.`}
                </p>
              </div>
            )}

            {/* Key details grid */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {job.material && (
                <div className="flex items-start gap-2">
                  <Package size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Material</p>
                    <p className="text-sm text-slate-700 font-semibold">{job.material}</p>
                  </div>
                </div>
              )}
              {job.color && (
                <div className="flex items-start gap-2">
                  <Palette size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Color</p>
                    <p className="text-sm text-slate-700 font-semibold">{job.color}</p>
                  </div>
                </div>
              )}
              {job.measurements && (
                <div className="flex items-start gap-2">
                  <Ruler size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Size</p>
                    <p className="text-sm text-slate-700 font-semibold leading-tight">{job.measurements}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Calendar size={14} className={`mt-0.5 flex-shrink-0 ${isOverdue ? 'text-red-500' : 'text-amber-500'}`} />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Deadline</p>
                  <p className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                    {new Date(job.deadline).toLocaleDateString()}
                    {isOverdue && ' (Overdue)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {job.description && (
              <p className="mt-4 text-sm text-slate-500 border-t border-slate-100 pt-4">
                {job.description}
              </p>
            )}
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-700 text-sm">Overall Progress</h2>
            <span className="text-sm font-bold" style={{ color: pct === 100 ? '#22c55e' : '#f59e0b' }}>
              {pct}%
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: pct === 100
                  ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                  : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {job.completedSteps} of {job.totalSteps} steps completed
          </p>
        </div>

        {/* ── Workflow steps timeline ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-700 text-sm mb-5">Fabrication Steps</h2>
          {job.workflowSteps.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Clock size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No workflow steps assigned yet.</p>
            </div>
          ) : (
            <div>
              {job.workflowSteps.map((step, idx) => (
                <StepItem
                  key={step.id}
                  step={step}
                  isLast={idx === job.workflowSteps.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="text-center text-xs text-slate-400 pb-4 space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <Layers size={12} className="text-amber-500" />
            <span className="font-semibold text-slate-500">Stone Co. Sdn Bhd</span>
          </div>
          <p>This page refreshes automatically every 30 seconds.</p>
          <p>Job reference: <span className="font-mono font-medium text-slate-600">{job.jobNumber}</span></p>
        </div>
      </main>
    </div>
  );
}
