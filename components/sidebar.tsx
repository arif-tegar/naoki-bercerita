'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  // State untuk mengontrol apakah sidebar sedang terbuka atau tertutup
  // Default: false (tertutup) agar layarnya lega
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Kategori Menu', path: '/admin/kategori', icon: '📁' },
    { name: 'Menu Makanan', path: '/admin/menu', icon: '🍲' },
    { name: 'Kelola Meja', path: '/admin/kelola-meja', icon: '🪑' },
    { name: 'Transaksi', path: '/admin/transaksi', icon: '💳' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <>
      {/* 1. Tombol Hamburger (Hanya muncul saat sidebar tertutup) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-40 p-2.5 bg-white border border-gray-200 shadow-md rounded-xl text-gray-700 hover:text-orange-500 hover:bg-orange-50 transition-all focus:outline-none"
          title="Buka Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* 2. Layar Gelap (Overlay) - Muncul saat sidebar terbuka */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)} // Kalau layar gelap diklik, sidebar otomatis nutup
        />
      )}

      {/* 3. Panel Sidebar Utama */}
      <aside 
        className={`fixed left-0 top-0 z-50 h-screen w-64 border-r border-gray-200 bg-white shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Logo */}
        <div className="flex items-center justify-between border-b border-gray-100 py-6 px-4">
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Kasir<span className="text-orange-500">Naoki</span> 🍔
          </h1>
          
          {/* Tombol Tutup Sidebar */}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Tutup Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigasi Menu */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setIsOpen(false)} // Otomatis nutup sidebar kalau menu diklik
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Tombol Logout di bagian paling bawah */}
        <div className="border-t border-gray-100 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition-all hover:bg-red-100"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>
    </>
  );
}