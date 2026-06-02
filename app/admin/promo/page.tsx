'use client';

import React, { useState, useEffect } from 'react';

interface Promo {
  id: number;
  code: string;
  name: string;
  discount: number;
  isPercent: boolean;
  expiresAt: string;
  isActive?: boolean;
}

export default function PromoPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // State Form Input
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [isPercent, setIsPercent] = useState(false);
  
  // Ambil tanggal hari ini sebagai default date picker (format: YYYY-MM-DD)
  const [expiryDate, setExpiryDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 30); // Default otomatis berlaku selama 30 hari ke depan
    return today.toISOString().split('T')[0];
  });

  // Ambil token bersih (Konsisten dengan halaman riwayat transaksi)
  const getCleanToken = () => {
    if (typeof window !== 'undefined') {
      const rawToken = localStorage.getItem('token');
      if (!rawToken) return '';
      return rawToken.replace(/['"]+/g, '').replace(/\\n/g, '').replace(/\s+/g, '');
    }
    return '';
  };

  // 1. AMBIL SEMUA DAFTAR PROMO (GET)
  const fetchPromos = async () => {
    const token = getCleanToken();
    try {
      const response = await fetch('https://naokibercerita.up.railway.app/promo', {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPromos(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Gagal mengambil data promo:', err);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  // 2. KIRIM DATA PROMO BARU (POST)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const token = getCleanToken();
    
    // Konversi nilai input tanggal dari kalender ke format ISO String lengkap sesuai ekspektasi backend
    const isoExpiresAt = new Date(`${expiryDate}T23:59:59.000Z`).toISOString();

    const payload = {
      code,
      name,
      discount: Number(discount),
      isPercent,
      expiresAt: isoExpiresAt,
    };

    try {
      const response = await fetch('https://naokibercerita.up.railway.app/promo', {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, 
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal membuat voucher promo');
      }

      setSuccessMsg(`Voucher promo "${code}" berhasil dibuat! 🎉`);
      setCode('');
      setName('');
      setDiscount(0);
      setIsPercent(false);
      
      fetchPromos();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. FUNGSI NONAKTIFKAN PROMO SECARA PAKSA (PUT)
  const handleDeactivate = async (id: number, promoCode: string) => {
    const confirmDeactivate = window.confirm(`Apakah kamu yakin ingin menonaktifkan paksa voucher "${promoCode}"?`);
    if (!confirmDeactivate) return;

    setErrorMsg('');
    setSuccessMsg('');

    const token = getCleanToken();

    try {
      const response = await fetch(`https://naokibercerita.up.railway.app/promo/${id}/deactivate`, {
        method: 'PUT',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menonaktifkan voucher');
      }

      setSuccessMsg(`Voucher promo "${promoCode}" berhasil dinonaktifkan secara paksa! 🛑`);
      fetchPromos();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menonaktifkan voucher.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kelola Voucher Promo 🎟️</h1>
        <p className="text-sm text-gray-500 mt-1">Halaman khusus Admin untuk membuat dan memantau diskon restoran.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM INPUT PROMO */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm h-fit">
          <h2 className="text-base font-bold text-gray-900 mb-4">Buat Promo Baru</h2>
          
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-xl border border-emerald-100">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Kode Voucher</label>
              <input
                type="text"
                required
                placeholder="Contoh: DISKONNAOKI"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nama Promo</label>
              <input
                type="text"
                required
                placeholder="Contoh: Promo Pembukaan Resto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tipe Potongan</label>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsPercent(false)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    !isPercent ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  Nominal Rupiah (Rp)
                </button>
                <button
                  type="button"
                  onClick={() => setIsPercent(true)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    isPercent ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  Persentase (%)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                Besar Potongan {isPercent ? '(%)' : '(Rp)'}
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder={isPercent ? '10' : '10000'}
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tanggal Kedaluwarsa</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700 focus:outline-orange-500 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-orange-500 text-white font-bold text-sm rounded-xl hover:bg-orange-600 transition-colors disabled:bg-gray-300 cursor-pointer"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Voucher Promo 🚀'}
            </button>
          </form>
        </div>

        {/* TABEL DAFTAR PROMO */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
          <h2 className="text-base font-bold text-gray-900 mb-4">Daftar Voucher Restoran</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold text-xs uppercase bg-gray-50/50">
                  <th className="py-3 px-3">Kode</th>
                  <th className="py-3 px-3">Nama Promo</th>
                  <th className="py-3 px-3">Potongan</th>
                  <th className="py-3 px-3">Kedaluwarsa</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {promos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400 text-sm">
                      Belum ada voucher promo yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  promos.map((promo, idx) => (
                    <tr key={promo.id || idx} className="hover:bg-gray-50/40 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-orange-600 text-xs">
                        {promo.code}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-gray-800">
                        {promo.name}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-gray-900">
                        {promo.isPercent ? `${promo.discount}%` : `Rp ${promo.discount.toLocaleString('id-ID')}`}
                      </td>
                      <td className="py-3.5 px-3 text-xs text-gray-600 font-medium">
                        {new Date(promo.expiresAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {promo.isActive === false ? (
                          <span className="text-xs text-gray-400 font-bold italic bg-gray-100 px-2.5 py-1 rounded-lg">
                            Inactive 🛑
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeactivate(promo.id, promo.code)}
                            className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold transition-all border border-red-100 cursor-pointer"
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}