export type MissionType = 'contact' | 'donation' | 'volunteer' | 'information';

export interface UserData {
  name: string;
  email: string;
  mission: MissionType | null;
  message?: string;
  // Donation specific
  donationAmount?: number;
  donationRecurrence?: 'once' | 'monthly' | 'yearly';
  // Volunteer specific
  skills?: string[];
  availability?: string;
  // Contact specific
  subject?: string;
  phone?: string;
}

export interface ChatMessage {
  id: number;
  type: 'bot' | 'user' | 'options' | 'input';
  content: string;
  options?: ChatOption[];
  inputType?: 'text' | 'email' | 'number' | 'textarea' | 'select';
  inputPlaceholder?: string;
  field?: keyof UserData;
  timestamp: Date;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface ChatOption {
  label: string;
  value: string;
  icon: string;
  description?: string;
}

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  keywords: string[];
}
