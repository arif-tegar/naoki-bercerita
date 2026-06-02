import { Inter } from 'next/font/google';
import './globals.css';
// 1. Import komponen Sidebar yang baru kita buat
import Sidebar from '@/components/sidebar'; 

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Naoki Resto',
  description: 'Management System Restoran',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-gray-50">
          
          {/* 2. Tampilkan Sidebar di sini */}
          <Sidebar />

          {/* 3. Bungkus children dengan main yang diberi jarak p-6 dan pl-64 */}
          <main className="flex-1 p-6 md:pl-72 transition-all">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}