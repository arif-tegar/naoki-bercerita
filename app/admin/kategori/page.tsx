'use client';

import React, { useState, useEffect } from 'react';

interface Category {
  id: number | string;
  name: string;
}

export default function KategoriPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://naokibercerita.up.railway.app';

  const getCleanToken = () => {
    if (typeof window !== 'undefined') {
      const rawToken = localStorage.getItem('token');
      if (!rawToken) return '';
      
      let clean = rawToken;
      clean = clean.replace(/['"]+/g, ''); 
      clean = clean.replace(/\\n/g, '');   
      clean = clean.replace(/\s+/g, '');   
      
      return clean;
    }
    return '';
  };

  const fetchCategories = async () => {
    try {
      const token = getCleanToken();
      const response = await fetch(`${baseUrl}/category`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      const data = await response.json();
      if (response.ok) {
        setCategories(data.data || data);
      }
    } catch (error) {
      console.error('Error saat fetch kategori:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEditClick = (cat: Category) => {
    setIsEditing(true);
    setEditId(cat.id);
    setNewCategory(cat.name);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setNewCategory('');
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const token = getCleanToken();
    if (!token) {
      setMessage('❌ Token tidak ditemukan. Silakan login kembali.');
      setLoading(false);
      return;
    }

    if (!newCategory.trim()) {
      setLoading(false);
      return;
    }

    try {
      let response;
      
      if (isEditing && editId) {
        response = await fetch(`${baseUrl}/category/${editId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: newCategory }),
        });
      } else {
        response = await fetch(`${baseUrl}/category`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: newCategory }),
        });
      }

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesi Anda habis / Token tidak valid. Wajib LOGIN ULANG.');
        }
        throw new Error(data.message || 'Gagal memproses data.');
      }

      setMessage(isEditing ? '✅ Kategori berhasil diperbarui!' : '✅ Kategori baru berhasil ditambahkan!');
      
      setNewCategory(''); 
      handleCancelEdit();
      fetchCategories();
      
    } catch (error: unknown) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number | string) => {
    const isConfirm = window.confirm('Apakah kamu yakin ingin menghapus kategori ini?');
    if (!isConfirm) return;

    const token = getCleanToken();
    if (!token) {
      alert('❌ Token tidak ditemukan. Silakan login kembali.');
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/category/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Gagal menghapus kategori.');

      alert('✅ Kategori berhasil dihapus!');
      if (editId === id) handleCancelEdit();
      fetchCategories();

    } catch (error: unknown) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:py-12 sm:px-6 lg:py-16">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header Section - Centered text on mobile */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            Kelola Kategori Menu 📁
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Khusus Akun Admin untuk mengatur kategori makanan dan minuman.
          </p>
          <div className="w-20 h-1 bg-orange-500 mx-auto mt-3 rounded-full"></div>
        </div>
        
        {/* Message Alert */}
        {message && (
          <div className={`max-w-3xl mx-auto p-4 mb-6 rounded-xl text-sm font-medium text-center shadow-sm ${
            message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Form Card */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 sm:p-6 transition-all">
            <form onSubmit={handleSubmitForm} className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder={isEditing ? "Ubah nama kategori..." : "Ketik nama kategori baru (cth: Makanan Utama)"}
                  required
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-5 py-3 text-white text-sm font-bold rounded-xl disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 flex-1 sm:flex-none ${
                      isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Menyimpan...
                      </span>
                    ) : isEditing ? 'Simpan Perubahan' : 'Tambah Kategori'}
                  </button>
                  
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Daftar Kategori Tersedia
                  </th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-36 sm:w-44">
                    Aksi
                  </th>
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-12 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span>Belum ada kategori terdaftar.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  categories.map((cat, index) => (
                    <tr key={cat.id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base text-gray-900 font-medium break-words">
                        {cat.name}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-center text-sm whitespace-nowrap">
                        <button 
                          onClick={() => handleEditClick(cat)}
                          className="text-blue-600 hover:text-blue-800 font-semibold mr-3 sm:mr-4 transition-colors focus:outline-none focus:underline"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-red-500 hover:text-red-700 font-semibold transition-colors focus:outline-none focus:underline"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Optional footer text */}
        <p className="text-center text-xs text-gray-400 mt-6">
          * Hanya admin yang memiliki akses untuk mengelola kategori
        </p>
      </div>
    </div>
  );
}