import { describe, it, expect, vi } from 'vitest';
import { formatDate, formatDuration, formatDifficulty, formatDateTime, cn } from './utils';

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('p-4', 'bg-red-500', { 'text-white': true })).toBe('p-4 bg-red-500 text-white');
  });
  it('should handle conflicting classes with tailwind-merge', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });
});

describe('formatDate', () => {
  it('should format date correctly for ru locale', () => {
    const date = new Date(2023, 0, 20); // Month is 0-indexed
    expect(formatDate(date, 'ru')).toBe('20 января 2023 г.');
  });

  it('should format date correctly for en locale', () => {
    const date = new Date(2023, 0, 20);
    expect(formatDate(date, 'en')).toBe('January 20, 2023');
  });

  it('should fallback to ru locale if an unsupported locale is provided', () => {
    const date = new Date(2023, 0, 20);
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(formatDate(date, 'xx-YY')).toBe('20 января 2023 г.');
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });
});

describe('formatDuration', () => {
  it('should return correct Russian duration string', () => {
    expect(formatDuration('short', 'ru')).toBe('До 10 минут');
    expect(formatDuration('medium', 'ru')).toBe('10-30 минут');
    expect(formatDuration('long', 'ru')).toBe('Более 30 минут');
  });

  it('should return correct English duration string', () => {
    expect(formatDuration('short', 'en')).toBe('Up to 10 minutes');
    expect(formatDuration('medium', 'en')).toBe('10-30 minutes');
    expect(formatDuration('long', 'en')).toBe('More than 30 minutes');
  });

  it('should fallback to Russian if locale not found', () => {
    expect(formatDuration('short', 'es')).toBe('До 10 минут');
  });
});

describe('formatDifficulty', () => {
  it('should return correct Russian difficulty string', () => {
    expect(formatDifficulty('beginner', 'ru')).toBe('Начальный');
    expect(formatDifficulty('intermediate', 'ru')).toBe('Средний');
    expect(formatDifficulty('advanced', 'ru')).toBe('Продвинутый');
  });

  it('should return correct English difficulty string', () => {
    expect(formatDifficulty('beginner', 'en')).toBe('Beginner');
    expect(formatDifficulty('intermediate', 'en')).toBe('Intermediate');
    expect(formatDifficulty('advanced', 'en')).toBe('Advanced');
  });

  it('should fallback to Russian if locale not found', () => {
    expect(formatDifficulty('beginner', 'es')).toBe('Начальный');
  });
});

describe('formatDateTime', () => {
  it('should format date-time correctly for ru locale', () => {
    const date = new Date(2023, 0, 20, 14, 35); // 20 Jan 2023, 14:35
    // Expected format can vary slightly based on Node's Intl version
    // Example: '20 января 2023 г., 14:35' or '20 января 2023 г. в 14:35'
    const formatted = formatDateTime(date, 'ru');
    expect(formatted).toContain('20 января 2023 г.');
    expect(formatted).toMatch(/14:35|14 ч. 35 мин./); // Accommodate variations
  });

  it('should format date-time correctly for en locale', () => {
    const date = new Date(2023, 0, 20, 14, 35);
    // Example: 'January 20, 2023, 2:35 PM' or 'January 20, 2023 at 2:35 PM'
    const formatted = formatDateTime(date, 'en');
    expect(formatted).toContain('January 20, 2023');
    expect(formatted).toMatch(/2:35\sPM/i);
  });

  it('should fallback to ru locale if an unsupported locale is provided for date-time', () => {
    const date = new Date(2023, 0, 20, 14, 35);
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const formatted = formatDateTime(date, 'xx-YY');
    expect(formatted).toContain('20 января 2023 г.');
    expect(formatted).toMatch(/14:35|14 ч. 35 мин./);
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });
}); 