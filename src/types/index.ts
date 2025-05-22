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

export type TestType = 'static' | 'ai';

export interface BaseTest {
  id: string;
  type: TestType;
  title: LocalizedString;
  description: LocalizedString;
  category: 'personality' | 'career' | 'relationships' | 'emotional' | 'cognitive' | 'mental_health' | 'development' | 'social' | 'leadership' | 'stress' | 'creativity' | 'motivation' | 'values' | 'humor' | 'mythology' | 'scenario' | 'lifestyle' | 'finance' | 'self_esteem' | 'communication' | 'culture' | 'ethics' | 'creative_thinking';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: 'short' | 'medium' | 'long';
  premium: boolean;
  image: string;
}

export interface StaticTest extends BaseTest {
  type: 'static';
  questions: Question[];
  resultScales: ResultScale[];
}

export interface AiTest extends BaseTest {
  type: 'ai';
  basePrompt: string;
  imagePrompt: string;
  personalityFactors: string[];
}

export type Test = StaticTest | AiTest;

export interface Question {
  id: string;
  text: LocalizedString;
  options: QuestionOption[];
  archetype?: string;
}

export interface QuestionOption {
  text: LocalizedString;
  value: number;
}

export interface ResultScale {
  name: LocalizedString;
  description: LocalizedString;
  minValue: number;
  maxValue: number;
}

export interface BaseTestResult {
  id: string;
  userId: string;
  testId: string;
  completedAt: Date;
}

export interface StaticTestResult extends BaseTestResult {
  scores: Record<string, number>;
  archetypeChanges: ArchetypeChange[];
}

export interface AiTestResult extends BaseTestResult {
  aiAnalysis: {
    text: string;
    recommendations: string[];
    imageUrl?: string;
  };
}

export type TestResult = StaticTestResult | AiTestResult;

export interface ArchetypeChange {
  name: string;
  change: number;
} 