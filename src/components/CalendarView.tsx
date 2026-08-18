import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, User, AlertCircle, Plus, CheckCircle2 } from 'lucide-react';
import { Case, Deadline } from '../types';

interface CalendarViewProps {
  cases: Case[];
  deadlines: Deadline[];
  onOpenQuickAdd: () => void;
  onToggleComplete: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  cases,
  deadlines,
  onOpenQuickAdd,
  onToggleComplete,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleTodayClick = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Days in month calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map deadlines by due_date (YYYY-MM-DD)
  const deadlinesByDate: Record<string, Deadline[]> = {};
  deadlines.forEach((dl) => {
    if (dl.due_date) {
      // Normalize format to YYYY-MM-DD
      const dateKey = dl.due_date.split('T')[0];
      if (!deadlinesByDate[dateKey]) {
        deadlinesByDate[dateKey] = [];
      }
      deadlinesByDate[dateKey].push(dl);
    }
  });

  // Today string for highlighting
  const todayStr = new Date().toISOString().split('T')[0];

  // Items for selected date
  const selectedDateDeadlines = deadlinesByDate[selectedDateStr] || [];

  // Format selected date header
  const formattedSelectedDate = new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* View Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0 shadow-xs">
              <CalendarIcon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-sans">Advocate Court Calendar</h2>
              <p className="text-xs text-slate-500">Check hearings, filings, and case deadlines by date</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleTodayClick}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Today
          </button>
          <button
            onClick={onOpenQuickAdd}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Case</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Month Calendar Grid Card */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 font-sans">
              {monthNames[month]} {year}
            </h3>
            <div className="flex items-center space-x-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {/* Blank leading cells */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`blank-${i}`} className="h-12 rounded-xl bg-slate-50/50"></div>
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
              const dayNum = dayIdx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayDeadlines = deadlinesByDate[dateStr] || [];
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === todayStr;

              const hasUrgent = dayDeadlines.some((d) => d.urgency === 'HIGH' && !d.is_completed);
              const hasPending = dayDeadlines.some((d) => !d.is_completed);

              return (
                <button
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-12 rounded-xl p-1 flex flex-col items-center justify-between transition-all border relative ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-md ring-2 ring-blue-300'
                      : isToday
                      ? 'bg-blue-50 text-blue-900 border-blue-300 font-bold'
                      : 'bg-slate-50/70 hover:bg-slate-100 text-slate-800 border-slate-200/80'
                  }`}
                >
                  <span className={`text-xs ${isToday && !isSelected ? 'text-blue-600 font-extrabold' : ''}`}>
                    {dayNum}
                  </span>

                  {/* Case Event Indicator Badges */}
                  {dayDeadlines.length > 0 && (
                    <div className="flex items-center space-x-1 mb-0.5">
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                          isSelected
                            ? 'bg-white text-blue-700'
                            : hasUrgent
                            ? 'bg-red-500 text-white'
                            : hasPending
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-300 text-slate-700'
                        }`}
                      >
                        {dayDeadlines.length} {dayDeadlines.length === 1 ? 'case' : 'cases'}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-4 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Case / Hearing</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>Urgent Matter</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-blue-100 border border-blue-400"></span>
              <span>Today</span>
            </span>
          </div>
        </div>

        {/* Selected Day Schedule Inspector */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Schedule Inspector</p>
              <h3 className="text-base font-bold text-slate-900 font-sans mt-0.5">{formattedSelectedDate}</h3>
            </div>
            {selectedDateStr === todayStr && (
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-blue-200">
                Today
              </span>
            )}
          </div>

          {/* Content for Selected Day */}
          <div className="flex-1 space-y-3">
            {selectedDateDeadlines.length === 0 ? (
              <div className="py-10 text-center space-y-3 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 p-4">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-700">No cases or hearings scheduled for this day</p>
                  <p className="text-[11px] text-slate-400 mt-1">Your court schedule is clear on {selectedDateStr}.</p>
                </div>
                <button
                  onClick={onOpenQuickAdd}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center space-x-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Case for This Date</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>{selectedDateDeadlines.length} {selectedDateDeadlines.length === 1 ? 'Matter' : 'Matters'} Listed</span>
                  <span className="text-blue-600 font-bold text-[11px]">Court Roster</span>
                </div>

                {selectedDateDeadlines.map((dl) => (
                  <div
                    key={dl.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                      dl.is_completed
                        ? 'bg-slate-50 border-slate-200 opacity-70'
                        : dl.urgency === 'HIGH'
                        ? 'bg-red-50/40 border-red-200'
                        : 'bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-bold text-slate-900 ${dl.is_completed ? 'line-through text-slate-500' : ''}`}>
                        {dl.case_title || dl.description}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          dl.urgency === 'HIGH'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {dl.urgency}
                      </span>
                    </div>

                    <p className="text-slate-600 leading-relaxed font-medium">{dl.description}</p>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      {dl.court_name && (
                        <span className="flex items-center space-x-1 text-slate-700">
                          <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                          <span className="truncate max-w-[160px]">{dl.court_name}</span>
                        </span>
                      )}
                      {dl.client_name && (
                        <span className="flex items-center space-x-1 text-slate-600">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{dl.client_name}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 italic">
                        Input: {dl.input_source}
                      </span>
                      <button
                        onClick={() => onToggleComplete(dl.id)}
                        className={`px-2 py-1 rounded text-[10px] font-bold flex items-center space-x-1 border transition-colors ${
                          dl.is_completed
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{dl.is_completed ? 'Completed' : 'Mark Done'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
