import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { recordService } from '../services'
import { ArrowLeft, User, Stethoscope, FileText, Edit, Calendar, Clock, Activity, Pill, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

const RecordDetail = () => {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecordDetail()
  }, [id])

  const fetchRecordDetail = async () => {
    try {
      setLoading(true)
      const response = await recordService.getRecord(id)
      setRecord(response.data?.record || response.data)
    } catch (error) {
      console.error('Fetch record error:', error)
      toast.error(t('records.detail.fetchFailed', 'Gagal memuat rekam medis'))
      navigate('/records')
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '-'
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    const locale = i18n.language === 'id' ? 'id-ID' : 'en-US'
    return new Date(dateString).toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0052CC]"></div>
      </div>
    )
  }

  if (!record) {
    return <div className="text-center py-12 text-gray-500">Rekam medis tidak ditemukan.</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/records')}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('records.form.back', 'Kembali')}
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detail Rekam Medis Pasien</h1>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-xs font-mono font-bold text-[#0052CC] px-2.5 py-0.5 bg-blue-50 border border-blue-200 rounded">
                ID Rekam Medis: #{record.id}
              </span>
              {record.diagnosisCode && (
                <span className="text-xs font-bold text-emerald-700 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-emerald-600" />
                  <span>ICD-10: {record.diagnosisCode}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate(`/records/${id}/edit`)}
          className="inline-flex items-center px-5 py-2.5 bg-[#0052CC] text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
        >
          <Edit className="w-4 h-4 mr-2" />
          <span>Edit Rekam Medis</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Clinical Examination Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
              <Activity className="w-5 h-5 text-[#0052CC]" />
              <h2 className="text-lg font-bold text-gray-900">Hasil Pemeriksaan Klinis</h2>
            </div>

            {/* Anamnesis / Symptoms */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Keluhan Utama / Anamnesis
              </label>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-800 leading-relaxed font-medium">
                {record.symptoms || <span className="text-gray-400 italic">Tidak ada catatan keluhan.</span>}
              </div>
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Diagnosis Dokter
              </label>
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-950 leading-relaxed font-medium">
                {record.diagnosisCode && (
                  <span className="inline-block mb-2 px-2 py-0.5 bg-blue-100 text-[#0052CC] font-bold text-[11px] rounded">
                    ICD-10: {record.diagnosisCode}
                  </span>
                )}
                <p>{record.diagnosis || <span className="text-gray-400 italic">Tidak ada catatan diagnosis.</span>}</p>
              </div>
            </div>

            {/* Treatment */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Penatalaksanaan & Pengobatan
              </label>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-800 leading-relaxed font-medium">
                {record.treatment || <span className="text-gray-400 italic">Tidak ada catatan penatalaksanaan.</span>}
              </div>
            </div>

            {/* Prescription */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Pill className="w-4 h-4 text-emerald-600" />
                <span>Resep Obat & Dosis (Farmasi)</span>
              </label>
              <div className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-100 text-xs text-gray-900 leading-relaxed font-mono whitespace-pre-wrap">
                {typeof record.prescription === 'object' && record.prescription !== null ? (
                  JSON.stringify(record.prescription, null, 2)
                ) : (
                  record.prescription || <span className="text-gray-400 italic font-sans">Tidak ada resep obat.</span>
                )}
              </div>
            </div>
          </div>

          {/* Patient Details Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
              <User className="w-5 h-5 text-[#0052CC]" />
              <h2 className="text-lg font-bold text-gray-900">Informasi Pasien</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-gray-500 font-bold block mb-1">Nama Pasien</label>
                <p className="font-bold text-gray-900 text-sm">{record.patient?.name || '-'}</p>
              </div>
              <div>
                <label className="text-gray-500 font-bold block mb-1">No. Rekam Medis (RM)</label>
                <p className="font-bold text-[#0052CC] font-mono">{record.patient?.medicalRecordNo || '-'}</p>
              </div>
              <div>
                <label className="text-gray-500 font-bold block mb-1">Jenis Kelamin / Usia</label>
                <p className="font-semibold text-gray-800">
                  {record.patient?.gender === 'MALE' ? '👨 Laki-laki' : '👩 Perempuan'} • {calculateAge(record.patient?.dateOfBirth)} Tahun
                </p>
              </div>
              <div>
                <label className="text-gray-500 font-bold block mb-1">No. Telepon / HP</label>
                <p className="font-semibold text-gray-800">{record.patient?.phone || '-'}</p>
              </div>
              <div className="col-span-2">
                <label className="text-gray-500 font-bold block mb-1">Alamat</label>
                <p className="font-medium text-gray-800">{record.patient?.address || '-'}</p>
              </div>
            </div>

            {record.patient && (
              <div className="pt-2">
                <Link
                  to={`/patients/${record.patient.id}`}
                  className="inline-flex items-center text-xs font-bold text-[#0052CC] hover:underline"
                >
                  Lihat Profil Pasien Selengkapnya →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Doctor DPJP Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
              <Stethoscope className="w-5 h-5 text-[#0052CC]" />
              <h2 className="text-base font-bold text-gray-900">Dokter Pemeriksa (DPJP)</h2>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-500 font-bold block mb-1">Nama Dokter</label>
                <p className="font-bold text-gray-900 text-sm">{record.doctor?.name || '-'}</p>
              </div>
              <div>
                <label className="text-gray-500 font-bold block mb-1">Spesialisasi / Departemen</label>
                <p className="font-semibold text-gray-800">{record.doctor?.department || 'Poliklinik Spesialis'}</p>
              </div>
              {record.doctor?.phone && (
                <div>
                  <label className="text-gray-500 font-bold block mb-1">No. Kontak Dokter</label>
                  <p className="font-semibold text-gray-800">{record.doctor.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Visit Information Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
              <Calendar className="w-5 h-5 text-[#0052CC]" />
              <h2 className="text-base font-bold text-gray-900">Informasi Kunjungan</h2>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-500 font-bold block mb-1">Tipe Kunjungan</label>
                <span className="inline-block px-2.5 py-1 bg-blue-50 text-[#0052CC] font-bold rounded border border-blue-200">
                  {record.visit?.visitType || 'Pemeriksaan Klinik'}
                </span>
              </div>
              <div>
                <label className="text-gray-500 font-bold block mb-1">Tanggal Kunjungan</label>
                <p className="font-semibold text-gray-900">
                  {record.visit?.scheduledAt ? formatDateTime(record.visit.scheduledAt) : formatDateTime(record.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata Timeline Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
              Waktu Pencatatan System
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-start space-x-2.5">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500 font-medium">Waktu Dibuat:</p>
                  <p className="font-bold text-gray-800">{formatDateTime(record.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500 font-medium">Terakhir Diperbarui:</p>
                  <p className="font-bold text-gray-800">{formatDateTime(record.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default RecordDetail
