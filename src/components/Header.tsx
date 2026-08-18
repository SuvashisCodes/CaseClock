import React from 'react';
import { Scale, Mic, Bell, Sparkles, Search, Calendar as CalendarIcon, Plus, MessageSquare, User } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAdd: () => void;
  celeryStatus: 'active' | 'running';
  onTriggerCeleryCheck: () => void;
  user: UserProfile | null;
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickAdd,
  celeryStatus,
  onTriggerCeleryCheck,
  user,
  onOpenLogin,
}) => {
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg text-white shadow-sm">
            C
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 font-sans">CaseClock</h1>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Advocate
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Search Bar */}
        <div className="hidden lg:flex items-center bg-slate-100 px-4 py-2 rounded-full w-80 border border-slate-200/80">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search cases, clients, or files..."
            className="bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 w-full focus:outline-none"
            onClick={() => setActiveTab('deadlines')}
          />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === 'calendar'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CalendarIcon className={`w-4 h-4 ${activeTab === 'calendar' ? 'text-white' : 'text-blue-600'}`} />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setActiveTab('deadlines')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'deadlines'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Deadlines
          </button>
          <button
            onClick={() => setActiveTab('cases')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'cases'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Cases
          </button>
          <button
            onClick={() => setActiveTab('drafting')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === 'drafting'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Drafting</span>
          </button>
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* AI Draft Quick Access Button (Prominent in top panel on Mobile & Desktop) */}
          <button
            onClick={() => setActiveTab('drafting')}
            title="AI Legal Drafting Assistant"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition-all ${
              activeTab === 'drafting'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs ring-2 ring-amber-300/50'
                : 'bg-amber-50/90 text-amber-900 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600 fill-amber-400 shrink-0" />
            <span className="text-[11px] font-bold">AI Draft</span>
          </button>

          {/* Today Date Indicator */}
          <div className="text-right hidden sm:block cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveTab('calendar')} title="Click to open Court Calendar">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">Today</p>
            <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{todayFormatted}</span>
            </p>
          </div>

          {/* WhatsApp Advocate Profile / Login Badge */}
          <button
            onClick={onOpenLogin}
            title={user ? `Logged in as ${user.name} (${user.phone})` : "Click to log in for WhatsApp reminders"}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-900 transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MessageSquare className="w-3 h-3" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[10px] font-bold text-emerald-950 truncate max-w-[110px] leading-tight">
                {user ? user.name : 'WhatsApp Login'}
              </p>
              <p className="text-[9px] font-mono text-emerald-700 leading-none">
                {user ? user.phone : 'Set Phone'}
              </p>
            </div>
          </button>

          {/* Celery Worker Status & Bell */}
          <button
            onClick={onTriggerCeleryCheck}
            title="Trigger Celery background deadline checker"
            className="relative w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-700 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <div className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${celeryStatus === 'running' ? 'bg-amber-500 animate-ping' : 'bg-blue-600'}`}></div>
          </button>

          {/* Add Case CTA (Desktop / Tablet only; mobile uses bottom navigation FAB) */}
          <button
            onClick={onOpenQuickAdd}
            className="hidden sm:flex px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold items-center space-x-1.5 shadow-sm transition-transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Case</span>
          </button>
        </div>
      </div>
    </header>
  );
};
