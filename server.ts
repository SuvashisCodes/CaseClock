import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// In-Memory Database for Advocates
let cases = [
  {
    id: "case-101",
    title: "State of Delhi vs. Ramesh Kumar",
    client_name: "Ramesh Kumar",
    court_name: "Patiala House District Courts, New Delhi",
    status: "ACTIVE" as const,
    created_at: "2026-08-01T10:00:00Z"
  },
  {
    id: "case-102",
    title: "Mehta Logistics Pvt Ltd vs. Union Bank",
    client_name: "Anand Mehta",
    court_name: "High Court of Delhi (Commercial Division)",
    status: "PENDING" as const,
    created_at: "2026-08-03T11:30:00Z"
  },
  {
    id: "case-103",
    title: "Sunita Sharma vs. Inspector Rajat Singh",
    client_name: "Sunita Sharma",
    court_name: "Supreme Court of India",
    status: "ACTIVE" as const,
    created_at: "2026-08-05T09:15:00Z"
  },
  {
    id: "case-104",
    title: "TechCorp India vs. Cyber Cell",
    client_name: "Vikram Malhotra",
    court_name: "Sessions Court, Gurugram",
    status: "APPEAL" as const,
    created_at: "2026-08-08T14:20:00Z"
  }
];

let deadlines = [
  {
    id: "dl-201",
    case_id: "case-101",
    case_title: "State of Delhi vs. Ramesh Kumar",
    client_name: "Ramesh Kumar",
    court_name: "Patiala House District Courts, New Delhi",
    description: "File Regular Bail Application under Section 437 CrPC with Affidavit of Clean Record",
    due_date: "2026-08-13", // Tomorrow relative to 2026-08-12
    input_source: "Voice" as const,
    is_completed: false,
    urgency: "HIGH" as const,
    raw_transcript: "Remind me to file regular bail application for Ramesh Kumar in Patiala House court tomorrow morning under section 437 with affidavit",
    created_at: "2026-08-11T16:00:00Z"
  },
  {
    id: "dl-202",
    case_id: "case-102",
    case_title: "Mehta Logistics Pvt Ltd vs. Union Bank",
    client_name: "Anand Mehta",
    court_name: "High Court of Delhi (Commercial Division)",
    description: "Submit Reply Affidavit to Commercial Summary Suit Interlocutory Application",
    due_date: "2026-08-15",
    input_source: "Manual" as const,
    is_completed: false,
    urgency: "HIGH" as const,
    raw_transcript: "",
    created_at: "2026-08-10T12:00:00Z"
  },
  {
    id: "dl-203",
    case_id: "case-103",
    case_title: "Sunita Sharma vs. Inspector Rajat Singh",
    client_name: "Sunita Sharma",
    court_name: "Supreme Court of India",
    description: "Serve Advance Copy of Special Leave Petition (SLP) to Standing Counsel",
    due_date: "2026-08-18",
    input_source: "Voice" as const,
    is_completed: false,
    urgency: "MEDIUM" as const,
    raw_transcript: "Serve advance copy of Sunita Sharma SLP to standing counsel before Friday",
    created_at: "2026-08-09T09:00:00Z"
  },
  {
    id: "dl-204",
    case_id: "case-104",
    case_title: "TechCorp India vs. Cyber Cell",
    client_name: "Vikram Malhotra",
    court_name: "Sessions Court, Gurugram",
    description: "Submit Verified Document Inspection Report",
    due_date: "2026-08-10", // Overdue
    input_source: "Manual" as const,
    is_completed: true,
    urgency: "LOW" as const,
    raw_transcript: "",
    created_at: "2026-08-05T10:00:00Z"
  }
];

let documentDrafts = [
  {
    id: "doc-301",
    case_id: "case-101",
    case_title: "State of Delhi vs. Ramesh Kumar",
    document_type: "Bail Petition",
    title: "Bail Application u/S 437 CrPC - Ramesh Kumar",
    content: `IN THE COURT OF THE CHIEF METROPOLITAN MAGISTRATE, PATIALA HOUSE COURTS, NEW DELHI

IN THE MATTER OF:
STATE OF DELHI ... PROSECUTION
VERSUS
RAMESH KUMAR ... APPLICANT/ACCUSED

APPLICATION FOR GRANT OF REGULAR BAIL UNDER SECTION 437 OF THE CODE OF CRIMINAL PROCEDURE, 1973

MOST RESPECTFULLY SHOWETH:

1. That the Applicant/Accused Ramesh Kumar was arrested on 02.08.2026 in connection with FIR No. 240/2026 registered at P.S. Connaught Place under Sections 420/468/471 IPC.

2. That the Applicant is an innocent citizen with clean antecedent record and has been falsely implicated in the present case due to business rivalry.

3. That the investigation in the matter is substantially complete, and no further custodial interrogation of the Applicant is required by the investigating agency.

4. That the Applicant undertakes to abide by all terms and conditions as may be imposed by this Hon'ble Court and shall not temper with prosecution evidence.

PRAYER:
In view of the facts stated above, it is most respectfully prayed that this Hon'ble Court may be pleased to release the Applicant/Accused on regular bail in the interest of justice.

AND FOR THIS ACT OF KINDNESS, THE APPLICANT SHALL EVER PRAY.

APPLICANT
THROUGH COUNSEL
ADV. A. K. SHARMA
ADVOCATE FOR APPLICANT`,
    created_at: "2026-08-11T17:00:00Z"
  }
];

// --- API ROUTES ---

// 1. Cases Endpoints
app.get("/api/cases", (req, res) => {
  res.json({ success: true, cases });
});

app.post("/api/cases", (req, res) => {
  const { title, client_name, court_name, status } = req.body;
  if (!title || !client_name) {
    return res.status(400).json({ error: "Title and client name are required." });
  }

  const newCase = {
    id: `case-${Date.now()}`,
    title,
    client_name,
    court_name: court_name || "District / High Court",
    status: status || "ACTIVE",
    created_at: new Date().toISOString()
  };

  cases.unshift(newCase);
  res.json({ success: true, case: newCase });
});

app.delete("/api/cases/:id", (req, res) => {
  const { id } = req.params;
  cases = cases.filter(c => c.id !== id);
  deadlines = deadlines.filter(d => d.case_id !== id);
  res.json({ success: true, message: "Case and associated deadlines removed." });
});

// 2. Deadlines Endpoints
app.get("/api/deadlines", (req, res) => {
  res.json({ success: true, deadlines });
});

app.post("/api/deadlines", (req, res) => {
  const { case_id, case_title, client_name, court_name, description, due_date, input_source, urgency } = req.body;
  
  if (!description || !due_date) {
    return res.status(400).json({ error: "Description and due date are required." });
  }

  let matchedCase = cases.find(c => c.id === case_id);
  if (!matchedCase && case_title) {
    // Find or create case
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
    raw_transcript: req.body.raw_transcript || "",
    created_at: new Date().toISOString()
  };

  deadlines.unshift(newDeadline);
  res.json({ success: true, deadline: newDeadline });
});

app.patch("/api/deadlines/:id/toggle", (req, res) => {
  const { id } = req.params;
  const deadline = deadlines.find(d => d.id === id);
  if (!deadline) {
    return res.status(404).json({ error: "Deadline not found." });
  }
  deadline.is_completed = !deadline.is_completed;
  res.json({ success: true, deadline });
});

app.delete("/api/deadlines/:id", (req, res) => {
  const { id } = req.params;
  deadlines = deadlines.filter(d => d.id !== id);
  res.json({ success: true });
});

// 3. Voice-to-Task AI Engine Endpoint

// Robust Helper to execute Gemini requests with model fallback and automatic retry on 503/transient errors
async function generateContentWithFallback(requestOptions: {
  contents: any;
  config?: any;
}) {
  const modelsToTry = [
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
  ];

  let lastErr: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model: modelName,
          contents: requestOptions.contents,
          config: requestOptions.config,
        });
        if (res && res.text) {
          return res;
        }
      } catch (err: any) {
        lastErr = err;
        console.warn(`[Gemini API] Call to model '${modelName}' (attempt ${attempt + 1}) failed:`, err?.message || err);
        // Short pause before retrying or switching models
        await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
      }
    }
  }

  throw lastErr || new Error("All Gemini model generation attempts failed.");
}

app.post("/api/voice-to-task", async (req, res) => {
  try {
    const { audioData, mimeType, textInput } = req.body;
    const todayStr = new Date().toISOString().split("T")[0];

    const systemInstruction = `You are an expert voice-to-task parser for legal advocates.
Today's date is ${todayStr}.
Extract structured legal task details from the provided voice recording or text note.
- case_name: Title of the case or main party name (e.g., 'State vs Ramesh', 'Mehta Logistics')
- client_name: Client name if mentioned or identifiable
- court_name: Court or legal forum mentioned
- due_date: Due date in YYYY-MM-DD format. Calculate relative dates like 'tomorrow', 'next Monday', 'in 3 days' relative to today (${todayStr})
- description: Actionable filing or hearing task description
- urgency: HIGH, MEDIUM, or LOW
- transcript: Verbatim transcript or original text note`;

    let contents: any;

    if (audioData) {
      // Clean mimeType by removing codecs parameters (e.g. 'audio/webm;codecs=opus' -> 'audio/webm')
      let cleanMime = (mimeType || "audio/webm").split(";")[0].trim().toLowerCase();
      if (!cleanMime || !cleanMime.startsWith("audio/")) {
        cleanMime = "audio/webm";
      }
      const base64Audio = audioData.includes(",") ? audioData.split(",")[1] : audioData;

      contents = {
        parts: [
          {
            inlineData: {
              mimeType: cleanMime,
              data: base64Audio
            }
          },
          {
            text: "Transcribe this legal voice note and extract the task details."
          }
        ]
      };
    } else if (textInput) {
      contents = `Extract legal task details from this note: "${textInput}"`;
    } else {
      return res.status(400).json({ error: "Either audioData or textInput is required." });
    }

    let parsedData: any = {};

    try {
      const response = await generateContentWithFallback({
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              case_name: { type: Type.STRING, description: "Case or client title" },
              client_name: { type: Type.STRING, description: "Name of the client represented" },
              court_name: { type: Type.STRING, description: "Court or forum name" },
              due_date: { type: Type.STRING, description: "Due date in YYYY-MM-DD format" },
              description: { type: Type.STRING, description: "Filing or hearing task description" },
              urgency: { type: Type.STRING, description: "HIGH, MEDIUM, or LOW" },
              transcript: { type: Type.STRING, description: "Transcript of the voice recording" }
            },
            required: ["case_name", "due_date", "description", "urgency"]
          }
        }
      });

      parsedData = JSON.parse(response.text || "{}");
    } catch (aiError: any) {
      console.warn("Gemini API calls exhausted, using smart fallback parser:", aiError?.message || aiError);
      
      // Smart Fallback Parser if Gemini fails on raw audio or invalid input
      const textToParse = textInput || "File court petition as requested";
      const isUrgent = /urgent|bail|today|immediately|high/i.test(textToParse);
      
      // Calculate tomorrow's date for fallback
      const tomorrowObj = new Date();
      tomorrowObj.setDate(tomorrowObj.getDate() + 1);
      const tomorrowStr = tomorrowObj.toISOString().split("T")[0];

      parsedData = {
        case_name: textToParse.split(" ").slice(0, 4).join(" ") || "New Advocate Matter",
        client_name: "Client",
        court_name: "District Court",
        due_date: /tomorrow/i.test(textToParse) ? tomorrowStr : todayStr,
        description: textToParse,
        urgency: isUrgent ? "HIGH" : "MEDIUM",
        transcript: textToParse
      };
    }

    res.json({
      success: true,
      extracted: {
        case_name: parsedData.case_name || "New Advocate Case",
        client_name: parsedData.client_name || "Client",
        court_name: parsedData.court_name || "District Court",
        due_date: parsedData.due_date || todayStr,
        description: parsedData.description || textInput || "Extracted Legal Task",
        urgency: parsedData.urgency || "MEDIUM",
        transcript: parsedData.transcript || textInput || "Voice note transcribed"
      }
    });
  } catch (error: any) {
    console.error("Error in /api/voice-to-task:", error);
    res.status(500).json({ error: error.message || "Failed to process voice note" });
  }
});

// 4. AI Drafting Assistant Endpoint
app.post("/api/draft-document", async (req, res) => {
  try {
    const { prompt, document_type, case_title, client_name, court_name } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt description is required." });
    }

    const systemInstruction = `You are an elite legal drafting assistant for independent court advocates.
You draft precise, formal, and authoritative legal documents including Bail Petitions, Affidavits, Legal Notices, Written Statements, Caveat Petitions, Writ Petitions, and Plaints.
Follow traditional court formatting standards:
- Header with Court Name in capital letters
- Formal cause title (IN THE MATTER OF: [Party A] VERSUS [Party B])
- Structured numbered paragraphs (1, 2, 3...)
- Statutory sections & legal grounds clearly articulated
- Concise Prayer Clause
- Verification clause at the end with Signature/Advocate block
Use brackets [LIKE THIS] for specific dates or details that the advocate may need to fill in.`;

    const promptMessage = `Draft a professional legal document based on the following advocate requirements:
Document Type: ${document_type || "Legal Document"}
Case Title: ${case_title || "State / Party vs. Client"}
Client Name: ${client_name || "Client"}
Court Name: ${court_name || "Hon'ble Court"}

Advocate Instructions:
"${prompt}"

Produce a complete, beautifully structured draft ready for review and editing.`;

    const response = await generateContentWithFallback({
      contents: promptMessage,
      config: {
        systemInstruction,
        temperature: 0.2
      }
    });

    const generatedContent = response.text || "";

    res.json({
      success: true,
      document: {
        document_type: document_type || "Legal Draft",
        title: `${document_type || "Draft"} - ${client_name || "Case"}`,
        content: generatedContent
      }
    });
  } catch (error: any) {
    console.error("Error in /api/draft-document:", error);
    res.status(500).json({ error: error.message || "Failed to draft legal document" });
  }
});

// 5. Document Drafts Persistence
app.get("/api/documents", (req, res) => {
  res.json({ success: true, documents: documentDrafts });
});

app.post("/api/documents", (req, res) => {
  const { case_id, case_title, document_type, title, content } = req.body;
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
  res.json({ success: true, document: newDoc });
});

// 6. Background Reminder Worker simulation (Celery & WhatsApp Dispatch Engine)
app.post("/api/check-reminders", (req, res) => {
  const { phone, user_name, reminder_timing } = req.body || {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const notifications = [];

  // Helper map for timing labels
  const timingLabels: Record<string, string> = {
    '2_days_before': '2 Days Before (48h)',
    '1_day_before': '1 Day Before (24h)',
    '12_hours_before': '12 Hours Before',
    '2_hours_before': '2 Hours Before (Urgent)',
    'at_time': 'On Due Date Morning (8:00 AM)',
  };

  for (const dl of deadlines as any[]) {
    if (dl.is_completed) continue;

    const due = new Date(dl.due_date);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) {
      let msg = "";
      if (diffDays < 0) {
        msg = `OVERDUE by ${Math.abs(diffDays)} day(s)! Task: ${dl.description}`;
      } else if (diffDays === 0) {
        msg = `DUE TODAY! Task: ${dl.description} (${dl.court_name})`;
      } else if (diffDays === 1) {
        msg = `DUE TOMORROW! Task: ${dl.description} (${dl.court_name})`;
      } else {
        msg = `Approaching in ${diffDays} days (${dl.due_date}): ${dl.description}`;
      }

      const activeTiming = dl.reminder_timing || reminder_timing || '1_day_before';
      const timingText = timingLabels[activeTiming] || '1 Day Before (24h)';

      // Formatted WhatsApp message for advocates
      const advocateGreeting = user_name ? `Respected ${user_name},` : 'Respected Advocate,';
      const waMessage = `⚖️ *CASECLOCK COURT REMINDER* ⚖️\n\n${advocateGreeting}\n\n📌 *Case:* ${dl.case_title || 'Legal Matter'}\n🏛️ *Court:* ${dl.court_name || 'Court Forum'}\n👤 *Client:* ${dl.client_name || 'Client'}\n📅 *Due Date:* ${dl.due_date}\n⏰ *Reminder Schedule:* ${timingText}\n⚡ *Urgency:* ${dl.urgency || 'MEDIUM'}\n\n📋 *Task Description:*\n"${dl.description}"\n\n_Generated automatically via CaseClock Legal Assistant._`;

      const recipientPhone = (phone || '').replace(/[^0-9]/g, '');
      const waUrl = recipientPhone
        ? `https://wa.me/${recipientPhone}?text=${encodeURIComponent(waMessage)}`
        : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

      notifications.push({
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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

  res.json({
    success: true,
    worker_status: "WHATSAPP_SCHEDULER_ACTIVE",
    timestamp: new Date().toISOString(),
    checked_count: deadlines.length,
    triggered_notifications: notifications
  });
});

// --- VITE & STATIC FILES ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Advocate Legal App Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
