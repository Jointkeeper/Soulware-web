import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date, locale: string = 'ru'): string {
  let targetLocale = locale;
  // Explicitly define supported locales or a whitelist
  const supportedLocales = ['ru', 'en']; 

  if (!supportedLocales.includes(locale)) {
    console.warn(`Unsupported locale "${locale}" provided to formatDate. Falling back to 'ru'.`);
    targetLocale = 'ru';
  }

  try {
    return new Intl.DateTimeFormat(targetLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch (e) {
    // This catch is for unexpected errors with the targetLocale or invalid date
    console.error(`Error in formatDate with locale ${targetLocale} (original: ${locale}):`, e);
    // Fallback to a very basic, non-localized format or re-throw
    return date.toISOString(); // Or a simpler, known-good format
  }
}

export function formatDuration(duration: 'short' | 'medium' | 'long', locale: string = 'ru'): string {
  const durations = {
    ru: {
      short: 'До 10 минут',
      medium: '10-30 минут',
      long: 'Более 30 минут',
    },
    en: { // Example for English
      short: 'Up to 10 minutes',
      medium: '10-30 minutes',
      long: 'More than 30 minutes',
    }
    // Add other locales as needed
  };
  // @ts-ignore // TODO: Improve type safety for locale access
  return durations[locale]?.[duration] || durations.ru[duration];
}

export function formatDifficulty(
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  locale: string = 'ru' // Added locale
): string {
  const difficulties = {
    ru: {
      beginner: 'Начальный',
      intermediate: 'Средний',
      advanced: 'Продвинутый',
    },
    en: { // Example for English
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    }
    // Add other locales as needed
  };
  // @ts-ignore // TODO: Improve type safety for locale access
  return difficulties[locale]?.[difficulty] || difficulties.ru[difficulty];
}

export function formatDateTime(date: Date, locale: string = 'ru'): string {
  let targetLocale = locale;
  const supportedLocales = ['ru', 'en'];

  if (!supportedLocales.includes(locale)) {
    console.warn(`Unsupported locale "${locale}" provided to formatDateTime. Falling back to 'ru'.`);
    targetLocale = 'ru';
  }

  try {
    return new Intl.DateTimeFormat(targetLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (e) {
    console.error(`Error in formatDateTime with locale ${targetLocale} (original: ${locale}):`, e);
    return date.toISOString(); // Or a simpler, known-good format
  }
} 