import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/sidebar'; // <-- 1. Import Sidebar yang baru dibuat

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Aplikasi Kasir Naoki',
  description: 'Sistem Manajemen Restoran',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {/* Kita buat layout dengan flexbox */}
        <div className="flex min-h-screen bg-gray-50">
          
          {/* Ini trik sederhana:
            Nanti kamu bisa mengatur agar Sidebar disembunyikan di halaman /login
            Tapi untuk sekarang, mari kita tampilkan berdampingan dengan konten utama
          */}
          <Sidebar />

          {/* Konten Utama (Berada di sebelah kanan Sidebar) */}
          {/* Margin left (ml-64) digunakan untuk memberi ruang selebar Sidebar (w-64) */}
          <main className="flex-1 ml-64 p-8">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}