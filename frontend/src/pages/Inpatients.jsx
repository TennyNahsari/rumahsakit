import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import inpatientService from '../services/inpatientService'
import CheckOutModal from '../components/CheckOutModal'
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  LogOut,
  Eye,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

const Inpatients = () => {
  const { t, i18n } = useTranslation()
  const [inpatients, setInpatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('ALL') // ALL, PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED
  const [filters, setFilters] = useState({
    roomType: '',
    floor: '',
    doctorId: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [selectedOccupancy, setSelectedOccupancy] = useState(null)

  const roomTypes = ['VIP', 'KELAS_1', 'KELAS_2', 'KELAS_3', 'ICU', 'NICU', 'PICU', 'ISOLATION']

  const fetchInpatients = async (page = 1) => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 15,
        status: activeTab,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.roomType && { roomType: filters.roomType }),
        ...(filters.floor && { floor: parseInt(filters.floor) }),
        ...(filters.doctorId && { doctorId: filters.doctorId })
      }
      
      const response = await inpatientService.getInpatients(params)
      setInpatients(response.data?.inpatients || [])
      setTotalPages(response.data?.pagination?.pages || 1)
    } catch (error) {
      toast.error(t('inpatients.loadFailed', 'Gagal memuat data rawat inap'))
      console.error('Fetch inpatients error:', error)
      setInpatients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInpatients(currentPage)
  }, [currentPage, filters, activeTab])

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchInpatients(1)
  }

  const handleStatusChange = async (occupancyId, newStatus) => {
    try {
      await inpatientService.updateStatus(occupancyId, { status: newStatus })
      toast.success(t('inpatients.statusUpdateSuccess', 'Status rawat inap berhasil diperbarui'))
      fetchInpatients(currentPage)
    } catch (err) {
      console.error('Update status error:', err)
      toast.error(err.response?.data?.error || t('inpatients.statusUpdateFailed', 'Gagal memperbarui status rawat inap'))
    }
  }

  const handleDeleteInpatient = async (occupancy) => {
    const confirmMsg = t('inpatients.deleteConfirm', 'Apakah Anda yakin ingin menghapus data rawat inap ini?')
    if (!window.confirm(confirmMsg)) return

    try {
      await inpatientService.deleteInpatient(occupancy.id)
      toast.success(t('inpatients.deleteSuccess', 'Data rawat inap berhasil dihapus'))
      fetchInpatients(currentPage)
    } catch (err) {
      console.error('Delete inpatient error:', err)
      toast.error(err.response?.data?.error || t('inpatients.deleteFailed', 'Gagal menghapus data rawat inap'))
    }
  }

  const openCheckoutModal = (occupancy) => {
    setSelectedOccupancy(occupancy)
    setCheckoutModalOpen(true)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const locale = i18n.language === 'id' ? 'id-ID' : 'en-US'
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const renderStatusDropdown = (status, occupancyId) => {
    let colorClass = 'bg-gray-100 text-gray-800 border-gray-300'

    if (status === 'PENDING') {
      colorClass = 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
    } else if (status === 'CONFIRMED') {
      colorClass = 'bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200'
    } else if (status === 'CHECKED_IN' || status === 'ACTIVE') {
      colorClass = 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
    } else if (status === 'CHECKED_OUT') {
      colorClass = 'bg-slate-100 text-slate-700 border-slate-300'
    } else if (status === 'CANCELLED') {
      colorClass = 'bg-red-100 text-red-900 border-red-300'
    }

    return (
      <select
        value={status === 'ACTIVE' ? 'CHECKED_IN' : status}
        onChange={(e) => handleStatusChange(occupancyId, e.target.value)}
        className={`text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer outline-none transition-all ${colorClass}`}
      >
        <option value="PENDING">🟡 {t('inpatients.statuses.PENDING', 'Pending')}</option>
        <option value="CONFIRMED">🔵 {t('inpatients.statuses.CONFIRMED', 'Confirmed')}</option>
        <option value="CHECKED_IN">🟢 {t('inpatients.statuses.CHECKED_IN', 'Check-in (Aktif)')}</option>
        <option value="CHECKED_OUT">⚪ {t('inpatients.statuses.CHECKED_OUT', 'Check-out')}</option>
        <option value="CANCELLED">🔴 {t('inpatients.statuses.CANCELLED', 'Dibatalkan')}</option>
      </select>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('inpatients.title', 'Rawat Inap')}</h1>
          <p className="text-sm text-gray-600">{t('inpatients.subtitle', 'Kelola pendaftaran dan status kamar pasien rawat inap')}</p>
        </div>
        
        <Link
          to="/inpatients/check-in"
          className="inline-flex items-center justify-center px-4 py-2 bg-[#0052CC] text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors shadow-sm gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>{t('inpatients.checkIn', 'Check-in Pasien')}</span>
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {[
          { key: 'ALL', label: t('inpatients.tabs.all', 'Semua Status'), color: 'blue' },
          { key: 'PENDING', label: t('inpatients.tabs.pending', 'Pending'), color: 'amber' },
          { key: 'CONFIRMED', label: t('inpatients.tabs.confirmed', 'Confirmed'), color: 'indigo' },
          { key: 'CHECKED_IN', label: t('inpatients.tabs.checkedIn', 'Check-in / Aktif'), color: 'emerald' },
          { key: 'CHECKED_OUT', label: t('inpatients.tabs.checkedOut', 'Check-out'), color: 'slate' },
          { key: 'CANCELLED', label: t('inpatients.tabs.cancelled', 'Dibatalkan'), color: 'red' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key)
              setCurrentPage(1)
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              activeTab === tab.key
                ? 'bg-[#0052CC] text-white border-[#0052CC] shadow-sm'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('inpatients.searchPlaceholder', 'Cari berdasarkan nama pasien atau No. RM...')}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg transition-colors"
          >
            {t('common.search', 'Cari')}
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('rooms.filterByType', 'Tipe Kamar')}
            </label>
            <select
              value={filters.roomType}
              onChange={(e) => setFilters({ ...filters, roomType: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium"
            >
              <option value="">{t('rooms.allTypes', 'Semua Tipe')}</option>
              {roomTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`rooms.types.${type}`, type)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('rooms.filterByFloor', 'Lantai')}
            </label>
            <input
              type="number"
              placeholder={t('rooms.allFloors', 'Semua Lantai')}
              value={filters.floor}
              onChange={(e) => setFilters({ ...filters, floor: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium"
            />
          </div>
        </div>
      </div>

      {/* Inpatients Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0052CC]"></div>
          </div>
        ) : !inpatients || inpatients.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-xs font-medium text-gray-500">{t('common.noDataFound', 'Tidak ada data rawat inap ditemukan')}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">No. RM</th>
                    <th className="px-4 py-3 text-left">{t('inpatients.patientName', 'Pasien')}</th>
                    <th className="px-4 py-3 text-left">{t('inpatients.roomNumber', 'Kamar & Bed')}</th>
                    <th className="px-4 py-3 text-left">{t('inpatients.doctor', 'Dokter DPJP')}</th>
                    <th className="px-4 py-3 text-left">{t('inpatients.statusLabel', 'Status')}</th>
                    <th className="px-4 py-3 text-left">{t('inpatients.checkInDate', 'Tanggal Masuk')}</th>
                    <th className="px-4 py-3 text-left">{t('inpatients.lengthOfStay', 'Lama Rawat')}</th>
                    <th className="px-4 py-3 text-center">{t('common.actions', 'Aksi')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 text-xs">
                  {inpatients.map((occupancy) => (
                    <tr key={occupancy.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-gray-900">
                        {occupancy.patient?.medicalRecordNo || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900">{occupancy.patient?.name || '-'}</p>
                        <p className="text-[10px] text-gray-500">Reg: {occupancy.registrationNumber}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-indigo-900">Kamar {occupancy.room?.roomNumber || '-'}</span>
                        {occupancy.bedNumber && <span className="text-gray-600 font-medium"> (Bed {occupancy.bedNumber})</span>}
                        <p className="text-[10px] text-gray-500">{occupancy.room?.roomType}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {occupancy.doctor?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {renderStatusDropdown(occupancy.status, occupancy.id)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-medium">
                        {formatDate(occupancy.checkedInAt)}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {occupancy.currentDays || 1} {t('inpatients.days', 'hari')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <Link
                            to={`/inpatients/${occupancy.id}`}
                            title="Detail Okupansi"
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            to={`/inpatients/${occupancy.id}/edit`}
                            title="Edit Okupansi / Status"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition-all"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          {(occupancy.status === 'CHECKED_IN' || occupancy.status === 'ACTIVE') && (
                            <button
                              onClick={() => openCheckoutModal(occupancy)}
                              title="Proses Check-out Pasien"
                              className="p-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white border border-orange-200 transition-all"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteInpatient(occupancy)}
                            title={t('common.delete', 'Hapus Data Rawat Inap')}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-100">
              {inpatients.map((occupancy) => (
                <div key={occupancy.id} className="p-4 space-y-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{occupancy.patient?.name || '-'}</h3>
                      <p className="text-xs text-gray-500 font-mono">RM: {occupancy.patient?.medicalRecordNo || '-'}</p>
                    </div>
                    <div>
                      {renderStatusDropdown(occupancy.status, occupancy.id)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg">
                    <div>
                      <span className="text-gray-500">Kamar: </span>
                      <span className="font-bold text-indigo-900">No. {occupancy.room?.roomNumber} {occupancy.bedNumber ? `(Bed ${occupancy.bedNumber})` : ''}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Lama: </span>
                      <span className="font-bold text-gray-900">{occupancy.currentDays || 1} hari</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Dokter: </span>
                      <span className="font-medium text-gray-800">{occupancy.doctor?.name}</span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-1 border-t border-gray-100">
                    <Link
                      to={`/inpatients/${occupancy.id}`}
                      className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detail</span>
                    </Link>
                    <Link
                      to={`/inpatients/${occupancy.id}/edit`}
                      className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Link>
                    {(occupancy.status === 'CHECKED_IN' || occupancy.status === 'ACTIVE') && (
                      <button
                        onClick={() => openCheckoutModal(occupancy)}
                        className="px-3 py-1 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Check-out</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteInpatient(occupancy)}
                      className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </>
        )}
      </div>

      {/* Check Out Modal */}
      <CheckOutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        occupancy={selectedOccupancy}
        onSuccess={() => fetchInpatients(currentPage)}
      />
    </div>
  )
}

export default Inpatients
