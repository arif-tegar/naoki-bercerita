'use client';

import React, { useState, useEffect } from 'react';

interface MenuDetail {
  id: number;
  name: string;
  price: number;
}

interface TransactionItem {
  id: number;
  transactionId: number;
  menuId: number;
  quantity: number;
  price: number;
  menu: MenuDetail;
}

interface Transaction {
  id: number;
  customerName: string;
  orderType: string;
  tableId: number;
  userId: number | null;
  status: string;
  paymentMethod: string;
  isPaid: boolean;
  createdAt: string;
  promoId: number | null;
  transactionItems: TransactionItem[];
  promo: any | null;
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Ambil token bersih
  const getCleanToken = () => {
    if (typeof window !== 'undefined') {
      const rawToken = localStorage.getItem('token');
      if (!rawToken) return '';
      return rawToken.replace(/['"]+/g, '').replace(/\\n/g, '').replace(/\s+/g, '');
    }
    return '';
  };

  const fetchHistory = async () => {
    setIsLoading(true);
    setErrorMsg('');
    const token = getCleanToken();

    try {
      const response = await fetch('https://naokibercerita.up.railway.app/transaction/history', {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil riwayat transaksi.');
      }

      setTransactions(Array.isArray(result) ? result : result.data || []);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'Terjadi kesalahan saat memuat data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // 💵 FUNGSI PROSES PELUNASAN PEMBAYARAN
  const handlePayment = async (id: number, totalAmount: number) => {
    const cashInput = window.prompt(`Total Tagihan Bersih: Rp ${totalAmount.toLocaleString('id-ID')}\nMasukkan Jumlah Uang Tunai yang Diterima (Tanpa titik/koma):`);
    
    if (cashInput === null) return; 
    
    const cashReceived = Number(cashInput);
    if (isNaN(cashReceived) || cashReceived < totalAmount) {
      alert('⚠️ Jumlah uang yang dimasukkan tidak valid atau kurang dari total tagihan!');
      return;
    }

    const token = getCleanToken();
    try {
      const response = await fetch(`https://naokibercerita.up.railway.app/transaction/${id}/pay`, {
        method: 'PUT',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cashReceived: cashReceived,
          paymentMethod: 'TUNAI'
        })
      });

      if (!response.ok) {
        const errResult = await response.json();
        throw new Error(errResult.message || 'Gagal memproses pembayaran.');
      }

      const kembalian = cashReceived - totalAmount;
      alert(`🎉 Pembayaran Berhasil!\nKembalian: Rp ${kembalian.toLocaleString('id-ID')}`);
      
      fetchHistory(); 
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // ❌ FUNGSI PROSES PEMBATALAN TRANSAKSI
  const handleCancel = async (id: number) => {
    const confirmCancel = window.confirm(`Apakah Anda yakin ingin MEMBATALKAN pesanan #${id}? Sisa stok menu akan dikembalikan secara otomatis.`);
    if (!confirmCancel) return;

    const token = getCleanToken();
    try {
      const response = await fetch(`https://naokibercerita.up.railway.app/transaction/${id}/cancel`, {
        method: 'PUT',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errResult = await response.json();
        throw new Error(errResult.message || 'Gagal membatalkan transaksi.');
      }

      alert(`❌ Pesanan #${id} telah berhasil dibatalkan!`);
      fetchHistory();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // Filter pencarian berdasarkan nama pelanggan atau nomor meja
  const filteredTransactions = transactions.filter((tx) => {
    const nameMatch = tx.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const tableMatch = tx.tableId?.toString().includes(searchTerm);
    return nameMatch || tableMatch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Riwayat Transaksi 📋</h1>
          <p className="text-sm text-gray-500 mt-1">Rekam jejak nota pembelian, item menu terpesan, dan pelunasan kasir.</p>
        </div>
        
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Cari nama pelanggan / meja..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 bg-white rounded-xl text-sm focus:outline-orange-500 shadow-sm"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-600 text-sm font-semibold rounded-2xl border border-red-100">
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-400 font-bold text-xs uppercase">
                <th className="py-4 px-4">Waktu / Nota</th>
                <th className="py-4 px-4">Pelanggan</th>
                <th className="py-4 px-4">Tipe / Meja</th>
                <th className="py-4 px-4">Menu Terpesan</th>
                <th className="py-4 px-4">Total Bayar</th>
                <th className="py-4 px-4 text-center">Status / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                    <span className="inline-block animate-pulse">Memuat data transaksi...</span>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                    Tidak ada riwayat transaksi ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  // 1. Hitung harga kotor total barang terlebih dahulu
                  const subtotalKotor = tx.transactionItems ? tx.transactionItems.reduce((sum, item) => {
                    return sum + (item.quantity * item.price);
                  }, 0) : 0;

                  // 2. Kalkulasi nominal potongan diskon berdasarkan tipe voucher
                  let discountAmount = 0;
                  if (tx.promo) {
                    discountAmount = tx.promo.isPercent
                      ? (subtotalKotor * tx.promo.discount) / 100
                      : tx.promo.discount;
                  }

                  // 3. Kurangi subtotal dengan potongan (Gunakan Math.max agar tidak bernilai minus)
                  const totalBersih = Math.max(0, subtotalKotor - discountAmount);
                  const currentStatus = tx.status?.toUpperCase();

                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/40 transition-colors">
                      {/* Waktu & Invoice */}
                      <td className="py-4 px-4">
                        <div className="font-mono text-xs text-gray-400">#{tx.id}</div>
                        <div className="text-xs font-semibold text-gray-600 mt-0.5">
                          {new Date(tx.createdAt).toLocaleDateString('id-ID')} {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Nama Pelanggan */}
                      <td className="py-4 px-4 font-bold text-gray-800">
                        {tx.customerName}
                      </td>

                      {/* Tipe & Meja */}
                      <td className="py-4 px-4">
                        <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-md">
                          {tx.orderType}
                        </span>
                        <div className="text-xs text-gray-500 font-semibold mt-1">
                          {tx.tableId ? `Meja ${tx.tableId}` : 'Tanpa Meja'}
                        </div>
                      </td>

                      {/* Menu Terpesan */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="space-y-0.5 text-xs text-gray-600">
                          {tx.transactionItems && tx.transactionItems.map((item, idx) => (
                            <div key={idx} className="truncate">
                              • <span className="font-bold text-gray-800">{item.quantity}x</span> {item.menu?.name || 'Menu Terhapus'}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* 🔥 TOTAL BAYAR (SINKRON DENGAN DISKON) */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          {discountAmount > 0 ? (
                            <>
                              {/* Tampilkan harga coret kotor */}
                              <span className="text-xs text-gray-400 line-through">
                                Rp {subtotalKotor.toLocaleString('id-ID')}
                              </span>
                              {/* Tampilkan nominal bersih baru */}
                              <div className="font-extrabold text-gray-900">
                                Rp {totalBersih.toLocaleString('id-ID')}
                              </div>
                              {/* Informasi Detail Potongan */}
                              <span className="inline-block w-fit text-[9px] bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded-md mt-1 font-mono uppercase">
                                🎟️ {tx.promo.code} (-Rp {discountAmount.toLocaleString('id-ID')})
                              </span>
                            </>
                          ) : (
                            /* Jika tidak ada promo, muncul harga normal */
                            <div className="font-extrabold text-gray-900">
                              Rp {subtotalKotor.toLocaleString('id-ID')}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status / Aksi Pembayaran */}
                      <td className="py-4 px-4 text-center">
                        {tx.isPaid === true || currentStatus === 'PAID' || currentStatus === 'SERVED' ? (
                          <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl">
                            LUNAS 🟢
                          </span>
                        ) : currentStatus === 'CANCELLED' || currentStatus === 'BATAL' ? (
                          <span className="inline-block px-2.5 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-xl">
                            BATAL 🔴
                          </span>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-700 font-bold text-xs rounded-xl mb-1">
                              PENDING 🟡
                            </span>
                            
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handlePayment(tx.id, totalBersih)} // 👈 Menggunakan totalBersih yang sudah terpotong kupon
                                className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[11px] rounded-lg shadow-xs transition-colors"
                              >
                                Bayar 💵
                              </button>
                              
                              <button
                                onClick={() => handleCancel(tx.id)}
                                className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white font-extrabold text-[11px] rounded-lg shadow-xs transition-colors"
                              >
                                Batal ❌
                              </button>
                            </div>
                          </div>
                        )}
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