'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState('KASIR'); // Default role penonton
  const [isCollapsed, setIsCollapsed] = useState(false); 
  const [isMobileOpen, setIsMobileOpen] = useState(false); 
  const [isLoggedIn, setIsLoggedIn] = useState(false); 

  // Ambil state role dan status login dari localStorage setelah render pertama
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token); 

      const role = localStorage.getItem('role') || 'KASIR';
      setUserRole(role.toUpperCase());

      const savedCollapsed = localStorage.getItem('sidebar_collapsed');
      if (savedCollapsed === 'true') {
        setIsCollapsed(true);
      }
    }
  }, [pathname]); // Update status otomatis setiap rute halaman berganti

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
  };

  const handleLogout = () => {
    if (window.confirm('Apakah kamu yakin ingin keluar?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      setIsLoggedIn(false);
      router.push('/login');
    }
  };

  // Menu navigasi utama berdasarkan hak akses gambar sistem Anda
  const menuItems = [
    { name: 'Kasir Pemesanan', icon: '🛒', path: '/kasir', roles: ['ADMIN', 'KASIR'] },
    { name: 'Riwayat Transaksi', icon: '📋', path: '/history', roles: ['ADMIN', 'KASIR'] },
    { name: 'Kelola Kategori', icon: '📁', path: '/admin/kategori', roles: ['ADMIN'] },
    { name: 'Daftar Menu', icon: '🍔', path: '/admin/menu', roles: ['ADMIN'] },
    { name: 'Denah Meja', icon: '🪑', path: '/admin/kelola-meja', roles: ['ADMIN', 'KASIR'] },
    { name: 'Kelola Promo', icon: '🎟️', path: '/admin/promo', roles: ['ADMIN'] },
  ];

  return (
    <>
      {/* 📱 TOMBOL HAMBURGER KHUSUS MOBILE */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2.5 bg-white rounded-xl shadow-md text-gray-700 border border-gray-100 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* 📋 BACKGROUND OVERLAY UNTUK MOBILE */}
      {isMobileOpen && (
        <div onClick={() => setIsMobileOpen(false)} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"></div>
      )}

      {/* 💻 NAVIGATION ASIDE UTAMA */}
      <aside
        className={`bg-white border-r border-gray-200 min-h-screen p-4 flex flex-col justify-between fixed left-0 top-0 z-50 transition-all duration-300 ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        } ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1">
          {/* BAGIAN ATAS: Logo Brand */}
          <div className="flex items-center justify-between mb-8 px-2 h-10 overflow-hidden">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xl">🍽️</span>
              {(!isCollapsed || isMobileOpen) && (
                <span className="font-bold text-gray-900 text-lg tracking-tight animate-fadeIn">
                  NaokiResto
                </span>
              )}
            </div>

            {/* Tombol Minimize Desktop */}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors focus:outline-none"
              title={isCollapsed ? "Buka Sidebar" : "Sembunyikan Sidebar"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* NAVIGASI MENU UTAMA */}
          <nav className="space-y-1 flex-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              if (!item.roles.includes(userRole)) return null;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center rounded-xl text-sm font-semibold transition-all group ${
                    isCollapsed && !isMobileOpen ? 'justify-center p-2.5' : 'px-4 py-2.5 gap-3'
                  } ${
                    isActive ? 'bg-orange-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  title={isCollapsed && !isMobileOpen ? item.name : ''}
                >
                  <span className="text-lg shrink-0">{item.icon}</span>
                  {(!isCollapsed || isMobileOpen) && (
                    <span className="truncate animate-fadeIn">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 🛠️ BAGIAN BAWAH: PANEL AUTHENTIKASI RESPONSIV */}
        <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
          {!isLoggedIn ? (
            /* 👉 JIKA BELUM LOGIN: Memunculkan Tombol Masuk & Daftar */
            <div className={`flex flex-col gap-2 ${isCollapsed && !isMobileOpen ? 'items-center' : ''}`}>
              <Link
                href="/login"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center justify-center font-bold text-xs rounded-xl transition-all border ${
                  isCollapsed && !isMobileOpen 
                    ? 'p-2.5 w-10 h-10 border-orange-200 text-orange-500 hover:bg-orange-50' 
                    : 'w-full px-4 py-2.5 text-center border-gray-200 text-gray-700 hover:bg-gray-50'
                } ${pathname === '/login' ? 'bg-orange-50 border-orange-500 text-orange-600' : ''}`}
                title="Masuk ke Akun"
              >
                {isCollapsed && !isMobileOpen ? <span>🔑</span> : <span className="animate-fadeIn">Masuk</span>}
              </Link>

              <Link
                href="/register"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center justify-center font-bold text-xs rounded-xl transition-all ${
                  isCollapsed && !isMobileOpen 
                    ? 'p-2.5 w-10 h-10 bg-orange-500 text-white hover:bg-orange-600' 
                    : 'w-full px-4 py-2.5 text-center bg-orange-500 text-white hover:bg-orange-600'
                } ${pathname === '/register' ? 'bg-orange-700' : ''}`}
                title="Daftar Sekarang"
              >
                {isCollapsed && !isMobileOpen ? <span>📝</span> : <span className="truncate animate-fadeIn">Daftar Sekarang</span>}
              </Link>
            </div>
          ) : (
            /* 👉 JIKA SUDAH LOGIN: Menampilkan Tombol Keluar (Aman dari Teks Terpotong) */
            <button
              onClick={handleLogout}
              className={`w-full flex items-center text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors ${
                isCollapsed && !isMobileOpen ? 'justify-center p-2.5' : 'px-4 py-2.5 justify-between'
              }`}
              title="Keluar"
            >
              {(!isCollapsed || isMobileOpen) && <span className="animate-fadeIn">Keluar</span>}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}