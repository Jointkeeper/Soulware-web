'use client'; // Делаем компонент клиентским для использования useTranslation

import { useTranslation } from 'next-i18next';

export default function Home() {
  const { t } = useTranslation('common'); // Указываем неймспейс, если нужно

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">{t('home.welcome')}</h1>
      <p className="text-lg text-gray-400">{t('home.tagline')}</p> 
      {/* Изменен цвет текста для лучшей читаемости на темном фоне */}
    </main>
  );
} 