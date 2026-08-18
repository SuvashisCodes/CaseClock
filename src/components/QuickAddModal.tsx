import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, Play, Check, X, Sparkles, Loader2, Calendar, AlertCircle, FileText, CheckCircle2, Volume2, MessageSquare, Clock } from 'lucide-react';
import { Case, Deadline, VoiceExtractionResult, ReminderTimingOption } from '../types';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeadlineCreated: (deadline: Deadline) => void;
  cases: Case[];
}

const VOICE_PRESETS = [
  "File regular bail application for Ramesh Kumar in Patiala House court tomorrow morning under section 437",
  "Submit reply affidavit for Mehta Logistics in High Court by Friday 3 PM with verified documents",
  "Serve advance copy of Special Leave Petition to Supreme Court standing counsel for Sunita Sharma by next Monday"
];

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onDeadlineCreated,
  cases,
}) => {
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<VoiceExtractionResult | null>(null);

  // Form edit fields after extraction
  const [caseTitle, setCaseTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [courtName, setCourtName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [reminderTiming, setReminderTiming] = useState<ReminderTimingOption>('1_day_before');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('new');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setIsRecording(false);
    setRecordingSeconds(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setTextInput('');
    setIsAnalyzing(false);
    setErrorMsg(null);
    setExtractedData(null);
    setCaseTitle('');
    setClientName('');
    setCourtName('');
    setDueDate('');
    setDescription('');
    setUrgency('MEDIUM');
    setSelectedCaseId('new');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startRecording = async () => {
    setErrorMsg(null);
    setExtractedData(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setErrorMsg("Microphone access denied or unavailable. You can type or use sample presets below.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processInput = async (presetText?: string) => {
    setErrorMsg(null);
    setIsAnalyzing(true);

    try {
      let bodyData: any = {};

      const textToUse = presetText || textInput;

      if (textToUse.trim()) {
        bodyData = { textInput: textToUse.trim() };
      } else if (audioBlob) {
        // Convert audio to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
        });
        reader.readAsDataURL(audioBlob);
        const base64Audio = await base64Promise;
        bodyData = { audioData: base64Audio, mimeType: audioBlob.type || 'audio/webm' };
      } else {
        setIsAnalyzing(false);
        setErrorMsg("Please record audio, enter a voice note, or click a sample preset.");
        return;
      }

      const response = await fetch("/api/voice-to-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze voice note.");
      }

      const res: VoiceExtractionResult = data.extracted;
      setExtractedData(res);
      setCaseTitle(res.case_name || '');
      setClientName(res.client_name || '');
      setCourtName(res.court_name || 'District / High Court');
      setDueDate(res.due_date || new Date().toISOString().split('T')[0]);
      setDescription(res.description || '');
      setUrgency(res.urgency || 'MEDIUM');

      // Check if case title matches existing
      const existing = cases.find(c => c.title.toLowerCase().includes(res.case_name.toLowerCase()));
      if (existing) {
        setSelectedCaseId(existing.id);
      } else {
        setSelectedCaseId('new');
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      setErrorMsg(err.message || "Failed to parse voice note. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveDeadline = async () => {
    if (!description || !dueDate) {
      setErrorMsg("Description and Due Date are required.");
      return;
    }

    try {
      const response = await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: selectedCaseId === 'new' ? undefined : selectedCaseId,
          case_title: caseTitle || "General Legal Task",
          client_name: clientName || "Client",
          court_name: courtName || "Court",
          description,
          due_date: dueDate,
          input_source: audioBlob ? "Voice" : "Manual",
          urgency,
          reminder_timing: reminderTiming,
          raw_transcript: extractedData?.transcript || textInput || ""
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save deadline.");
      }

      onDeadlineCreated(data.deadline);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Error saving deadline.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-100 my-auto">
        {/* Modal Header */}
        <div className="bg-slate-800/90 px-5 py-4 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-serif">Voice-to-Task Engine</h2>
              <p className="text-xs text-slate-400">Speak or type deadline to extract legal entities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {errorMsg && (
            <div className="bg-red-950/60 border border-red-800/60 rounded-xl p-3 text-xs text-red-200 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!extractedData ? (
            <>
              {/* Input Mode Selector */}
              <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700/60 text-xs font-medium">
                <button
                  onClick={() => setInputMode('voice')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                    inputMode === 'voice' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Voice Recorder</span>
                </button>
                <button
                  onClick={() => setInputMode('text')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                    inputMode === 'text' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Text Dictation</span>
                </button>
              </div>

              {/* Voice Recorder Mode */}
              {inputMode === 'voice' ? (
                <div className="bg-slate-950/80 rounded-2xl p-6 border border-slate-800 text-center space-y-4">
                  {isRecording ? (
                    <div className="space-y-4">
                      <div className="relative inline-flex items-center justify-center">
                        <div className="absolute w-20 h-20 rounded-full bg-red-500/20 animate-ping"></div>
                        <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg relative z-10">
                          <Mic className="w-8 h-8 animate-pulse" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-red-400">Recording Voice Note...</p>
                        <p className="text-2xl font-mono font-bold text-white mt-1">
                          00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                        </p>
                      </div>
                      <button
                        onClick={stopRecording}
                        className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center space-x-2 mx-auto shadow-md transition-transform active:scale-95"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        <span>Stop Recording</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
                        <Mic className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Tap to Speak Advocate Note</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                          E.g., "File bail application for Ramesh Kumar in Patiala House court tomorrow under section 437"
                        </p>
                      </div>

                      {audioUrl && (
                        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <Volume2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-slate-300 font-medium">Recording captured</span>
                          </div>
                          <audio src={audioUrl} controls className="h-7 max-w-[180px]" />
                        </div>
                      )}

                      <div className="flex items-center justify-center space-x-3 pt-2">
                        <button
                          onClick={startRecording}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md transition-transform active:scale-95"
                        >
                          <Mic className="w-4 h-4" />
                          <span>{audioUrl ? 'Record Again' : 'Start Recording'}</span>
                        </button>

                        {(audioBlob || textInput) && (
                          <button
                            onClick={() => processInput()}
                            disabled={isAnalyzing}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md transition-transform active:scale-95 disabled:opacity-50"
                          >
                            {isAnalyzing ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Extracting...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                <span>Extract Task</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Text Input Mode */
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Type or dictating text note:
                  </label>
                  <textarea
                    rows={4}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="E.g., File reply affidavit for Mehta Logistics in Delhi High Court before 15th August..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => processInput()}
                    disabled={isAnalyzing || !textInput.trim()}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md transition-all disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>GPT-4 / Gemini Extracting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Extract Legal Entities</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Advocate Sample Voice Presets */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Sample Advocate Dictations:
                </p>
                <div className="space-y-1.5">
                  {VOICE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setTextInput(preset);
                        processInput(preset);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-xs text-slate-300 transition-colors flex items-center justify-between group"
                    >
                      <span className="line-clamp-1 italic">"{preset}"</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 opacity-60 group-hover:opacity-100 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Entity Extraction Review Form */
            <div className="space-y-4">
              <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">Entities extracted via LLM Engine</span>
                </div>
                <button
                  onClick={() => setExtractedData(null)}
                  className="text-xs text-slate-400 underline hover:text-white"
                >
                  Re-parse Note
                </button>
              </div>

              {extractedData.transcript && (
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 italic">
                  <span className="font-semibold text-slate-300 not-italic">Transcript: </span>"{extractedData.transcript}"
                </div>
              )}

              {/* Entity Fields Form */}
              <div className="space-y-3">
                {/* Select Case or Create New */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Link to Case</label>
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="new">+ Create New Case ({caseTitle || "Extracted Title"})</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.court_name})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCaseId === 'new' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Case Title</label>
                      <input
                        type="text"
                        value={caseTitle}
                        onChange={(e) => setCaseTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Client Name</label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Court Name</label>
                  <input
                    type="text"
                    value={courtName}
                    onChange={(e) => setCourtName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Urgency Level</label>
                    <select
                      value={urgency}
                      onChange={(e: any) => setUrgency(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="HIGH">HIGH (Immediate Filing)</option>
                      <option value="MEDIUM">MEDIUM (Standard Deadline)</option>
                      <option value="LOW">LOW (Follow-up Task)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-emerald-400 mb-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp Reminder Timing</span>
                  </label>
                  <select
                    value={reminderTiming}
                    onChange={(e: any) => setReminderTiming(e.target.value as ReminderTimingOption)}
                    className="w-full bg-slate-950 border border-emerald-800/80 rounded-xl px-3 py-2 text-xs text-emerald-200 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="1_day_before">1 Day Before (24 Hours) - Recommended</option>
                    <option value="2_days_before">2 Days Before (48 Hours)</option>
                    <option value="12_hours_before">12 Hours Before</option>
                    <option value="2_hours_before">2 Hours Before (Urgent Alert)</option>
                    <option value="at_time">On Due Date Morning (8:00 AM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Task Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  onClick={() => setExtractedData(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveDeadline}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md transition-transform active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Deadline</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
