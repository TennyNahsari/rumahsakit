import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { inpatientService, roomService } from '../services'
import { ArrowLeft, Save, Bed, AlertCircle, Search, Check, X, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

const InpatientEdit = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [occupancy, setOccupancy] = useState(null)
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)

  // Room Autocomplete State
  const [roomSearch, setRoomSearch] = useState('')
  const [isRoomOpen, setIsRoomOpen] = useState(false)
  const roomRef = useRef(null)

  const [formData, setFormData] = useState({
    roomId: '',
    bedNumber: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

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

  const fetchData = async () => {
    try {
      setLoading(true)
      const [occupancyResponse, roomsResponse] = await Promise.all([
        inpatientService.getInpatient(id),
        roomService.getRooms({ status: 'AVAILABLE', limit: 1000 })
      ])

      const occ = occupancyResponse.data?.occupancy || occupancyResponse.data
      setOccupancy(occ)
      
      // Include current room in available rooms list if not already present
      const availableRooms = roomsResponse.data?.rooms || roomsResponse.data || []
      if (occ.room && !availableRooms.find(r => r.id === occ.room.id)) {
        availableRooms.unshift(occ.room)
      }
      setRooms(availableRooms)

      setFormData({
        roomId: occ.room?.id?.toString() || '',
        bedNumber: occ.bedNumber?.toString() || '',
        status: occ.status || 'CHECKED_IN',
        notes: occ.notes || ''
      })

      setSelectedRoom(occ.room)

      if (occ.room) {
        const roomTypeName = t(`rooms.types.${occ.room.roomType}`, occ.room.roomType)
        setRoomSearch(`${occ.room.roomNumber} - ${occ.room.roomName || ''} (${roomTypeName})`)
      }
    } catch (error) {
      toast.error(t('inpatients.loadFailed', 'Gagal memuat data rawat inap'))
      console.error('Fetch data error:', error)
      navigate('/inpatients')
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

  // Room Autocomplete Helpers
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
    setFormData(prev => {
      const isSameRoom = room.id === occupancy?.room?.id
      return {
        ...prev,
        roomId: room.id.toString(),
        bedNumber: isSameRoom ? (occupancy?.bedNumber?.toString() || '') : ''
      }
    })

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.roomId) {
      toast.error(t('inpatients.selectRoom', 'Silakan pilih kamar pengganti terlebih dahulu'))
      return
    }

    try {
      setSubmitting(true)
      
      const updateData = {
        roomId: parseInt(formData.roomId),
        bedNumber: formData.bedNumber ? parseInt(formData.bedNumber) : undefined,
        status: formData.status,
        notes: formData.notes || undefined
      }

      await inpatientService.updateOccupancy(id, updateData)
        // update success
        toast.success(t('inpatients.updateSuccess', 'Data rawat inap berhasil diperbarui'))
        navigate('/inpatients')
      } catch (error) {
        toast.error(error.response?.data?.error || t('inpatients.updateFailed', 'Gagal memperbarui kamar rawat inap'))
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

    if (!occupancy) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
          <p className="text-gray-600">{t('inpatients.notFound', 'Data rawat inap tidak ditemukan.')}</p>
          <button
            onClick={() => navigate('/inpatients')}
            className="mt-4 btn bg-primary-600 text-white hover:bg-primary-700"
          >
            {t('common.back', 'Kembali')}
          </button>
        </div>
      )
    }

    const isRoomChanged = formData.roomId !== occupancy.room?.id?.toString()
    const currentRoomPrice = occupancy.room?.pricePerDay || 0
    const newRoomPrice = selectedRoom?.pricePerDay || 0
    const priceDifference = newRoomPrice - currentRoomPrice

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
            <h1 className="text-2xl font-bold text-gray-900">{t('inpatients.editOccupancy', 'Pindah Kamar / Ubah Rawat Inap')}</h1>
            <p className="text-gray-600 font-mono text-sm">{occupancy.registrationNumber}</p>
          </div>
        </div>

        {/* Current Info */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{t('inpatients.currentInfo', 'Informasi Rawat Inap Saat Ini')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs">{t('inpatients.patient', 'Pasien')}</p>
              <p className="font-bold text-gray-900">{occupancy.patient?.name}</p>
              <p className="text-gray-500 font-mono text-xs">{occupancy.patient?.medicalRecordNo}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">{t('inpatients.currentRoom', 'Kamar Saat Ini')}</p>
              <p className="font-bold text-gray-900">
                Kamar {occupancy.room?.roomNumber} - {t(`rooms.types.${occupancy.room?.roomType}`, occupancy.room?.roomType)}
              </p>
              <p className="text-gray-500 text-xs">
                Bed {occupancy.bedNumber || '-'} | {i18n.language === 'id' ? 'Lantai' : 'Floor'} {occupancy.room?.floor}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">{t('inpatients.doctor', 'Dokter Penanggung Jawab')}</p>
              <p className="font-bold text-gray-900">{occupancy.doctor?.name}</p>
              <p className="text-gray-500 text-xs">{occupancy.doctor?.department}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">{t('inpatients.lengthOfStay', 'Lama Rawat')}</p>
              <p className="font-bold text-gray-900">{occupancy.currentDays || 1} {t('inpatients.days', 'Hari')}</p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card overflow-visible">
            <div className="flex items-center space-x-2 mb-4">
              <Bed className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold">{t('inpatients.changeRoom', 'Pindah Kamar (Kamar Baru)')}</h2>
            </div>

            <div className="space-y-4">
              
              {/* New Room Search Autocomplete */}
              <div className="relative" ref={roomRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('inpatients.newRoom', 'Pilih Kamar Baru')} <span className="text-red-500">*</span>
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

                {/* Room Dropdown Menu */}
                {isRoomOpen && (
                  <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100">
                    {filteredRooms.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-500">
                        {t('common.noDataFound', 'Kamar tidak ditemukan atau tidak tersedia')}
                      </div>
                    ) : (
                      filteredRooms.map(room => {
                        const isSelected = formData.roomId === room.id.toString()
                        const isCurrentRoom = room.id === occupancy.room?.id
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
                                <span>Kamar {room.roomNumber} {room.roomName ? `- ${room.roomName}` : ''}</span>
                                {isCurrentRoom && (
                                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                                    {t('inpatients.current', 'Kamar Saat Ini')}
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                {roomTypeName} • {i18n.language === 'id' ? 'Lantai' : 'Floor'} {room.floor} • Rp {(room.pricePerDay || 0).toLocaleString('id-ID')}/{i18n.language === 'id' ? 'hari' : 'day'}
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
                    Kapasitas: {selectedRoom.bedCapacity} Bed | Tersedia: {selectedRoom.availableBeds || selectedRoom.bedCapacity} Bed | Rp {(selectedRoom.pricePerDay || 0).toLocaleString('id-ID')}/hari
                  </p>
                )}
              </div>

              {/* Bed Number */}
              <div>
                <label htmlFor="bedNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('inpatients.bedNumber', 'Nomor Bed / Kasur Baru')}
                </label>
                <input
                  type="number"
                  id="bedNumber"
                  name="bedNumber"
                  value={formData.bedNumber}
                  onChange={handleChange}
                  min="1"
                  max={selectedRoom?.bedCapacity || 99}
                  placeholder={selectedRoom ? `1 - ${selectedRoom.bedCapacity}` : 'Pilih kamar terlebih dahulu'}
                  disabled={!formData.roomId}
                  className="input text-sm font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t('inpatients.bedNumberHint', 'Opsional: Nomor urut kasur di dalam kamar baru.')}
                </p>
              </div>

              {/* Status Inpatient Selection */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('inpatients.statusLabel', 'Status Rawat Inap Pasien')}
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input text-sm font-bold"
                >
                  <option value="PENDING">{i18n.language === 'id' ? '🟡 Pending (Menunggu Persetujuan)' : '🟡 Pending Approval'}</option>
                  <option value="CONFIRMED">{i18n.language === 'id' ? '🔵 Confirmed (Terkonfirmasi)' : '🔵 Confirmed'}</option>
                  <option value="CHECKED_IN">{i18n.language === 'id' ? '🟢 Check-in (Aktif Dirawat)' : '🟢 Check-in (Active)'}</option>
                  <option value="CHECKED_OUT">{i18n.language === 'id' ? '⚪ Check-out (Selesai Rawat Inap)' : '⚪ Checked-out'}</option>
                  <option value="CANCELLED">{i18n.language === 'id' ? '🔴 Cancelled (Dibatalkan)' : '🔴 Cancelled'}</option>
                </select>
              </div>

              {/* Reason for Change Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('inpatients.notes', 'Alasan Kepindahan / Catatan')}
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder={t('inpatients.reasonForChange', 'Ketik alasan pindah kamar atau catatan perawat...')}
                  className="input text-sm"
                />
              </div>

              {/* Price Comparison */}
              {isRoomChanged && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                  <h3 className="text-sm font-bold text-blue-900">
                    {t('inpatients.priceComparison', 'Perbandingan Tarif Kamar')}
                  </h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-blue-700">{t('inpatients.currentPrice', 'Tarif Kamar Lama')}:</span>
                      <span className="font-semibold">Rp {(currentRoomPrice || 0).toLocaleString('id-ID')}/hari</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">{t('inpatients.newPrice', 'Tarif Kamar Baru')}:</span>
                      <span className="font-semibold">Rp {(newRoomPrice || 0).toLocaleString('id-ID')}/hari</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-300 pt-1.5 text-sm">
                      <span className="font-bold text-blue-900">{t('inpatients.difference', 'Selisih Tarif')}:</span>
                      <span className={`font-bold ${priceDifference > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {priceDifference > 0 ? '+' : ''}Rp {(priceDifference || 0).toLocaleString('id-ID')}/hari
                      </span>
                    </div>
                  </div>
                </div>
              )}

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
            className="btn btn-primary inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {t('common.saving', 'Menyimpan...')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t('inpatients.saveChanges', 'Simpan Perubahan')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default InpatientEdit
