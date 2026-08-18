import React, { useState } from 'react';
import { FolderKanban, Plus, Search, Building2, User, Clock, FileText, ChevronRight, CheckCircle2, AlertCircle, X, Trash2 } from 'lucide-react';
import { Case, Deadline, DocumentDraft } from '../types';

interface CasesListProps {
  cases: Case[];
  deadlines: Deadline[];
  documents: DocumentDraft[];
  onCaseCreated: (newCase: Case) => void;
  onCaseDeleted: (id: string) => void;
  onSelectCaseForDrafting: (c: Case) => void;
}

export const CasesList: React.FC<CasesListProps> = ({
  cases,
  deadlines,
  documents,
  onCaseCreated,
  onCaseDeleted,
  onSelectCaseForDrafting,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  // New Case Form state
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [courtName, setCourtName] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'PENDING' | 'DISPOSED' | 'APPEAL'>('ACTIVE');

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.court_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    return true;
  });

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !clientName) return;

    const newCase: Case = {
      id: `case-${Date.now()}`,
      title,
      client_name: clientName,
      court_name: courtName || 'District / High Court',
      status,
      created_at: new Date().toISOString(),
    };

    onCaseCreated(newCase);
    setTitle('');
    setClientName('');
    setCourtName('');
    setStatus('ACTIVE');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif flex items-center space-x-2">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            <span>Advocate Case Management</span>
          </h2>
          <p className="text-xs text-slate-500">Track matters, clients, courts, linked deadlines and legal drafts</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Case</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter */}
        <div className="flex items-center space-x-1 overflow-x-auto text-xs font-medium scrollbar-none">
          {['ALL', 'ACTIVE', 'PENDING', 'APPEAL', 'DISPOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'All Cases' : st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, client, court..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Case Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredCases.map((c) => {
          const caseDeadlines = deadlines.filter((d) => d.case_id === c.id || d.case_title?.toLowerCase() === c.title.toLowerCase());
          const caseDocs = documents.filter((d) => d.case_id === c.id);
          const pendingCount = caseDeadlines.filter((d) => !d.is_completed).length;

          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                {/* Status Badge & Court */}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      c.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : c.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : c.status === 'APPEAL'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {c.status}
                  </span>

                  <button
                    onClick={() => onCaseDeleted(c.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    title="Delete Case"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Case Title */}
                <h3
                  onClick={() => setSelectedCase(c)}
                  className="text-base font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors leading-snug font-serif"
                >
                  {c.title}
                </h3>

                {/* Details */}
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Client: <strong className="text-slate-800">{c.client_name}</strong></span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="line-clamp-1">{c.court_name}</span>
                  </div>
                </div>
              </div>

              {/* Footer Stats & Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3 text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{pendingCount} Pending Task{pendingCount !== 1 ? 's' : ''}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>{caseDocs.length} Draft{caseDocs.length !== 1 ? 's' : ''}</span>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onSelectCaseForDrafting(c)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold transition-colors"
                  >
                    Draft Doc
                  </button>
                  <button
                    onClick={() => setSelectedCase(c)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Case Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-900 my-auto border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base font-serif">Create New Advocate Case</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Case Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State of Maharashtra vs. Vijay Mallya"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vijay Mallya"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Court Name & Bench</label>
                <input
                  type="text"
                  placeholder="e.g. Bombay High Court (Commercial Bench)"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Case Status</label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ACTIVE">ACTIVE (In Progress)</option>
                  <option value="PENDING">PENDING (Awaiting Hearing)</option>
                  <option value="APPEAL">APPEAL (Under Appeal)</option>
                  <option value="DISPOSED">DISPOSED (Closed)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm"
                >
                  Save Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Details Drawer / Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-900 my-auto border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-start justify-between border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300">
                  {selectedCase.status}
                </span>
                <h3 className="text-lg font-bold font-serif mt-1">{selectedCase.title}</h3>
                <p className="text-xs text-slate-400">
                  Client: {selectedCase.client_name} • Court: {selectedCase.court_name}
                </p>
              </div>
              <button onClick={() => setSelectedCase(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              {/* Linked Deadlines */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Linked Case Deadlines & Tasks</span>
                </h4>
                {deadlines.filter((d) => d.case_id === selectedCase.id || d.case_title?.toLowerCase() === selectedCase.title.toLowerCase()).length === 0 ? (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl">No deadlines added yet for this case.</p>
                ) : (
                  <div className="space-y-2">
                    {deadlines
                      .filter((d) => d.case_id === selectedCase.id || d.case_title?.toLowerCase() === selectedCase.title.toLowerCase())
                      .map((dl) => (
                        <div key={dl.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-800">{dl.description}</p>
                            <p className="text-[11px] text-slate-500">Due: {dl.due_date} ({dl.urgency} Urgency)</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${dl.is_completed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {dl.is_completed ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Linked Legal Drafts */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Generated Document Drafts</span>
                </h4>
                {documents.filter((d) => d.case_id === selectedCase.id).length === 0 ? (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl">No legal documents drafted yet for this case.</p>
                ) : (
                  <div className="space-y-2">
                    {documents
                      .filter((d) => d.case_id === selectedCase.id)
                      .map((doc) => (
                        <div key={doc.id} className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/80 text-xs space-y-1">
                          <p className="font-bold text-slate-900">{doc.title}</p>
                          <p className="text-[11px] text-slate-600 line-clamp-2 italic">{doc.content}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
              >
                Close Case Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
