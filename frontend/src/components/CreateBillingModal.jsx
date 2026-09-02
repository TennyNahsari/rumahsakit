import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { billingService, medicineService } from '../services'
import { X, CreditCard, User, Calendar, Save, Plus, Trash2, Search, Pill, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const CreateBillingModal = ({ visit, isOpen, onClose, onSuccess }) => {
  const { t, i18n } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [medicines, setMedicines] = useState([])

  const [formData, setFormData] = useState({
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
    discount: '0'
  })

  useEffect(() => {
    if (isOpen) {
      fetchMedicines()
      setFormData({
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
        discount: '0'
      })
    }
  }, [isOpen])

  const fetchMedicines = async () => {
    try {
      const res = await medicineService.getMedicines({ limit: 1000 })
      setMedicines(res.data?.medicines || res.data || [])
    } catch (err) {
      console.error('Fetch medicines error:', err)
    }
  }

  if (!isOpen || !visit) return null

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

    const validItems = formData.items.every(item => 
      item.description.trim() && item.amount && parseFloat(item.amount) > 0
    )

    if (!validItems) {
      toast.error(t('billing.form.validation.itemRequired', 'Seluruh item tagihan harus diisi dengan benar'))
      return
    }

    try {
      setSubmitting(true)
      const { subtotal, tax, discount, total } = calculateTotals()

      const submitData = {
        patientId: visit.patientId,
        visitId: visit.id,
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

      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      console.error('Create billing error:', error)
      toast.error(error.response?.data?.error || t('billing.form.createFailed', 'Gagal membuat tagihan'))
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
  const queueNo = visit.queueNumberFormatted || visit.queueNumber || `Visit #${visit.id}`

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-[#0052CC] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {t('billing.form.quickCreateTitle', 'Buat Tagihan Baru Pasien')}
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                {queueNo} • {visit.patient?.name} (RM: {visit.patient?.medicalRecordNo})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Patient Info Context */}
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-[#0052CC]" />
              <div>
                <span className="text-gray-500 font-medium">{t('billing.form.patient', 'Pasien')}: </span>
                <span className="font-bold text-gray-900">{visit.patient?.name}</span>
                <span className="text-gray-500 ml-2">RM: {visit.patient?.medicalRecordNo}</span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 text-gray-600">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>{visit.visitType}</span>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                {t('billing.form.items', 'Rincian Item Tagihan')}
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addItem('MEDICINE')}
                  className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 text-[11px] font-bold rounded-lg flex items-center gap-1"
                >
                  <Pill className="w-3 h-3" />
                  <span>{t('billing.form.addMedicineItem', '+ Obat')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => addItem('CUSTOM')}
                  className="px-2.5 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 text-[11px] font-bold rounded-lg flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  <span>{t('billing.form.addCustomItem', '+ Layanan')}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => {
                const isMedicine = item.type === 'MEDICINE'

                const filteredItemMedicines = medicines.filter(med => {
                  const query = (item.medicineSearch || '').toLowerCase().trim()
                  if (!query) return true
                  return med.name?.toLowerCase().includes(query)
                })

                return (
                  <div key={index} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-500">#{index + 1}</span>
                        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
                          <button
                            type="button"
                            onClick={() => handleItemTypeChange(index, 'MEDICINE')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isMedicine ? 'bg-emerald-600 text-white' : 'text-gray-600'
                            }`}
                          >
                            {t('billing.form.medicineOption', 'Obat')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleItemTypeChange(index, 'CUSTOM')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              !isMedicine ? 'bg-slate-800 text-white' : 'text-gray-600'
                            }`}
                          >
                            {t('billing.form.customOption', 'Custom')}
                          </button>
                        </div>
                      </div>

                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {isMedicine ? (
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start text-xs">
                        <div className="sm:col-span-5 relative">
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
                            placeholder={t('billing.form.searchMedicinePlaceholder', 'Cari obat...')}
                            className="input text-xs font-medium"
                            required
                          />

                          {item.isDropdownOpen && (
                            <div className="absolute z-30 mt-1 w-full bg-white border rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y">
                              {filteredItemMedicines.length === 0 ? (
                                <div className="p-2 text-center text-[11px] text-gray-500">{t('billing.form.medicineNotFound', 'Obat tidak ditemukan')}</div>
                              ) : (
                                filteredItemMedicines.map(med => (
                                  <div
                                    key={med.id}
                                    onClick={() => handleSelectMedicineForItem(index, med)}
                                    className="p-2 hover:bg-emerald-50 cursor-pointer flex justify-between"
                                  >
                                    <div>
                                      <p className="font-bold text-gray-900">{med.name}</p>
                                      <p className="text-[10px] text-gray-500">
                                        {i18n.language === 'id' ? 'Harga' : 'Price'}: {formatCurrency(med.price)} • {i18n.language === 'id' ? 'Stok' : 'Stock'}: {med.totalStock || 0}
                                      </p>
                                    </div>
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">{t('billing.form.selectMedicine', 'Pilih')}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>

                        <div className="sm:col-span-3">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                            placeholder={i18n.language === 'id' ? 'Harga Rp' : 'Price ($)'}
                            className="input text-xs"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleQtyChange(index, e.target.value)}
                            className="input text-xs font-bold text-center"
                            required
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <input
                            type="number"
                            value={item.amount}
                            readOnly
                            className="input text-xs font-bold bg-gray-100 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start text-xs">
                        <div className="sm:col-span-8">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleCustomItemChange(index, 'description', e.target.value)}
                            placeholder={t('billing.form.customDescriptionPlaceholder', 'Deskripsi layanan...')}
                            className="input text-xs"
                            required
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) => handleCustomItemChange(index, 'amount', e.target.value)}
                            placeholder={i18n.language === 'id' ? 'Total Rp' : 'Total Amount'}
                            className="input text-xs font-bold"
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

          {/* Tax, Discount & Total */}
          <div className="border-t pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">{t('billing.form.taxPercent', 'Pajak / PPN (%)')}</label>
                <input
                  type="number"
                  value={formData.tax}
                  onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">{t('billing.form.discountAmount', 'Diskon / Potongan (Rp)')}</label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  className="input text-xs"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('billing.table.subtotal', 'Subtotal')}:</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('billing.table.tax', 'Pajak')} ({formData.tax}%):</span>
                <span className="font-semibold">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>{t('billing.table.discount', 'Diskon')}:</span>
                <span className="font-semibold">- {formatCurrency(discount)}</span>
              </div>
              <div className="flex justify-between border-t pt-1.5 text-sm font-bold">
                <span>{t('billing.table.total', 'Total Tagihan')}:</span>
                <span className="text-[#0052CC]">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              {t('common.cancel', 'Batal')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                  <span>{t('billing.form.saving', 'Menyimpan...')}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t('billing.form.saveButton', 'Simpan Tagihan')}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default CreateBillingModal
