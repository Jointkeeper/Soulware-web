import React from 'react';
import { useTranslation } from 'next-i18next';

export function Footer() {
  const { t } = useTranslation('common'); // Предполагаем, что есть неймспейс 'common'

  return (
    <footer className="text-center text-gray-500 text-sm p-4 border-t border-gray-700 mt-12">
      <div className="mb-2">
        <strong dangerouslySetInnerHTML={{ __html: t('footer.slogan') }} />
      </div>
      <div className="mb-2">
        {t('footer.description')}
      </div>
      <div className="mb-2">
        <a href={t('footer.url')} className="text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">{t('footer.urlText')}</a>
      </div>
      <div>
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
} 