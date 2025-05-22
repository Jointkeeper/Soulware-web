import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatDuration(duration: 'short' | 'medium' | 'long'): string {
  const durations = {
    short: 'До 10 минут',
    medium: '10-30 минут',
    long: 'Более 30 минут',
  };
  return durations[duration];
}

export function formatDifficulty(
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): string {
  const difficulties = {
    beginner: 'Начальный',
    intermediate: 'Средний',
    advanced: 'Продвинутый',
  };
  return difficulties[difficulty];
} 