'use client';

import { useEffect, useState } from 'react';
import {
  GitBranch, Plus, Trash2, X, ChevronDown, Check, Star, Layers, WifiOff, RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Pagination from '@/components/Pagination';

interface StepDef { stepNumber: number; name: string; description?: string }
interface Template { id: string; name: string; description?: string; steps: StepDef[]; isDefault: boolean; createdAt: string }

export default function WorkflowsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [name, setName]           = useState('');
  const [desc, setDesc]           = useState('');
  const [steps, setSteps]         = useState<StepDef[]>([{ stepNumber: 1, name: '', description: '' }]);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [page, setPage]           = useState(1);

  const load = async () => {
    setFetchError(false);
    try {
      const r = await api.get<{ data: Template[] }>('/workflow-templates');
      setTemplates(r.data.data);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addStep = () => setSteps(p => [...p, { stepNumber: p.length + 1, name: '', description: '' }]);
  const removeStep = (i: number) => setSteps(p => p.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, stepNumber: idx + 1 })));
  const updateStep = (i: number, field: 'name' | 'description', val: string) =>
    setSteps(p => p.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const handleSave = async () => {
    if (!name || steps.filter(s => s.name).length === 0) return;
    setSaving(true); setSaveError('');
    try {
      const res = await api.post<{ data: Template }>('/workflow-templates', {
        name, description: desc,
        steps: steps.filter(s => s.name),
      });
      setTemplates(p => [res.data.data, ...p]);
      setShowModal(false);
      setName(''); setDesc(''); setSteps([{ stepNumber: 1, name: '', description: '' }]);
    } catch {
      setSaveError('Failed to save. Make sure the backend is running.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/workflow-templates/${id}`);
      setTemplates(p => p.filter(t => t.id !== id));
    } catch {
      // keep list unchanged if delete fails
    }
    setDeleteId(null);
  };

  const PAGE_SIZE = 8;
  const totalPages = Math.ceil(templates.length / PAGE_SIZE);
  const paginated = templates.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <Header
        title="Workflow Templates"
        subtitle="Reusable step templates for common job types"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              title="Refresh"
              className="p-2 rounded-lg text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={15} />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-900"
              style={{ background: '#f59e0b' }}
            >
              <Plus size={15} /> New Template
            </button>
          </div>
        }
      />

      <main className="flex-1 p-6 overflow-y-auto">
        {fetchError && (
          <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <WifiOff size={16} className="flex-shrink-0" />
            <span>Cannot connect to backend. Make sure the server is running on port 4000.</span>
            <button onClick={load} className="ml-auto text-red-600 hover:underline font-medium">Retry</button>
          </div>
        )}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => <div key={i} className="h-48 bg-white rounded-xl animate-pulse border border-slate-200" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginated.map(t => (
              <div key={t.id} className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all ${t.isDefault ? 'border-amber-300' : 'border-slate-200'}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <GitBranch size={15} className="text-amber-500 flex-shrink-0" />
                        <h3 className="font-bold text-slate-800">{t.name}</h3>
                        {t.isDefault && (
                          <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            <Star size={10} /> Default
                          </span>
                        )}
                      </div>
                      {t.description && <p className="text-sm text-slate-500 mt-0.5 ml-5">{t.description}</p>}
                    </div>
                    <button
                      onClick={() => setDeleteId(t.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {(t.steps as StepDef[]).map((s) => (
                      <div key={s.stepNumber} className="flex items-center gap-2.5 text-sm">
                        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {s.stepNumber}
                        </div>
                        <span className="font-medium text-slate-700">{s.name}</span>
                        {s.description && <span className="text-slate-400 text-xs">– {s.description}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-5 py-3 bg-slate-50 rounded-b-xl border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{(t.steps as StepDef[]).length} steps</span>
                  <a
                    href={`/jobs/new?templateId=${t.id}`}
                    className="text-xs text-amber-600 hover:underline font-medium"
                  >
                    Use for new job →
                  </a>
                </div>
              </div>
            ))}

            {templates.length === 0 && (
              <div className="col-span-2 bg-white rounded-xl border border-slate-200 py-16 text-center">
                <Layers size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No templates yet</p>
                <button onClick={() => setShowModal(true)} className="mt-2 text-amber-600 text-sm hover:underline">+ Create first template</button>
              </div>
            )}
          </div>
        )}
        {!loading && templates.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        )}
      </main>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-lg">New Workflow Template</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Template Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Standard Granite Workflow"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
                <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Steps *</label>
                <div className="space-y-2">
                  {steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {s.stepNumber}
                      </div>
                      <input
                        value={s.name} onChange={e => updateStep(i, 'name', e.target.value)}
                        placeholder="Step name"
                        className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      <input
                        value={s.description || ''} onChange={e => updateStep(i, 'description', e.target.value)}
                        placeholder="Description (optional)"
                        className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      <button onClick={() => removeStep(i)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={addStep} className="mt-2 text-xs text-amber-600 hover:underline flex items-center gap-1 font-medium">
                  <Plus size={12} /> Add step
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex flex-col gap-2">
              {saveError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</p>
              )}
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-medium text-slate-900 rounded-lg flex items-center gap-2 disabled:opacity-60"
                  style={{ background: '#f59e0b' }}>
                  <Check size={14} /> {saving ? 'Saving...' : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-bold text-slate-800 text-center mb-1">Delete Template?</h3>
            <p className="text-sm text-slate-500 text-center mb-5">This template will be removed. Existing jobs are unaffected.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
