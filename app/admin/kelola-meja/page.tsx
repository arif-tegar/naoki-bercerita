'use client';

import React, { useState, useEffect } from 'react';

interface TableData {
  id: number | string;
  number: string;
  status: 'AVAILABLE' | 'OCCUPIED' | string;
}

export default function KelolaMejaPage() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://naokibercerita.up.railway.app';

  const getCleanToken = () => {
    if (typeof window !== 'undefined') {
      const rawToken = localStorage.getItem('token');
      if (!rawToken) return '';
      return rawToken.replace(/['"]+/g, '').replace(/\\n/g, '').replace(/\s+/g, '');
    }
    return '';
  };

  const fetchTables = async () => {
    try {
      const token = getCleanToken();
      const response = await fetch(`${baseUrl}/table`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      const data = await response.json();
      if (response.ok) {
        setTables(data.data || data);
      } else {
        console.error('Gagal mengambil data meja:', data.message);
      }
    } catch (error) {
      console.error('Error saat fetch meja:', error);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const token = getCleanToken();
    if (!token) {
      setMessage('❌ Token tidak ditemukan. Silakan login kembali.');
      setLoading(false);
      return;
    }

    if (!newTableNumber.trim()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/table`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ number: newTableNumber }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) throw new Error('Sesi habis / Token hilang. Wajib login ulang.');
        throw new Error(data.message || 'Gagal menambahkan meja.');
      }

      setMessage(`✅ Meja ${newTableNumber} berhasil ditambahkan!`);
      setNewTableNumber(''); 
      fetchTables(); 
    } catch (error: unknown) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number | string, currentStatus: string) => {
    const token = getCleanToken();
    if (!token) {
      alert('❌ Token tidak ditemukan. Silakan login kembali.');
      return;
    }

    const newStatus = currentStatus === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE';

    try {
      const response = await fetch(`${baseUrl}/table/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengubah status meja.');
      }

      fetchTables();
    } catch (error: unknown) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Terjadi kesalahan saat ubah status'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:py-12 sm:px-6 lg:py-16">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header Section - Centered text on mobile */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            Kelola Denah Meja 🪑
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Tambahkan nomor meja baru dan atur status ketersediaannya secara manual.
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

        {/* Form Card - Tambah Meja */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 sm:p-6 transition-all">
            <form onSubmit={handleAddTable} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nomor/Nama Meja
                </label>
                <input
                  type="text"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="Misal: A1, B2, VIP-1"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menyimpan...
                    </span>
                  ) : (
                    'Tambah Meja'
                  )}
                </button>
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
                    Nomor Meja
                  </th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-32 sm:w-44">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tables.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M6 14h12m-7 4h2M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                        </svg>
                        <span>Belum ada meja yang terdaftar di restoran ini.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tables.map((table, index) => (
                    <tr key={table.id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-base sm:text-lg font-extrabold text-gray-900">
                        {table.number}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 sm:px-3 sm:py-1 rounded-full font-bold text-xs ${
                          table.status === 'AVAILABLE' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {table.status === 'AVAILABLE' ? 'Kosong' : 'Terisi'}
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-center text-sm whitespace-nowrap">
                        <button 
                          onClick={() => handleToggleStatus(table.id, table.status)}
                          className={`px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-lg font-bold text-xs transition-colors text-white shadow-sm ${
                            table.status === 'AVAILABLE'
                              ? 'bg-red-500 hover:bg-red-600'
                              : 'bg-green-500 hover:bg-green-600'
                          }`}
                        >
                          {table.status === 'AVAILABLE' ? 'Set Terisi' : 'Set Kosong'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Optional footer info */}
        <p className="text-center text-xs text-gray-400 mt-6">
          * Ubah status meja secara manual saat ada pelanggan datang/meninggalkan meja.
        </p>
      </div>
    </div>
  );
}