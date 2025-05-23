import { SubscriptionTier } from './subscription';
import { z } from 'zod';

// Zod schema for LocalizedString
export const LocalizedStringSchema = z.object({
  ru: z.string(),
  en: z.string(),
});
export type LocalizedString = z.infer<typeof LocalizedStringSchema>;

// Zod schemas for Questions
const BaseQuestionSchema = z.object({
  id: z.string(),
  text: LocalizedStringSchema,
});

const OptionSchema = z.object({
  id: z.string(),
  text: LocalizedStringSchema,
  value: z.number(), // Or z.union([z.string(), z.number()]) if value can be non-numeric
});

const OptionBasedQuestionSchema = BaseQuestionSchema.extend({
  type: z.enum(['single', 'multiple']),
  options: z.array(OptionSchema),
  scaleRange: z.never().optional(),
});

const ScaleBasedQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('scale'),
  options: z.never().optional(),
  scaleRange: z.object({
    min: z.number(),
    max: z.number(),
    step: z.number(),
  }),
});

export const QuestionSchema = z.union([
  OptionBasedQuestionSchema,
  ScaleBasedQuestionSchema,
]);

export type Question = z.infer<typeof QuestionSchema>;

// Zod schema for Scale
export const ScaleSchema = z.object({
  id: z.string(),
  name: LocalizedStringSchema,
  description: LocalizedStringSchema,
  minValue: z.number(),
  maxValue: z.number(),
  interpretations: z.array(
    z.object({
      range: z.tuple([z.number(), z.number()]),
      description: LocalizedStringSchema,
    })
  ),
});
export type Scale = z.infer<typeof ScaleSchema>;

// Zod schema for BaseTest
// TestType and TestCategory are implicitly handled by the schemas and constants below.
// export type TestType = 'static' | 'ai'; (Removed)
// export type TestCategory = ...; (Removed, string used in schema, constant for values)

const BaseTestSchema = z.object({
  id: z.string(),
  type: z.enum(['static', 'ai']), 
  category: z.string(), // TestCategory values are in TEST_CATEGORIES constant
  title: LocalizedStringSchema,
  description: LocalizedStringSchema,
  duration: z.enum(['short', 'medium', 'long']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  image: z.string().url().optional(),
  requiredTier: z.string(), // SubscriptionTier (string enum like)
  isActive: z.boolean(),
  thumbnail: z.string().url().optional(),
  tags: z.array(z.string()),
  estimatedTime: z.number(), // in minutes
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
});

// Zod schema for StaticTest
export const StaticTestSchema = BaseTestSchema.extend({
  type: z.literal('static'),
  questions: z.array(QuestionSchema),
  resultScales: z.array(ScaleSchema),
});
export type StaticTest = z.infer<typeof StaticTestSchema>;

// Zod schema for AiTest
export const AiTestSchema = BaseTestSchema.extend({
  type: z.literal('ai'),
  basePrompt: z.string(),
  imagePrompt: z.string(),
  personalityFactors: z.array(z.string()),
  requiredInputs: z.array(
    z.object({
      id: z.string(),
      name: LocalizedStringSchema,
      type: z.enum(['text', 'number', 'choice']),
      options: z.array(LocalizedStringSchema).optional(),
    })
  ),
});
export type AiTest = z.infer<typeof AiTestSchema>;

export const TestSchema = z.union([StaticTestSchema, AiTestSchema]);
export type Test = z.infer<typeof TestSchema>;

// Define a more specific Zod schema for answers
export const TestAnswerValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.number(),
]);
export const TestAnswersSchema = z.record(TestAnswerValueSchema);

// Zod schema for TestResult
export const TestResultSchema = z.object({
  id: z.string(),
  userId: z.string(),
  testId: z.string(),
  answers: TestAnswersSchema, 
  scores: z.record(z.number()).optional(),
  aiAnalysis: z.object({
    text: z.string(),
    recommendations: z.array(z.string()),
    imageUrl: z.string().url().optional(),
  }).optional(),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
});

export type TestResult = z.infer<typeof TestResultSchema>;

// TestCategory type alias is removed, but this constant providing the actual categories and their localizations is still needed.
export const TEST_CATEGORIES: Record<string, LocalizedString> = { // Changed Record<TestCategory, LocalizedString> to Record<string, LocalizedString>
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