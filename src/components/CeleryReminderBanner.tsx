import React, { useState } from 'react';
import { MessageSquare, RefreshCw, CheckCircle2, ShieldCheck, ExternalLink, Terminal, Phone, Clock } from 'lucide-react';
import { ReminderNotification, UserProfile } from '../types';

interface CeleryReminderBannerProps {
  onTriggerCheck: () => void;
  notifications: ReminderNotification[];
  isChecking: boolean;
  user: UserProfile | null;
  onOpenSettings: () => void;
}

export const CeleryReminderBanner: React.FC<CeleryReminderBannerProps> = ({
  onTriggerCheck,
  notifications,
  isChecking,
  user,
  onOpenSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800/80 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <h3 className="text-sm font-bold font-sans text-white">WhatsApp Advocate Reminder Engine</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                WhatsApp Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
              {user ? (
                <>
                  <span className="text-slate-200 font-semibold flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    {user.phone}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    {user.default_reminder_timing.replace('_', ' ')}
                  </span>
                </>
              ) : (
                <span>Delivers formatted court hearings & filing deadlines directly to WhatsApp</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold border border-slate-700"
          >
            WhatsApp Settings
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            {isOpen ? 'Hide Dispatch Log' : `WhatsApp Alerts (${notifications.length})`}
          </button>
          <button
            onClick={onTriggerCheck}
            disabled={isChecking}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-transform active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Check & Send WhatsApp</span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-3 border-t border-slate-800 space-y-2.5">
          <p className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
            <Terminal className="w-3.5 h-3.5" />
            <span>WhatsApp Dispatch Logs: Celery task output for {user?.phone || 'registered advocate'}</span>
          </p>

          {notifications.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No court deadlines requiring WhatsApp reminders right now.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-xl text-xs bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{n.case_title}</span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                        {n.reminder_timing || '1 Day Before'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">{n.message}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {n.whatsapp_url && (
                      <a
                        href={n.whatsapp_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Open WhatsApp</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <span className="text-[10px] font-mono text-slate-500">{n.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

