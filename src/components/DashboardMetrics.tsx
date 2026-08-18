import React from 'react';
import { FolderKanban, Clock, AlertCircle, CheckCircle2, Mic, Sparkles, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Case, Deadline } from '../types';

interface DashboardMetricsProps {
  cases: Case[];
  deadlines: Deadline[];
  onOpenQuickAdd: () => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  cases,
  deadlines,
  onOpenQuickAdd,
  onNavigateTab,
}) => {
  const getDaysRemaining = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const pendingDeadlines = deadlines.filter((d) => !d.is_completed);
  const dueToday = pendingDeadlines.filter((d) => getDaysRemaining(d.due_date) === 0);
  const overdue = pendingDeadlines.filter((d) => getDaysRemaining(d.due_date) < 0);
  const activeCases = cases.filter((c) => c.status === 'ACTIVE' || c.status === 'PENDING');

  return (
    <div>
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Cases */}
        <div
          onClick={() => onNavigateTab('cases')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-blue-400 transition-all cursor-pointer space-y-1.5"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Matters</span>
            <FolderKanban className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-bold font-sans text-slate-900">{activeCases.length}</p>
          <p className="text-xs text-slate-500">{cases.length} Total Cases</p>
        </div>

        {/* Pending Deadlines */}
        <div
          onClick={() => onNavigateTab('deadlines')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-blue-400 transition-all cursor-pointer space-y-1.5"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Queue</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-bold font-sans text-slate-900">{pendingDeadlines.length}</p>
          <p className="text-xs text-slate-500">Chronological Deadlines</p>
        </div>

        {/* Due Today */}
        <div
          onClick={() => onNavigateTab('deadlines')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-blue-400 transition-all cursor-pointer space-y-1.5"
        >
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Due Today</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-3xl font-bold font-sans text-amber-600">{dueToday.length}</p>
          <p className="text-xs text-slate-500">Urgent Hearings / Filings</p>
        </div>

        {/* Overdue */}
        <div
          onClick={() => onNavigateTab('deadlines')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-red-300 transition-all cursor-pointer space-y-1.5"
        >
          <div className="flex items-center justify-between text-red-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overdue Tasks</span>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-3xl font-bold font-sans text-red-600">{overdue.length}</p>
          <p className="text-xs text-slate-500">Action Required</p>
        </div>
      </div>
    </div>
  );
};
