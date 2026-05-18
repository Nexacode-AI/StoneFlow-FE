'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, ArrowUpRight, ArrowDownLeft, Search, RefreshCw, WifiOff } from 'lucide-react';
import { api } from '@/lib/api';
import Header from '@/components/Header';

interface WaMessage {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  content: string;
  status: string;
  sentAt: string;
  job?: { id: string; jobNumber: string; title: string };
  user?: { id: string; name: string; phone: string };
}

export default function MessagesPage() {
  const [messages, setMessages]   = useState<WaMessage[]>([]);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [search, setSearch]       = useState('');
  const [dir, setDir]             = useState<'ALL' | 'INBOUND' | 'OUTBOUND'>('ALL');
  const [selected, setSelected]   = useState<WaMessage | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);

  const load = async () => {
    setLoading(true); setFetchError(false);
    try {
      const res = await api.get<{ data: WaMessage[] }>('/messages');
      setMessages(res.data.data);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setVisibleCount(20); }, [dir, search]);

  const filtered = messages.filter(m => {
    const matchDir = dir === 'ALL' || m.direction === dir;
    const q = search.toLowerCase();
    const matchQ = !q || m.content.toLowerCase().includes(q)
      || m.user?.name.toLowerCase().includes(q)
      || m.job?.jobNumber.toLowerCase().includes(q);
    return matchDir && matchQ;
  });

  const fmt = (d: string) => new Date(d).toLocaleString('en-MY', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <>
      <Header
        title="WhatsApp Logs"
        subtitle="Message history between system and workers"
        action={
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      <main className="flex-1 p-6 overflow-y-auto flex flex-col min-h-0">
        {fetchError && (
          <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <WifiOff size={16} className="flex-shrink-0" />
            <span>Cannot connect to backend. Make sure the server is running on port 4000.</span>
            <button onClick={load} className="ml-auto text-red-600 hover:underline font-medium">Retry</button>
          </div>
        )}
        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search messages, workers, jobs..."
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
            {(['ALL', 'OUTBOUND', 'INBOUND'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDir(d)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${dir === d ? 'text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
                style={dir === d ? { background: '#f59e0b' } : {}}
              >
                {d === 'ALL' ? 'All' : d === 'OUTBOUND' ? '↑ Sent' : '↓ Received'}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-lg">{filtered.length} messages</span>
        </div>

        <div className="flex gap-5 flex-1 min-h-0">
          {/* Message list */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div
              className="overflow-y-auto flex-1"
              onScroll={e => {
                const el = e.currentTarget;
                if (el.scrollHeight - el.scrollTop <= el.clientHeight + 80) {
                  setVisibleCount(prev => Math.min(prev + 20, filtered.length));
                }
              }}
            >
              {loading ? (
                <div className="p-6 space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-lg animate-pulse" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <MessageSquare size={36} className="mx-auto mb-2 opacity-30" />
                  <p>No messages found</p>
                </div>
              ) : (
                filtered.slice(0, visibleCount).map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className={`w-full text-left px-4 py-3.5 border-b border-slate-50 hover:bg-amber-50 transition-colors flex items-start gap-3 ${selected?.id === m.id ? 'bg-amber-50' : ''}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      m.direction === 'OUTBOUND' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {m.direction === 'OUTBOUND'
                        ? <ArrowUpRight size={13} />
                        : <ArrowDownLeft size={13} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-800 text-sm truncate">{m.user?.name ?? m.user?.phone ?? 'Unknown'}</span>
                        <span className="text-xs text-slate-400 flex-shrink-0">{fmt(m.sentAt)}</span>
                      </div>
                      {m.job && (
                        <span className="text-xs text-slate-400">{m.job.jobNumber}</span>
                      )}
                      <p className="text-xs text-slate-500 truncate mt-0.5">{m.content}</p>
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 font-medium ${
                      m.status === 'sent' || m.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                      m.status === 'received' ? 'bg-green-100 text-green-700' :
                      m.status === 'demo_sent' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {m.status}
                    </div>
                  </button>
                ))
              )}
              {!loading && visibleCount < filtered.length && (
                <div className="py-3 text-center text-xs text-slate-400 border-t border-slate-50">
                  Scroll down to load more ({filtered.length - visibleCount} remaining)
                </div>
              )}
            </div>
          </div>

          {/* Message detail */}
          {selected && (
            <div className="w-80 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex-shrink-0 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">Message Detail</h3>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400">Direction</span>
                  <p className="font-medium text-slate-700">{selected.direction}</p>
                </div>
                <div>
                  <span className="text-slate-400">Status</span>
                  <p className="font-medium text-slate-700">{selected.status}</p>
                </div>
                <div>
                  <span className="text-slate-400">Time</span>
                  <p className="font-medium text-slate-700">{fmt(selected.sentAt)}</p>
                </div>
                {selected.user && (
                  <div>
                    <span className="text-slate-400">Worker</span>
                    <p className="font-medium text-slate-700">{selected.user.name}</p>
                    <p className="text-slate-400">{selected.user.phone}</p>
                  </div>
                )}
                {selected.job && (
                  <div>
                    <span className="text-slate-400">Job</span>
                    <a href={`/jobs/${selected.job.id}`} className="block font-medium text-amber-600 hover:underline">
                      {selected.job.jobNumber}
                    </a>
                    <p className="text-slate-500">{selected.job.title}</p>
                  </div>
                )}
              </div>
              <div>
                <span className="text-xs text-slate-400 mb-1 block">Content</span>
                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-100">
                  {selected.content}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
