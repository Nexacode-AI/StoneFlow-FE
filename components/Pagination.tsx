'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

export default function Pagination({ page, totalPages, onChange, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = Math.max(1, page - 2);
  const end   = Math.min(totalPages, page + 2);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className={`flex items-center justify-center gap-1.5 py-4 ${className}`}>
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-amber-50 hover:border-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        <ChevronLeft size={14} />
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => onChange(1)}
            className="w-8 h-8 text-sm rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-amber-50 hover:border-amber-300 transition-all shadow-sm"
          >
            1
          </button>
          {start > 2 && <span className="text-slate-400 text-xs px-0.5">···</span>}
        </>
      )}

      {pages.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-8 h-8 text-sm rounded-xl font-semibold transition-all shadow-sm ${
            p === page
              ? 'text-slate-900 border border-amber-400'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-amber-50 hover:border-amber-300'
          }`}
          style={p === page ? { background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' } : {}}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-slate-400 text-xs px-0.5">···</span>}
          <button
            onClick={() => onChange(totalPages)}
            className="w-8 h-8 text-sm rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-amber-50 hover:border-amber-300 transition-all shadow-sm"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-amber-50 hover:border-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
