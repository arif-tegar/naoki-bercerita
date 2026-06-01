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

  // Jurus Sapu Jagat Token
  const getCleanToken = () => {
    if (typeof window !== 'undefined') {
      const rawToken = localStorage.getItem('token');
      if (!rawToken) return '';
      return rawToken.replace(/['"]+/g, '').replace(/\\n/g, '').replace(/\s+/g, '');
    }
    return '';
  };

  // 1. Fungsi Mengambil Daftar Meja (GET)
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
        setTables(data.data || data); // Antisipasi jika dibungkus object 'data'
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

  // 2. Fungsi Menambah Meja Baru (POST)
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
      // Payload sesuai spesifikasi: { "number": "A1" }
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

  // 3. Fungsi Mengubah Status Meja (PUT)
  const handleToggleStatus = async (id: number | string, currentStatus: string) => {
    const token = getCleanToken();
    if (!token) {
      alert('❌ Token tidak ditemukan. Silakan login kembali.');
      return;
    }

    // Tentukan status kebalikannya (Toggle)
    const newStatus = currentStatus === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE';

    try {
      // Endpoint spesifik untuk update status: /table/{id}/status
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

      fetchTables(); // Refresh data untuk melihat perubahan warna badge
    } catch (error: unknown) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Terjadi kesalahan saat ubah status'}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Kelola Denah Meja 🪑</h1>
        <p className="text-sm text-gray-500 mt-2">Tambahkan nomor meja baru dan atur status ketersediaannya secara manual.</p>
      </div>
      
      {message && (
        <div className={`p-4 mb-6 rounded-xl text-sm font-medium ${
          message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Form Tambah Meja */}
      <form onSubmit={handleAddTable} className="flex flex-col sm:flex-row gap-3 mb-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nomor/Nama Meja</label>
          <input
            type="text"
            value={newTableNumber}
            onChange={(e) => setNewTableNumber(e.target.value)}
            placeholder="Misal: A1, B2, VIP-1"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2 h-10.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl disabled:bg-gray-300 transition-all shadow-md"
          >
            {loading ? 'Menyimpan...' : 'Tambah Meja'}
          </button>
        </div>
      </form>

      {/* Tabel Tampilan Daftar Meja */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Nomor Meja
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Status Saat Ini
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-48">
                Aksi Manual
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {tables.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                  Belum ada meja yang terdaftar di restoran ini.
                </td>
              </tr>
            ) : (
              tables.map((table, index) => (
                <tr key={table.id || index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-lg text-gray-900 font-extrabold">
                    {table.number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {/* Badge Status (Hijau = Kosong, Merah = Terisi) */}
                    <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                      table.status === 'AVAILABLE' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {table.status === 'AVAILABLE' ? 'KOSONG (AVAILABLE)' : 'TERISI (OCCUPIED)'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm whitespace-nowrap">
                    {/* Tombol Pintar untuk Toggle Status */}
                    <button 
                      onClick={() => handleToggleStatus(table.id, table.status)}
                      className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-colors text-white shadow-sm ${
                        table.status === 'AVAILABLE'
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      Set {table.status === 'AVAILABLE' ? 'Terisi' : 'Kosong'}
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