import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { visitService, patientService, userService } from '../services'
import { ArrowLeft, Save, Search, Check, User, Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'

const VisitForm = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  
  // Autocomplete states for Patient
  const [patientSearch, setPatientSearch] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Autocomplete states for Doctor
  const [doctorSearch, setDoctorSearch] = useState('')
  const [isDoctorOpen, setIsDoctorOpen] = useState(false)
  const doctorRef = useRef(null)

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    visitType: 'GENERAL_CHECKUP',
    visitDate: new Date().toISOString().split('T')[0],
    visitTime: '',
    status: 'SCHEDULED',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
      if (doctorRef.current && !doctorRef.current.contains(event.target)) {
        setIsDoctorOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [patientsResponse, usersResponse] = await Promise.all([
        patientService.getPatients(),
        userService.getUsers()
      ])

      setPatients(patientsResponse.data.patients || [])
      
      const usersList = usersResponse?.data?.users || usersResponse?.data || []
      const doctorsList = usersList.filter(user => user.role === 'DOCTOR')
      setDoctors(doctorsList)
    } catch (error) {
      console.error('Fetch data error:', error)
      toast.error(t('visitForm.loadFailed', 'Gagal memuat data pasien/dokter'))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const filteredPatients = patients.filter(patient => {
    const query = patientSearch.toLowerCase()
    return (
      patient.name.toLowerCase().includes(query) ||
      (patient.medicalRecordNo && patient.medicalRecordNo.toLowerCase().includes(query))
    )
  })

  const filteredDoctors = doctors.filter(doctor => {
    const query = doctorSearch.toLowerCase()
    return (
      doctor.name.toLowerCase().includes(query) ||
      (doctor.department && doctor.department.toLowerCase().includes(query))
    )
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.patientId) {
      toast.error('Silakan pilih pasien dari pencarian terlebih dahulu')
      return
    }
    if (!formData.doctorId) {
      toast.error('Silakan pilih dokter DPJP dari pencarian terlebih dahulu')
      return
    }
    if (!formData.visitDate) {
      toast.error('Tanggal kunjungan tidak boleh kosong')
      return
    }

    try {
      setSubmitting(true)
      const scheduledAt = formData.visitTime 
        ? `${formData.visitDate}T${formData.visitTime}` 
        : formData.visitDate

      const payload = {
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        visitType: formData.visitType,
        scheduledAt,
        status: formData.status,
        notes: formData.notes
      }

      await visitService.createVisit(payload)
      toast.success(t('visitForm.createSuccess', 'Kunjungan berhasil dibuat'))
      navigate('/visits')
    } catch (error) {
      toast.error(error.response?.data?.error || t('visitForm.createFailed', 'Gagal membuat kunjungan'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0052CC]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/visits')}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('visitForm.back', 'Kembali')}
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('visitForm.title', 'Tambah Kunjungan / Antrean')}</h1>
          <p className="text-gray-600">{t('visitForm.subtitle', 'Daftarkan antrean kunjungan pasien baru')}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Informasi Kunjungan</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Search Autocomplete */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Pasien <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik Nama Pasien / No. Rekam Medis..."
                  value={patientSearch}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setPatientSearch(e.target.value)
                    setIsDropdownOpen(true)
                    if (!e.target.value) {
                      setFormData(prev => ({ ...prev, patientId: '' }))
                    }
                  }}
                  className={`w-full text-xs p-3 pl-10 pr-10 rounded-lg border ${
                    formData.patientId ? 'border-emerald-500 bg-emerald-50/20 font-bold text-emerald-900' : 'border-gray-300 focus:border-[#0052CC]'
                  } outline-none transition-all`}
                  required
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />

                {formData.patientId && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, patientId: '' }))
                      setPatientSearch('')
                      setIsDropdownOpen(true)
                    }}
                    className="absolute right-3 top-3 text-xs text-gray-400 hover:text-red-500 font-bold p-1"
                    title="Reset Pilihan Pasien"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Hidden input to enforce native required validation */}
              <input
                type="text"
                value={formData.patientId}
                onChange={() => {}}
                required
                tabIndex={-1}
                className="opacity-0 absolute bottom-0 left-0 w-full h-0 pointer-events-none"
              />

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100 animate-in fade-in duration-150">
                  {filteredPatients.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      Tidak ada pasien ditemukan untuk &quot;<span className="font-bold">{patientSearch}</span>&quot;
                    </div>
                  ) : (
                    filteredPatients.map(patient => {
                      const isSelected = String(formData.patientId) === String(patient.id)
                      return (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, patientId: patient.id }))
                            setPatientSearch(`${patient.name} (${patient.medicalRecordNo})`)
                            setIsDropdownOpen(false)
                          }}
                          className={`w-full text-left p-3 text-xs hover:bg-blue-50 transition-colors flex items-center justify-between ${
                            isSelected ? 'bg-blue-50/80 font-bold text-[#0052CC]' : 'text-gray-800'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-gray-900 text-xs flex items-center space-x-2">
                              <span>{patient.name}</span>
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 font-mono text-[10px] rounded border border-gray-200">
                                RM: {patient.medicalRecordNo}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {patient.gender === 'MALE' ? '👨 Laki-laki' : '👩 Perempuan'} • Lahir: {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('id-ID') : '-'}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#0052CC]" />}
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            {/* Doctor Search Autocomplete */}
            <div className="relative" ref={doctorRef}>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Dokter DPJP <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik Nama Dokter DPJP / Spesialisasi..."
                  value={doctorSearch}
                  onFocus={() => setIsDoctorOpen(true)}
                  onChange={(e) => {
                    setDoctorSearch(e.target.value)
                    setIsDoctorOpen(true)
                    if (!e.target.value) {
                      setFormData(prev => ({ ...prev, doctorId: '' }))
                    }
                  }}
                  className={`w-full text-xs p-3 pl-10 pr-10 rounded-lg border ${
                    formData.doctorId ? 'border-emerald-500 bg-emerald-50/20 font-bold text-emerald-900' : 'border-gray-300 focus:border-[#0052CC]'
                  } outline-none transition-all`}
                  required
                />
                <Stethoscope className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />

                {formData.doctorId && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, doctorId: '' }))
                      setDoctorSearch('')
                      setIsDoctorOpen(true)
                    }}
                    className="absolute right-3 top-3 text-xs text-gray-400 hover:text-red-500 font-bold p-1"
                    title="Reset Pilihan Dokter"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Hidden input to enforce native required validation */}
              <input
                type="text"
                value={formData.doctorId}
                onChange={() => {}}
                required
                tabIndex={-1}
                className="opacity-0 absolute bottom-0 left-0 w-full h-0 pointer-events-none"
              />

              {/* Dropdown Menu */}
              {isDoctorOpen && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100 animate-in fade-in duration-150">
                  {filteredDoctors.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      Tidak ada dokter ditemukan untuk &quot;<span className="font-bold">{doctorSearch}</span>&quot;
                    </div>
                  ) : (
                    filteredDoctors.map(doctor => {
                      const isSelected = String(formData.doctorId) === String(doctor.id)
                      return (
                        <button
                          key={doctor.id}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, doctorId: doctor.id }))
                            setDoctorSearch(`${doctor.name} - ${doctor.department || 'Spesialis'}`)
                            setIsDoctorOpen(false)
                          }}
                          className={`w-full text-left p-3 text-xs hover:bg-blue-50 transition-colors flex items-center justify-between ${
                            isSelected ? 'bg-blue-50/80 font-bold text-[#0052CC]' : 'text-gray-800'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-gray-900 text-xs">
                              {doctor.name}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              🩺 Spesialisasi: {doctor.department || 'Poliklinik Spesialis'}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#0052CC]" />}
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            {/* Visit Type */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Tipe Kunjungan <span className="text-red-500">*</span>
              </label>
              <select
                name="visitType"
                value={formData.visitType}
                onChange={handleChange}
                className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none bg-white"
                required
              >
                <option value="GENERAL_CHECKUP">Pemeriksaan Umum</option>
                <option value="OUTPATIENT">Rawat Jalan (Poliklinik)</option>
                <option value="INPATIENT">Rawat Inap</option>
                <option value="EMERGENCY">IGD (Gawat Darurat)</option>
                <option value="MEDICAL_ACTION">Tindakan Medis</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Status Antrean <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none bg-white"
                required
              >
                <option value="SCHEDULED">Menunggu (Scheduled)</option>
                <option value="IN_PROGRESS">Sedang Diperiksa</option>
                <option value="COMPLETED">Selesai</option>
                <option value="CANCELLED">Batal</option>
              </select>
            </div>

            {/* Tanggal Kunjungan (Wajib) & Jam Kunjungan (Opsional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Tanggal Kunjungan <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="visitDate"
                  value={formData.visitDate}
                  onChange={handleChange}
                  className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none bg-white"
                  required
                />
                <p className="text-[10px] text-gray-500 mt-1">Wajib diisi (tidak boleh kosong).</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Jam Kunjungan <span className="text-gray-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="time"
                  name="visitTime"
                  value={formData.visitTime}
                  onChange={handleChange}
                  className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none bg-white"
                />
                <p className="text-[10px] text-gray-500 mt-1">Bisa dikosongkan jika tidak ada jam spesifik.</p>
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Catatan / Keluhan Pasien
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none"
                placeholder="Keluhan singkat atau catatan pendaftaran..."
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/visits')}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-50"
          >
            {t('common.cancel', 'Batal')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg bg-[#0052CC] text-white text-xs font-bold hover:bg-blue-700 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {submitting ? (
              <span>Menyimpan...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Kunjungan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default VisitForm
