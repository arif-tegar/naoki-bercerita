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

  // Sinyal detektor untuk fitur EDIT
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://naokibercerita.up.railway.app';

  // Fungsi pembantu Jurus Sapu Jagat untuk membersihkan token
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

  // 1. Fungsi mengambil daftar kategori (GET)
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

  // 2. Pemicu saat tombol "Edit" di tabel diklik
  const handleEditClick = (cat: Category) => {
    setIsEditing(true);       // Nyalakan mode edit
    setEditId(cat.id);        // Simpan ID yang mau diedit
    setNewCategory(cat.name); // Lempar nama lamanya ke dalam kotak input utama
  };

  // 3. Batalkan Mode Edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setNewCategory('');
  };

  // 4. Fungsi Utama Form: Bisa Tambah (POST) atau Update (PUT)
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
        // === JALUR EDIT DATA (PUT) ===
        // Target URL sesuai dokumentasi kamu, misal: .../category/5
        response = await fetch(`${baseUrl}/category/${editId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // <--- Token diselipkan di sini agar tidak 401 lagi
          },
          body: JSON.stringify({ name: newCategory }),
        });
      } else {
        // === JALUR TAMBAH BARU (POST) ===
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
      
      // Reset Form ke keadaan semula
      setNewCategory(''); 
      handleCancelEdit();
      fetchCategories(); // Refresh tabel otomatis
      
    } catch (error: unknown) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`);
    } finally {
      setLoading(false);
    }
  };

  // 5. Fungsi menghapus kategori (DELETE)
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
      if (editId === id) handleCancelEdit(); // Reset jika data yang sedang diedit malah dihapus
      fetchCategories(); 

    } catch (error: unknown) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Kategori Menu 📁</h1>
        <p className="text-sm text-gray-500">Khusus Akun Admin untuk mengatur kategori makanan dan minuman.</p>
      </div>
      
      {message && (
        <div className={`p-4 mb-4 rounded-xl text-sm font-medium ${
          message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Form Dinamis: Bisa Tambah Kategori atau Simpan Perubahan */}
      <form onSubmit={handleSubmitForm} className="flex flex-col sm:flex-row gap-3 mb-8 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder={isEditing ? "Ubah nama kategori..." : "Ketik nama kategori baru (cth: Makanan Utama)"}
          required
          className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 text-white text-sm font-bold rounded-xl disabled:bg-gray-300 transition-all shadow-md flex-1 sm:flex-none ${
              isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {loading ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah Kategori'}
          </button>
          
          {/* Tombol Batal Edit (Hanya muncul jika mode edit aktif) */}
          {isEditing && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-all"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      {/* Tabel Tampilan Daftar Kategori */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Daftar Kategori Tersedia
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-48">
                Aksi
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-sm text-gray-500">
                  Belum ada kategori terdaftar.
                </td>
              </tr>
            ) : (
              categories.map((cat, index) => (
                <tr key={cat.id || index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {cat.name}
                  </td>
                  <td className="px-6 py-4 text-center text-sm whitespace-nowrap">
                    {/* TOMBOL EDIT HUBUNGAN LANGSUNG */}
                    <button 
                      onClick={() => handleEditClick(cat)}
                      className="text-blue-600 hover:text-blue-800 font-bold mr-4 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-500 hover:text-red-700 font-bold transition-colors"
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
  );
}