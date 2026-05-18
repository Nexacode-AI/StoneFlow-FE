'use client';

import { StepStatus } from '@/lib/api';
import { CheckCircle2, Clock, AlertTriangle, HelpCircle, PlayCircle, SkipForward, Bell } from 'lucide-react';

interface WorkflowStep {
  id: string;
  stepNumber: number;
  name: string;
  description?: string;
  status: StepStatus;
  assignedUser?: { name: string; role: string };
  startedAt?: string;
  completedAt?: string;
}

interface WorkflowTimelineProps {
  steps: WorkflowStep[];
  onCompleteStep?: (stepId: string) => void;
  isAdmin?: boolean;
}

const stepConfig: Record<StepStatus, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  WAITING:     { icon: Clock,         color: 'text-slate-400', bg: 'bg-slate-100',   label: 'Waiting' },
  NOTIFIED:    { icon: Bell,          color: 'text-blue-600',  bg: 'bg-blue-100',    label: 'Notified' },
  IN_PROGRESS: { icon: PlayCircle,    color: 'text-amber-600', bg: 'bg-amber-100',   label: 'In Progress' },
  ISSUE:       { icon: AlertTriangle, color: 'text-red-600',   bg: 'bg-red-100',     label: 'Issue Reported' },
  HELP_NEEDED: { icon: HelpCircle,    color: 'text-orange-600',bg: 'bg-orange-100',  label: 'Help Needed' },
  COMPLETED:   { icon: CheckCircle2,  color: 'text-green-600', bg: 'bg-green-100',   label: 'Completed' },
  SKIPPED:     { icon: SkipForward,   color: 'text-slate-400', bg: 'bg-slate-100',   label: 'Skipped' },
};

export default function WorkflowTimeline({ steps, onCompleteStep, isAdmin }: WorkflowTimelineProps) {
  return (
    <div className="relative">
      {steps.map((step, idx) => {
        const cfg = stepConfig[step.status];
        const Icon = cfg.icon;
        const isLast = idx === steps.length - 1;

        return (
          <div key={step.id} className="flex gap-4 group">
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg} border-2 ${step.status === 'COMPLETED' ? 'border-green-300' : step.status === 'IN_PROGRESS' || step.status === 'NOTIFIED' ? 'border-amber-300' : 'border-slate-200'}`}>
                <Icon size={17} className={cfg.color} />
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 mt-1 mb-1 ${step.status === 'COMPLETED' ? 'bg-green-200' : 'bg-slate-200'}`} style={{ minHeight: '28px' }} />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-5 ${isLast ? '' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Step {step.stepNumber}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800 mt-0.5">{step.name}</p>
                  {step.description && (
                    <p className="text-sm text-slate-500 mt-0.5">{step.description}</p>
                  )}
                  {step.assignedUser && (
                    <p className="text-xs text-slate-500 mt-1">
                      Assigned to:{' '}
                      <span className="font-medium text-slate-700">{step.assignedUser.name}</span>
                      <span className="ml-1 text-slate-400">({step.assignedUser.role.replace(/_/g, ' ')})</span>
                    </p>
                  )}
                  {step.completedAt && (
                    <p className="text-xs text-green-600 mt-0.5">
                      Completed: {new Date(step.completedAt).toLocaleString()}
                    </p>
                  )}
                  {step.startedAt && !step.completedAt && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      Started: {new Date(step.startedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                {isAdmin && (step.status === 'IN_PROGRESS' || step.status === 'NOTIFIED') && onCompleteStep && (
                  <button
                    onClick={() => onCompleteStep(step.id)}
                    className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex-shrink-0"
                  >
                    Mark Done
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
