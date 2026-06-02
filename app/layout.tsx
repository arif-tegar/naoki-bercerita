'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/sidebar';
import { useState } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <html lang="id">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
          <main
            className={`flex-1 p-4 sm:p-6 md:p-8 transition-all duration-300 ${
              isSidebarOpen ? 'ml-0 md:ml-64' : 'ml-0'
            }`}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}