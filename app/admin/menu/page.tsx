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
    } catch (error) {
      console.error('Gagal mengambil data:', error);
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
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Kelola Menu Makanan 🍲</h1>
        <p className="mt-2 text-sm text-gray-600">Tambah hidangan baru, edit rincian, dan atur sisa stok dapur.</p>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-xl text-sm font-medium transition-all ${
          message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Form Dinamis: Tambah / Edit */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {isEditing ? '👉 Mode Edit Menu' : 'Tambah Menu Baru'}
        </h2>
        <form onSubmit={handleSubmitMenu} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Menu</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required className="block w-full px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:outline-none" placeholder="Misal: Ramen Gekikara" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Harga (Rp)</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} required min="0" className="block w-full px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:outline-none" placeholder="35000" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Stok</label>
            <input type="number" name="stock" value={form.stock} onChange={handleChange} min="0" className="block w-full px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:outline-none" placeholder="Kosongkan jika belum ada stok" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori</label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange} required className="block w-full px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 bg-white cursor-pointer focus:outline-none">
              <option value="" disabled>Pilih...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-5 flex justify-end gap-2 mt-2">
            {isEditing && (
              <button type="button" onClick={handleCancelEdit} className="px-5 py-2.5 text-sm font-bold rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all">
                Batal
              </button>
            )}
            <button type="submit" disabled={loading} className={`px-8 py-2.5 text-sm font-bold rounded-xl text-white transition-all shadow-md ${
              isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600'
            }`}>
              {loading ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah Menu'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Menu - Responsif: overflow horizontal */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Menu</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Harga</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sisa Stok</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {menus.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    Belum ada menu makanan terdaftar.
                  </td>
                </tr>
              ) : (
                menus.map((menu, index) => {
                  const matchedCategory = categories.find(
                    (c) => String(c.id) === String(menu.categoryId || menu.category_id)
                  );

                  return (
                    <tr key={menu.id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{menu.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium">
                          {matchedCategory ? matchedCategory.name : 'Umum / Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">Rp {menu.price.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1 rounded-full font-full text-xs ${menu.stock > 10 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {menu.stock} porsi
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <button onClick={() => handleEditClick(menu)} className="text-blue-600 hover:text-blue-800 font-bold mr-4 transition-colors">Edit</button>
                        <button onClick={() => handleDeleteMenu(menu.id)} className="text-red-500 hover:text-red-700 font-bold transition-colors">Hapus</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}