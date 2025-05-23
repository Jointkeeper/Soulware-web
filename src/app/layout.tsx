'use client';

import { QueryClient, QueryClientProvider } from 'react-query';
import { useTranslation } from 'next-i18next';
import { I18nextProvider } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import '@/styles/globals.css';
import { ToastProvider } from '@/context/ToastContext';
import { ToastContainer } from '@/components/ui/ToastContainer';

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { i18n } = useTranslation();

  const currentLanguage = typeof i18n.language === 'string' ? i18n.language : 'ru';

  return (
    <html lang={currentLanguage} suppressHydrationWarning>
      <body className={`${currentLanguage} flex flex-col min-h-screen bg-background text-foreground`}>
        <I18nextProvider i18n={i18n}>
          <ToastProvider>
            <QueryClientProvider client={queryClient}>
              <Navbar />
              <main className="flex-grow container mx-auto px-4 py-8">
                {children}
              </main>
              <Footer />
              <ToastContainer />
            </QueryClientProvider>
          </ToastProvider>
        </I18nextProvider>
      </body>
    </html>
  );
} 