import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useTranslation } from 'next-i18next';
import { Menu } from '@headlessui/react';
import { SunIcon, MoonIcon, LanguageIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { Language } from '@/types';
import { cn } from '@/lib/utils';
import { useToasts } from '@/context/ToastContext';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { addToast } = useToasts();

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    addToast(t('theme.changed', { theme: newTheme }), 'info');
  };

  const changeLanguage = (lang: Language) => {
    i18n.changeLanguage(lang);
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-purple-400">
            Soulware
          </Link>

          <nav className="hidden md:flex space-x-6 text-sm">
            <Link href="/catalog" className="hover:text-purple-400 transition-colors">
              {t('nav.tests')}
            </Link>
            <Link href="/daily" className="hover:text-purple-400 transition-colors">
              {t('nav.daily')}
            </Link>
            <Link href="/recommendations" className="hover:text-purple-400 transition-colors">
              {t('nav.recommendations')}
            </Link>
            {user ? (
              <Link href="/profile" className="hover:text-purple-400 transition-colors">
                {t('nav.profile')}
              </Link>
            ) : null}
            <Link href="/subscribe" className="hover:text-purple-400 transition-colors">
              {t('nav.support')}
            </Link>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                aria-label={t(theme === 'dark' ? 'nav.switchToLight' : 'nav.switchToDark')}
                className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white"
              >
                {theme === 'dark' ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </button>

              <Menu as="div" className="relative">
                <Menu.Button className="p-2 hover:bg-gray-700 rounded-full" aria-label={t('nav.changeLanguage')}>
                  <LanguageIcon className="w-5 h-5" />
                </Menu.Button>
                <Menu.Items className="absolute right-0 mt-2 w-36 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={cn(
                            active ? 'bg-gray-700 text-white' : 'text-gray-300',
                            'block w-full text-left px-4 py-2 text-sm'
                          )}
                          onClick={() => changeLanguage('ru' as Language)}
                        >
                          {t('nav.russian')}
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={cn(
                            active ? 'bg-gray-700 text-white' : 'text-gray-300',
                            'block w-full text-left px-4 py-2 text-sm'
                          )}
                          onClick={() => changeLanguage('en' as Language)}
                        >
                          {t('nav.english')}
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Menu>

              {user ? (
                <button
                  onClick={() => signOut()}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-1 rounded transition-colors"
                >
                  {t('nav.signOut')}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-1 rounded transition-colors"
                >
                  {t('nav.signIn')}
                </Link>
              )}
            </div>
          </nav>

          <button
            aria-label={t('nav.toggleMenu')}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            className="md:hidden text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        {isMenuOpen && (
          <div id="mobile-menu" className="md:hidden mt-4 space-y-2">
            <Link href="/catalog" className="block px-3 py-2 hover:bg-gray-700 rounded" onClick={() => setIsMenuOpen(false)}>
              {t('nav.tests')}
            </Link>
            <Link href="/daily" className="block px-3 py-2 hover:bg-gray-700 rounded" onClick={() => setIsMenuOpen(false)}>
              {t('nav.daily')}
            </Link>
            <Link href="/recommendations" className="block px-3 py-2 hover:bg-gray-700 rounded" onClick={() => setIsMenuOpen(false)}>
              {t('nav.recommendations')}
            </Link>
            {user && (
              <Link href="/profile" className="block px-3 py-2 hover:bg-gray-700 rounded" onClick={() => setIsMenuOpen(false)}>
                {t('nav.profile')}
              </Link>
            )}
            <Link href="/subscribe" className="block px-3 py-2 hover:bg-gray-700 rounded" onClick={() => setIsMenuOpen(false)}>
              {t('nav.support')}
            </Link>

            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="px-3 text-sm font-medium text-gray-400">{t('nav.settings')}</span>
                 <button
                    onClick={() => { toggleTheme(); setIsMenuOpen(false); }}
                    aria-label={t(theme === 'dark' ? 'nav.switchToLight' : 'nav.switchToDark')}
                    className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white"
                  >
                    {theme === 'dark' ? (
                      <SunIcon className="w-5 h-5" />
                    ) : (
                      <MoonIcon className="w-5 h-5" />
                    )}
                  </button>
              </div>
             
              <Menu as="div" className="relative">
                <Menu.Button className="flex w-full items-center justify-between px-3 py-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
                  <span className="flex items-center">
                    <LanguageIcon className="w-5 h-5 mr-2" />
                    {i18n.language === 'ru' ? t('nav.russian') : t('nav.english')}
                  </span>
                </Menu.Button>
                <Menu.Items className="mt-1 w-full origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={cn(
                            active ? 'bg-gray-700 text-white' : 'text-gray-300',
                            'block w-full text-left px-4 py-2 text-sm'
                          )}
                          onClick={() => { changeLanguage('ru' as Language); setIsMenuOpen(false); }}
                        >
                          {t('nav.russian')}
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={cn(
                            active ? 'bg-gray-700 text-white' : 'text-gray-300',
                            'block w-full text-left px-4 py-2 text-sm'
                          )}
                          onClick={() => { changeLanguage('en' as Language); setIsMenuOpen(false); }}
                        >
                          {t('nav.english')}
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Menu>

              <div className="mt-4 pt-4 border-t border-gray-700">
              {user ? (
                <button
                  onClick={() => { signOut(); setIsMenuOpen(false); }}
                  className="w-full block text-left px-3 py-2 rounded hover:bg-gray-700 text-red-400"
                >
                  {t('nav.signOut')}
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full block px-3 py-2 rounded hover:bg-gray-700 text-purple-400"
                >
                  {t('nav.signIn')}
                </Link>
              )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 