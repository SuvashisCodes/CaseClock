import React, { useState } from 'react';
import { User, Phone, MessageSquare, Clock, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { UserProfile, ReminderTimingOption } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: UserProfile) => void;
  currentUser?: UserProfile | null;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLoginSuccess,
  currentUser,
  onClose,
}) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 ');
  const [whatsappEnabled, setWhatsappEnabled] = useState(currentUser ? currentUser.whatsapp_enabled : true);
  const [reminderTiming, setReminderTiming] = useState<ReminderTimingOption>(
    currentUser?.default_reminder_timing || '1_day_before'
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name or Advocate title');
      return;
    }

    const cleanPhone = phone.replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setError('Please enter a valid phone number (with country code, e.g. +91 9876543210)');
      return;
    }

    setError(null);
    const profile: UserProfile = {
      name: name.trim(),
      phone: cleanPhone,
      whatsapp_enabled: whatsappEnabled,
      default_reminder_timing: reminderTiming,
    };

    // Save to LocalStorage
    localStorage.setItem('caseclock_user', JSON.stringify(profile));
    onLoginSuccess(profile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Icon */}
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-center text-emerald-600 mb-5">
          <MessageSquare className="w-8 h-8" />
        </div>

        <div className="space-y-1 mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
            {currentUser ? 'Update WhatsApp Settings' : 'Advocate WhatsApp Login'}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sign in with your name and phone number to receive real-time court case and deadline reminders directly on <strong className="text-emerald-700">WhatsApp</strong>.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Advocate Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Advocate Name / Title</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Adv. Rajesh Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          {/* WhatsApp Phone Number */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>WhatsApp Phone Number</span>
            </label>
            <input
              type="tel"
              required
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
            <p className="text-[10px] text-slate-400">Include country code (e.g. +91 for India, +1 for US)</p>
          </div>

          {/* WhatsApp Alert Timing Selection */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Default Reminder Timing</span>
            </label>
            
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: '1_day_before', label: '1 Day Before (Recommended)', desc: '24 hours prior to court hearing / filing' },
                { id: '2_days_before', label: '2 Days Before (Early Prep)', desc: '48 hours before deadline' },
                { id: '12_hours_before', label: '12 Hours Before', desc: 'Night before court date' },
                { id: '2_hours_before', label: '2 Hours Before (Urgent)', desc: 'Immediate morning alert' },
                { id: 'at_time', label: 'On Due Date Morning (8:00 AM)', desc: 'Same day court reminder' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => setReminderTiming(opt.id as ReminderTimingOption)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                    reminderTiming === opt.id
                      ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-400 text-emerald-950 font-semibold'
                      : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="reminder_timing"
                    checked={reminderTiming === opt.id}
                    onChange={() => setReminderTiming(opt.id as ReminderTimingOption)}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="font-bold text-slate-900">{opt.label}</p>
                    <p className="text-[10px] text-slate-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* WhatsApp Toggle Checkbox */}
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Enable WhatsApp Reminders</span>
              </p>
              <p className="text-[10px] text-emerald-700">Receive court hearing alerts & filing deadlines directly on WhatsApp</p>
            </div>
            <input
              type="checkbox"
              checked={whatsappEnabled}
              onChange={(e) => setWhatsappEnabled(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center gap-2">
            {currentUser && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md transition-transform active:scale-95"
            >
              <span>{currentUser ? 'Save WhatsApp Settings' : 'Continue to CaseClock'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
