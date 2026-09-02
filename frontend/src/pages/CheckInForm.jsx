import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { inpatientService, patientService, userService, roomService } from '../services'
import { 
  ArrowLeft, Save, User, Bed, Calendar, FileText, Search, Check, X, ChevronDown, Stethoscope 
} from 'lucide-react'
import toast from 'react-hot-toast'

const CheckInForm = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)

  // Patient Autocomplete State
  const [patientSearch, setPatientSearch] = useState('')
  const [isPatientOpen, setIsPatientOpen] = useState(false)
  const patientRef = useRef(null)

  // Room Autocomplete State
  const [roomSearch, setRoomSearch] = useState('')
  const [isRoomOpen, setIsRoomOpen] = useState(false)
  const roomRef = useRef(null)

  // Doctor Autocomplete State
  const [doctorSearch, setDoctorSearch] = useState('')
  const [isDoctorOpen, setIsDoctorOpen] = useState(false)
  const doctorRef = useRef(null)
  
  const [formData, setFormData] = useState({
    patientId: '',
    roomId: '',
    bedNumber: '',
    doctorId: '',
    initialDiagnosis: '',
    estimatedCheckoutAt: '',
    status: 'PENDING',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (patientRef.current && !patientRef.current.contains(event.target)) {
        setIsPatientOpen(false)
      }
      if (roomRef.current && !roomRef.current.contains(event.target)) {
        setIsRoomOpen(false)
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
      const [patientsResponse, usersResponse, roomsResponse] = await Promise.all([
        patientService.getPatients({ limit: 1000 }),
        userService.getUsers({ limit: 1000 }),
        roomService.getRooms({ status: 'AVAILABLE', limit: 1000 })
      ])

      setPatients(patientsResponse.data?.patients || patientsResponse.data || [])
      
      const usersList = usersResponse?.data?.users || usersResponse?.data || []
      const doctorsList = usersList.filter(user => user.role === 'DOCTOR')
      setDoctors(doctorsList)

      setRooms(roomsResponse.data?.rooms || roomsResponse.data || [])
    } catch (error) {
      console.error('Fetch data error:', error)
      toast.error(t('inpatients.loadFailed', 'Gagal memuat data master'))
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

  // 1. Patient Autocomplete Helpers
  const filteredPatients = patients.filter(patient => {
    const query = patientSearch.toLowerCase().trim()
    if (!query) return true
    return (
      patient.name?.toLowerCase().includes(query) ||
      patient.medicalRecordNo?.toLowerCase().includes(query) ||
      patient.phone?.toLowerCase().includes(query)
    )
  })

  const handleSelectPatient = (patient) => {
    setFormData(prev => ({
      ...prev,
      patientId: patient.id
    }))
    setPatientSearch(`${patient.name} (${patient.medicalRecordNo})`)
    setIsPatientOpen(false)
  }

  const handleClearPatient = () => {
    setFormData(prev => ({
      ...prev,
      patientId: ''
    }))
    setPatientSearch('')
  }

  // 2. Room Autocomplete Helpers
  const filteredRooms = rooms.filter(room => {
    const query = roomSearch.toLowerCase().trim()
    if (!query) return true
    return (
      room.roomNumber?.toLowerCase().includes(query) ||
      room.roomName?.toLowerCase().includes(query) ||
      room.roomType?.toLowerCase().includes(query) ||
      (room.floor ? `lantai ${room.floor}` : '').includes(query)
    )
  })

  const handleSelectRoom = (room) => {
    setSelectedRoom(room)
    setFormData(prev => ({
      ...prev,
      roomId: room.id,
      bedNumber: ''
    }))
    const roomTypeName = t(`rooms.types.${room.roomType}`, room.roomType)
    setRoomSearch(`${room.roomNumber} - ${room.roomName || ''} (${roomTypeName})`)
    setIsRoomOpen(false)
  }

  const handleClearRoom = () => {
    setSelectedRoom(null)
    setFormData(prev => ({
      ...prev,
      roomId: '',
      bedNumber: ''
    }))
    setRoomSearch('')
  }

  // 3. Doctor Autocomplete Helpers
  const filteredDoctors = doctors.filter(doctor => {
    const query = doctorSearch.toLowerCase().trim()
    if (!query) return true
    return (
      doctor.name?.toLowerCase().includes(query) ||
      doctor.department?.toLowerCase().includes(query)
    )
  })

  const handleSelectDoctor = (doctor) => {
    setFormData(prev => ({
      ...prev,
      doctorId: doctor.id
    }))
    setDoctorSearch(`${doctor.name} - ${doctor.department || 'Spesialis'}`)
    setIsDoctorOpen(false)
  }

  const handleClearDoctor = () => {
    setFormData(prev => ({
      ...prev,
      doctorId: ''
    }))
    setDoctorSearch('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.patientId) {
      toast.error(t('inpatients.selectPatient', 'Silakan pilih pasien terlebih dahulu'))
      return
    }
    if (!formData.roomId) {
      toast.error(t('inpatients.selectRoom', 'Silakan pilih kamar terlebih dahulu'))
      return
    }
    if (!formData.doctorId) {
      toast.error(t('inpatients.selectDoctor', 'Silakan pilih dokter penanggung jawab terlebih dahulu'))
      return
    }
    if (!formData.initialDiagnosis) {
      toast.error(t('inpatients.enterDiagnosis', 'Masukkan diagnosis awal pasien'))
      return
    }

    try {
      setSubmitting(true)
      
      const checkInData = {
        patientId: parseInt(formData.patientId),
        roomId: parseInt(formData.roomId),
        bedNumber: formData.bedNumber ? parseInt(formData.bedNumber) : undefined,
        doctorId: parseInt(formData.doctorId),
        initialDiagnosis: formData.initialDiagnosis,
        estimatedCheckoutAt: formData.estimatedCheckoutAt || undefined,
        notes: formData.notes || undefined
      }

      await inpatientService.checkInPatient(checkInData)
      toast.success(t('inpatients.checkInSuccess', 'Pasien berhasil dimasukin rawat inap'))
      navigate('/inpatients')
    } catch (error) {
      toast.error(error.response?.data?.error || t('inpatients.checkInFailed', 'Gagal melakukan check-in pasien'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/inpatients')}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back', 'Kembali')}
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('inpatients.checkIn', 'Check-in Pasien Rawat Inap')}</h1>
          <p className="text-gray-600">{t('inpatients.checkInSubtitle', 'Pendaftaran pasien ke kamar rawat inap')}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Patient Autocomplete Information */}
        <div className="card overflow-visible">
          <div className="flex items-center space-x-2 mb-4">
            <User className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold">{t('inpatients.patientInfo', 'Informasi Pasien')}</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="relative" ref={patientRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inpatients.patient', 'Pasien')} <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={patientSearch}
                  onFocus={() => setIsPatientOpen(true)}
                  onChange={(e) => {
                    setPatientSearch(e.target.value)
                    setIsPatientOpen(true)
                    if (formData.patientId) {
                      setFormData(prev => ({ ...prev, patientId: '' }))
                    }
                  }}
                  placeholder={t('inpatients.searchPatientPlaceholder', 'Ketik untuk mencari pasien (Nama, No. RM, HP)...')}
                  className="input pl-9 pr-10 text-sm font-medium"
                  required={!formData.patientId}
                />

                {formData.patientId ? (
                  <button
                    type="button"
                    onClick={handleClearPatient}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
              </div>

              {/* Patient Dropdown */}
              {isPatientOpen && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100">
                  {filteredPatients.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      {t('common.noDataFound', 'Pasien tidak ditemukan')}
                    </div>
                  ) : (
                    filteredPatients.map(patient => {
                      const isSelected = formData.patientId === patient.id
                      return (
                        <div
                          key={patient.id}
                          onClick={() => handleSelectPatient(patient)}
                          className={`p-3 hover:bg-blue-50/70 cursor-pointer transition-colors flex items-center justify-between ${
                            isSelected ? 'bg-blue-50 font-semibold' : ''
                          }`}
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[#0052CC]" />
                              <span>{patient.name}</span>
                            </p>
                            <p className="text-[11px] font-mono text-gray-500">
                              RM: {patient.medicalRecordNo || '-'} {patient.phone ? `• HP: ${patient.phone}` : ''}
                            </p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#0052CC]" />}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Room Autocomplete Information */}
        <div className="card overflow-visible">
          <div className="flex items-center space-x-2 mb-4">
            <Bed className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold">{t('inpatients.roomInfo', 'Informasi Kamar')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Room Search Autocomplete */}
            <div className="relative" ref={roomRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rooms.room', 'Kamar')} <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={roomSearch}
                  onFocus={() => setIsRoomOpen(true)}
                  onChange={(e) => {
                    setRoomSearch(e.target.value)
                    setIsRoomOpen(true)
                    if (formData.roomId) {
                      setFormData(prev => ({ ...prev, roomId: '', bedNumber: '' }))
                      setSelectedRoom(null)
                    }
                  }}
                  placeholder={t('inpatients.searchRoomPlaceholder', 'Ketik untuk mencari kamar (No. Kamar, Nama, Tipe, Lantai)...')}
                  className="input pl-9 pr-10 text-sm font-medium"
                  required={!formData.roomId}
                />

                {formData.roomId ? (
                  <button
                    type="button"
                    onClick={handleClearRoom}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
              </div>

              {/* Room Dropdown */}
              {isRoomOpen && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100">
                  {filteredRooms.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      {t('common.noDataFound', 'Kamar tidak ditemukan atau tidak tersedia')}
                    </div>
                  ) : (
                    filteredRooms.map(room => {
                      const isSelected = formData.roomId === room.id
                      const roomTypeName = t(`rooms.types.${room.roomType}`, room.roomType)
                      return (
                        <div
                          key={room.id}
                          onClick={() => handleSelectRoom(room)}
                          className={`p-3 hover:bg-emerald-50/70 cursor-pointer transition-colors flex items-center justify-between ${
                            isSelected ? 'bg-emerald-50 font-semibold' : ''
                          }`}
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                              <Bed className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{t('billing.form.roomLabel', 'Kamar')} {room.roomNumber} {room.roomName ? `- ${room.roomName}` : ''}</span>
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {roomTypeName} • {t('rooms.floor', 'Lantai')} {room.floor} • Rp {(room.pricePerDay || 0).toLocaleString(i18n.language === 'id' ? 'id-ID' : 'en-US')}/{t('inpatients.perDay', 'hari')}
                            </p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {selectedRoom && (
                <p className="mt-2 text-xs text-emerald-700 font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  {t('inpatients.capacity', 'Kapasitas')}: {selectedRoom.bedCapacity} Bed | {t('inpatients.available', 'Tersedia')}: {selectedRoom.availableBeds || selectedRoom.bedCapacity} Bed | Rp {(selectedRoom.pricePerDay || 0).toLocaleString(i18n.language === 'id' ? 'id-ID' : 'en-US')}/{t('inpatients.perDay', 'hari')}
                </p>
              )}
            </div>

            {/* Bed Number Input */}
            <div>
              <label htmlFor="bedNumber" className="block text-sm font-medium text-gray-700 mb-2">
                {t('inpatients.bedNumber', 'Nomor Bed / Kasur')}
              </label>
              <input
                type="number"
                id="bedNumber"
                name="bedNumber"
                value={formData.bedNumber}
                onChange={handleChange}
                min="1"
                max={selectedRoom?.bedCapacity || 99}
                placeholder={selectedRoom ? `1 - ${selectedRoom.bedCapacity}` : t('inpatients.selectRoomFirst', 'Pilih kamar terlebih dahulu')}
                disabled={!formData.roomId}
                className="input text-sm font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('inpatients.bedNumberHint', 'Opsional: Nomor urut kasur di dalam kamar.')}
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Doctor & Medical Information */}
        <div className="card overflow-visible">
          <div className="flex items-center space-x-2 mb-4">
            <Stethoscope className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold">{t('inpatients.medicalInfo', 'Informasi Dokter & Diagnosis')}</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Doctor Autocomplete */}
            <div className="relative" ref={doctorRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inpatients.doctor', 'Dokter Penanggung Jawab')} <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={doctorSearch}
                  onFocus={() => setIsDoctorOpen(true)}
                  onChange={(e) => {
                    setDoctorSearch(e.target.value)
                    setIsDoctorOpen(true)
                    if (formData.doctorId) {
                      setFormData(prev => ({ ...prev, doctorId: '' }))
                    }
                  }}
                  placeholder={t('inpatients.searchDoctorPlaceholder', 'Ketik untuk mencari dokter (Nama, Spesialis/Departemen)...')}
                  className="input pl-9 pr-10 text-sm font-medium"
                  required={!formData.doctorId}
                />

                {formData.doctorId ? (
                  <button
                    type="button"
                    onClick={handleClearDoctor}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
              </div>

              {/* Doctor Dropdown */}
              {isDoctorOpen && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100">
                  {filteredDoctors.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      {t('common.noDataFound', 'Dokter tidak ditemukan')}
                    </div>
                  ) : (
                    filteredDoctors.map(doctor => {
                      const isSelected = formData.doctorId === doctor.id
                      return (
                        <div
                          key={doctor.id}
                          onClick={() => handleSelectDoctor(doctor)}
                          className={`p-3 hover:bg-indigo-50/70 cursor-pointer transition-colors flex items-center justify-between ${
                            isSelected ? 'bg-indigo-50 font-semibold' : ''
                          }`}
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                              <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{doctor.name}</span>
                            </p>
                            <p className="text-[11px] text-gray-500">
                              Departemen / Spesialis: <span className="font-semibold text-gray-700">{doctor.department || '-'}</span>
                            </p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            {/* Initial Diagnosis */}
            <div>
              <label htmlFor="initialDiagnosis" className="block text-sm font-medium text-gray-700 mb-2">
                {t('inpatients.initialDiagnosis', 'Diagnosis Awal')} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="initialDiagnosis"
                name="initialDiagnosis"
                value={formData.initialDiagnosis}
                onChange={handleChange}
                required
                rows="3"
                placeholder={t('inpatients.initialDiagnosisPlaceholder', 'Ketik keluhan awal atau diagnosis masuk...')}
                className="input text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Schedule & Notes Information */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold">{t('inpatients.scheduleInfo', 'Jadwal & Catatan')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="estimatedCheckoutAt" className="block text-sm font-medium text-gray-700 mb-2">
                {t('inpatients.estimatedCheckout', 'Estimasi Tanggal Keluar (Checkout)')}
              </label>
              <input
                type="datetime-local"
                id="estimatedCheckoutAt"
                name="estimatedCheckoutAt"
                value={formData.estimatedCheckoutAt}
                onChange={handleChange}
                min={new Date().toISOString().slice(0, 16)}
                className="input text-sm"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                {t('inpatients.notes', 'Catatan Tambahan')}
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder={t('inpatients.notesPlaceholder', 'Catatan medis atau instruksi khusus perawat/kamar...')}
                className="input text-sm"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/inpatients')}
            className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            disabled={submitting}
          >
            {t('common.cancel', 'Batal')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary inline-flex items-center"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('common.saving', 'Menyimpan...')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t('inpatients.checkInPatient', 'Proses Check-in Pasien')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CheckInForm
