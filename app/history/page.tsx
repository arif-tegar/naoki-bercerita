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

  const filteredTransactions = transactions.filter((tx) => {
    const nameMatch = tx.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const tableMatch = tx.tableId?.toString().includes(searchTerm);
    return nameMatch || tableMatch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      {/* HEADER SECTION: Judul & Input Cari Adaptif */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Riwayat Transaksi 📋</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Rekam jejak nota pembelian, item menu terpesan, dan pelunasan kasir.</p>
        </div>
        
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Cari nama pelanggan / meja..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white shadow-xs transition-all"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-600 text-xs sm:text-sm font-semibold rounded-xl border border-red-100">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* --- KONDISI LOADING --- */}
      {isLoading ? (
        <div className="py-16 text-center text-gray-400 bg-white border border-gray-100 rounded-2xl">
          <div className="inline-block animate-bounce text-lg mb-2">🔄</div>
          <p className="text-xs sm:text-sm font-medium animate-pulse">Memuat data riwayat transaksi...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        /* --- KONDISI KOSONG --- */
        <div className="py-16 text-center text-gray-400 bg-white border border-gray-100 rounded-2xl">
          <div className="text-2xl mb-2">📭</div>
          <p className="text-xs sm:text-sm font-medium">Tidak ada riwayat transaksi ditemukan.</p>
        </div>
      ) : (
        <div>
          {/* LAYOUT 1: TAMPILAN CARD (Khusus HP & Tablet - Tersembunyi di Desktop `lg:hidden`) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {filteredTransactions.map((tx) => {
              const subtotalKotor = tx.transactionItems ? tx.transactionItems.reduce((sum, item) => sum + (item.quantity * item.price), 0) : 0;
              let discountAmount = tx.promo ? (tx.promo.isPercent ? (subtotalKotor * tx.promo.discount) / 100 : tx.promo.discount) : 0;
              const totalBersih = Math.max(0, subtotalKotor - discountAmount);
              const currentStatus = tx.status?.toUpperCase();

              return (
                <div key={tx.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between gap-4">
                  {/* Atas Card: Invoice ID & Waktu */}
                  <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-gray-400">#{tx.id}</span>
                      <h3 className="font-extrabold text-gray-900 text-base mt-0.5">{tx.customerName}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-md inline-block">
                        {tx.orderType}
                      </span>
                      <p className="text-[11px] font-medium text-gray-400 mt-1">
                        {new Date(tx.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {/* Tengah Card: Rincian Meja & Menu Item */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-gray-500 font-semibold">
                      <span>Lokasi/Meja:</span>
                      <span className="text-gray-800">{tx.tableId ? `Meja ${tx.tableId}` : 'Tanpa Meja'}</span>
                    </div>
                    
                    <div className="bg-gray-50/70 p-3 rounded-xl space-y-1 max-h-28 overflow-y-auto">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Item Pesanan:</p>
                      {tx.transactionItems && tx.transactionItems.map((item, idx) => (
                        <div key={idx} className="text-gray-700 flex justify-between gap-2">
                          <span className="truncate">• <span className="font-bold text-gray-900">{item.quantity}x</span> {item.menu?.name || 'Menu Terhapus'}</span>
                          <span className="text-gray-400 shrink-0">@Rp{item.price.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bawah Card: Harga Final & Badge Status / Tombol Aksi */}
                  <div className="pt-3 border-t border-gray-50 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Total Bayar</p>
                      {discountAmount > 0 ? (
                        <div>
                          <span className="text-xs text-gray-400 line-through mr-1.5">Rp {subtotalKotor.toLocaleString('id-ID')}</span>
                          <span className="text-base font-black text-gray-900">Rp {totalBersih.toLocaleString('id-ID')}</span>
                          <div className="text-[9px] bg-orange-50 text-orange-600 font-bold px-1.5 py-0.5 rounded mt-0.5 w-fit">
                            🎟️ {tx.promo.code}
                          </div>
                        </div>
                      ) : (
                        <span className="text-base font-black text-gray-900">Rp {subtotalKotor.toLocaleString('id-ID')}</span>
                      )}
                    </div>

                    <div className="text-right">
                      {tx.isPaid || currentStatus === 'PAID' || currentStatus === 'SERVED' ? (
                        <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-xs rounded-xl">
                          LUNAS 🟢
                        </span>
                      ) : currentStatus === 'CANCELLED' || currentStatus === 'BATAL' ? (
                        <span className="inline-block px-3 py-1 bg-red-50 text-red-700 border border-red-100 font-bold text-xs rounded-xl">
                          BATAL 🔴
                        </span>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-1.5 items-end sm:items-center">
                          <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 font-bold text-[10px] rounded-lg">
                            PENDING 🟡
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handlePayment(tx.id, totalBersih)}
                              className="px-2.5 py-1.5 bg-orange-500 text-white font-bold text-xs rounded-lg shadow-xs active:bg-orange-600"
                            >
                              Bayar 💵
                            </button>
                            <button
                              onClick={() => handleCancel(tx.id)}
                              className="px-2.5 py-1.5 bg-red-500 text-white font-bold text-xs rounded-lg shadow-xs active:bg-red-600"
                            >
                              Batal ❌
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* LAYOUT 2: TAMPILAN TABEL ASLI (Hanya muncul di Layar Desktop `hidden lg:block`) */}
          <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-400 font-bold text-xs uppercase tracking-wider">
                    <th className="py-4 px-5">Waktu / Nota</th>
                    <th className="py-4 px-5">Pelanggan</th>
                    <th className="py-4 px-5">Tipe / Meja</th>
                    <th className="py-4 px-5">Menu Terpesan</th>
                    <th className="py-4 px-5">Total Bayar</th>
                    <th className="py-4 px-5 text-center">Status / Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTransactions.map((tx) => {
                    const subtotalKotor = tx.transactionItems ? tx.transactionItems.reduce((sum, item) => sum + (item.quantity * item.price), 0) : 0;
                    let discountAmount = tx.promo ? (tx.promo.isPercent ? (subtotalKotor * tx.promo.discount) / 100 : tx.promo.discount) : 0;
                    const totalBersih = Math.max(0, subtotalKotor - discountAmount);
                    const currentStatus = tx.status?.toUpperCase();

                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-mono text-xs text-gray-400">#{tx.id}</div>
                          <div className="text-xs font-semibold text-gray-600 mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString('id-ID')} {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td className="py-4 px-5 font-bold text-gray-800">
                          {tx.customerName}
                        </td>

                        <td className="py-4 px-5">
                          <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-md">
                            {tx.orderType}
                          </span>
                          <div className="text-xs text-gray-500 font-semibold mt-1">
                            {tx.tableId ? `Meja ${tx.tableId}` : 'Tanpa Meja'}
                          </div>
                        </td>

                        <td className="py-4 px-5 max-w-xs">
                          <div className="space-y-0.5 text-xs text-gray-600 max-h-16 overflow-y-auto">
                            {tx.transactionItems && tx.transactionItems.map((item, idx) => (
                              <div key={idx} className="truncate">
                                • <span className="font-bold text-gray-800">{item.quantity}x</span> {item.menu?.name || 'Menu Terhapus'}
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <div className="flex flex-col">
                            {discountAmount > 0 ? (
                              <>
                                <span className="text-xs text-gray-400 line-through">Rp {subtotalKotor.toLocaleString('id-ID')}</span>
                                <div className="font-extrabold text-gray-900">Rp {totalBersih.toLocaleString('id-ID')}</div>
                                <span className="inline-block w-fit text-[9px] bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded-md mt-1 font-mono uppercase">
                                  🎟️ {tx.promo.code} (-Rp {discountAmount.toLocaleString('id-ID')})
                                </span>
                              </>
                            ) : (
                              <div className="font-extrabold text-gray-900">Rp {subtotalKotor.toLocaleString('id-ID')}</div>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-5 text-center">
                          {tx.isPaid || currentStatus === 'PAID' || currentStatus === 'SERVED' ? (
                            <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl">
                              LUNAS 🟢
                            </span>
                          ) : currentStatus === 'CANCELLED' || currentStatus === 'BATAL' ? (
                            <span className="inline-block px-2.5 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-xl">
                              BATAL 🔴
                            </span>
                          ) : (
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-700 font-bold text-xs rounded-xl">
                                PENDING 🟡
                              </span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handlePayment(tx.id, totalBersih)}
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
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}