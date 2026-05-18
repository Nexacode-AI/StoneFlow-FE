'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  AlertTriangle, HelpCircle, Send, X, CheckCircle2,
  RefreshCw, Bell, ArrowRight, WifiOff,
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Pagination from '@/components/Pagination';
import { AlertStep } from '@/lib/api';

type Filter = 'ALL' | 'ISSUE' | 'HELP_NEEDED';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => { setLastUpdated(new Date()); }, []);

  // Reply state
  const [replyAlertId, setReplyAlertId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ workerName: string; jobNumber: string; type: 'reply' | 'resolve' } | null>(null);
  const [page, setPage]           = useState(1);
  const [resolveAlert, setResolveAlert] = useState<AlertStep | null>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`);
      const json = await res.json();
      setAlerts(json?.data?.alertSteps ?? []);
      setLastUpdated(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (replyAlertId) replyInputRef.current?.focus();
  }, [replyAlertId]);

  useEffect(() => { setPage(1); }, [filter]);

  function getAdminId() {
    try { return JSON.parse(localStorage.getItem('auth_user') ?? '{}').id ?? 'admin'; } catch { return 'admin'; }
  }

  function showToast(workerName: string, jobNumber: string, type: 'reply' | 'resolve') {
    setToast({ workerName, jobNumber, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleAlertReply(alert: AlertStep) {
    if (!replyText.trim()) return;
    setReplySending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/reply-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: alert.id, adminId: getAdminId(), message: replyText.trim() }),
      });
      if (res.ok) {
        const json = await res.json();
        setDismissedAlerts(prev => new Set(prev).add(alert.id));
        setReplyText('');
        setReplyAlertId(null);
        showToast(json.data?.workerName ?? alert.assignedUser?.name ?? 'Worker', alert.job.jobNumber, 'reply');
      }
    } catch { /* ignore */ }
    finally { setReplySending(false); }
  }

  async function handleResolveStep(alert: AlertStep) {
    setResolveAlert(alert);
  }

  async function confirmResolve() {
    if (!resolveAlert) return;
    const alert = resolveAlert;
    setResolveAlert(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/resolve-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: alert.id, adminId: getAdminId() }),
      });
      if (res.ok) {
        const json = await res.json();
        setDismissedAlerts(prev => new Set(prev).add(alert.id));
        setReplyAlertId(null);
        showToast(json.data?.workerName ?? alert.assignedUser?.name ?? 'Worker', alert.job.jobNumber, 'resolve');
      }
    } catch { /* ignore */ }
  }

  const visible = alerts.filter(a => !dismissedAlerts.has(a.id));
  const filtered = visible.filter(a => filter === 'ALL' || a.status === filter);
  const issueCount = visible.filter(a => a.status === 'ISSUE').length;
  const helpCount  = visible.filter(a => a.status === 'HELP_NEEDED').length;

  const PAGE_SIZE = 5;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <Header title="Alerts" />

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50">
          <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${
            toast.type === 'resolve'
              ? 'bg-green-900 border-green-700 text-white'
              : 'bg-slate-900 border-amber-500 text-white'
          }`} style={{ minWidth: 280, maxWidth: 360 }}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              toast.type === 'resolve' ? 'bg-green-700' : 'bg-amber-500'
            }`}>
              {toast.type === 'resolve'
                ? <CheckCircle2 size={18} className="text-white" />
                : <Send size={16} className="text-slate-900" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">
                {toast.type === 'resolve' ? 'Issue Resolved' : 'Message Sent'}
              </p>
              <p className="text-xs mt-0.5 text-slate-300">
                {toast.type === 'resolve'
                  ? `✅ ${toast.workerName} notified — alert cleared from Job #${toast.jobNumber}`
                  : `📩 ${toast.workerName} received your message on Job #${toast.jobNumber}`}
              </p>
              {toast.type === 'reply' && (
                <p className="text-xs mt-1 text-amber-400 font-medium">Worker will reply: DONE / ISSUE / HELP</p>
              )}
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white mt-0.5">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-6" style={{ background: '#f8fafc' }}>
        <div className="space-y-5">

          {/* ─── Header row ─── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Bell size={20} className="text-red-500" /> Active Alerts
                {visible.length > 0 && (
                  <span className="px-2.5 py-0.5 bg-red-500 text-white text-sm font-bold rounded-full">{visible.length}</span>
                )}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}</p>
            </div>
            <button
              onClick={load}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {/* ─── Stats row ─── */}
          {!loading && !error && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Alerts', count: visible.length, color: 'border-red-200 bg-red-50', text: 'text-red-700', badge: 'bg-red-500' },
                { label: 'Issues', count: issueCount, color: 'border-orange-200 bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-500' },
                { label: 'Help Requests', count: helpCount, color: 'border-amber-200 bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-500' },
              ].map(({ label, count, color, text, badge }) => (
                <div key={label} className={`rounded-xl border p-4 ${color}`}>
                  <p className={`text-xs font-medium ${text}`}>{label}</p>
                  <div className="flex items-end gap-2 mt-1">
                    <span className={`text-2xl font-bold ${text}`}>{count}</span>
                    <span className={`mb-0.5 px-1.5 py-0.5 rounded-full text-white text-[10px] font-bold ${badge}`}>active</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── Filter tabs ─── */}
          {!loading && !error && visible.length > 0 && (
            <div className="flex gap-2">
              {([
                { key: 'ALL', label: `All (${visible.length})` },
                { key: 'ISSUE', label: `⚠️ Issues (${issueCount})` },
                { key: 'HELP_NEEDED', label: `🆘 Help (${helpCount})` },
              ] as { key: Filter; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    filter === key
                      ? 'border-amber-400 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                  style={filter === key ? { background: '#f59e0b' } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* ─── Loading ─── */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={22} className="animate-spin text-slate-400" />
            </div>
          )}

          {/* ─── Error ─── */}
          {error && (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <WifiOff size={32} className="text-slate-300" />
              <p className="text-slate-500 font-medium">Could not load alerts</p>
              <button onClick={load} className="text-amber-600 text-sm hover:underline">Try again</button>
            </div>
          )}

          {/* ─── Empty ─── */}
          {!loading && !error && visible.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-20 text-center bg-white rounded-2xl border border-slate-200">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-green-500" />
              </div>
              <div>
                <p className="text-slate-700 font-semibold text-lg">All clear!</p>
                <p className="text-slate-400 text-sm mt-1">No active alerts. All workers are on track.</p>
              </div>
              <Link href="/" className="text-amber-600 text-sm hover:underline">← Back to Dashboard</Link>
            </div>
          )}

          {/* ─── Alert cards ─── */}
          {!loading && !error && filtered.length > 0 && (
            <div className="space-y-3">
              {paginated.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                    alert.status === 'ISSUE' ? 'border-red-200' : 'border-orange-200'
                  }`}
                >
                  {/* Coloured top bar */}
                  <div className={`h-1 w-full ${alert.status === 'ISSUE' ? 'bg-red-500' : 'bg-orange-400'}`} />

                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        alert.status === 'ISSUE' ? 'bg-red-100' : 'bg-orange-100'
                      }`}>
                        {alert.status === 'ISSUE'
                          ? <AlertTriangle size={20} className="text-red-600" />
                          : <HelpCircle size={20} className="text-orange-600" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            alert.status === 'ISSUE' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {alert.status === 'ISSUE' ? '⚠️ ISSUE' : '🆘 HELP'}
                          </span>
                          <span className="text-slate-800 font-semibold text-sm">{alert.name}</span>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Job</p>
                            <p className="text-sm font-semibold text-slate-700">{alert.job.jobNumber}</p>
                            <p className="text-xs text-slate-500">{alert.job.title}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Worker</p>
                            <p className="text-sm font-semibold text-slate-700">{alert.assignedUser?.name ?? 'Unknown'}</p>
                            <p className="text-xs text-slate-400">{new Date(alert.updatedAt).toLocaleString()}</p>
                          </div>
                        </div>

                        {alert.issueText && (
                          <div className="mt-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                            <p className="text-xs text-red-600 italic">"{alert.issueText}"</p>
                          </div>
                        )}

                        {/* Inline reply box */}
                        {replyAlertId === alert.id && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                ref={replyInputRef}
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleAlertReply(alert);
                                  if (e.key === 'Escape') setReplyAlertId(null);
                                }}
                                placeholder={`Message to ${alert.assignedUser?.name ?? 'worker'}…`}
                                className="flex-1 px-3 py-2 text-sm border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                              />
                              <button
                                onClick={() => handleAlertReply(alert)}
                                disabled={replySending || !replyText.trim()}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-slate-900 disabled:opacity-50 transition-all"
                                style={{ background: '#f59e0b' }}
                              >
                                <Send size={14} /> {replySending ? 'Sending…' : 'Send'}
                              </button>
                              <button onClick={() => setReplyAlertId(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                                <X size={16} />
                              </button>
                            </div>
                            <p className="text-xs text-slate-400">
                              Worker will receive this in their language with <strong>DONE / ISSUE / HELP</strong> reply options
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      {replyAlertId !== alert.id && (
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => { setReplyAlertId(alert.id); setReplyText(''); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-900 transition-colors"
                            style={{ background: '#f59e0b' }}
                          >
                            <Send size={14} /> Reply
                          </button>
                          <button
                            onClick={() => handleResolveStep(alert)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-green-700 border border-green-300 bg-green-50 hover:bg-green-100 transition-colors"
                          >
                            <CheckCircle2 size={14} /> Resolve
                          </button>
                          <Link
                            href={`/jobs/${alert.job.id}`}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                          >
                            <ArrowRight size={14} /> View Job
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No results for this filter */}
          {!loading && !error && visible.length > 0 && filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              No {filter === 'ISSUE' ? 'issues' : 'help requests'} right now
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          )}

        </div>
      </main>

      {/* Resolve Confirmation Dialog */}
      {resolveAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={24} className="text-green-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-center mb-1 text-lg">Resolve Alert?</h3>
            <p className="text-sm text-slate-500 text-center mb-1">
              <span className="font-semibold text-slate-700">{resolveAlert.assignedUser?.name ?? 'Worker'}</span> — {resolveAlert.name}
            </p>
            <p className="text-xs text-slate-400 text-center mb-6">
              Job {resolveAlert.job.jobNumber} · The worker will be notified to continue.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setResolveAlert(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmResolve}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-green-500 rounded-xl hover:bg-green-600 transition-colors shadow-sm"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
