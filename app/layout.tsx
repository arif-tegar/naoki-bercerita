'use client'; // 🔥 WAJIB TAMBAHKAN INI karena kita menggunakan usePathname

import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/sidebar'; 
import { usePathname } from 'next/navigation'; // Import usePathname

const inter = Inter({ subsets: ['latin'] });

// Catatan: Jika Anda menggunakan 'use client', Next.js 13+ melarang export metadata statis.
// Jika error, hapus/pindahkan metadata ke file layout terpisah, atau biarkan jika tidak error.

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // 1. Cek apakah pengguna sedang berada di halaman auth (login atau register)
  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <html lang="id">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-gray-50">
          
          {/* 2. Hanya tampilkan Sidebar JIKA BUKAN halaman login/register */}
          {!isAuthPage && <Sidebar />}

          {/* 3. Atur padding secara dinamis: 
                 - Jika halaman login/register: pl-0 (penuh semata-mata)
                 - Jika halaman biasa: md:pl-72 (memberi ruang untuk sidebar) */}
          <main 
            className={`flex-1 transition-all duration-300 ${
              isAuthPage ? 'p-0' : 'p-6 md:pl-72'
            }`}
          >
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}