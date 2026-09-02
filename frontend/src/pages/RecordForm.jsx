import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { recordService, patientService, visitService, userService } from '../services'
import { ArrowLeft, Save, Search, Check, Calendar, Stethoscope, User } from 'lucide-react'
import toast from 'react-hot-toast'

const RecordForm = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [patients, setPatients] = useState([])
  const [visits, setVisits] = useState([])
  const [doctors, setDoctors] = useState([])

  // Autocomplete states for Patient
  const [patientSearch, setPatientSearch] = useState('')
  const [isPatientOpen, setIsPatientOpen] = useState(false)
  const patientRef = useRef(null)

  // Autocomplete states for Visit
  const [visitSearch, setVisitSearch] = useState('')
  const [isVisitOpen, setIsVisitOpen] = useState(false)
  const visitRef = useRef(null)

  // Autocomplete states for Doctor
  const [doctorSearch, setDoctorSearch] = useState('')
  const [isDoctorOpen, setIsDoctorOpen] = useState(false)
  const doctorRef = useRef(null)

  const [formData, setFormData] = useState({
    visitId: '',
    patientId: '',
    doctorId: '',
    diagnosisCode: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    prescription: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (patientRef.current && !patientRef.current.contains(e.target)) setIsPatientOpen(false)
      if (visitRef.current && !visitRef.current.contains(e.target)) setIsVisitOpen(false)
      if (doctorRef.current && !doctorRef.current.contains(e.target)) setIsDoctorOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [patientsResponse, visitsResponse, usersResponse] = await Promise.all([
        patientService.getPatients(),
        visitService.getVisits({ limit: 1000 }),
        userService.getUsers()
      ])

      setPatients(patientsResponse.data.patients || [])
      setVisits(visitsResponse.data.visits || [])
      
      const usersList = usersResponse?.data?.users || usersResponse?.data || []
      const doctorsList = usersList.filter(user => user.role === 'DOCTOR')
      setDoctors(doctorsList)
    } catch (error) {
      console.error('Fetch data error:', error)
      toast.error(t('records.form.loadFailed'))
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

  // Filter eligible visits:
  // 1. Visit status must be COMPLETED (pemeriksaan sudah selesai)
  // 2. Billing status must NOT be PAID (belum lunas)
  const eligibleVisits = visits.filter(v => {
    if (v.status !== 'COMPLETED') return false

    if (v.billings && v.billings.length > 0) {
      const isPaid = v.billings.some(b => b.status === 'PAID')
      if (isPaid) return false
    }

    return true
  })

  // Set of patient IDs that have at least 1 eligible completed visit
  const eligiblePatientIds = new Set(eligibleVisits.map(v => v.patientId))

  // Filter patients list so only patients with eligible completed visits are selectable
  const eligiblePatients = patients.filter(p => eligiblePatientIds.has(p.id))

  // Filtered lists for Autocomplete
  const filteredPatients = eligiblePatients.filter(p => {
    const query = patientSearch.toLowerCase().trim()
    if (!query) return true
    return p.name.toLowerCase().includes(query) || (p.medicalRecordNo && p.medicalRecordNo.toLowerCase().includes(query))
  })

  const availableVisits = formData.patientId 
    ? eligibleVisits.filter(v => v.patientId === formData.patientId)
    : eligibleVisits

  const filteredVisits = availableVisits.filter(v => {
    const query = visitSearch.toLowerCase().trim()
    if (!query) return true
    const qNo = (v.queueNumberFormatted || v.queueNumber || '').toLowerCase()
    const pName = (v.patient?.name || '').toLowerCase()
    const typeStr = (v.visitType || '').toLowerCase()
    return qNo.includes(query) || pName.includes(query) || typeStr.includes(query) || String(v.id).includes(query)
  })

  const filteredDoctors = doctors.filter(d => {
    const query = doctorSearch.toLowerCase().trim()
    if (!query) return true
    return d.name.toLowerCase().includes(query) || (d.department && d.department.toLowerCase().includes(query))
  })

  const selectPatient = (patient) => {
    setFormData(prev => ({
      ...prev,
      patientId: patient.id,
      visitId: '' // Reset visit when patient changes
    }))
    setPatientSearch(`${patient.name} (${patient.medicalRecordNo})`)
    setVisitSearch('')
    setIsPatientOpen(false)
  }

  const selectVisit = (visit) => {
    const selectedPatient = patients.find(p => p.id === visit.patientId)
    const selectedDoctor = doctors.find(d => d.id === visit.doctorId)

    setFormData(prev => ({
      ...prev,
      visitId: visit.id,
      patientId: visit.patientId,
      doctorId: visit.doctorId || prev.doctorId
    }))

    if (selectedPatient) {
      setPatientSearch(`${selectedPatient.name} (${selectedPatient.medicalRecordNo})`)
    }
    if (selectedDoctor) {
      setDoctorSearch(`${selectedDoctor.name} - ${selectedDoctor.department || 'Spesialis'}`)
    }

    const dateStr = new Date(visit.scheduledAt).toLocaleDateString('id-ID')
    const qNo = visit.queueNumberFormatted || visit.queueNumber || `Antrean #${visit.id}`
    setVisitSearch(`${qNo} • ${dateStr} (${visit.visitType})`)
    setIsVisitOpen(false)
  }

  const selectDoctor = (doctor) => {
    setFormData(prev => ({
      ...prev,
      doctorId: doctor.id
    }))
    setDoctorSearch(`${doctor.name} - ${doctor.department || 'Spesialis'}`)
    setIsDoctorOpen(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.patientId) {
      toast.error('Silakan pilih Pasien dari pencarian terlebih dahulu')
      return
    }
    if (!formData.visitId) {
      toast.error('Silakan pilih Kunjungan dari pencarian terlebih dahulu')
      return
    }
    if (!formData.doctorId) {
      toast.error('Silakan pilih Dokter DPJP dari pencarian terlebih dahulu')
      return
    }

    try {
      setSubmitting(true)
      
      const submitData = {
        visitId: parseInt(formData.visitId),
        patientId: parseInt(formData.patientId),
        doctorId: parseInt(formData.doctorId),
        diagnosisCode: formData.diagnosisCode || null,
        symptoms: formData.symptoms || null,
        diagnosis: formData.diagnosis || null,
        treatment: formData.treatment || null,
        prescription: formData.prescription ? JSON.parse(formData.prescription) : null
      }

      await recordService.createRecord(submitData)
      toast.success(t('records.form.createSuccess'))
      navigate('/records')
    } catch (error) {
      toast.error(error.response?.data?.error || t('records.form.createFailed'))
      console.error('Create record error:', error)
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
          onClick={() => navigate('/records')}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('records.form.back')}
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('records.form.title')}</h1>
          <p className="text-gray-600">{t('records.form.subtitle')}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">{t('records.form.visitInfo')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Patient Autocomplete */}
            <div className="relative" ref={patientRef}>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {t('records.form.patient')} <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik Nama Pasien / No. RM..."
                  value={patientSearch}
                  onFocus={() => setIsPatientOpen(true)}
                  onChange={(e) => {
                    setPatientSearch(e.target.value)
                    setIsPatientOpen(true)
                    if (!e.target.value) setFormData(prev => ({ ...prev, patientId: '', visitId: '' }))
                  }}
                  className={`w-full text-xs p-3 pl-10 pr-10 rounded-lg border ${
                    formData.patientId ? 'border-emerald-500 bg-emerald-50/20 font-bold text-emerald-900' : 'border-gray-300 focus:border-[#0052CC]'
                  } outline-none transition-all`}
                  required
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />

                {formData.patientId && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, patientId: '', visitId: '' }))
                      setPatientSearch('')
                      setVisitSearch('')
                      setIsPatientOpen(true)
                    }}
                    className="absolute right-3 top-3 text-xs text-gray-400 hover:text-red-500 font-bold p-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Patient Dropdown */}
              {isPatientOpen && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100 animate-in fade-in duration-150">
                  {filteredPatients.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      Tidak ada pasien dengan kunjungan selesai (COMPLETED) yang belum lunas
                    </div>
                  ) : (
                    filteredPatients.map(patient => {
                      const isSelected = String(formData.patientId) === String(patient.id)
                      return (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => selectPatient(patient)}
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
                              {patient.gender === 'MALE' ? '👨 Laki-laki' : '👩 Perempuan'}
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

            {/* 2. Visit Autocomplete */}
            <div className="relative" ref={visitRef}>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {t('records.form.visit')} <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik No. Antrean / Tanggal / Tipe Kunjungan..."
                  value={visitSearch}
                  onFocus={() => setIsVisitOpen(true)}
                  onChange={(e) => {
                    setVisitSearch(e.target.value)
                    setIsVisitOpen(true)
                    if (!e.target.value) setFormData(prev => ({ ...prev, visitId: '' }))
                  }}
                  className={`w-full text-xs p-3 pl-10 pr-10 rounded-lg border ${
                    formData.visitId ? 'border-emerald-500 bg-emerald-50/20 font-bold text-emerald-900' : 'border-gray-300 focus:border-[#0052CC]'
                  } outline-none transition-all`}
                  required
                />
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />

                {formData.visitId && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, visitId: '' }))
                      setVisitSearch('')
                      setIsVisitOpen(true)
                    }}
                    className="absolute right-3 top-3 text-xs text-gray-400 hover:text-red-500 font-bold p-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              {!formData.patientId ? (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <span>ℹ️ Pilih pasien terlebih dahulu untuk menampilkan kunjungan selesai yang belum lunas.</span>
                </p>
              ) : (
                <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                  <span>✓ Hanya menampilkan kunjungan berstatus Selesai (COMPLETED) yang belum lunas.</span>
                </p>
              )}

              {/* Visit Dropdown */}
              {isVisitOpen && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100 animate-in fade-in duration-150">
                  {filteredVisits.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      Tidak ada kunjungan selesai (COMPLETED) yang belum lunas untuk pasien ini
                    </div>
                  ) : (
                    filteredVisits.map(visit => {
                      const isSelected = String(formData.visitId) === String(visit.id)
                      const qNo = visit.queueNumberFormatted || visit.queueNumber || `Antrean #${visit.id}`
                      const dateStr = new Date(visit.scheduledAt).toLocaleDateString('id-ID')
                      return (
                        <button
                          key={visit.id}
                          type="button"
                          onClick={() => selectVisit(visit)}
                          className={`w-full text-left p-3 text-xs hover:bg-blue-50 transition-colors flex items-center justify-between ${
                            isSelected ? 'bg-blue-50/80 font-bold text-[#0052CC]' : 'text-gray-800'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-gray-900 text-xs flex items-center space-x-2">
                              <span className="px-1.5 py-0.5 bg-blue-100 text-[#0052CC] font-bold rounded">
                                {qNo}
                              </span>
                              <span>{visit.patient?.name || 'Pasien'}</span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-1">
                              📅 {dateStr} • Tipe: <span className="font-semibold text-gray-700">{visit.visitType}</span>
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

            {/* 3. Doctor Autocomplete */}
            <div className="relative" ref={doctorRef}>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {t('records.form.doctor')} <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik Nama Dokter DPJP..."
                  value={doctorSearch}
                  onFocus={() => setIsDoctorOpen(true)}
                  onChange={(e) => {
                    setDoctorSearch(e.target.value)
                    setIsDoctorOpen(true)
                    if (!e.target.value) setFormData(prev => ({ ...prev, doctorId: '' }))
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
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Doctor Dropdown */}
              {isDoctorOpen && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100 animate-in fade-in duration-150">
                  {filteredDoctors.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      Tidak ada dokter ditemukan
                    </div>
                  ) : (
                    filteredDoctors.map(doctor => {
                      const isSelected = String(formData.doctorId) === String(doctor.id)
                      return (
                        <button
                          key={doctor.id}
                          type="button"
                          onClick={() => selectDoctor(doctor)}
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

            {/* Diagnosis Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('records.form.diagnosisCode')}
              </label>
              <input
                type="text"
                name="diagnosisCode"
                value={formData.diagnosisCode}
                onChange={handleChange}
                className="input"
                placeholder={t('records.form.diagnosisCodePlaceholder')}
                maxLength={20}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{t('records.form.medicalNotes')}</h2>
          
          <div className="space-y-6">
            {/* Symptoms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('records.form.symptoms')}
              </label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                rows="4"
                className="input w-full"
                placeholder={t('records.form.symptomsPlaceholder')}
              />
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('records.form.diagnosis')}
              </label>
              <textarea
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                rows="4"
                className="input w-full"
                placeholder={t('records.form.diagnosisPlaceholder')}
              />
            </div>

            {/* Treatment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('records.form.treatment')}
              </label>
              <textarea
                name="treatment"
                value={formData.treatment}
                onChange={handleChange}
                rows="4"
                className="input w-full"
                placeholder={t('records.form.treatmentPlaceholder')}
              />
            </div>

            {/* Prescription */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('records.form.prescription')}
              </label>
              <textarea
                name="prescription"
                value={formData.prescription}
                onChange={handleChange}
                rows="5"
                className="input w-full font-mono text-sm"
                placeholder={t('records.form.prescriptionPlaceholder')}
              />
              <p className="text-sm text-gray-500 mt-1">
                {t('records.form.prescriptionHelp')}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/records')}
            className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            disabled={submitting}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {t('records.form.saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t('records.form.saveButton')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default RecordForm
