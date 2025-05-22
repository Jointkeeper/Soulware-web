import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useTranslation } from 'next-i18next';
import { Menu } from '@headlessui/react';
import { SunIcon, MoonIcon, LanguageIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { Language } from '@/types';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
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
                className="p-2 hover:bg-gray-700 rounded-full"
              >
                {theme === 'dark' ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </button>

              <Menu as="div" className="relative">
                <Menu.Button className="p-2 hover:bg-gray-700 rounded-full">
                  <LanguageIcon className="w-5 h-5" />
                </Menu.Button>
                <Menu.Items className="absolute right-0 mt-2 w-32 bg-gray-800 rounded-md shadow-lg">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-gray-700' : ''
                        } block w-full text-left px-4 py-2`}
                        onClick={() => changeLanguage('ru')}
                      >
                        Русский
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-gray-700' : ''
                        } block w-full text-left px-4 py-2`}
                        onClick={() => changeLanguage('en')}
                      >
                        English
                      </button>
                    )}
                  </Menu.Item>
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
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-2">
            <Link href="/catalog" className="block px-3 py-2 hover:bg-gray-700 rounded">
              {t('nav.tests')}
            </Link>
            <Link href="/daily" className="block px-3 py-2 hover:bg-gray-700 rounded">
              {t('nav.daily')}
            </Link>
            <Link href="/recommendations" className="block px-3 py-2 hover:bg-gray-700 rounded">
              {t('nav.recommendations')}
            </Link>
            {user && (
              <Link href="/profile" className="block px-3 py-2 hover:bg-gray-700 rounded">
                {t('nav.profile')}
              </Link>
            )}
            <Link href="/subscribe" className="block px-3 py-2 hover:bg-gray-700 rounded">
              {t('nav.support')}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
} 