'use client';

import { JobStatus, Priority } from '@/lib/api';

interface BadgeProps {
  value: string;
  type: 'status' | 'priority' | 'role' | 'step';
}

const statusConfig: Record<JobStatus, { label: string; class: string }> = {
  PENDING:     { label: 'Pending',     class: 'bg-slate-100 text-slate-600 border border-slate-200' },
  IN_PROGRESS: { label: 'In Progress', class: 'bg-amber-100 text-amber-700 border border-amber-200' },
  PAUSED:      { label: 'Paused',      class: 'bg-orange-100 text-orange-700 border border-orange-200' },
  COMPLETED:   { label: 'Completed',   class: 'bg-green-100 text-green-700 border border-green-200' },
  CANCELLED:   { label: 'Cancelled',   class: 'bg-red-100 text-red-700 border border-red-200' },
};

const priorityConfig: Record<Priority, { label: string; class: string }> = {
  LOW:    { label: 'Low',    class: 'bg-slate-100 text-slate-500' },
  NORMAL: { label: 'Normal', class: 'bg-blue-100 text-blue-600' },
  HIGH:   { label: 'High',   class: 'bg-orange-100 text-orange-600' },
  URGENT: { label: 'Urgent', class: 'bg-red-100 text-red-700 font-bold' },
};

export function StatusBadge({ status }: { status: JobStatus }) {
  const cfg = statusConfig[status] || { label: status, class: 'bg-slate-100 text-slate-500' };
  return (
    <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium ${cfg.class}`}>
      {cfg.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = priorityConfig[priority] || { label: priority, class: 'bg-slate-100 text-slate-500' };
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded font-medium ${cfg.class}`}>
      {cfg.label}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
      {role.replace(/_/g, ' ')}
    </span>
  );
}
