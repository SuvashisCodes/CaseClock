export interface UserProfile {
  name: string;
  phone: string;
  whatsapp_enabled: boolean;
  default_reminder_timing: '2_days_before' | '1_day_before' | '12_hours_before' | '2_hours_before' | 'at_time';
}

export interface Case {
  id: string;
  title: string;
  client_name: string;
  court_name: string;
  status: 'ACTIVE' | 'PENDING' | 'DISPOSED' | 'APPEAL';
  created_at: string;
}

export type ReminderTimingOption = '2_days_before' | '1_day_before' | '12_hours_before' | '2_hours_before' | 'at_time';

export interface Deadline {
  id: string;
  case_id: string;
  case_title?: string;
  court_name?: string;
  client_name?: string;
  description: string;
  due_date: string; // ISO format YYYY-MM-DD
  input_source: 'Manual' | 'Voice';
  is_completed: boolean;
  urgency?: 'HIGH' | 'MEDIUM' | 'LOW';
  raw_transcript?: string;
  reminder_timing?: ReminderTimingOption;
  whatsapp_sent?: boolean;
  created_at: string;
}

export interface DocumentDraft {
  id: string;
  case_id: string;
  case_title?: string;
  document_type: string;
  title: string;
  content: string;
  created_at: string;
}

export interface VoiceExtractionResult {
  case_name: string;
  client_name?: string;
  court_name?: string;
  due_date: string;
  description: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  reminder_timing?: ReminderTimingOption;
  confidence?: number;
  transcript: string;
}

export interface ReminderNotification {
  id: string;
  deadline_id: string;
  case_title: string;
  description: string;
  due_date: string;
  days_remaining: number;
  message: string;
  whatsapp_message?: string;
  whatsapp_url?: string;
  reminder_timing?: string;
  timestamp: string;
}

