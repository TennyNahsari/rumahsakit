import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { inpatientService, roomService } from '../services'
import { X, Bed, User, Stethoscope, Save, Search, Check, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

const CreateInpatientModal = ({ visit, isOpen, onClose, onSuccess }) => {
  const { t, i18n } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)

  // Room Autocomplete State
  const [roomSearch, setRoomSearch] = useState('')
  const [isRoomOpen, setIsRoomOpen] = useState(false)
  const roomRef = useRef(null)

  const [formData, setFormData] = useState({
    roomId: '',
    bedNumber: '',
    initialDiagnosis: '',
    estimatedCheckoutAt: '',
    notes: ''
  })

  useEffect(() => {
    if (isOpen && visit) {
      fetchAvailableRooms()
      setFormData({
        roomId: '',
        bedNumber: '',
        initialDiagnosis: visit.notes || '',
        estimatedCheckoutAt: '',
        notes: ''
      })
      setRoomSearch('')
      setSelectedRoom(null)
    }
  }, [isOpen, visit])

  // Close room dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roomRef.current && !roomRef.current.contains(event.target)) {
        setIsRoomOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchAvailableRooms = async () => {
    try {
      const res = await roomService.getRooms({ status: 'AVAILABLE', limit: 1000 })
      setRooms(res.data?.rooms || res.data || [])
    } catch (err) {
      console.error('Fetch available rooms error:', err)
    }
  }

  if (!isOpen || !visit) return null

  // Filtered rooms for Autocomplete
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
      roomId: room.id.toString(),
      bedNumber: ''
    }))
    const roomTypeName = t(`rooms.types.${room.roomType}`, room.roomType)
    const roomPrefix = i18n.language === 'id' ? 'Kamar' : 'Room'
    setRoomSearch(`${roomPrefix} ${room.roomNumber} - ${room.roomName || ''} (${roomTypeName})`)
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.roomId) {
      toast.error(t('inpatients.selectRoom', 'Silakan pilih kamar rawat inap'))
      return
    }
    if (!formData.initialDiagnosis.trim()) {
      toast.error(t('inpatients.enterDiagnosis', 'Masukkan diagnosis awal pasien'))
      return
    }

    try {
      setSubmitting(true)

      const checkInData = {
        patientId: visit.patientId,
        roomId: parseInt(formData.roomId),
        bedNumber: formData.bedNumber ? parseInt(formData.bedNumber) : undefined,
        doctorId: visit.doctorId,
        initialDiagnosis: formData.initialDiagnosis.trim(),
        estimatedCheckoutAt: formData.estimatedCheckoutAt || undefined,
        notes: formData.notes.trim() || undefined
      }

      await inpatientService.checkInPatient(checkInData)
      toast.success(t('inpatients.checkInSuccess', 'Pasien berhasil dimasukin rawat inap'))

      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      console.error('Check-in inpatient error:', error)
      toast.error(error.response?.data?.error || t('inpatients.checkInFailed', 'Gagal melakukaan check-in rawat inap'))
    } finally {
      setSubmitting(false)
    }
  }

  const queueNo = visit.queueNumberFormatted || visit.queueNumber || `Visit #${visit.id}`

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-indigo-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Bed className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {t('inpatients.quickCheckInTitle', 'Check-in Rawat Inap Pasien')}
              </h2>
              <p className="text-xs text-indigo-100 font-medium">
                {queueNo} • {visit.patient?.name} (RM: {visit.patient?.medicalRecordNo})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Patient & Doctor Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-indigo-700 shrink-0" />
              <div>
                <p className="text-gray-500 font-medium">{t('inpatients.patient', 'Pasien')}:</p>
                <p className="font-bold text-gray-900">{visit.patient?.name}</p>
                <p className="font-mono text-[10px] text-gray-500">RM: {visit.patient?.medicalRecordNo}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 border-t sm:border-t-0 sm:border-l border-indigo-100 pt-2 sm:pt-0 sm:pl-3">
              <Stethoscope className="w-4 h-4 text-indigo-700 shrink-0" />
              <div>
                <p className="text-gray-500 font-medium">{t('inpatients.doctor', 'Dokter DPJP')}:</p>
                <p className="font-bold text-gray-900">{visit.doctor?.name}</p>
                <p className="text-[10px] text-gray-500">{visit.doctor?.department || (i18n.language === 'id' ? 'Spesialis' : 'Specialist')}</p>
              </div>
            </div>
          </div>

          {/* Room Autocomplete Field */}
          <div className="relative" ref={roomRef}>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('rooms.room', 'Pilih Kamar Rawat Inap')} <span className="text-red-500">*</span>
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
                className="input pl-9 pr-10 text-xs font-medium"
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

            {/* Room Dropdown Menu */}
            {isRoomOpen && (
              <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
                {filteredRooms.length === 0 ? (
                  <div className="p-3 text-center text-xs text-gray-500">
                    {t('common.noDataFound', 'Kamar tidak ditemukan atau tidak tersedia')}
                  </div>
                ) : (
                  filteredRooms.map(room => {
                    const isSelected = formData.roomId === room.id.toString()
                    const roomTypeName = t(`rooms.types.${room.roomType}`, room.roomType)
                    const roomPrefix = i18n.language === 'id' ? 'Kamar' : 'Room'
                    return (
                      <div
                        key={room.id}
                        onClick={() => handleSelectRoom(room)}
                        className={`p-2.5 hover:bg-indigo-50/70 cursor-pointer transition-colors flex items-center justify-between text-xs ${
                          isSelected ? 'bg-indigo-50 font-semibold' : ''
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-900 flex items-center gap-1.5">
                            <Bed className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{roomPrefix} {room.roomNumber} {room.roomName ? `- ${room.roomName}` : ''}</span>
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {roomTypeName} • {i18n.language === 'id' ? 'Lantai' : 'Floor'} {room.floor} • Rp {(room.pricePerDay || 0).toLocaleString('id-ID')}/{i18n.language === 'id' ? 'hari' : 'day'}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {selectedRoom && (
              <p className="mt-1.5 text-xs text-indigo-800 font-medium bg-indigo-50 p-2 rounded-lg border border-indigo-200">
                {i18n.language === 'id' ? 'Kapasitas' : 'Capacity'}: {selectedRoom.bedCapacity} Bed | {i18n.language === 'id' ? 'Tersedia' : 'Available'}: {selectedRoom.availableBeds || selectedRoom.bedCapacity} Bed | Rp {(selectedRoom.pricePerDay || 0).toLocaleString('id-ID')}/{i18n.language === 'id' ? 'hari' : 'day'}
              </p>
            )}
          </div>

          {/* Bed Number & Initial Diagnosis */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('inpatients.bedNumber', 'Nomor Bed / Kasur')}
              </label>
              <input
                type="number"
                value={formData.bedNumber}
                onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
                min="1"
                max={selectedRoom?.bedCapacity || 99}
                placeholder={selectedRoom ? `1 - ${selectedRoom.bedCapacity}` : (i18n.language === 'id' ? 'Pilih kamar' : 'Select room')}
                disabled={!formData.roomId}
                className="w-full text-xs font-medium p-3 rounded-xl border border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all disabled:bg-gray-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('inpatients.initialDiagnosis', 'Diagnosis Awal')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.initialDiagnosis}
                onChange={(e) => setFormData({ ...formData, initialDiagnosis: e.target.value })}
                rows="2"
                placeholder={t('inpatients.initialDiagnosisPlaceholder', 'Ketik keluhan awal atau diagnosis masuk...')}
                className="w-full text-xs font-medium p-3 rounded-xl border border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-y"
                required
              />
            </div>
          </div>

          {/* Estimated Checkout & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('inpatients.estimatedCheckout', 'Estimasi Tanggal Keluar')}
              </label>
              <input
                type="datetime-local"
                value={formData.estimatedCheckoutAt}
                onChange={(e) => setFormData({ ...formData, estimatedCheckoutAt: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full text-xs font-medium p-3 rounded-xl border border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('inpatients.notes', 'Catatan Perawat / Kamar')}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="2"
                placeholder={t('inpatients.notesPlaceholder', 'Catatan medis atau instruksi khusus...')}
                className="w-full text-xs font-medium p-3 rounded-xl border border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-y"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors"
              disabled={submitting}
            >
              {t('common.cancel', 'Batal')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg flex items-center space-x-2 transition-all shadow-md"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                  <span>{t('common.saving', 'Menyimpan...')}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t('inpatients.checkInPatient', 'Proses Check-in')}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}

export default CreateInpatientModal
