import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { billingService, medicineService } from '../services'
import { 
  ArrowLeft, Save, Plus, Trash2, Search, Pill, FileText, AlertTriangle 
} from 'lucide-react'
import toast from 'react-hot-toast'

const BillingEdit = () => {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [medicines, setMedicines] = useState([])

  const [formData, setFormData] = useState({
    patientName: '',
    items: [
      {
        type: 'MEDICINE',
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
    discount: '0',
    status: 'UNPAID'
  })

  useEffect(() => {
    fetchBilling()
  }, [id])

  const fetchBilling = async () => {
    try {
      setLoading(true)
      const [billingResponse, medicinesResponse] = await Promise.all([
        billingService.getBilling(id),
        medicineService.getMedicines({ limit: 1000 })
      ])

      const billing = billingResponse.data?.billing || billingResponse.data
      const medsList = medicinesResponse.data?.medicines || medicinesResponse.data || []
      setMedicines(medsList)

      const rawItems = Array.isArray(billing.items) ? billing.items : []
      const parsedItems = rawItems.map(item => {
        const isMed = !!(item.medicineId || item.medicineName)
        const matchedMed = isMed 
          ? medsList.find(m => m.id === item.medicineId || m.name.toLowerCase() === (item.description || '').toLowerCase().trim())
          : medsList.find(m => m.name.toLowerCase() === (item.description || '').toLowerCase().trim())

        return {
          type: isMed || matchedMed ? 'MEDICINE' : 'CUSTOM',
          medicineId: item.medicineId || matchedMed?.id || null,
          medicineSearch: item.description || matchedMed?.name || '',
          isDropdownOpen: false,
          description: item.description || '',
          unitPrice: item.unitPrice ? item.unitPrice.toString() : (matchedMed ? matchedMed.price.toString() : item.amount.toString()),
          qty: item.qty || 1,
          amount: item.amount ? item.amount.toString() : '',
          stockAvailable: matchedMed ? matchedMed.totalStock : null,
          unit: matchedMed ? matchedMed.unit : ''
        }
      })

      setFormData({
        patientName: billing.patient?.name || '',
        items: parsedItems.length > 0 ? parsedItems : [{
          type: 'MEDICINE',
          medicineId: null,
          medicineSearch: '',
          isDropdownOpen: false,
          description: '',
          unitPrice: '',
          qty: 1,
          amount: '',
          stockAvailable: null,
          unit: ''
        }],
        tax: billing.subtotal ? ((parseFloat(billing.tax || 0) / parseFloat(billing.subtotal)) * 100).toFixed(2) : '10',
        discount: billing.discount ? billing.discount.toString() : '0',
        status: billing.status || 'UNPAID'
      })
    } catch (error) {
      console.error('Fetch billing error:', error)
      toast.error(t('billing.form.loadFailed', 'Gagal memuat data tagihan'))
      navigate('/billing')
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
        total,
        status: formData.status
      }

      await billingService.updateBilling(id, submitData)
      toast.success(t('billing.form.updateSuccess', 'Tagihan berhasil diperbarui'))
      navigate('/billing')
    } catch (error) {
      toast.error(error.response?.data?.error || t('billing.form.updateFailed', 'Gagal memperbarui tagihan'))
      console.error('Update billing error:', error)
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
          <h1 className="text-2xl font-bold text-gray-900">{t('billing.form.editTitle', 'Edit Tagihan')}</h1>
          <p className="text-gray-600">{t('billing.form.editSubtitle', 'Perbarui informasi tagihan')}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Patient Info (Readonly) */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{t('billing.detail.patientInfo', 'Informasi Pasien')}</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('billing.form.patient', 'Pasien')}
            </label>
            <input
              type="text"
              value={formData.patientName}
              className="input bg-gray-100 cursor-not-allowed text-gray-900 font-semibold"
              disabled
            />
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

            <div className="flex items-center gap-2">
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

        {/* Section 3: Totals & Status */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{t('billing.form.calculations', 'Perhitungan Pembayaran')} & {t('billing.table.status', 'Status')}</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('billing.table.status', 'Status Pembayaran')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input font-bold"
                  required
                >
                  <option value="UNPAID">{t('billing.status.unpaid', 'Belum Bayar')}</option>
                  <option value="PAID">{t('billing.status.paid', 'Lunas')}</option>
                  <option value="CANCELLED">{t('billing.status.cancelled', 'Dibatalkan')}</option>
                </select>
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
                <span className="text-[#0052CC]">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
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
                {t('billing.form.updateButton', 'Simpan Perubahan')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default BillingEdit
