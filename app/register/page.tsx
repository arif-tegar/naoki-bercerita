'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// 1. Sesuaikan interface dengan Schema Swagger Backend
interface RegisterForm {
  username: string;
  password: string;
  name: string;
  role: string;
}

export default function RegisterPage() {
  const router = useRouter();
  
  // 2. Ubah state default awal mengikuti Swagger
  const [form, setForm] = useState<RegisterForm>({
    username: '',
    password: '',
    name: '',
    role: 'KASIR', // Nilai default dropdown
  });
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mengizinkan perubahan untuk Input text maupun Select dropdown
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form), // Data form dikirim dalam bentuk username, password, name, role
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registrasi gagal. Silakan periksa kembali data Anda.');
      }

      setIsSuccess(true);
      setMessage('✅ Registrasi berhasil! Mengalihkan ke halaman login...');
      
      if (data.data?.access_token) {
        console.log('Token:', data.data.access_token);
      }

      // Reset form ke awal setelah sukses
      setForm({ username: '', password: '', name: '', role: 'KASIR' });

      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (error: unknown) {
      setIsSuccess(false);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Terjadi kesalahan sistem.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            Daftar Akun Baru 🍔
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Mulai jelajahi dan kelola kuliner nusantara
          </p>
        </div>

        {/* Notifikasi Status */}
        {message && (
          <div className={`p-4 rounded-lg text-sm font-medium text-center transition-all ${
            isSuccess ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {/* Input Nama Lengkap (name) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">Nama Lengkap</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm"
              placeholder="Masukkan nama lengkap Anda"
            />
          </div>

          {/* Input Username (username) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm"
              placeholder="Masukkan nama pengguna unik"
            />
          </div>

          {/* Input Password (password) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm"
              placeholder="••••••••"
            />
          </div>

          {/* Pilihan Role / Jabatan (role) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">Role / Jabatan</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm bg-white cursor-pointer"
            >
              <option value="KASIR">KASIR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md shadow-orange-200"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Memproses...
              </span>
            ) : (
              'Daftar Sekarang'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}