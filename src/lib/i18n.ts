import { i18n } from 'next-i18next';
import { Language } from '@/types';

export const i18nConfig = {
  defaultLocale: 'ru' as Language,
  locales: ['ru', 'en'] as Language[],
  localePath: './public/locales',
};

export const getI18n = () => {
  return i18n;
};

export const setLanguage = async (language: Language) => {
  if (typeof window !== 'undefined' && i18n) {
    localStorage.setItem('language', language);
    await i18n.changeLanguage(language);
  }
}; 