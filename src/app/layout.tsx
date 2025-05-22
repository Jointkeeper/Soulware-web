'use client';

import { QueryClient, QueryClientProvider } from 'react-query';
import { Navbar } from '@/components/Navbar';
import { Footer } from '../components/Footer';
import '@/styles/globals.css';

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="bg-gray-900 text-white font-sans">
        <QueryClientProvider client={queryClient}>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </QueryClientProvider>
      </body>
    </html>
  );
} 