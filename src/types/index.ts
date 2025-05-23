export type Language = 'ru' | 'en';

export interface LocalizedString {
  ru: string;
  en: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  isPremium: boolean;
  preferences: {
    language: Language;
    notifications: {
      dailyTest: boolean;
      recommendations: boolean;
      updates: boolean;
    };
  };
  progress: {
    level: number;
    testsCompleted: number;
    achievements: Achievement[];
  };
  archetypes: ArchetypeProgress[];
}

export interface Achievement {
  id: string;
  name: string;
  dateUnlocked: Date;
}

export interface ArchetypeProgress {
  name: string;
  level: number;
  lastUpdated: Date;
} 