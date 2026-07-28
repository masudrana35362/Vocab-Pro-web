import { Timestamp } from "firebase/firestore";

export interface UserSettings {
  darkMode: boolean;
  dailyGoal: number;
  reminderTime?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  streakCount: number;
  lastActivityDate: Timestamp;
  totalWords: number;
  achievements: string[];
  settings: UserSettings;
}

export interface SRSData {
  interval: number;
  easeFactor: number;
  nextReview: Timestamp;
  masteryLevel: number;
  timesMissed: number;
}

export interface Word {
  id?: string;
  word: string;
  meaning: string;
  example: string;
  tags: string[];
  banglaMeaning?: string;
  synonyms?: string[];
  image_url?: string;
  audio_url?: string;
  srs: SRSData;
  createdAt: Timestamp;
}
