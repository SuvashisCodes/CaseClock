import React, { useState } from 'react';
import { Clock, Calendar, CheckCircle2, Circle, AlertTriangle, Mic, FileText, Search, Trash2, Bell, Filter, ShieldAlert, Sparkles, Plus, MessageSquare, ExternalLink } from 'lucide-react';
import { Deadline, UserProfile } from '../types';

interface UpcomingDeadlinesProps {
  deadlines: Deadline[];
  onToggleComplete: (id: string) => void;
  onDeleteDeadline: (id: string) => void;
  onOpenQuickAdd: () => void;
  onTriggerAlert: (deadline: Deadline) => void;
  user?: UserProfile | null;
}

export const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({
  deadlines,
  onToggleComplete,
  onDeleteDeadline,
  onOpenQuickAdd,
  onTriggerAlert,
  user,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'today' | '3days' | 'overdue' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const getDaysRemaining = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredDeadlines = deadlines.filter((dl) => {
    // Search query
    const matchesSearch =
      dl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dl.case_title && dl.case_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (dl.court_name && dl.court_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (dl.client_name && dl.client_name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    const days = getDaysRemaining(dl.due_date);

    if (filterTab === 'today') return days === 0 && !dl.is_completed;
    if (filterTab === '3days') return days >= 0 && days <= 3 && !dl.is_completed;
    if (filterTab === 'overdue') return days < 0 && !dl.is_completed;
    if (filterTab === 'completed') return dl.is_completed;

    return true; // 'all'
  });

  // Sort chronologically (earliest due date first, pending before completed)
  const sortedDeadlines = [...filteredDeadlines].sort((a, b) => {
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  return (
    <div className="space-y-4">
      {/* Top Title & Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Upcoming Deadlines</span>
          </h2>
          <p className="text-xs text-slate-500">Chronological filing dates, court hearings & advocate tasks</p>
        </div>

        <button
          onClick={onOpenQuickAdd}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Case / Deadline</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs font-medium">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                filterTab === 'all'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              All Tasks ({deadlines.length})
            </button>
            <button
              onClick={() => setFilterTab('today')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center space-x-1 ${
                filterTab === 'today'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>Due Today</span>
              {deadlines.filter((d) => getDaysRemaining(d.due_date) === 0 && !d.is_completed).length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 font-bold">
                  {deadlines.filter((d) => getDaysRemaining(d.due_date) === 0 && !d.is_completed).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab('3days')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                filterTab === '3days'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Next 3 Days
            </button>
            <button
              onClick={() => setFilterTab('overdue')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center space-x-1 ${
                filterTab === 'overdue'
                  ? 'bg-red-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>Overdue</span>
              {deadlines.filter((d) => getDaysRemaining(d.due_date) < 0 && !d.is_completed).length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-200 text-red-900 font-bold">
                  {deadlines.filter((d) => getDaysRemaining(d.due_date) < 0 && !d.is_completed).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab('completed')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                filterTab === 'completed'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Completed
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search case, court, task..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Deadlines List */}
      {sortedDeadlines.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-300 space-y-3 shadow-xs">
          <Clock className="w-10 h-10 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-sm font-semibold text-slate-700">No deadlines found</h3>
            <p className="text-xs text-slate-500 mt-0.5">Try clearing your search filter or add a new voice task.</p>
          </div>
          <button
            onClick={onOpenQuickAdd}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center space-x-1.5 shadow-xs hover:bg-blue-700 transition-colors"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Speak Voice Note</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDeadlines.map((dl) => {
            const daysRemaining = getDaysRemaining(dl.due_date);
            const isOverdue = daysRemaining < 0 && !dl.is_completed;
            const isDueToday = daysRemaining === 0 && !dl.is_completed;
            const isDueTomorrow = daysRemaining === 1 && !dl.is_completed;

            // Parse date for calendar box
            const dueDateObj = new Date(dl.due_date);
            const monthStr = isNaN(dueDateObj.getTime()) ? 'DUE' : dueDateObj.toLocaleDateString('en-US', { month: 'short' });
            const dayNumStr = isNaN(dueDateObj.getTime()) ? '!' : dueDateObj.getDate();

            return (
              <div
                key={dl.id}
                className={`bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4 hover:border-blue-400 transition-colors ${
                  dl.is_completed
                    ? 'border-slate-200 opacity-70'
                    : isOverdue || isDueToday
                    ? 'border-red-200 bg-red-50/10'
                    : 'border-slate-200'
                }`}
              >
                {/* Date Badge Box */}
                <div
                  className={`w-12 h-12 flex flex-col items-center justify-center rounded-lg font-bold shrink-0 ${
                    dl.is_completed
                      ? 'bg-slate-100 text-slate-600'
                      : isOverdue || isDueToday
                      ? 'bg-red-50 text-red-600'
                      : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  <span className="text-[10px] leading-none uppercase tracking-wider">{monthStr}</span>
                  <span className="text-lg leading-tight">{dayNumStr}</span>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`font-bold text-slate-800 text-sm leading-snug truncate ${dl.is_completed ? 'line-through text-slate-500' : ''}`}>
                      {dl.case_title || dl.description}
                    </h3>

                    {/* Court Badge */}
                    {dl.court_name && (
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase px-2 py-1 rounded shrink-0 hidden sm:inline-block">
                        {dl.court_name}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 leading-snug flex items-center space-x-1.5 flex-wrap">
                    <span>{dl.description}</span>
                    <span className="text-slate-300">•</span>
                    {isOverdue ? (
                      <span className="text-red-600 font-bold">Urgent (Overdue)</span>
                    ) : isDueToday ? (
                      <span className="text-red-500 font-bold">Urgent (Today)</span>
                    ) : isDueTomorrow ? (
                      <span className="text-blue-600 font-medium">Due Tomorrow</span>
                    ) : (
                      <span className="text-slate-500 font-medium">{dl.due_date}</span>
                    )}
                    {dl.client_name && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600">Client: {dl.client_name}</span>
                      </>
                    )}
                  </p>

                  {/* Dictated transcript snippet */}
                  {dl.raw_transcript && (
                    <p className="text-[10px] text-slate-400 italic bg-slate-50 px-2 py-1 rounded border border-slate-100 line-clamp-1 mt-1">
                      "{dl.raw_transcript}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  {/* WhatsApp Quick Send Button */}
                  {(() => {
                    const recipientPhone = (user?.phone || '').replace(/[^0-9]/g, '');
                    const timingLabel = dl.reminder_timing ? dl.reminder_timing.replace('_', ' ') : (user?.default_reminder_timing ? user.default_reminder_timing.replace('_', ' ') : '1 day before');
                    const msgText = `⚖️ *CASECLOCK COURT REMINDER* ⚖️\n\nRespected ${user?.name || 'Advocate'},\n\n📌 *Case:* ${dl.case_title || dl.description}\n🏛️ *Court:* ${dl.court_name || 'Court Forum'}\n📅 *Due Date:* ${dl.due_date}\n⏰ *Reminder Timing:* ${timingLabel}\n⚡ *Urgency:* ${dl.urgency || 'MEDIUM'}\n\n📋 *Task Description:*\n"${dl.description}"\n\n_Generated via CaseClock Legal Assistant._`;
                    const waUrl = recipientPhone
                      ? `https://wa.me/${recipientPhone}?text=${encodeURIComponent(msgText)}`
                      : `https://wa.me/?text=${encodeURIComponent(msgText)}`;

                    return (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center space-x-1 transition-colors"
                        title="Send WhatsApp Reminder"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>
                    );
                  })()}

                  <button
                    onClick={() => onToggleComplete(dl.id)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      dl.is_completed
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-emerald-600 hover:border-emerald-300'
                    }`}
                    title={dl.is_completed ? "Mark pending" : "Mark completed"}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onTriggerAlert(dl)}
                    className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-300 transition-colors"
                    title="Alert Preview"
                  >
                    <Bell className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteDeadline(dl.id)}
                    className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-300 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
