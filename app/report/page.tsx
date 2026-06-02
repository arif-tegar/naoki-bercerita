'use client';

import React, { useState, useEffect } from 'react';

interface FinancialSummary {
  total_omzet_kotor: number;
  total_potongan_diskon: number;
  total_omzet_resmi_bersih: number;
}

interface OrderStatistics {
  total_nota_masuk: number;
  nota_lunas: number;
  nota_pending: number;
  nota_batal: number;
  pilihan_dine_in: number;
  pilihan_takeaway: number;
}

interface TopMenu {
  nama_menu: string;
  porsi_terjual: number;
  total_pendapatan: number;
}

interface ReportData {
  periode_laporan: string;
  ringkasan_keuangan: FinancialSummary;
  statistik_pesanan: OrderStatistics;
  menu_terlaris_peringkat: TopMenu[];
}

export default function ReportPage() {
  // Mendapatkan tanggal hari ini format YYYY-MM-DD sesuai timezone lokal
  const getTodayDateString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState(getTodayDateString());
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Ambil token bersih dari localStorage
  const getCleanToken = () => {
    if (typeof window !== 'undefined') {
      const rawToken = localStorage.getItem('token');
      if (!rawToken) return '';
      return rawToken.replace(/['"]+/g, '').replace(/\\n/g, '').replace(/\s+/g, '');
    }
    return '';
  };

  const fetchReport = async () => {
    setIsLoading(true);
    setErrorMsg('');
    const token = getCleanToken();

    try {
      const response = await fetch(
        `https://naokibercerita.up.railway.app/transaction/report/sales?startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal memuat laporan penjualan.');
      }

      setReport(result);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  // Ambil data otomatis saat pertama kali halaman dibuka
  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* HEADER & FILTER TANGGAL */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Laporan Penjualan 📈</h1>
          <p className="text-sm text-gray-500 mt-1">
            Periode aktif: <span className="font-semibold text-orange-600">{report?.periode_laporan || `${startDate} sampai ${endDate}`}</span>
          </p>
        </div>

        {/* INPUT DATE PICKER */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-gray-400 uppercase mb-1">Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 focus:outline-orange-500 font-medium"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-gray-400 uppercase mb-1">Sampai</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 focus:outline-orange-500 font-medium"
            />
          </div>
          <button
            onClick={fetchReport}
            disabled={isLoading}
            className="mt-4 px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {isLoading ? 'Loading...' : 'Filter 🔍'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-100">
          ⚠️ {errorMsg}
        </div>
      )}

      {report && !isLoading && (
        <>
          {/* BARIS KARTU RINGKASAN KEUANGAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Omzet Bersih */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md self-start">
                Omzet Bersih 💰
              </span>
              <div className="mt-4">
                <span className="text-2xl font-extrabold text-gray-900">
                  Rp {(report.ringkasan_keuangan.total_omzet_resmi_bersih ?? 0).toLocaleString('id-ID')}
                </span>
                <p className="text-xs text-gray-400 mt-1">Total pendapatan bersih setelah potongan diskon.</p>
              </div>
            </div>

            {/* Total Potongan Diskon */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2.5 py-1 rounded-md self-start">
                Potongan Diskon 🎟️
              </span>
              <div className="mt-4">
                <span className="text-2xl font-extrabold text-gray-900">
                  Rp {(report.ringkasan_keuangan.total_potongan_diskon ?? 0).toLocaleString('id-ID')}
                </span>
                <p className="text-xs text-gray-400 mt-1">Total pengurangan biaya dari penukaran voucher.</p>
              </div>
            </div>

            {/* Omzet Kotor */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-2.5 py-1 rounded-md self-start">
                Omzet Kotor 🛒
              </span>
              <div className="mt-4">
                <span className="text-2xl font-extrabold text-gray-900">
                  Rp {(report.ringkasan_keuangan.total_omzet_kotor ?? 0).toLocaleString('id-ID')}
                </span>
                <p className="text-xs text-gray-400 mt-1">Akumulasi penjualan kotor sebelum diskon.</p>
              </div>
            </div>
          </div>

          {/* GRID STATISTIK NOTA & PILIHAN LAYANAN */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Box Kiri: Statistik Nota Masuk */}
            <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2">
                Statistik Nota Masuk 📊
              </h2>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-500 font-medium">Total Seluruh Nota</span>
                <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-md">
                  {report.statistik_pesanan.total_nota_masuk} Nota
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-500 font-medium">🟢 Nota Lunas (PAID)</span>
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                  {report.statistik_pesanan.nota_lunas}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-500 font-medium">🟡 Nota Pending</span>
                <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md">
                  {report.statistik_pesanan.nota_pending}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-500 font-medium">🔴 Nota Batal</span>
                <span className="text-sm font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-md">
                  {report.statistik_pesanan.nota_batal}
                </span>
              </div>

              <div className="border-t border-gray-50 pt-3 grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Dine In</div>
                  <div className="text-base font-extrabold text-slate-700 mt-0.5">{report.statistik_pesanan.pilihan_dine_in}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Takeaway</div>
                  <div className="text-base font-extrabold text-slate-700 mt-0.5">{report.statistik_pesanan.pilihan_takeaway}</div>
                </div>
              </div>
            </div>

            {/* Box Kanan: Menu Terlaris Peringkat */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-5 border-b border-gray-50">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                    Peringkat Menu Terlaris ⭐
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-50/70 text-gray-400 font-bold text-xs uppercase border-b border-gray-50">
                        <th className="py-3 px-5 text-center w-16">Rank</th>
                        <th className="py-3 px-4">Nama Item Menu</th>
                        <th className="py-3 px-4 text-center">Porsi Terjual</th>
                        <th className="py-3 px-5 text-right">Total Pendapatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {report.menu_terlaris_peringkat.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-400 text-xs">
                            Tidak ada data menu terjual pada periode ini.
                          </td>
                        </tr>
                      ) : (
                        report.menu_terlaris_peringkat.map((menu, index) => (
                          <tr key={index} className="hover:bg-gray-50/30 transition-colors">
                            <td className="py-3.5 px-5 text-center">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                index === 0 ? 'bg-amber-100 text-amber-800' :
                                index === 1 ? 'bg-slate-200 text-slate-800' :
                                index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-gray-800">
                              {menu.nama_menu}
                            </td>
                            <td className="py-3.5 px-4 text-center font-semibold text-gray-600">
                              {menu.porsi_terjual} Porsi
                            </td>
                            <td className="py-3.5 px-5 text-right font-extrabold text-gray-900">
                              Rp {menu.total_pendapatan.toLocaleString('id-ID')}
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
        </>
      )}
    </div>
  );
}