import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { DashboardMetrics } from './components/DashboardMetrics';
import { UpcomingDeadlines } from './components/UpcomingDeadlines';
import { CasesList } from './components/CasesList';
import { DraftingAssistant } from './components/DraftingAssistant';
import { CalendarView } from './components/CalendarView';
import { QuickAddModal } from './components/QuickAddModal';
import { CeleryReminderBanner } from './components/CeleryReminderBanner';
import { LoginModal } from './components/LoginModal';
import { Case, Deadline, DocumentDraft, ReminderNotification, UserProfile } from './types';
import { Bell, CheckCircle2, X, Mic, Plus, MessageSquare } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [cases, setCases] = useState<Case[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [documents, setDocuments] = useState<DocumentDraft[]>([]);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [selectedCaseForDrafting, setSelectedCaseForDrafting] = useState<Case | null>(null);

  // User Profile & Login Modal
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('caseclock_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Celery Worker state
  const [celeryStatus, setCeleryStatus] = useState<'active' | 'running'>('active');
  const [celeryNotifications, setCeleryNotifications] = useState<ReminderNotification[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
    // Prompt login if user is not configured yet
    if (!user) {
      setIsLoginModalOpen(true);
    }
  }, []);

  const fetchInitialData = async () => {
    try {
      const [casesRes, deadlinesRes, docsRes] = await Promise.all([
        fetch("/api/cases").then((r) => r.json()).catch(() => null),
        fetch("/api/deadlines").then((r) => r.json()).catch(() => null),
        fetch("/api/documents").then((r) => r.json()).catch(() => null),
      ]);

      if (casesRes && casesRes.success && Array.isArray(casesRes.cases)) setCases(casesRes.cases);
      if (deadlinesRes && deadlinesRes.success && Array.isArray(deadlinesRes.deadlines)) setDeadlines(deadlinesRes.deadlines);
      if (docsRes && docsRes.success && Array.isArray(docsRes.documents)) setDocuments(docsRes.documents);

      // Trigger automatic background reminder check on startup
      triggerCeleryCheck(user);
    } catch (err) {
      console.error("Failed to load initial advocate data:", err);
    }
  };

  const triggerCeleryCheck = async (currentUserProfile?: UserProfile | null) => {
    setCeleryStatus('running');
    const u = currentUserProfile !== undefined ? currentUserProfile : user;
    try {
      const res = await fetch("/api/check-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: u?.phone || '',
          user_name: u?.name || '',
          reminder_timing: u?.default_reminder_timing || '1_day_before'
        })
      });
      const data = await res.json();
      if (data.success) {
        setCeleryNotifications(data.triggered_notifications || []);
      }
    } catch (err) {
      console.error("Celery reminder check error:", err);
    } finally {
      setTimeout(() => setCeleryStatus('active'), 800);
    }
  };

  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
    setIsLoginModalOpen(false);
    setToastMessage(`Welcome ${profile.name}! WhatsApp reminders configured for ${profile.phone}.`);
    setTimeout(() => setToastMessage(null), 4000);
    triggerCeleryCheck(profile);
  };

  const handleToggleDeadlineComplete = async (id: string) => {
    // Optimistic UI update
    setDeadlines((prev) =>
      prev.map((d) => (d.id === id ? { ...d, is_completed: !d.is_completed } : d))
    );

    try {
      await fetch(`/api/deadlines/${id}/toggle`, { method: "PATCH" });
    } catch (err) {
      console.error("Failed to toggle deadline completion:", err);
    }
  };

  const handleDeleteDeadline = async (id: string) => {
    setDeadlines((prev) => prev.filter((d) => d.id !== id));
    try {
      await fetch(`/api/deadlines/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete deadline:", err);
    }
  };

  const handleDeadlineCreated = (newDl: Deadline) => {
    setDeadlines((prev) => [newDl, ...prev]);
    // Refresh cases list in case a new case was created
    fetch("/api/cases")
      .then((r) => r.json())
      .then((d) => d.success && setCases(d.cases));

    setToastMessage(`New deadline saved: ${newDl.description}`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCaseCreated = (newCase: Case) => {
    setCases((prev) => [newCase, ...prev]);
    setToastMessage(`Case '${newCase.title}' created.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCaseDeleted = async (id: string) => {
    setCases((prev) => prev.filter((c) => c.id !== id));
    setDeadlines((prev) => prev.filter((d) => d.case_id !== id));
    try {
      await fetch(`/api/cases/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete case:", err);
    }
  };

  const handleSaveDocument = (newDoc: DocumentDraft) => {
    setDocuments((prev) => [newDoc, ...prev]);
    setToastMessage(`Document saved to case '${newDoc.case_title || 'Matter'}'.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectCaseForDrafting = (c: Case) => {
    setSelectedCaseForDrafting(c);
    setActiveTab('drafting');
  };

  const handleTriggerSingleAlert = (dl: Deadline) => {
    setToastMessage(`[CELERY ALERT] Deadline for ${dl.case_title || 'Case'}: ${dl.description} (Due ${dl.due_date})`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-20 md:pb-12 flex flex-col relative">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        celeryStatus={celeryStatus}
        onTriggerCeleryCheck={() => triggerCeleryCheck(user)}
        user={user}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Real-time Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-start space-x-3 text-xs animate-in fade-in slide-in-from-top-3">
          <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-300">WhatsApp Alert System</p>
            <p className="mt-0.5 text-slate-200">{toastMessage}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* WhatsApp & Celery Background Reminder Banner */}
        <CeleryReminderBanner
          onTriggerCheck={() => triggerCeleryCheck(user)}
          notifications={celeryNotifications}
          isChecking={celeryStatus === 'running'}
          user={user}
          onOpenSettings={() => setIsLoginModalOpen(true)}
        />

        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <DashboardMetrics
              cases={cases}
              deadlines={deadlines}
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />

            <UpcomingDeadlines
              deadlines={deadlines}
              onToggleComplete={handleToggleDeadlineComplete}
              onDeleteDeadline={handleDeleteDeadline}
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
              onTriggerAlert={handleTriggerSingleAlert}
              user={user}
            />
          </div>
        )}

        {/* Tab 2: Interactive Court Calendar */}
        {activeTab === 'calendar' && (
          <CalendarView
            cases={cases}
            deadlines={deadlines}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            onToggleComplete={handleToggleDeadlineComplete}
          />
        )}

        {/* Tab 3: Deadlines List */}
        {activeTab === 'deadlines' && (
          <UpcomingDeadlines
            deadlines={deadlines}
            onToggleComplete={handleToggleDeadlineComplete}
            onDeleteDeadline={handleDeleteDeadline}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            onTriggerAlert={handleTriggerSingleAlert}
            user={user}
          />
        )}

        {/* Tab 4: Cases List */}
        {activeTab === 'cases' && (
          <CasesList
            cases={cases}
            deadlines={deadlines}
            documents={documents}
            onCaseCreated={handleCaseCreated}
            onCaseDeleted={handleCaseDeleted}
            onSelectCaseForDrafting={handleSelectCaseForDrafting}
          />
        )}

        {/* Tab 5: AI Legal Drafting Assistant */}
        {activeTab === 'drafting' && (
          <DraftingAssistant
            cases={cases}
            initialCase={selectedCaseForDrafting}
            onSaveDocument={handleSaveDocument}
          />
        )}
      </main>

      {/* Desktop Floating Plus FAB Button */}
      <div className="hidden md:flex fixed bottom-8 right-8 z-40 items-center">
        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-2xl transition-transform transform active:scale-95 border-2 border-white"
          title="Add Case or Voice Note"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Mobile Thumb Navigation Bar */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      {/* Quick Voice Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onDeadlineCreated={handleDeadlineCreated}
        cases={cases}
      />

      {/* Login & WhatsApp Settings Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onLoginSuccess={handleLoginSuccess}
        currentUser={user}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
