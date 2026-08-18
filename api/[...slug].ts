// Vercel catch-all API handler adapted from server.ts
// Exports a single handler that implements the existing in-memory API.

import { GoogleGenAI, Type } from "@google/genai";

// In-memory data persisted across warm lambda instances
let cases: any[] = [
  {
    id: "case-101",
    title: "State of Delhi vs. Ramesh Kumar",
    client_name: "Ramesh Kumar",
    court_name: "Patiala House District Courts, New Delhi",
    status: "ACTIVE",
    created_at: "2026-08-01T10:00:00Z"
  },
  {
    id: "case-102",
    title: "Mehta Logistics Pvt Ltd vs. Union Bank",
    client_name: "Anand Mehta",
    court_name: "High Court of Delhi (Commercial Division)",
    status: "PENDING",
    created_at: "2026-08-03T11:30:00Z"
  }
];

let deadlines: any[] = [
  {
    id: "dl-201",
    case_id: "case-101",
    case_title: "State of Delhi vs. Ramesh Kumar",
    client_name: "Ramesh Kumar",
    court_name: "Patiala House District Courts, New Delhi",
    description: "File Regular Bail Application under Section 437 CrPC with Affidavit of Clean Record",
    due_date: "2026-08-13",
    input_source: "Voice",
    is_completed: false,
    urgency: "HIGH",
    raw_transcript: "Remind me to file regular bail application for Ramesh Kumar in Patiala House court tomorrow morning under section 437 with affidavit",
    created_at: "2026-08-11T16:00:00Z"
  }
];

let documentDrafts: any[] = [
  {
    id: "doc-301",
    case_id: "case-101",
    case_title: "State of Delhi vs. Ramesh Kumar",
    document_type: "Bail Petition",
    title: "Bail Application u/S 437 CrPC - Ramesh Kumar",
    content: "(sample draft content)",
    created_at: "2026-08-11T17:00:00Z"
  }
];

// Helper: Gemini/GenAI client initialization (optional)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: { "User-Agent": "aistudio-build" }
  }
});

// Reusable fallback generator similar to server.ts
async function generateContentWithFallback(requestOptions: { contents: any; config?: any }) {
  const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastErr: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model: modelName,
          contents: requestOptions.contents,
          config: requestOptions.config
        });
        if (res && res.text) return res;
      } catch (err: any) {
        lastErr = err;
        console.warn(`GenAI model ${modelName} failed:`, err?.message || err);
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
    }
  }

  throw lastErr || new Error("All GenAI attempts failed.");
}

// Main handler for Vercel
export default async function handler(req: any, res: any) {
  try {
    const url = req.url || ""; // e.g. /api/cases or /api/deadlines
    const method = (req.method || "GET").toUpperCase();
    // Normalize path after /api and remove query/trailing slashes
    const pathOnly = String(url).split("?")[0];
    const rawPath = pathOnly.replace(/^\/api/, "");
    const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, "") : rawPath;

    // --- Cases ---
    if (path === "/cases" && method === "GET") {
      return res.json({ success: true, cases });
    }

    if (path === "/cases" && method === "POST") {
      const { title, client_name, court_name, status } = req.body || {};
      if (!title || !client_name) return res.status(400).json({ error: "Title and client name are required." });
      const newCase = {
        id: `case-${Date.now()}`,
        title,
        client_name,
        court_name: court_name || "District / High Court",
        status: status || "ACTIVE",
        created_at: new Date().toISOString()
      };
      cases.unshift(newCase);
      return res.json({ success: true, case: newCase });
    }

    // DELETE /api/cases/:id
    if (path.startsWith("/cases/") && method === "DELETE") {
      const id = path.split("/").pop();
      cases = cases.filter(c => c.id !== id);
      deadlines = deadlines.filter(d => d.case_id !== id);
      return res.json({ success: true, message: "Case and associated deadlines removed." });
    }

    // --- Deadlines ---
    if (path === "/deadlines" && method === "GET") {
      return res.json({ success: true, deadlines });
    }

    if (path === "/deadlines" && method === "POST") {
      const { case_id, case_title, client_name, court_name, description, due_date, input_source, urgency } = req.body || {};
      if (!description || !due_date) return res.status(400).json({ error: "Description and due date are required." });
      let matchedCase = cases.find(c => c.id === case_id);
      if (!matchedCase && case_title) {
        matchedCase = cases.find(c => c.title.toLowerCase() === case_title.toLowerCase());
        if (!matchedCase) {
          matchedCase = {
            id: `case-${Date.now()}`,
            title: case_title,
            client_name: client_name || "Client",
            court_name: court_name || "District Court",
            status: "ACTIVE",
            created_at: new Date().toISOString()
          };
          cases.unshift(matchedCase);
        }
      }

      const newDeadline = {
        id: `dl-${Date.now()}`,
        case_id: matchedCase ? matchedCase.id : "case-general",
        case_title: matchedCase ? matchedCase.title : (case_title || "General Legal Task"),
        client_name: matchedCase ? matchedCase.client_name : (client_name || "Client"),
        court_name: matchedCase ? matchedCase.court_name : (court_name || "Court"),
        description,
        due_date,
        input_source: input_source || "Manual",
        is_completed: false,
        urgency: urgency || "MEDIUM",
        raw_transcript: req.body?.raw_transcript || "",
        created_at: new Date().toISOString()
      };

      deadlines.unshift(newDeadline);
      return res.json({ success: true, deadline: newDeadline });
    }

    // PATCH /api/deadlines/:id/toggle
    if (path.endsWith("/toggle") && method === "PATCH") {
      const parts = path.split("/");
      // parts e.g. ['', 'deadlines', ':id', 'toggle']
      const id = parts[2];
      const deadline = deadlines.find(d => d.id === id);
      if (!deadline) return res.status(404).json({ error: "Deadline not found." });
      deadline.is_completed = !deadline.is_completed;
      return res.json({ success: true, deadline });
    }

    if (path.startsWith("/deadlines/") && method === "DELETE") {
      const id = path.split("/").pop();
      deadlines = deadlines.filter(d => d.id !== id);
      return res.json({ success: true });
    }

    // --- Documents ---
    if (path === "/documents" && method === "GET") {
      return res.json({ success: true, documents: documentDrafts });
    }

    if (path === "/documents" && method === "POST") {
      const { case_id, case_title, document_type, title, content } = req.body || {};
      const newDoc = {
        id: `doc-${Date.now()}`,
        case_id: case_id || "case-general",
        case_title: case_title || "General Case",
        document_type: document_type || "Legal Draft",
        title: title || "Untitled Draft",
        content: content || "",
        created_at: new Date().toISOString()
      };
      documentDrafts.unshift(newDoc);
      return res.json({ success: true, document: newDoc });
    }

    // --- Reminder worker simulation ---
    if (path === "/check-reminders" && method === "POST") {
      const { phone, user_name, reminder_timing } = req.body || {};
      const today = new Date();
      today.setHours(0,0,0,0);
      const notifications: any[] = [];
      const timingLabels: Record<string,string> = {
        '2_days_before': '2 Days Before (48h)',
        '1_day_before': '1 Day Before (24h)',
        '12_hours_before': '12 Hours Before',
        '2_hours_before': '2 Hours Before (Urgent)',
        'at_time': 'On Due Date Morning (8:00 AM)'
      };

      for (const dl of deadlines as any[]) {
        if (dl.is_completed) continue;
        const due = new Date(dl.due_date);
        due.setHours(0,0,0,0);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000*60*60*24));
        if (diffDays <= 3) {
          let msg = "";
          if (diffDays < 0) msg = `OVERDUE by ${Math.abs(diffDays)} day(s)! Task: ${dl.description}`;
          else if (diffDays === 0) msg = `DUE TODAY! Task: ${dl.description} (${dl.court_name})`;
          else if (diffDays === 1) msg = `DUE TOMORROW! Task: ${dl.description} (${dl.court_name})`;
          else msg = `Approaching in ${diffDays} days (${dl.due_date}): ${dl.description}`;

          const activeTiming = dl.reminder_timing || reminder_timing || '1_day_before';
          const timingText = timingLabels[activeTiming] || '1 Day Before (24h)';
          const advocateGreeting = user_name ? `Respected ${user_name},` : 'Respected Advocate,';
          const waMessage = `⚖️ *CASECLOCK COURT REMINDER* ⚖️\\n\\n${advocateGreeting}\\n\\n📌 *Case:* ${dl.case_title || 'Legal Matter'}\\n🏛️ *Court:* ${dl.court_name || 'Court Forum'}\\n👤 *Client:* ${dl.client_name || 'Client'}\\n📅 *Due Date:* ${dl.due_date}\\n⏰ *Reminder Schedule:* ${timingText}\\n⚡ *Urgency:* ${dl.urgency || 'MEDIUM'}\\n\\n📋 *Task Description:*\\n"${dl.description}"\\n\\n_Generated automatically via CaseClock Legal Assistant._`;
          const recipientPhone = (phone||'').replace(/[^0-9]/g, '');
          const waUrl = recipientPhone ? `https://wa.me/${recipientPhone}?text=${encodeURIComponent(waMessage)}` : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

          notifications.push({
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2,6)}`,
            deadline_id: dl.id,
            case_title: dl.case_title || "Case Task",
            description: dl.description,
            due_date: dl.due_date,
            days_remaining: diffDays,
            message: msg,
            whatsapp_message: waMessage,
            whatsapp_url: waUrl,
            reminder_timing: timingText,
            timestamp: new Date().toLocaleTimeString()
          });
        }
      }

      return res.json({ success: true, worker_status: "WHATSAPP_SCHEDULER_ACTIVE", timestamp: new Date().toISOString(), checked_count: deadlines.length, triggered_notifications: notifications });
    }

    // --- Voice-to-Task ---
    if (path === "/voice-to-task" && method === "POST") {
      try {
        const { audioData, mimeType, textInput } = req.body || {};
        const todayStr = new Date().toISOString().split('T')[0];
        const systemInstruction = `You are an expert voice-to-task parser for legal advocates. Today's date is ${todayStr}. Extract structured legal task details.`;
        let contents: any;
        if (audioData) {
          let cleanMime = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
          if (!cleanMime.startsWith('audio/')) cleanMime = 'audio/webm';
          const base64Audio = audioData.includes(',') ? audioData.split(',')[1] : audioData;
          contents = { parts: [{ inlineData: { mimeType: cleanMime, data: base64Audio } }, { text: 'Transcribe this legal voice note and extract the task details.' }] };
        } else if (textInput) {
          contents = `Extract legal task details from this note: "${textInput}"`;
        } else {
          return res.status(400).json({ error: 'Either audioData or textInput is required.' });
        }

        let parsedData: any = {};
        try {
          const response = await generateContentWithFallback({ contents, config: { systemInstruction, responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { case_name: { type: Type.STRING }, client_name: { type: Type.STRING }, court_name: { type: Type.STRING }, due_date: { type: Type.STRING }, description: { type: Type.STRING }, urgency: { type: Type.STRING }, transcript: { type: Type.STRING } }, required: ['case_name','due_date','description','urgency'] } } });
          parsedData = JSON.parse(response.text || '{}');
        } catch (aiError: any) {
          console.warn('Gemini error, fallback parser used:', aiError?.message || aiError);
          const textToParse = textInput || 'File court petition as requested';
          const isUrgent = /urgent|bail|today|immediately|high/i.test(textToParse);
          const tomorrowObj = new Date(); tomorrowObj.setDate(tomorrowObj.getDate()+1);
          const tomorrowStr = tomorrowObj.toISOString().split('T')[0];
          parsedData = { case_name: textToParse.split(' ').slice(0,4).join(' ') || 'New Advocate Matter', client_name: 'Client', court_name: 'District Court', due_date: /tomorrow/i.test(textToParse) ? tomorrowStr : todayStr, description: textToParse, urgency: isUrgent ? 'HIGH' : 'MEDIUM', transcript: textToParse };
        }

        return res.json({ success: true, extracted: { case_name: parsedData.case_name || 'New Advocate Case', client_name: parsedData.client_name || 'Client', court_name: parsedData.court_name || 'District Court', due_date: parsedData.due_date || todayStr, description: parsedData.description || textInput || 'Extracted Legal Task', urgency: parsedData.urgency || 'MEDIUM', transcript: parsedData.transcript || textInput || 'Voice note transcribed' } });
      } catch (error: any) {
        console.error('Error /api/voice-to-task:', error);
        return res.status(500).json({ error: error.message || 'Failed to process voice note' });
      }
    }

    // --- Draft Document ---
    if (path === "/draft-document" && method === "POST") {
      try {
        const { prompt, document_type, case_title, client_name, court_name } = req.body || {};
        if (!prompt) return res.status(400).json({ error: 'Prompt description is required.' });
        const systemInstruction = `You are an elite legal drafting assistant for independent court advocates.`;
        const promptMessage = `Draft a professional legal document based on the following requirements: Document Type: ${document_type || 'Legal Document'}\\nCase Title: ${case_title || ''}\\nClient Name: ${client_name || ''}\\nCourt Name: ${court_name || ''}\\n\\n${prompt}`;
        const response = await generateContentWithFallback({ contents: promptMessage, config: { systemInstruction, temperature: 0.2 } });
        const generatedContent = response.text || '';
        return res.json({ success: true, document: { document_type: document_type || 'Legal Draft', title: `${document_type || 'Draft'} - ${client_name || 'Case'}`, content: generatedContent } });
      } catch (error: any) {
        console.error('Error /api/draft-document:', error);
        return res.status(500).json({ error: error.message || 'Failed to draft legal document' });
      }
    }

    // If no route matched
    return res.status(404).json({ error: 'Not Found' });
  } catch (err: any) {
    console.error('API handler error:', err);
    return res.status(500).json({ error: err?.message || 'Internal Error' });
  }
}
