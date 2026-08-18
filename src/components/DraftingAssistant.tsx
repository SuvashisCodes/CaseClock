import React, { useState, useRef } from 'react';
import { Sparkles, Mic, FileText, Download, Copy, Check, Save, Loader2, Bold, Italic, AlignLeft, Heading1, Heading2, List, Shield, HelpCircle } from 'lucide-react';
import { Case, DocumentDraft } from '../types';
import jsPDF from 'jspdf';

interface DraftingAssistantProps {
  cases: Case[];
  initialCase?: Case | null;
  onSaveDocument: (doc: DocumentDraft) => void;
}

const DOCUMENT_PRESETS = [
  {
    type: "Bail Petition",
    label: "Bail Application (Sec 437 CrPC)",
    defaultPrompt: "Draft a bail petition under Section 437 CrPC for [Client Name] arrested under FIR No. [Number] PS [Location] mentioning no prior criminal antecedents, cooperation with investigation, and ready to furnish surety."
  },
  {
    type: "Legal Notice",
    label: "Legal Notice for Breach of Contract",
    defaultPrompt: "Draft a formal legal notice to [Opposite Party] for failure to pay outstanding invoices amounting to [Amount] within 15 days, failing which civil suit for recovery with 18% interest will be instituted."
  },
  {
    type: "Affidavit",
    label: "Affidavit of Evidence",
    defaultPrompt: "Draft an Affidavit of Evidence on behalf of the Plaintiff affirming truth of facts in Plaint and producing exhibited documents A-1 to A-5."
  },
  {
    type: "Written Statement",
    label: "Written Statement (Civil Suit)",
    defaultPrompt: "Draft a Written Statement in Civil Suit denying allegations of paragraph-wise Plaint, raising preliminary objections regarding court jurisdiction and limitation."
  },
  {
    type: "Caveat Petition",
    label: "Caveat Petition",
    defaultPrompt: "Draft a Caveat Petition under Section 148A CPC requesting the Court not to pass any ex-parte ad-interim order without advance notice to Caveator."
  }
];

export const DraftingAssistant: React.FC<DraftingAssistantProps> = ({
  cases,
  initialCase,
  onSaveDocument,
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCase ? initialCase.id : (cases[0]?.id || ''));
  const [documentType, setDocumentType] = useState<string>("Bail Petition");
  const [prompt, setPrompt] = useState<string>(DOCUMENT_PRESETS[0].defaultPrompt);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [draftContent, setDraftContent] = useState<string>('');
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Formatting state for rich text
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  const activeCase = cases.find((c) => c.id === selectedCaseId);

  const handleSelectPreset = (preset: typeof DOCUMENT_PRESETS[0]) => {
    setDocumentType(preset.type);
    let populatedPrompt = preset.defaultPrompt;
    if (activeCase) {
      populatedPrompt = populatedPrompt
        .replace("[Client Name]", activeCase.client_name)
        .replace("[Opposite Party]", "Opposing Party");
    }
    setPrompt(populatedPrompt);
  };

  const handleGenerateDraft = async () => {
    if (!prompt.trim()) return;
    setError(null);
    setIsGenerating(true);
    setCopied(false);
    setSaved(false);

    try {
      const response = await fetch("/api/draft-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          document_type: documentType,
          case_title: activeCase?.title || "Legal Matter",
          client_name: activeCase?.client_name || "Client",
          court_name: activeCase?.court_name || "Hon'ble Court",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate legal draft.");
      }

      setDraftContent(data.document.content);
      setDraftTitle(data.document.title);
    } catch (err: any) {
      console.error("Drafting error:", err);
      setError(err.message || "Failed to generate legal document.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(draftContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToCase = async () => {
    if (!draftContent) return;

    try {
      const docObj: DocumentDraft = {
        id: `doc-${Date.now()}`,
        case_id: activeCase?.id || 'case-general',
        case_title: activeCase?.title || 'General Legal Matter',
        document_type: documentType,
        title: draftTitle || `${documentType} Draft`,
        content: draftContent,
        created_at: new Date().toISOString(),
      };

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docObj),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onSaveDocument(data.document || docObj);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err: any) {
      console.error("Error saving document:", err);
    }
  };

  // Export PDF using jsPDF
  const handleExportPDF = () => {
    if (!draftContent) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const margin = 54; // 0.75 inch margin
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - margin * 2;

    doc.setFont('Times', 'normal');
    doc.setFontSize(11);

    const splitText = doc.splitTextToSize(draftContent, maxLineWidth);

    let cursorY = margin;
    const lineHeight = 16;
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 0; i < splitText.length; i++) {
      if (cursorY + lineHeight > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(splitText[i], margin, cursorY);
      cursorY += lineHeight;
    }

    doc.save(`${draftTitle || 'Legal_Draft'}.pdf`);
  };

  // Export Word Document (.doc / .docx compatible)
  const handleExportWord = () => {
    if (!draftContent) return;

    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
      "xmlns:w='urn:schemas-microsoft-com:office:word' "+
      "xmlns='http://www.w3.org/TR/REC-html40'>"+
      "<head><meta charset='utf-8'><title>Legal Document</title>"+
      "<style>body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; margin: 1in; }</style>"+
      "</head><body>";
    const footer = "</body></html>";
    const html = header + "<pre style='font-family: \"Times New Roman\", serif; white-space: pre-wrap;'>" + draftContent + "</pre>" + footer;

    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draftTitle || 'Legal_Draft'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Toolbar formatting helpers for editor
  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!editorRef.current) return;
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end) || 'text';
    const replacement = `${prefix}${selected}${suffix}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setDraftContent(newText);
  };

  return (
    <div className="space-y-4">
      {/* Top Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-serif flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>AI Legal Drafting Assistant</span>
        </h2>
        <p className="text-xs text-slate-500">
          Dictate or type instructions to generate Court Petitions, Affidavits, Legal Notices & Written Statements
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Form: Instructions & Presets */}
        <div className="lg:col-span-5 space-y-4 bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Select Case */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Case Matter</label>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- General Legal Document (No Case) --</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.client_name})
                </option>
              ))}
            </select>
          </div>

          {/* Template Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Document Templates</label>
            <div className="space-y-1.5">
              {DOCUMENT_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(p)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    documentType === p.type
                      ? 'bg-blue-50 text-blue-900 border-blue-300 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Instructions Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Advocate Drafting Requirements</label>
              <span className="text-[10px] text-slate-400">Speak or type specific facts</span>
            </div>
            <textarea
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Draft a bail petition under Section 437 CrPC for Ramesh Kumar mentioning clean prior record..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateDraft}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                <span>Drafting Legal Document...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generate Legal Draft</span>
              </>
            )}
          </button>
        </div>

        {/* Right Preview & Rich Editor */}
        <div className="lg:col-span-7 bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 flex flex-col justify-between">
          {!draftContent ? (
            <div className="h-full min-h-[360px] bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-300" />
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Legal Document Editor</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Select a template on the left and click "Generate Legal Draft" to produce formal petitions, affidavits, or notices.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900 text-white p-3 rounded-xl">
                <div>
                  <h3 className="text-xs font-bold font-serif">{draftTitle || "Generated Legal Draft"}</h3>
                  <p className="text-[10px] text-slate-400">Court Format Standard • Ready for Review</p>
                </div>

                {/* Actions: Export & Copy */}
                <div className="flex items-center space-x-1.5 flex-wrap">
                  <button
                    onClick={handleCopyToClipboard}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleSaveToCase}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1 transition-colors"
                  >
                    {saved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{saved ? 'Saved' : 'Save to Case'}</span>
                  </button>

                  <button
                    onClick={handleExportPDF}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={handleExportWord}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Word</span>
                  </button>
                </div>
              </div>

              {/* Text Editor Formatting Bar */}
              <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => insertFormatting("**", "**")}
                  className="p-1.5 rounded hover:bg-white text-slate-700 font-bold"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertFormatting("*", "*")}
                  className="p-1.5 rounded hover:bg-white text-slate-700 italic"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button
                  onClick={() => insertFormatting("\nIN THE COURT OF ", "")}
                  className="px-2 py-1 rounded hover:bg-white text-slate-800 text-[11px] font-bold"
                >
                  + Court Header
                </button>
                <button
                  onClick={() => insertFormatting("\nPRAYER:\nIn view of the above...", "")}
                  className="px-2 py-1 rounded hover:bg-white text-slate-800 text-[11px] font-bold"
                >
                  + Prayer Clause
                </button>
                <button
                  onClick={() => insertFormatting("\n\nVERIFICATION:\nVerified at [City] on this [Date] day of [Month]...", "")}
                  className="px-2 py-1 rounded hover:bg-white text-slate-800 text-[11px] font-bold"
                >
                  + Verification
                </button>
              </div>

              {/* Editable Textarea Area */}
              <textarea
                ref={editorRef}
                rows={16}
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-xs font-mono text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-pre-wrap"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
