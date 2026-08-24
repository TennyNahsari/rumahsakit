import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { polyclinicService } from '../services'
import { 
  Building2, Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, 
  Sparkles, HeartPulse, Users, Heart, Activity, Stethoscope, Brain, 
  Pill, ShieldCheck, Car, Eye, X, Check
} from 'lucide-react'
import toast from 'react-hot-toast'

const AVAILABLE_ICONS = [
  { name: 'Stethoscope', label: 'Stetoskop', comp: Stethoscope },
  { name: 'HeartPulse', label: 'Denyut Jantung', comp: HeartPulse },
  { name: 'Users', label: 'Anak / Keluarga', comp: Users },
  { name: 'Heart', label: 'Kandungan / Obgyn', comp: Heart },
  { name: 'Activity', label: 'Aktivitas Medis', comp: Activity },
  { name: 'Brain', label: 'Saraf / Otak', comp: Brain },
  { name: 'Pill', label: 'Obat / Farmasi', comp: Pill },
  { name: 'Building2', label: 'Gedung / RS', comp: Building2 },
  { name: 'Car', label: 'Darurat / Ambulans', comp: Car },
]

const AVAILABLE_COLORS = [
  { label: 'Biru (Penyakit Dalam)', value: 'bg-blue-50 text-[#0052CC] border-blue-200' },
  { label: 'Hijau (Anak & Tumbuh Kembang)', value: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { label: 'Merah Muda (Kebidanan / Obgyn)', value: 'bg-pink-50 text-pink-600 border-pink-200' },
  { label: 'Merah (Jantung & Pembuluh Darah)', value: 'bg-red-50 text-red-600 border-red-200' },
  { label: 'Nila (Bedah & Ortopedi)', value: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  { label: 'Ungu (Saraf & Neurologi)', value: 'bg-purple-50 text-purple-600 border-purple-200' },
  { label: 'Teal (Farmasi & Lab)', value: 'bg-teal-50 text-teal-600 border-teal-200' },
  { label: 'Amber (IGD / Darurat)', value: 'bg-amber-50 text-amber-600 border-amber-200' },
]

const Polyclinics = () => {
  const { t, i18n } = useTranslation()
  const [polyclinics, setPolyclinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Delete Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    englishName: '',
    code: '',
    description: '',
    englishDescription: '',
    servicesInput: '',
    icon: 'Stethoscope',
    color: 'bg-blue-50 text-[#0052CC] border-blue-200',
    isActive: true,
    sortOrder: 1,
  })

  useEffect(() => {
    fetchPolyclinics()
  }, [search, statusFilter])

  const fetchPolyclinics = async () => {
    try {
      setLoading(true)
      const res = await polyclinicService.getPolyclinics({ search, status: statusFilter })
      const list = res.data?.polyclinics || res.polyclinics || []
      setPolyclinics(list)
    } catch (error) {
      console.error('Fetch polyclinics error:', error)
      toast.error('Gagal mengambil data poliklinik')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setIsEdit(false)
    setSelectedId(null)
    setFormData({
      name: '',
      englishName: '',
      code: '',
      description: '',
      englishDescription: '',
      servicesInput: '',
      icon: 'Stethoscope',
      color: 'bg-blue-50 text-[#0052CC] border-blue-200',
      isActive: true,
      sortOrder: polyclinics.length + 1,
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (poly) => {
    setIsEdit(true)
    setSelectedId(poly.id)
    const servicesText = Array.isArray(poly.services) ? poly.services.join('\n') : ''
    setFormData({
      name: poly.name || '',
      englishName: poly.englishName || '',
      code: poly.code || '',
      description: poly.description || '',
      englishDescription: poly.englishDescription || '',
      servicesInput: servicesText,
      icon: poly.icon || 'Stethoscope',
      color: poly.color || 'bg-blue-50 text-[#0052CC] border-blue-200',
      isActive: poly.isActive !== false,
      sortOrder: poly.sortOrder || 1,
    })
    setIsModalOpen(true)
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Nama poliklinik wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      const servicesArray = formData.servicesInput
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)

      const payload = {
        name: formData.name,
        englishName: formData.englishName,
        code: formData.code,
        description: formData.description,
        englishDescription: formData.englishDescription,
        services: servicesArray,
        icon: formData.icon,
        color: formData.color,
        isActive: formData.isActive,
        sortOrder: parseInt(formData.sortOrder) || 1,
      }

      if (isEdit) {
        await polyclinicService.updatePolyclinic(selectedId, payload)
        toast.success('Poliklinik berhasil diperbarui')
      } else {
        await polyclinicService.createPolyclinic(payload)
        toast.success('Poliklinik baru berhasil ditambahkan')
      }

      setIsModalOpen(false)
      fetchPolyclinics()
    } catch (error) {
      console.error('Submit polyclinic error:', error)
      toast.error(error.response?.data?.error || 'Gagal menyimpan data poliklinik')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (poly) => {
    setDeleteTarget(poly)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await polyclinicService.deletePolyclinic(deleteTarget.id)
      toast.success(`Poliklinik "${deleteTarget.name}" berhasil dihapus`)
      setIsDeleteModalOpen(false)
      setDeleteTarget(null)
      fetchPolyclinics()
    } catch (error) {
      console.error('Delete polyclinic error:', error)
      toast.error('Gagal menghapus poliklinik')
    }
  }

  const renderIconComp = (iconName, className = 'w-5 h-5') => {
    const item = AVAILABLE_ICONS.find((i) => i.name === iconName)
    const IconComponent = item ? item.comp : Stethoscope
    return <IconComponent className={className} />
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#D9DADC] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 text-[#0052CC] rounded-2xl flex items-center justify-center border border-blue-200 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A1C1E] tracking-tight">
              {t('polyclinics.title', 'Modul Kelola Poliklinik')}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('polyclinics.subtitle', 'Tambah, ubah, dan hapus poliklinik yang ditampilkan secara otomatis pada Landing Page & Modal Pendaftaran')}
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-[#0052CC] text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 w-full md:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('polyclinics.addNew', 'Tambah Poliklinik Baru')}</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#D9DADC] shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder={t('polyclinics.searchPlaceholder', 'Cari Poliklinik...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto text-xs py-2.5 px-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none bg-white font-medium"
          >
            <option value="">{t('polyclinics.allStatus', 'Semua Status')}</option>
            <option value="active">{t('polyclinics.activeStatus', 'Aktif (Tampil di Web)')}</option>
            <option value="inactive">{t('polyclinics.inactiveStatus', 'Non-Aktif')}</option>
          </select>
        </div>
      </div>

      {/* Grid of Polyclinic Cards */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#0052CC] border-t-transparent"></div>
          <p className="text-xs text-gray-500 mt-3 font-semibold">{t('polyclinics.loading', 'Memuat Data Poliklinik...')}</p>
        </div>
      ) : polyclinics.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-base font-bold text-gray-700">{t('polyclinics.noDataTitle', 'Belum Ada Poliklinik')}</p>
          <p className="text-xs text-gray-500 mt-1">{t('polyclinics.noDataSub', 'Klik tombol di atas untuk menambahkan poliklinik pertama anda.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polyclinics.map((poly) => {
            const isEn = i18n.language === 'en'
            const servicesList = Array.isArray(poly.services) ? poly.services : []
            const cardTitle = isEn ? (poly.englishName || poly.name) : poly.name
            const cardSub = isEn ? poly.name : (poly.englishName || 'Polyclinic Service')
            const cardDesc = isEn ? (poly.englishDescription || poly.description) : poly.description

            return (
              <div
                key={poly.id}
                className="bg-white rounded-2xl p-6 border border-[#D9DADC] hover:border-[#0052CC] transition-all shadow-sm hover:shadow-lg flex flex-col justify-between group"
              >
                <div>
                  {/* Top Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${poly.color || 'bg-blue-50 text-[#0052CC] border-blue-200'}`}>
                      {renderIconComp(poly.icon, 'w-6 h-6')}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 uppercase border border-gray-200">
                        {poly.code || 'POLI'}
                      </span>
                      {poly.isActive ? (
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> {t('polyclinics.activeBadge', 'Aktif')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">
                          <XCircle className="w-3 h-3 mr-1" /> {t('polyclinics.inactiveBadge', 'Non-Aktif')}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    {cardSub}
                  </span>
                  <h3 className="text-lg font-extrabold text-[#1A1C1E] mt-0.5 group-hover:text-[#0052CC] transition-colors">
                    {cardTitle}
                  </h3>

                  <p className="text-xs text-gray-600 mt-2.5 leading-relaxed line-clamp-3">
                    {cardDesc || 'Tidak ada deskripsi.'}
                  </p>

                  {/* Bullet Services List */}
                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      {t('polyclinics.servicesHeader', 'Layanan & Keunggulan:')}
                    </p>
                    <ul className="space-y-1.5">
                      {servicesList.length > 0 ? (
                        servicesList.map((srv, sIdx) => (
                          <li key={sIdx} className="text-[11px] text-gray-700 flex items-center space-x-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                            <span>{srv}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-[11px] text-gray-400 italic">
                          {t('polyclinics.noServices', 'Belum ada rincian layanan')}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-gray-400">
                    {t('polyclinics.sortOrder', 'Urutan')}: #{poly.sortOrder || 1}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(poly)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                      title="Edit Poliklinik"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(poly)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                      title="Hapus Poliklinik"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Add/Edit Polyclinic */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#D9DADC] max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 text-[#0052CC] rounded-xl flex items-center justify-center border border-blue-200 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1A1C1E]">
                  {isEdit ? t('polyclinics.editModalTitle', 'Ubah Data Poliklinik') : t('polyclinics.addModalTitle', 'Tambah Poliklinik Baru')}
                </h3>
                <p className="text-xs text-gray-500">
                  {isEdit ? t('polyclinics.editModalSub', 'Perbarui rincian poliklinik dan layanan') : t('polyclinics.addModalSub', 'Masukkan informasi poliklinik yang akan ditampilkan di landing page')}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t('polyclinics.nameLabel', 'Nama Poliklinik (Bahasa Indonesia) *')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Poliklinik Penyakit Dalam"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t('polyclinics.englishNameLabel', 'Nama Poliklinik (English)')}
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Internal Medicine Clinic"
                    value={formData.englishName}
                    onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t('polyclinics.codeLabel', 'Kode Poliklinik')}
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: POLI-INT"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t('polyclinics.sortOrderLabel', 'Urutan Tampilan')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('polyclinics.descLabel', 'Deskripsi Ringkas (Bahasa Indonesia)')}
                </label>
                <textarea
                  rows="2"
                  placeholder="Penanganan penyakit metabolik, diabetes, hipertensi, pencernaan, dan gangguan ginjal..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('polyclinics.englishDescLabel', 'Deskripsi Ringkas (English)')}
                </label>
                <textarea
                  rows="2"
                  placeholder="Comprehensive treatment for metabolic, diabetes, hypertension..."
                  value={formData.englishDescription}
                  onChange={(e) => setFormData({ ...formData, englishDescription: e.target.value })}
                  className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('polyclinics.servicesLabel', 'Layanan & Keunggulan (Pisahkan per baris / enter)')}
                </label>
                <textarea
                  rows="3"
                  placeholder={'Konsultasi Diabetes & Endokrin\nEndoskopi Saluran Cerna\nSkrining Kardiometabolik'}
                  value={formData.servicesInput}
                  onChange={(e) => setFormData({ ...formData, servicesInput: e.target.value })}
                  className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none font-mono"
                ></textarea>
                <p className="text-[10px] text-gray-400 mt-1">
                  {t('polyclinics.servicesHelp', 'Gunakan enter untuk memisahkan setiap item poin layanan.')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t('polyclinics.iconLabel', 'Pilihan Ikon Visual')}
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none bg-white font-medium"
                  >
                    {AVAILABLE_ICONS.map((ic) => (
                      <option key={ic.name} value={ic.name}>
                        {ic.label} ({ic.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t('polyclinics.colorLabel', 'Tema Warna Badge')}
                  </label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none bg-white font-medium"
                  >
                    {AVAILABLE_COLORS.map((col, idx) => (
                      <option key={idx} value={col.value}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#0052CC] rounded focus:ring-[#0052CC]"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-bold text-gray-700 cursor-pointer">
                  {t('polyclinics.activeCheckbox', 'Aktifkan Poliklinik ini (Tampilkan di Landing Page & Modal Book)')}
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  {t('common.cancel', 'Batal')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-lg bg-[#0052CC] text-white text-xs font-bold hover:bg-blue-700 transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {submitting
                      ? t('common.saving', 'Menyimpan...')
                      : isEdit
                      ? t('common.saveChanges', 'Simpan Perubahan')
                      : t('polyclinics.submitAdd', 'Tambah Poliklinik')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {t('polyclinics.deleteTitle', 'Hapus Poliklinik?')}
            </h3>
            <p className="text-xs text-gray-500 mt-2">
              {t('polyclinics.deleteConfirmMsg', 'Apakah anda yakin ingin menghapus poliklinik')} <span className="font-bold text-gray-800">"{deleteTarget?.name}"</span>?
            </p>

            <div className="mt-6 flex items-center justify-center space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 border border-gray-200"
              >
                {t('common.cancel', 'Batal')}
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-all"
              >
                {t('polyclinics.yesDelete', 'Ya, Hapus')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Polyclinics
