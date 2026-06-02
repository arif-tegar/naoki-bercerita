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

  // State Khusus Fitur Voucher Promo
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ id: number; code: string; discount: number; isPercent: boolean } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [loadingPromo, setLoadingPromo] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://naokibercerita.up.railway.app';

  // Ambil token bersih
  const getCleanToken = () => {
    if (typeof window !== 'undefined') {
      const rawToken = localStorage.getItem('token');
      if (!rawToken) return '';
      return rawToken.replace(/['"]+/g, '').replace(/\\n/g, '').replace(/\s+/g, '');
    }
    return '';
  };

  // Mengambil Menu & Meja
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

  // --- LOGIKA KALKULASI HARGA & POTONGAN VOUCHER ---
  const totalPrice = cart.reduce((total, item) => total + (item.price * item.qty), 0);

  const discountAmount = appliedPromo
    ? appliedPromo.isPercent
      ? (totalPrice * appliedPromo.discount) / 100
      : appliedPromo.discount
    : 0;

  const grandTotal = Math.max(0, totalPrice - discountAmount);

  // --- LOGIKA PENGECEKAN KODE VOUCHER KE BACKEND ---
const handleCheckPromo = async () => {
    if (!promoCode.trim()) return;

    setPromoError('');
    setPromoSuccess('');

    const token = getCleanToken();

    try {
      const response = await fetch(`${baseUrl}/promo/check?code=${promoCode.toUpperCase().trim()}`, {
        method: 'GET',
        headers: {
          accept: '*/*',
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Voucher tidak valid atau sudah kedaluwarsa.');
      }

      // 🎯 KUNCINYA DI SINI: Mengambil properti 'promo' sesuai dengan response body backend-mu
      const promoData = result.promo;

      // Validasi jika properti promo tidak ditemukan atau kosong
      if (!promoData) {
        throw new Error('Voucher tidak ditemukan dalam respon server.');
      }

      // Validasi status keaktifan voucher promo
      if (!promoData.isActive) {
        throw new Error('Voucher ini sudah dinonaktifkan.');
      }

      // Masukkan data promo yang valid ke dalam state
      setAppliedPromo(promoData);
      
      const labelDiskon = promoData.isPercent 
        ? `${promoData.discount}%` 
        : `Rp ${promoData.discount.toLocaleString('id-ID')}`;
        
      setPromoSuccess(`Kupon "${promoData.code}" berhasil diterapkan! Potongan: ${labelDiskon}`);
    } catch (error: any) {
      setAppliedPromo(null);
      setPromoError(error.message || 'Gagal memeriksa kode promo.');
    }
  };

  // --- LOGIKA CHECKOUT KE BACKEND ---
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
      // Menyusun payload dengan menyertakan properti promoCode
      const payload = {
        customerName: customerName.trim() || 'Pelanggan Walk-in',
        tableId: Number(selectedTable),
        orderType: 'DINE_IN',
       promoCode: appliedPromo ? appliedPromo.code : null,
        items: cart.map((item) => ({
          menuId: Number(item.id),
          quantity: Number(item.qty)
        }))
      };

      console.log('Mengirim Checkout Sesuai DTO Terbaru dengan Promo:', payload);

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

      // Reset Form, Keranjang, dan Kunci Promo jika sukses
      setCart([]);
      setSelectedTable('');
      setCustomerName('');
      setPromoCode('');
      setAppliedPromo(null);
      setPromoSuccess('');
      fetchData(); // Refresh data menu & meja terbaru

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
                  const currentStatus = String(t.status).toUpperCase();
                  const isOccupied = currentStatus === 'OCCUPIED';

                  return (
                    <option
                      key={t.id}
                      value={t.id}
                      disabled={isOccupied}
                      className={isOccupied ? 'text-gray-400 bg-gray-100' : 'text-gray-900'}
                    >
                      Meja {t.number} {isOccupied ? '🔴 (SEDANG TERISI)' : '🟢 (KOSONG)'}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          {/* SECTION COMPONENT INPUT KUPON PROMO */}
          <div className="mt-2 bg-slate-50 p-4 rounded-xl border border-gray-200">
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Kupon Promo (Opsional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Masukkan kode, cth: NAOKI"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                disabled={!!appliedPromo} // Kunci input jika kupon sudah berhasil terpasang
                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-mono focus:outline-orange-500 disabled:bg-gray-100 disabled:text-gray-400"
              />
              {appliedPromo ? (
                <button
                  type="button"
                  onClick={() => {
                    setAppliedPromo(null);
                    setPromoCode('');
                    setPromoSuccess('');
                  }}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckPromo}
                  disabled={loadingPromo}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {loadingPromo ? 'Cek...' : 'Terapkan'}
                </button>
              )}
            </div>

            {/* Pesan Feedback Status Promo */}
            {promoError && <p className="text-red-500 text-xs font-bold mt-1.5">⚠️ {promoError}</p>}
            {promoSuccess && <p className="text-emerald-600 text-xs font-bold mt-1.5">✅ {promoSuccess}</p>}
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

          {/* Rincian Akumulasi Total Harga Akhir */}
          <div className="pt-4 border-t border-gray-100 space-y-1.5">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-700">Rp {totalPrice.toLocaleString('id-ID')}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-sm text-red-600 font-medium">
                <span>Potongan Kupon</span>
                <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
              </div>
            )}

            <div className="flex justify-between items-end pt-2 border-t border-gray-50">
              <span className="text-sm font-bold text-gray-500">Total Bayar</span>
              <span className="text-2xl font-extrabold text-gray-900">Rp {grandTotal.toLocaleString('id-ID')}</span>
            </div>

            <button
              type="submit"
              disabled={loading || cart.length === 0 || !selectedTable}
              className="w-full mt-2 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl disabled:bg-gray-300 transition-all shadow-md text-lg cursor-pointer text-center"
            >
              {loading ? 'Memproses...' : 'Buat Pesanan 🚀'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}