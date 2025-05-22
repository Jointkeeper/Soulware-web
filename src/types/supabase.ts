export interface Database {
  public: {
    Tables: {
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tier: 'free' | 'premium' | 'professional';
          features: {
            aiTestsPerDay: number;
            staticTestsAccess: 'limited' | 'full';
            analytics: 'basic' | 'advanced';
            advertising: boolean;
            support: 'basic' | 'priority';
            apiAccess: boolean;
            customBranding: boolean;
            dataExport: boolean;
          };
          valid_until: string;
          auto_renew: boolean;
          last_ai_test_date: string;
          ai_tests_used_today: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier: 'free' | 'premium' | 'professional';
          features?: {
            aiTestsPerDay: number;
            staticTestsAccess: 'limited' | 'full';
            analytics: 'basic' | 'advanced';
            advertising: boolean;
            support: 'basic' | 'priority';
            apiAccess: boolean;
            customBranding: boolean;
            dataExport: boolean;
          };
          valid_until?: string;
          auto_renew?: boolean;
          last_ai_test_date?: string;
          ai_tests_used_today?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tier?: 'free' | 'premium' | 'professional';
          features?: {
            aiTestsPerDay: number;
            staticTestsAccess: 'limited' | 'full';
            analytics: 'basic' | 'advanced';
            advertising: boolean;
            support: 'basic' | 'priority';
            apiAccess: boolean;
            customBranding: boolean;
            dataExport: boolean;
          };
          valid_until?: string;
          auto_renew?: boolean;
          last_ai_test_date?: string;
          ai_tests_used_today?: number;
          updated_at?: string;
        };
      };
      tests: {
        Row: {
          id: string;
          type: 'static' | 'ai';
          title: { ru: string; en: string };
          description: { ru: string; en: string };
          duration: 'short' | 'medium' | 'long';
          difficulty: 'beginner' | 'intermediate' | 'advanced';
          required_tier: 'free' | 'premium' | 'professional';
          is_active: boolean;
          content: {
            questions?: Array<{
              id: string;
              text: { ru: string; en: string };
              type: 'single' | 'multiple' | 'scale';
              options?: Array<{
                id: string;
                text: { ru: string; en: string };
                value: number;
              }>;
              scaleRange?: {
                min: number;
                max: number;
                step: number;
              };
            }>;
            scales?: Array<{
              id: string;
              name: { ru: string; en: string };
              description: { ru: string; en: string };
              minValue: number;
              maxValue: number;
              interpretations: Array<{
                range: [number, number];
                description: { ru: string; en: string };
              }>;
            }>;
            basePrompt?: string;
            imagePrompt?: string;
            personalityFactors?: string[];
            requiredInputs?: Array<{
              id: string;
              name: { ru: string; en: string };
              type: 'text' | 'number' | 'choice';
              options?: Array<{ ru: string; en: string }>;
            }>;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: 'static' | 'ai';
          title: { ru: string; en: string };
          description: { ru: string; en: string };
          duration: 'short' | 'medium' | 'long';
          difficulty: 'beginner' | 'intermediate' | 'advanced';
          required_tier: 'free' | 'premium' | 'professional';
          is_active?: boolean;
          content: object;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: 'static' | 'ai';
          title?: { ru: string; en: string };
          description?: { ru: string; en: string };
          duration?: 'short' | 'medium' | 'long';
          difficulty?: 'beginner' | 'intermediate' | 'advanced';
          required_tier?: 'free' | 'premium' | 'professional';
          is_active?: boolean;
          content?: object;
          updated_at?: string;
        };
      };
      test_results: {
        Row: {
          id: string;
          user_id: string;
          test_id: string;
          answers: Record<string, any>;
          scores?: Record<string, number>;
          ai_analysis?: {
            text: string;
            recommendations: string[];
            imageUrl?: string;
          };
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          test_id: string;
          answers: Record<string, any>;
          scores?: Record<string, number>;
          ai_analysis?: {
            text: string;
            recommendations: string[];
            imageUrl?: string;
          };
          created_at?: string;
        };
        Update: {
          answers?: Record<string, any>;
          scores?: Record<string, number>;
          ai_analysis?: {
            text: string;
            recommendations: string[];
            imageUrl?: string;
          };
        };
      };
      user_avatars: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          traits: Record<string, number>;
          prompt: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url: string;
          traits: Record<string, number>;
          prompt: string;
          created_at?: string;
        };
        Update: {
          image_url?: string;
          traits?: Record<string, number>;
          prompt?: string;
        };
      };
      partner_ads: {
        Row: {
          id: string;
          title: { ru: string; en: string };
          description: { ru: string; en: string };
          image_url: string;
          link: string;
          is_active: boolean;
          priority: number;
          start_date: string;
          end_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: { ru: string; en: string };
          description: { ru: string; en: string };
          image_url: string;
          link: string;
          is_active?: boolean;
          priority?: number;
          start_date: string;
          end_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: { ru: string; en: string };
          description?: { ru: string; en: string };
          image_url?: string;
          link?: string;
          is_active?: boolean;
          priority?: number;
          start_date?: string;
          end_date?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
} 