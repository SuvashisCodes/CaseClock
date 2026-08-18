import React from 'react';
import { LayoutDashboard, Calendar as CalendarIcon, Clock, FolderKanban, Sparkles, Plus } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAdd: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, onOpenQuickAdd }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 shadow-lg px-2 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {/* Dashboard */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </button>

        {/* Calendar */}
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'calendar' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarIcon className="w-6 h-6 mb-0.5" />
          <span>Calendar</span>
        </button>

        {/* Center Quick Add FAB */}
        <button
          onClick={onOpenQuickAdd}
          className="-mt-5 bg-blue-600 text-white p-3.5 rounded-full shadow-lg border-2 border-slate-900 hover:bg-blue-500 active:scale-95 transition-transform flex items-center justify-center"
          aria-label="Add Case"
          title="Add Case"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Deadlines */}
        <button
          onClick={() => setActiveTab('deadlines')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'deadlines' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span>Deadlines</span>
        </button>

        {/* Cases */}
        <button
          onClick={() => setActiveTab('cases')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            activeTab === 'cases' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderKanban className="w-5 h-5 mb-0.5" />
          <span>Cases</span>
        </button>
      </div>
    </div>
  );
};
