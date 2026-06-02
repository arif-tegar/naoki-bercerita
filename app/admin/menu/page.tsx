'use client';

import React, { useState, useEffect } from 'react';

interface Category {
  id: number | string;
  name: string;
}

interface Menu {
  id: number | string;
  name: string;
  price: number;
  stock: number;
  categoryId?: number | string;
  category_id?: number | string;
}

export default function MenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    categoryId: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [fetchError, setFetchError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://naokibercerita.up.railway.app';

  const getCleanToken = () => {
    if (typeof window !== 'undefined') {
      const rawToken = localStorage.getItem('token');
      if (!rawToken) return '';
      return rawToken.replace(/['"]+/g, '').replace(/\\n/g, '').replace(/\s+/g, '');
    }
    return '';
  };

  const fetchData = async () => {
    try {
      const token = getCleanToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const resCategory = await fetch(`${baseUrl}/category`, { method: 'GET', headers });
      const dataCategory = await resCategory.json();
      if (resCategory.ok) {
        setCategories(dataCategory.data || dataCategory);
      }

      const resMenu = await fetch(`${baseUrl}/menu`, { method: 'GET', headers });
      const dataMenu = await resMenu.json();
      if (resMenu.ok) {
        setMenus(dataMenu.data || dataMenu);
      }

      setFetchError('');
    } catch (error) {
      console.error('Gagal mengambil data:', error);
      setFetchError('❌ Gagal terhubung ke server. Periksa koneksi Anda.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditClick = (menu: Menu) => {
    setIsEditing(true);
    setEditId(menu.id);
    setForm({
      name: menu.name,
      price: String(menu.price),
      stock: String(menu.stock),
      categoryId: String(menu.categoryId || menu.category_id || '')
    });
    // Scroll otomatis ke form agar user mobile tahu form di atas berubah jadi mode edit
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setForm({ name: '', price: '', stock: '', categoryId: '' });
  };

  const handleSubmitMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const token = getCleanToken();
    if (!token) {
      setMessage('❌ Anda belum login atau token hilang.');
      setLoading(false);
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        price: Number(form.price),
        categoryId: Number(form.categoryId)
      };

      if (form.stock !== '') {
        payload.stock = Number(form.stock);
      }

      let response;

      if (isEditing && editId) {
        response = await fetch(`${baseUrl}/menu/${editId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${baseUrl}/menu`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menyimpan data menu.');
      }

      const submittedStock = form.stock !== '' ? Number(form.stock) : undefined;

      setMessage(isEditing ? '✅ Menu berhasil diperbarui!' : '✅ Menu baru berhasil ditambahkan!');
      handleCancelEdit();

      if (isEditing && editId) {
        fetchData();
      } else {
        const newMenu = data?.data || data;
        if (newMenu?.id) {
          if (submittedStock !== undefined && (!newMenu.stock || newMenu.stock === 0)) {
            newMenu.stock = submittedStock;
          }
          setMenus(prev => [...prev, newMenu]);
        } else {
          fetchData();
        }
      }

      setTimeout(() => setMessage(''), 3000);

    } catch (error: unknown) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Terjadi kesalahan sistem.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMenu = async (id: number | string) => {
    const isConfirm = window.confirm('Apakah kamu yakin ingin menghapus menu ini?');
    if (!isConfirm) return;

    const token = getCleanToken();
    if (!token) {
      alert('❌ Token tidak ditemukan. Silakan login kembali.');
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/menu/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Gagal menghapus menu.');

      alert('✅ Menu berhasil dihapus!');
      if (editId === id) handleCancelEdit();
      fetchData();

    } catch (error: unknown) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Terjadi kesalahan sistem'}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Kelola Menu Makanan 🍲</h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">Tambah hidangan baru, edit rincian, dan atur sisa stok dapur.</p>
      </div>

      {/* NOTIFIKASI */}
      {fetchError && (
        <div className="p-4 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm bg-red-50 text-red-800 border border-red-100">
          {fetchError}
        </div>
      )}
      {message && (
        <div className={`p-4 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm ${
          message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'
        }`}>
          {message}
        </div>
      )}

      {/* FORM ADAPTIF */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">
          {isEditing ? '👉 Mode Edit Menu' : 'Tambah Menu Baru'}
        </h2>
        <form onSubmit={handleSubmitMenu} className="space-y-4">
          {/* Baris Input Atas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Nama Menu</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required className="block w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all" placeholder="Misal: Ramen Gekikara" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Harga (Rp)</label>
              <input type="number" name="price" value={form.price} onChange={handleChange} required min="0" className="block w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all" placeholder="35000" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Stok</label>
              <input type="number" name="stock" value={form.stock} onChange={handleChange} min="0" className="block w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all" placeholder="Sifatnya opsional" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Kategori</label>
              <select name="categoryId" value={form.categoryId} onChange={handleChange} required className="block w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white cursor-pointer focus:outline-none transition-all">
                <option value="" disabled>Pilih Kategori...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Baris Tombol Form */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-gray-50">
            {isEditing && (
              <button type="button" onClick={handleCancelEdit} className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer">
                Batal
              </button>
            )}
            <button type="submit" disabled={loading} className={`w-full sm:w-auto px-8 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-white transition-all shadow-sm cursor-pointer ${
              isEditing ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-100'
            }`}>
              {loading ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah Menu 🚀'}
            </button>
          </div>
        </form>
      </div>

      {/* DAFTAR DATA ADAPTIF */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Daftar Menu Saat Ini</h2>

        {menus.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center text-sm text-gray-400 shadow-sm">
            Belum ada menu makanan terdaftar.
          </div>
        ) : (
          <>
            {/* 📱 1. TAMPILAN MOBILE (Mode Kartu/Card) - Hanya muncul di layar HP (< sm) */}
            <div className="grid grid-cols-1 gap-4 sm:hidden">
              {menus.map((menu, index) => {
                const matchedCategory = categories.find(
                  (c) => String(c.id) === String(menu.categoryId || menu.category_id)
                );

                return (
                  <div key={menu.id || index} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">{menu.name}</h3>
                        <span className="inline-block mt-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-[11px] font-medium">
                          {matchedCategory ? matchedCategory.name : 'Umum / Uncategorized'}
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${menu.stock > 10 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {menu.stock} Porsi
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                      <span className="text-sm font-bold text-orange-600">
                        Rp {menu.price.toLocaleString('id-ID')}
                      </span>
                      <div className="flex gap-3">
                        <button onClick={() => handleEditClick(menu)} className="text-xs font-bold text-blue-600 hover:underline">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteMenu(menu.id)} className="text-xs font-bold text-red-500 hover:underline">
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 💻 2. TAMPILAN DESKTOP/TABLET (Mode Tabel Asli) - Sembunyi di HP, muncul di >= sm */}
            <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50/70">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Nama Menu</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Kategori</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Harga</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Sisa Stok</th>
                      <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {menus.map((menu, index) => {
                      const matchedCategory = categories.find(
                        (c) => String(c.id) === String(menu.categoryId || menu.category_id)
                      );

                      return (
                        <tr key={menu.id || index} className="hover:bg-gray-50/40 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{menu.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium">
                              {matchedCategory ? matchedCategory.name : 'Umum / Uncategorized'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                            Rp {menu.price.toLocaleString('id-ID')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2.5 py-1 rounded-full font-medium text-xs ${menu.stock > 10 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              {menu.stock} porsi
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold">
                            <button onClick={() => handleEditClick(menu)} className="text-blue-600 hover:text-blue-800 mr-4 transition-colors">Edit</button>
                            <button onClick={() => handleDeleteMenu(menu.id)} className="text-red-500 hover:text-red-700 transition-colors">Hapus</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}