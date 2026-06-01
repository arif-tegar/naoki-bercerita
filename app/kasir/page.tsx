'use client';

import React, { useState, useEffect } from 'react';

interface Menu {
  id: number | string;
  name: string;
  price: number;
  stock: number;
}

interface Table {
  id: number | string;
  number: string;
  status: string;
}

interface CartItem extends Menu {
  qty: number;
}

export default function KasirPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [tables, setTables] = useState<Table[]>([]);

  // State untuk Keranjang & Form Pemesanan
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [customerName, setCustomerName] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://naokibercerita.up.railway.app';

  // Ambil token
  const getCleanToken = () => {
    if (typeof window !== 'undefined') {
      const rawToken = localStorage.getItem('token');
      if (!rawToken) return '';
      return rawToken.replace(/['"]+/g, '').replace(/\\n/g, '').replace(/\s+/g, '');
    }
    return '';
  };

  // Mengambil Menu & Meja (Hanya Meja Kosong yang akan ditampilkan di dropdown nanti)
  const fetchData = async () => {
    try {
      const token = getCleanToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const [resMenu, resTable] = await Promise.all([
        fetch(`${baseUrl}/menu`, { method: 'GET', headers }),
        fetch(`${baseUrl}/table`, { method: 'GET', headers })
      ]);

      const dataMenu = await resMenu.json();
      const dataTable = await resTable.json();

      if (resMenu.ok) setMenus(dataMenu.data || dataMenu);
      if (resTable.ok) setTables(dataTable.data || dataTable);
    } catch (error) {
      console.error('Gagal mengambil data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- LOGIKA KERANJANG (CART) ---
  const addToCart = (menu: Menu) => {
    if (menu.stock <= 0) {
      alert('Stok habis!');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === menu.id);
      if (existing) {
        if (existing.qty >= menu.stock) {
          alert('Mencapai batas maksimal stok!');
          return prev;
        }
        return prev.map((item) => item.id === menu.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...menu, qty: 1 }];
    });
  };

  const updateCartQty = (id: number | string, action: 'plus' | 'minus') => {
    setCart((prev) => prev.map((item) => {
      if (item.id === id) {
        if (action === 'plus' && item.qty < item.stock) return { ...item, qty: item.qty + 1 };
        if (action === 'minus' && item.qty > 1) return { ...item, qty: item.qty - 1 };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number | string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const totalPrice = cart.reduce((total, item) => total + (item.price * item.qty), 0);

  // --- LOGIKA CHECKOUT KE BACK END ---
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setMessage('❌ Keranjang masih kosong!');
      return;
    }

    setLoading(true);
    setMessage('');
    const token = getCleanToken();

    try {
      // KUNCI UTAMA: Menyusun payload yang 100% patuh pada DTO Backend terbaru
      const payload = {
        customerName: customerName.trim() || 'Pelanggan Walk-in', // Re-add & pastikan tidak kosong
        tableId: Number(selectedTable),
        orderType: 'DINE_IN', // <-- PROPERTI BARU YANG WAJIB DIISI!
        items: cart.map((item) => ({
          menuId: Number(item.id),
          quantity: Number(item.qty) // Tetap menggunakan 'quantity' sesuai DTO asli temanmu
        }))
      };

      console.log('Mengirim Checkout Sesuai DTO Terbaru:', payload);

      const response = await fetch(`${baseUrl}/transaction/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorDetail = Array.isArray(data.message) 
          ? data.message.join(', ') 
          : data.message;
        
        throw new Error(errorDetail || 'Gagal memproses transaksi.');
      }

      setMessage('✅ Pesanan berhasil dibuat! Meja otomatis terkunci.');

      // Reset Form & Keranjang jika sukses
      setCart([]);
      setSelectedTable('');
      setCustomerName('');
      fetchData(); // Refresh data menu & meja terbaru dari server

      setTimeout(() => setMessage(''), 4000);
    } catch (error: unknown) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-6">

      {/* SEBELAH KIRI: Daftar Menu */}
      <div className="flex-1">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Kasir Pemesanan 🛒</h1>
          <p className="text-sm text-gray-500 mt-2">Klik menu untuk menambahkannya ke pesanan.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {menus.map((menu) => (
            <div
              key={menu.id}
              onClick={() => addToCart(menu)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-sm ${menu.stock > 0
                ? 'border-transparent bg-white hover:border-orange-500 hover:shadow-md'
                : 'border-transparent bg-gray-100 opacity-60 cursor-not-allowed'
                }`}
            >
              <h3 className="font-bold text-gray-800 mb-1 leading-tight">{menu.name}</h3>
              <p className="text-orange-600 font-bold text-sm mb-3">Rp {menu.price.toLocaleString('id-ID')}</p>
              <div className="text-xs font-medium text-gray-500">
                Sisa stok: <span className={menu.stock > 0 ? 'text-green-600' : 'text-red-600'}>{menu.stock}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEBELAH KANAN: Keranjang & Checkout */}
      <div className="w-full lg:w-100 flex flex-col bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden h-[fit-content]">
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Rincian Pesanan</h2>
        </div>

        {message && (
          <div className={`m-4 p-3 rounded-lg text-sm font-medium text-center ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleCheckout} className="p-6 flex flex-col gap-5">
          {/* Form Pelanggan & Meja */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Pelanggan (Opsional)</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Masukkan nama..."
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pilih Meja</label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white cursor-pointer"
            >
              <option value="" disabled>-- Pilih Meja --</option>
              {tables.length === 0 ? (
                <option value="" disabled>Belum ada meja tersedia</option>
              ) : (
                tables.map((t) => {
                  // Menyamakan format teks status menjadi huruf besar agar aman dari typo huruf kecil
                  const currentStatus = String(t.status).toUpperCase();
                  const isOccupied = currentStatus === 'OCCUPIED';

                  return (
                    <option
                      key={t.id}
                      value={t.id}
                      disabled={isOccupied} // <-- KUNCINYA DI SINI: Jika terisi, otomatis tidak bisa diklik!
                      className={isOccupied ? 'text-gray-400 bg-gray-100' : 'text-gray-900'}
                    >
                      Meja {t.number} {isOccupied ? '🔴 (SEDANG TERISI)' : '🟢 (KOSONG)'}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          <hr className="border-dashed border-gray-200" />

          {/* List Item Keranjang */}
          <div className="flex-1 overflow-y-auto max-h-75 pr-2">
            {cart.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Belum ada menu yang dipilih.</p>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center mb-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-800 leading-tight">{item.name}</h4>
                    <p className="text-xs text-orange-500 font-semibold">Rp {item.price.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button type="button" onClick={() => updateCartQty(item.id, 'minus')} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 font-bold hover:bg-gray-50">-</button>
                      <span className="w-8 text-center text-sm font-bold leading-6 text-gray-800">{item.qty}</span>
                      <button type="button" onClick={() => updateCartQty(item.id, 'plus')} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 font-bold hover:bg-gray-50">+</button>
                    </div>
                    <button type="button" onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total & Tombol Submit */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex justify-between items-end mb-4">
              <span className="text-sm font-bold text-gray-500">Total Harga</span>
              <span className="text-2xl font-extrabold text-gray-900">Rp {totalPrice.toLocaleString('id-ID')}</span>
            </div>

            <button
              type="submit"
              disabled={loading || cart.length === 0 || !selectedTable}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl disabled:bg-gray-300 transition-all shadow-md text-lg"
            >
              {loading ? 'Memproses...' : 'Buat Pesanan 🚀'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}