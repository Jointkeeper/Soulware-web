import { SubscriptionTier } from './subscription';

export type TestType = 'static' | 'ai';

export type TestCategory =
  | 'personality' // Личностные тесты
  | 'career' // Профориентация
  | 'relationships' // Отношения
  | 'emotional' // Эмоциональный интеллект
  | 'cognitive' // Когнитивные способности
  | 'mental_health' // Психическое здоровье
  | 'development' // Личностный рост
  | 'social' // Социальные навыки
  | 'leadership' // Лидерство
  | 'stress' // Стресс и выгорание
  | 'creativity' // Креативность
  | 'motivation' // Мотивация
  | 'values' // Ценности и убеждения
  | 'humor' // Юмористические
  | 'mythology' // Мифологические
  | 'scenario' // Сценарные
  | 'lifestyle' // Здоровье и образ жизни
  | 'finance' // Финансовая грамотность
  | 'self_esteem' // Самооценка
  | 'communication' // Коммуникация
  | 'culture' // Культура и искусство
  | 'ethics' // Этические дилеммы
  | 'creative_thinking'; // Творческое мышление

export interface LocalizedContent {
  ru: string;
  en: string;
}

export interface Question {
  id: string;
  text: LocalizedContent;
  type: 'single' | 'multiple' | 'scale';
  options?: Array<{
    id: string;
    text: LocalizedContent;
    value: number;
  }>;
  scaleRange?: {
    min: number;
    max: number;
    step: number;
  };
}

export interface Scale {
  id: string;
  name: LocalizedContent;
  description: LocalizedContent;
  minValue: number;
  maxValue: number;
  interpretations: Array<{
    range: [number, number];
    description: LocalizedContent;
  }>;
}

interface BaseTest {
  id: string;
  type: TestType;
  category: TestCategory;
  title: LocalizedContent;
  description: LocalizedContent;
  duration: 'short' | 'medium' | 'long';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  requiredTier: SubscriptionTier;
  isActive: boolean;
  thumbnail?: string;
  tags: string[];
  estimatedTime: number; // в минутах
  createdAt: Date;
  updatedAt: Date;
}

export interface StaticTest extends BaseTest {
  type: 'static';
  questions: Question[];
  resultScales: Scale[];
}

export interface AiTest extends BaseTest {
  type: 'ai';
  basePrompt: string;
  imagePrompt: string;
  personalityFactors: string[];
  requiredInputs: Array<{
    id: string;
    name: LocalizedContent;
    type: 'text' | 'number' | 'choice';
    options?: LocalizedContent[];
  }>;
}

export type Test = StaticTest | AiTest;

export interface TestResult {
  id: string;
  userId: string;
  testId: string;
  answers: Record<string, any>;
  scores?: Record<string, number>;
  aiAnalysis?: {
    text: string;
    recommendations: string[];
    imageUrl?: string;
  };
  createdAt: Date;
}

export const TEST_CATEGORIES: Record<TestCategory, LocalizedContent> = {
  personality: {
    ru: 'Личностные тесты',
    en: 'Personality Tests',
  },
  career: {
    ru: 'Профориентация',
    en: 'Career Guidance',
  },
  relationships: {
    ru: 'Отношения',
    en: 'Relationships',
  },
  emotional: {
    ru: 'Эмоциональный интеллект',
    en: 'Emotional Intelligence',
  },
  cognitive: {
    ru: 'Когнитивные способности',
    en: 'Cognitive Abilities',
  },
  mental_health: {
    ru: 'Психическое здоровье',
    en: 'Mental Health',
  },
  development: {
    ru: 'Личностный рост',
    en: 'Personal Development',
  },
  social: {
    ru: 'Социальные навыки',
    en: 'Social Skills',
  },
  leadership: {
    ru: 'Лидерство',
    en: 'Leadership',
  },
  stress: {
    ru: 'Стресс и выгорание',
    en: 'Stress & Burnout',
  },
  creativity: {
    ru: 'Креативность',
    en: 'Creativity',
  },
  motivation: {
    ru: 'Мотивация',
    en: 'Motivation',
  },
  values: {
    ru: 'Ценности и убеждения',
    en: 'Values & Beliefs',
  },
  humor: {
    ru: 'Юмористические',
    en: 'Humor',
  },
  mythology: {
    ru: 'Мифологические',
    en: 'Mythology',
  },
  scenario: {
    ru: 'Сценарные',
    en: 'Scenario-based',
  },
  lifestyle: {
    ru: 'Здоровье и образ жизни',
    en: 'Lifestyle & Health',
  },
  finance: {
    ru: 'Финансовая грамотность',
    en: 'Financial Literacy',
  },
  self_esteem: {
    ru: 'Самооценка',
    en: 'Self-Esteem',
  },
  communication: {
    ru: 'Коммуникация',
    en: 'Communication',
  },
  culture: {
    ru: 'Культура и искусство',
    en: 'Culture & Arts',
  },
  ethics: {
    ru: 'Этические дилеммы',
    en: 'Ethical Dilemmas',
  },
  creative_thinking: {
    ru: 'Творческое мышление',
    en: 'Creative Thinking',
  },
}; 