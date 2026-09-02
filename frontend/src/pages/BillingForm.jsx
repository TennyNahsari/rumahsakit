import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { billingService, patientService, visitService, medicineService, inpatientService } from '../services'
import { 
  ArrowLeft, Save, Plus, Trash2, Search, Check, X, User, Calendar, 
  ChevronDown, Pill, FileText, AlertTriangle, Bed 
} from 'lucide-react'
import toast from 'react-hot-toast'

const BillingForm = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [patients, setPatients] = useState([])
  const [visits, setVisits] = useState([])
  const [medicines, setMedicines] = useState([])

  // Autocomplete state for Patient
  const [patientSearch, setPatientSearch] = useState('')
  const [isPatientOpen, setIsPatientOpen] = useState(false)
  const patientRef = useRef(null)

  // Autocomplete state for Visit
  const [visitSearch, setVisitSearch] = useState('')
  const [isVisitOpen, setIsVisitOpen] = useState(false)
  const visitRef = useRef(null)

  const [formData, setFormData] = useState({
    patientId: '',
    visitId: '',
    items: [
      {
        type: 'MEDICINE', // 'MEDICINE' or 'CUSTOM'
        medicineId: null,
        medicineSearch: '',
        isDropdownOpen: false,
        description: '',
        unitPrice: '',
        qty: 1,
        amount: '',
        stockAvailable: null,
        unit: ''
      }
    ],
    tax: '10',
    discount: '0'
  })

  useEffect(() => {
    fetchData()
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (patientRef.current && !patientRef.current.contains(event.target)) {
        setIsPatientOpen(false)
      }
      if (visitRef.current && !visitRef.current.contains(event.target)) {
        setIsVisitOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [patientsResponse, visitsResponse, medicinesResponse] = await Promise.all([
        patientService.getPatients({ limit: 1000 }),
        visitService.getVisits({ limit: 1000 }),
        medicineService.getMedicines({ limit: 1000 })
      ])

      setPatients(patientsResponse.data?.patients || patientsResponse.data || [])
      setVisits(visitsResponse.data?.visits || visitsResponse.data || [])
      setMedicines(medicinesResponse.data?.medicines || medicinesResponse.data || [])
    } catch (error) {
      console.error('Fetch data error:', error)
      toast.error(t('billing.form.loadFailed', 'Gagal memuat data master'))
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
  // 1. Visit status must be COMPLETED
  // 2. Billing status must NOT be PAID
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
  const eligiblePatients = patients.filter(patient => eligiblePatientIds.has(patient.id))

  // Patient Autocomplete Helpers
  const filteredPatients = eligiblePatients.filter(patient => {
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
      patientId: patient.id,
      visitId: ''
    }))
    setPatientSearch(`${patient.name} (${patient.medicalRecordNo})`)
    setVisitSearch('')
    setIsPatientOpen(false)
  }

  const handleClearPatient = () => {
    setFormData(prev => ({
      ...prev,
      patientId: '',
      visitId: ''
    }))
    setPatientSearch('')
    setVisitSearch('')
  }

  // Visit Autocomplete Helpers
  const availableVisits = formData.patientId 
    ? eligibleVisits.filter(v => v.patientId === formData.patientId)
    : eligibleVisits

  const filteredVisits = availableVisits.filter(visit => {
    const query = visitSearch.toLowerCase().trim()
    if (!query) return true
    const queueNo = (visit.queueNumberFormatted || visit.queueNumber || '').toLowerCase()
    const visitType = (visit.visitType || '').toLowerCase()
    const doctorName = (visit.doctor?.name || '').toLowerCase()
    const dateStr = new Date(visit.scheduledAt || visit.createdAt).toLocaleDateString().toLowerCase()
    
    return (
      queueNo.includes(query) ||
      visitType.includes(query) ||
      doctorName.includes(query) ||
      dateStr.includes(query)
    )
  })

  const handleSelectVisit = (visit) => {
    const queueNo = visit.queueNumberFormatted || visit.queueNumber || `Visit #${visit.id}`
    const dateStr = new Date(visit.scheduledAt || visit.createdAt).toLocaleDateString(
      i18n.language === 'id' ? 'id-ID' : 'en-US'
    )
    
    setFormData(prev => ({
      ...prev,
      visitId: visit.id
    }))
    setVisitSearch(`${queueNo} - ${dateStr} (${visit.visitType})`)
    setIsVisitOpen(false)
  }

  const handleClearVisit = () => {
    setFormData(prev => ({
      ...prev,
      visitId: ''
    }))
    setVisitSearch('')
  }

  const handleAddInpatientItem = async () => {
    if (!formData.patientId) {
      toast.error(t('billing.form.selectPatientFirst', 'Pilih pasien terlebih dahulu'))
      return
    }

    const toastId = toast.loading(t('common.loading', 'Memuat data rawat inap...'))
    try {
      const res = await inpatientService.getHistory({ patientId: formData.patientId })
      toast.dismiss(toastId)

      const historyList = res.data?.history || res.data?.inpatients || res.data || []
      
      if (!historyList || historyList.length === 0) {
        toast.error(t('billing.form.noCheckedOutInpatient', 'Pasien ini tidak memiliki riwayat rawat inap yang sudah check-out'))
        return
      }

      const newInpatientItems = historyList.map(occ => {
        const roomNum = occ.room?.roomNumber || ''
        const roomType = occ.room?.roomType || ''
        const days = occ.actualDays || occ.currentDays || 1
        const pricePerDay = parseFloat(occ.room?.pricePerDay || 0)
        const totalCost = occ.totalRoomCost ? parseFloat(occ.totalRoomCost) : days * pricePerDay
        const desc = `Rawat Inap Kamar ${roomNum} (${roomType}) - ${days} Hari (@ Rp ${pricePerDay.toLocaleString('id-ID')})`

        return {
          type: 'CUSTOM',
          medicineId: null,
          medicineSearch: '',
          isDropdownOpen: false,
          description: desc,
          unitPrice: pricePerDay.toString(),
          qty: days,
          amount: totalCost.toString(),
          stockAvailable: null,
          unit: 'Hari'
        }
      })

      setFormData(prev => ({
        ...prev,
        items: [
          ...prev.items.filter(i => i.description || i.medicineId),
          ...newInpatientItems
        ]
      }))

      toast.success(t('billing.form.inpatientAdded', 'Biaya rawat inap berhasil ditambahkan ke rincian tagihan'))
    } catch (err) {
      toast.dismiss(toastId)
      console.error('Fetch inpatient history error:', err)
      toast.error(t('billing.form.noCheckedOutInpatient', 'Gagal mengambil data rawat inap pasien'))
    }
  }

  // Item Management Helpers
  const handleItemTypeChange = (index, newType) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      newItems[index] = {
        type: newType,
        medicineId: null,
        medicineSearch: '',
        isDropdownOpen: false,
        description: '',
        unitPrice: '',
        qty: 1,
        amount: '',
        stockAvailable: null,
        unit: ''
      }
      return { ...prev, items: newItems }
    })
  }

  const handleSelectMedicineForItem = (index, medicine) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      const qty = newItems[index].qty || 1
      const unitPrice = medicine.price ? parseFloat(medicine.price) : 0
      const totalAmount = (unitPrice * qty).toString()

      newItems[index] = {
        ...newItems[index],
        medicineId: medicine.id,
        medicineSearch: medicine.name,
        description: `${medicine.name} (${medicine.unit})`,
        unitPrice: unitPrice.toString(),
        qty: qty,
        amount: totalAmount,
        stockAvailable: medicine.totalStock || 0,
        unit: medicine.unit,
        isDropdownOpen: false
      }
      return { ...prev, items: newItems }
    })
  }

  const handleQtyChange = (index, newQtyStr) => {
    const qty = Math.max(1, parseInt(newQtyStr) || 1)
    setFormData(prev => {
      const newItems = [...prev.items]
      const item = newItems[index]
      const unitPrice = parseFloat(item.unitPrice) || 0
      const totalAmount = (unitPrice * qty).toString()

      newItems[index] = {
        ...item,
        qty: qty,
        amount: totalAmount
      }
      return { ...prev, items: newItems }
    })
  }

  const handleUnitPriceChange = (index, newUnitPriceStr) => {
    const unitPrice = parseFloat(newUnitPriceStr) || 0
    setFormData(prev => {
      const newItems = [...prev.items]
      const item = newItems[index]
      const totalAmount = (unitPrice * (item.qty || 1)).toString()

      newItems[index] = {
        ...item,
        unitPrice: newUnitPriceStr,
        amount: totalAmount
      }
      return { ...prev, items: newItems }
    })
  }

  const handleCustomItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      newItems[index][field] = value
      return { ...prev, items: newItems }
    })
  }

  const addItem = (type = 'MEDICINE') => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          type,
          medicineId: null,
          medicineSearch: '',
          isDropdownOpen: false,
          description: '',
          unitPrice: '',
          qty: 1,
          amount: '',
          stockAvailable: null,
          unit: ''
        }
      ]
    }))
  }

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }))
    }
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0
      return sum + amount
    }, 0)

    const taxPercent = parseFloat(formData.tax) || 0
    const tax = (subtotal * taxPercent) / 100

    const discount = parseFloat(formData.discount) || 0
    const total = subtotal + tax - discount

    return { subtotal, tax, discount, total }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.patientId) {
      toast.error(t('billing.form.validation.selectPatient', 'Silakan pilih pasien terlebih dahulu'))
      return
    }

    try {
      setSubmitting(true)

      // Validate items
      const validItems = formData.items.every(item => 
        item.description.trim() && item.amount && parseFloat(item.amount) > 0
      )

      if (!validItems) {
        toast.error(t('billing.form.validation.itemRequired', 'Seluruh item tagihan harus diisi dengan benar'))
        return
      }

      const { subtotal, tax, discount, total } = calculateTotals()

      const submitData = {
        patientId: parseInt(formData.patientId),
        visitId: formData.visitId ? parseInt(formData.visitId) : null,
        items: formData.items.map(item => ({
          description: item.description.trim(),
          amount: parseFloat(item.amount),
          unitPrice: item.unitPrice ? parseFloat(item.unitPrice) : null,
          qty: item.qty ? parseInt(item.qty) : 1,
          medicineId: item.medicineId ? parseInt(item.medicineId) : null
        })),
        subtotal,
        tax,
        discount,
        total
      }

      await billingService.createBilling(submitData)
      toast.success(t('billing.form.createSuccess', 'Tagihan berhasil dibuat'))
      navigate('/billing')
    } catch (error) {
      toast.error(error.response?.data?.error || t('billing.form.createFailed', 'Gagal membuat tagihan'))
      console.error('Create billing error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (value) => {
    const locale = i18n.language === 'id' ? 'id-ID' : 'en-US'
    const currency = i18n.language === 'id' ? 'IDR' : 'USD'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(value || 0)
  }

  const { subtotal, tax, discount, total } = calculateTotals()

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
          onClick={() => navigate('/billing')}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('billing.form.back', 'Kembali')}
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('billing.form.title', 'Buat Tagihan Baru')}</h1>
          <p className="text-gray-600">{t('billing.form.subtitle', 'Buat invoice / billing pembayaran pasien')}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Patient & Visit Info */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{t('billing.detail.patientInfo', 'Informasi Pasien')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Patient Autocomplete */}
            <div className="relative" ref={patientRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('billing.form.patient', 'Pasien')} <span className="text-red-500">*</span>
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
                      setFormData(prev => ({ ...prev, patientId: '', visitId: '' }))
                      setVisitSearch('')
                    }
                  }}
                  placeholder={t('billing.form.searchPatientPlaceholder', 'Ketik untuk mencari pasien (Nama, No. RM, HP)...')}
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

              {/* Patient Dropdown Menu */}
              {isPatientOpen && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100">
                  {filteredPatients.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      {t('billing.form.noCompletedPatient', 'Tidak ada pasien dengan kunjungan selesai (COMPLETED) yang belum lunas')}
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

            {/* Visit Autocomplete (Optional) */}
            <div className="relative" ref={visitRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('billing.form.completedVisitLabel', 'Kunjungan Selesai')}
              </label>

              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={visitSearch}
                  disabled={!formData.patientId}
                  onFocus={() => formData.patientId && setIsVisitOpen(true)}
                  onChange={(e) => {
                    setVisitSearch(e.target.value)
                    setIsVisitOpen(true)
                    if (formData.visitId) {
                      setFormData(prev => ({ ...prev, visitId: '' }))
                    }
                  }}
                  placeholder={
                    formData.patientId 
                      ? t('billing.form.searchVisitPlaceholder', 'Cari kunjungan selesai (No. Antrean, Tipe, Dokter)...') 
                      : t('billing.form.selectPatientFirst', 'Pilih pasien terlebih dahulu')
                  }
                  className="input pl-9 pr-10 text-sm font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
                />

                {formData.visitId ? (
                  <button
                    type="button"
                    onClick={handleClearVisit}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
              </div>

              {!formData.patientId ? (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <span>ℹ️ {t('billing.form.selectPatientFirst', 'Pilih pasien terlebih dahulu untuk menampilkan kunjungan selesai yang belum lunas.')}</span>
                </p>
              ) : (
                <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                  <span>✓ {t('billing.form.onlyCompletedVisitNote', 'Hanya menampilkan kunjungan berstatus Selesai (COMPLETED) yang belum lunas.')}</span>
                </p>
              )}

              {/* Visit Dropdown Menu */}
              {isVisitOpen && formData.patientId && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100">
                  {filteredVisits.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      {t('billing.form.noCompletedVisit', 'Tidak ada kunjungan selesai (COMPLETED) yang belum lunas untuk pasien ini')}
                    </div>
                  ) : (
                    filteredVisits.map(visit => {
                      const isSelected = formData.visitId === visit.id
                      const queueNo = visit.queueNumberFormatted || visit.queueNumber || `Visit #${visit.id}`
                      const dateStr = new Date(visit.scheduledAt || visit.createdAt).toLocaleDateString(
                        i18n.language === 'id' ? 'id-ID' : 'en-US'
                      )

                      return (
                        <div
                          key={visit.id}
                          onClick={() => handleSelectVisit(visit)}
                          className={`p-3 hover:bg-blue-50/70 cursor-pointer transition-colors flex items-center justify-between ${
                            isSelected ? 'bg-blue-50 font-semibold' : ''
                          }`}
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{queueNo} • {dateStr}</span>
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {i18n.language === 'id' ? 'Tipe' : 'Type'}: <span className="font-semibold text-gray-700">{visit.visitType}</span> {visit.doctor?.name ? `• ${i18n.language === 'id' ? 'Dokter' : 'Doctor'}: ${visit.doctor.name}` : ''}
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

        {/* Section 2: Billing Items List */}
        <div className="card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>{t('billing.form.items', 'Rincian Item Tagihan')}</span>
              </h2>
              <p className="text-xs text-gray-500">{t('billing.form.itemsSubtitle', 'Pilih obat dari Master Medicine (stok otomatis berkurang) atau isi layanan kustom.')}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => addItem('MEDICINE')}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Pill className="w-3.5 h-3.5" />
                <span>{t('billing.form.addMedicineItem', '+ Obat (Medicine)')}</span>
              </button>

              <button
                type="button"
                onClick={handleAddInpatientItem}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-300 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Bed className="w-3.5 h-3.5" />
                <span>{t('billing.form.addInpatientItem', '+ Tagihan Rawat Inap')}</span>
              </button>

              <button
                type="button"
                onClick={() => addItem('CUSTOM')}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t('billing.form.addCustomItem', '+ Item Kustom')}</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => {
              const isMedicine = item.type === 'MEDICINE'

              const filteredItemMedicines = medicines.filter(med => {
                const query = (item.medicineSearch || '').toLowerCase().trim()
                if (!query) return true
                return (
                  med.name?.toLowerCase().includes(query) ||
                  med.description?.toLowerCase().includes(query)
                )
              })

              return (
                <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 relative group">
                  
                  {/* Row Top Bar: Type Selector & Delete */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-gray-500">{t('billing.form.itemType', 'Item')} #{index + 1}:</span>
                      
                      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => handleItemTypeChange(index, 'MEDICINE')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                            isMedicine ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <Pill className="w-3 h-3" />
                          <span>{t('billing.form.medicineOption', 'Obat (Medicine)')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemTypeChange(index, 'CUSTOM')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                            !isMedicine ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <FileText className="w-3 h-3" />
                          <span>{t('billing.form.customOption', 'Custom / Layanan')}</span>
                        </button>
                      </div>
                    </div>

                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700 p-1 font-bold text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t('billing.form.removeItem', 'Hapus Item')}</span>
                      </button>
                    )}
                  </div>

                  {/* Row Fields */}
                  {isMedicine ? (
                    /* MEDICINE ITEM FIELDS */
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      
                      {/* Medicine Search Autocomplete */}
                      <div className="md:col-span-5 relative">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          {t('billing.form.searchMedicine', 'Cari Nama Obat')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={item.medicineSearch}
                            onFocus={() => {
                              setFormData(prev => {
                                const newItems = [...prev.items]
                                newItems[index].isDropdownOpen = true
                                return { ...prev, items: newItems }
                              })
                            }}
                            onChange={(e) => {
                              const val = e.target.value
                              setFormData(prev => {
                                const newItems = [...prev.items]
                                newItems[index].medicineSearch = val
                                newItems[index].isDropdownOpen = true
                                if (newItems[index].medicineId) {
                                  newItems[index].medicineId = null
                                  newItems[index].description = val
                                } else {
                                  newItems[index].description = val
                                }
                                return { ...prev, items: newItems }
                              })
                            }}
                            placeholder={t('billing.form.searchMedicinePlaceholder', 'Ketik nama obat (misal: Paracetamol)...')}
                            className="input pl-8 text-xs font-semibold"
                            required
                          />
                        </div>

                        {/* Medicine Dropdown Menu */}
                        {item.isDropdownOpen && (
                          <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
                            {filteredItemMedicines.length === 0 ? (
                              <div className="p-3 text-center text-xs text-gray-500">
                                {t('billing.form.medicineNotFound', 'Obat tidak ditemukan')}
                              </div>
                            ) : (
                              filteredItemMedicines.map(med => (
                                <div
                                  key={med.id}
                                  onClick={() => handleSelectMedicineForItem(index, med)}
                                  className="p-2.5 hover:bg-emerald-50 cursor-pointer transition-colors flex items-center justify-between"
                                >
                                  <div>
                                    <p className="text-xs font-bold text-gray-900">{med.name}</p>
                                    <p className="text-[10px] text-gray-500">
                                      {i18n.language === 'id' ? 'Harga' : 'Price'}: {formatCurrency(med.price)} / {med.unit} • {i18n.language === 'id' ? 'Stok' : 'Stock'}: <span className="font-bold text-gray-700">{med.totalStock || 0}</span>
                                    </p>
                                  </div>
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                    {t('billing.form.selectMedicine', 'Pilih')}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* Stock Info Badge */}
                        {item.stockAvailable !== null && (
                          <div className="mt-1 flex items-center space-x-2">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                              {t('billing.form.stockAvailable', 'Stok Tersedia')}: {item.stockAvailable} {item.unit}
                            </span>

                            {item.qty > item.stockAvailable && (
                              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                                {t('billing.form.stockExceeded', 'Qty melebihi stok!')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Unit Price */}
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          {t('billing.form.unitPrice', 'Harga Satuan')}
                        </label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                          placeholder="0"
                          min="0"
                          className="input text-xs font-semibold"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          {t('billing.form.qty', 'Jumlah (Qty)')}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleQtyChange(index, e.target.value)}
                          className="input text-xs font-bold text-center"
                          required
                        />
                      </div>

                      {/* Total Item Amount */}
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          {t('billing.form.itemTotal', 'Total')}
                        </label>
                        <input
                          type="number"
                          value={item.amount}
                          readOnly
                          className="input text-xs font-bold bg-gray-100 text-gray-900 cursor-not-allowed"
                        />
                      </div>

                    </div>
                  ) : (
                    /* CUSTOM ITEM FIELDS */
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      <div className="md:col-span-8">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          {t('billing.form.customDescription', 'Deskripsi Layanan / Tindakan Kustom')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleCustomItemChange(index, 'description', e.target.value)}
                          className="input text-xs"
                          placeholder={t('billing.form.customDescriptionPlaceholder', 'Contoh: Konsultasi Dokter Spesialis, Tindakan Laboratorium...')}
                          required
                        />
                      </div>

                      <div className="md:col-span-4">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          {t('billing.form.customAmount', 'Total Biaya')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => handleCustomItemChange(index, 'amount', e.target.value)}
                          className="input text-xs font-bold"
                          placeholder="0"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        </div>

        {/* Section 3: Totals & Calculations */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{t('billing.form.calculations', 'Perhitungan Pembayaran')}</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('billing.form.taxPercent', 'Pajak / PPN (%)')}
                </label>
                <input
                  type="number"
                  name="tax"
                  value={formData.tax}
                  onChange={handleChange}
                  className="input"
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('billing.form.discountAmount', 'Diskon / Potongan')}
                </label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleChange}
                  className="input"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('billing.table.subtotal', 'Subtotal')}:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('billing.table.tax', 'Pajak')} ({formData.tax}%):</span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('billing.table.discount', 'Diskon')}:</span>
                <span className="font-medium text-red-600">- {formatCurrency(discount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>{t('billing.table.total', 'Total Tagihan')}:</span>
                <span className="text-primary-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/billing')}
            className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            disabled={submitting}
          >
            {t('common.cancel', 'Batal')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {t('billing.form.saving', 'Menyimpan...')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t('billing.form.saveButton', 'Simpan Tagihan')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default BillingForm
