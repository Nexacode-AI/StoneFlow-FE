'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'slate';
  trend?: { value: number; positive: boolean };
  suffix?: string;
  href?: string;
}

const colorMap = {
  amber:  { bar: '#f59e0b', iconBg: '#fef3c7', iconColor: '#d97706' },
  blue:   { bar: '#3b82f6', iconBg: '#dbeafe', iconColor: '#2563eb' },
  green:  { bar: '#22c55e', iconBg: '#dcfce7', iconColor: '#16a34a' },
  red:    { bar: '#ef4444', iconBg: '#fee2e2', iconColor: '#dc2626' },
  purple: { bar: '#a855f7', iconBg: '#f3e8ff', iconColor: '#9333ea' },
  slate:  { bar: '#64748b', iconBg: '#f1f5f9', iconColor: '#475569' },
};

export default function StatsCard({ label, value, icon: Icon, color, trend, suffix, href }: StatsCardProps) {
  const c = colorMap[color];
  const inner = (
    <div
      className={`relative h-full rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-200 ${href ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : ''}`}
    >
      {/* coloured top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: c.bar }} />

      <div className="p-5 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1 leading-none">
              {value}{suffix && <span className="text-base font-medium ml-1 text-slate-400">{suffix}</span>}
            </p>
            {trend && (
              <p className={`text-xs mt-2 font-semibold flex items-center gap-1 ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
                <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[10px] ${trend.positive ? 'bg-green-500' : 'bg-red-500'}`}>
                  {trend.positive ? '↑' : '↓'}
                </span>
                {Math.abs(trend.value)}% this week
              </p>
            )}
          </div>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: c.iconBg }}
          >
            <Icon size={20} style={{ color: c.iconColor }} />
          </div>
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}
