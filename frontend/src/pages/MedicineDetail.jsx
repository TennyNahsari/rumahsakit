import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { medicineService } from '../services'
import { ArrowLeft, Edit, Trash2, Pill, Package, DollarSign, Calendar, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

const MedicineDetail = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()

  const [medicine, setMedicine] = useState(null)
  const [loading, setLoading] = useState(true)

  // Add Batch Modal State
  const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState(false)
  const [batchForm, setBatchForm] = useState({
    batchNo: '',
    stock: 0,
    expiryDate: ''
  })
  const [submittingBatch, setSubmittingBatch] = useState(false)

  const fetchMedicine = async () => {
    try {
      setLoading(true)
      const response = await medicineService.getMedicine(id)
      const data = response.data?.medicine || response.data
      setMedicine(data)
    } catch (error) {
      toast.error(t('medicines.loadFailed', 'Gagal memuat detail obat'))
      console.error('Fetch medicine error:', error)
      navigate('/medicines')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedicine()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleDelete = async () => {
    if (window.confirm(t('medicines.deleteConfirm', 'Apakah Anda yakin ingin menghapus obat ini?'))) {
      try {
        await medicineService.deleteMedicine(id)
        toast.success(t('medicines.deleteSuccess', 'Obat berhasil dihapus'))
        navigate('/medicines')
      } catch (error) {
        toast.error(t('medicines.deleteFailed', 'Gagal menghapus obat'))
      }
    }
  }

  const handleAddBatchSubmit = async (e) => {
    e.preventDefault()
    if (!batchForm.batchNo || !batchForm.expiryDate) {
      toast.error('Nomor Batch dan Tanggal Kadaluarsa harus diisi')
      return
    }

    try {
      setSubmittingBatch(true)
      await medicineService.addBatch(id, batchForm)
      toast.success('Batch obat berhasil ditambahkan')
      setIsAddBatchModalOpen(false)
      setBatchForm({ batchNo: '', stock: 0, expiryDate: '' })
      fetchMedicine()
    } catch (error) {
      const msg = error.response?.data?.error || 'Gagal menambahkan batch'
      toast.error(msg)
    } finally {
      setSubmittingBatch(false)
    }
  }

  const handleDeleteBatch = async (batchId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus batch obat ini?')) {
      try {
        await medicineService.deleteBatch(batchId)
        toast.success('Batch berhasil dihapus')
        fetchMedicine()
      } catch (error) {
        toast.error('Gagal menghapus batch')
      }
    }
  }

  const formatCurrency = (value) => {
    const locale = i18n.language === 'id' ? 'id-ID' : 'en-US'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: i18n.language === 'id' ? 'IDR' : 'USD',
      minimumFractionDigits: 0
    }).format(value || 0)
  }

  const getExpiryStatus = (expiryDate) => {
    const today = new Date()
    const exp = new Date(expiryDate)
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) {
      return { label: 'Kadaluarsa', bg: 'bg-red-100 text-red-800 border-red-200' }
    } else if (diffDays <= 90) {
      return { label: `Kadaluarsa ${diffDays} hari lagi`, bg: 'bg-amber-100 text-amber-800 border-amber-200' }
    }
    return { label: 'Baik', bg: 'bg-green-100 text-green-800 border-green-200' }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0052CC]"></div>
      </div>
    )
  }

  if (!medicine) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/medicines')}
            className="inline-flex items-center px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {t('common.back', 'Kembali')}
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <span>{medicine.name}</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Satuan: <span className="font-semibold text-gray-700">{medicine.unit}</span></p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setBatchForm({
                batchNo: `BATCH-${Date.now().toString().slice(-6)}`,
                stock: 50,
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              })
              setIsAddBatchModalOpen(true)
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Batch Stok</span>
          </button>

          <Link
            to={`/medicines/${id}/edit`}
            className="px-3.5 py-2 bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <Edit className="w-4 h-4" />
            <span>{t('common.edit', 'Edit')}</span>
          </Link>

          <button
            onClick={handleDelete}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('common.delete', 'Hapus')}</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Overview Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center space-x-2">
              <Pill className="w-5 h-5 text-[#0052CC]" />
              <span>Informasi Detail Obat</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-500 font-semibold mb-1">Nama Obat</p>
                <p className="font-bold text-gray-900 text-sm">{medicine.name}</p>
              </div>

              <div>
                <p className="text-gray-500 font-semibold mb-1">Status Keaktifan</p>
                {medicine.isActive ? (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block">
                    Aktif
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-200 inline-block">
                    Nonaktif
                  </span>
                )}
              </div>

              <div>
                <p className="text-gray-500 font-semibold mb-1">Harga per {medicine.unit}</p>
                <p className="font-bold text-gray-900 text-sm">{formatCurrency(medicine.price)}</p>
              </div>

              <div>
                <p className="text-gray-500 font-semibold mb-1">Total Stok Tersedia</p>
                <p className="font-extrabold text-gray-900 text-sm flex items-center space-x-1">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>{medicine.totalStock || 0} {medicine.unit}</span>
                </p>
              </div>
            </div>

            {medicine.description && (
              <div className="pt-3 border-t border-gray-100 text-xs">
                <p className="text-gray-500 font-semibold mb-1">Deskripsi / Keterangan</p>
                <p className="text-gray-800 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200">{medicine.description}</p>
              </div>
            )}
          </div>

          {/* Batches Table */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <span>Daftar Batch & Stok ({medicine.batches?.length || 0})</span>
              </h2>

              <button
                onClick={() => {
                  setBatchForm({
                    batchNo: `BATCH-${Date.now().toString().slice(-6)}`,
                    stock: 50,
                    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  })
                  setIsAddBatchModalOpen(true)
                }}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold rounded-lg flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Batch</span>
              </button>
            </div>

            {!medicine.batches || medicine.batches.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <span>Belum ada data batch untuk obat ini. Klik "Tambah Batch" untuk mengisi stok.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-gray-50 text-gray-900 uppercase text-[10px] tracking-wider font-extrabold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">No. Batch</th>
                      <th className="px-4 py-3">Stok</th>
                      <th className="px-4 py-3">Tanggal Expired</th>
                      <th className="px-4 py-3">Status Expired</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {medicine.batches.map((batch) => {
                      const expStatus = getExpiryStatus(batch.expiryDate)
                      const expFormatted = new Date(batch.expiryDate).toLocaleDateString(
                        i18n.language === 'id' ? 'id-ID' : 'en-US'
                      )

                      return (
                        <tr key={batch.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono font-bold text-gray-900">
                            {batch.batchNo}
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-800">
                            {batch.stock} {medicine.unit}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {expFormatted}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border inline-block ${expStatus.bg}`}>
                              {expStatus.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteBatch(batch.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Hapus Batch"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Summary Card */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Ringkasan Stok & Nilai
            </h2>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-[#0052CC]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Total Stok saat ini</p>
                  <p className="text-lg font-extrabold text-gray-900">
                    {medicine.totalStock || 0} <span className="text-xs font-normal text-gray-600">{medicine.unit}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Est. Nilai Total Stok</p>
                  <p className="text-lg font-extrabold text-gray-900">
                    {formatCurrency((medicine.totalStock || 0) * (medicine.price || 0))}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Jumlah Batch Terdaftar</p>
                  <p className="text-lg font-extrabold text-gray-900">
                    {medicine.batches?.length || 0} Batch
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Add Batch Modal */}
      {isAddBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>Tambah Batch Stok Baru</span>
              </h3>
              <button
                onClick={() => setIsAddBatchModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBatchSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nomor Batch (Batch No.)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BATCH-001"
                  value={batchForm.batchNo}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, batchNo: e.target.value }))}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Jumlah Stok Batch
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={batchForm.stock}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tanggal Kadaluarsa (Expiry Date)
                </label>
                <input
                  type="date"
                  required
                  value={batchForm.expiryDate}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddBatchModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingBatch}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {submittingBatch ? 'Simpan...' : 'Simpan Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default MedicineDetail
