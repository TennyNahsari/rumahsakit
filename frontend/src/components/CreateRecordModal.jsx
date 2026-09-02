import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { recordService } from '../services'
import { X, FileText, User, Stethoscope, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const CreateRecordModal = ({ visit, isOpen, onClose, onSuccess }) => {
  const { t, i18n } = useTranslation()
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    diagnosisCode: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    prescription: ''
  })

  useEffect(() => {
    if (visit) {
      setFormData({
        diagnosisCode: '',
        symptoms: visit.notes || '',
        diagnosis: '',
        treatment: '',
        prescription: ''
      })
    }
  }, [visit])

  if (!isOpen || !visit) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.diagnosis.trim()) {
      toast.error(t('records.form.diagnosisRequired', 'Diagnosis medis wajib diisi'))
      return
    }

    try {
      setSubmitting(true)

      const submitData = {
        visitId: visit.id,
        patientId: visit.patientId,
        doctorId: visit.doctorId,
        diagnosisCode: formData.diagnosisCode.trim() || null,
        symptoms: formData.symptoms.trim() || null,
        diagnosis: formData.diagnosis.trim(),
        treatment: formData.treatment.trim() || null,
        prescription: formData.prescription.trim() || null
      }

      await recordService.createRecord(submitData)
      toast.success(t('records.form.createSuccess', 'Rekam medis berhasil dibuat'))
      
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      console.error('Create medical record error:', error)
      toast.error(error.response?.data?.error || t('records.form.createFailed', 'Gagal membuat rekam medis'))
    } finally {
      setSubmitting(false)
    }
  }

  const queueNo = visit.queueNumberFormatted || visit.queueNumber || `Visit #${visit.id}`
  const scheduledDate = new Date(visit.scheduledAt || visit.createdAt).toLocaleDateString(
    i18n.language === 'id' ? 'id-ID' : 'en-US'
  )

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-[#0052CC] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <FileText className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {t('records.form.quickCreateTitle', 'Buat Rekam Medis Pasien')}
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                {queueNo} • {scheduledDate} ({visit.visitType})
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Patient & Doctor Context Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-[#0052CC] shrink-0" />
              <div>
                <p className="text-gray-500 font-medium">{t('records.form.patient', 'Pasien')}:</p>
                <p className="font-bold text-gray-900">{visit.patient?.name}</p>
                <p className="font-mono text-[10px] text-gray-500">RM: {visit.patient?.medicalRecordNo}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 border-t sm:border-t-0 sm:border-l border-blue-100 pt-2 sm:pt-0 sm:pl-3">
              <Stethoscope className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <p className="text-gray-500 font-medium">{t('records.form.doctor', 'Dokter')}:</p>
                <p className="font-bold text-gray-900">{visit.doctor?.name}</p>
                <p className="text-[10px] text-gray-500">{visit.doctor?.department || (i18n.language === 'id' ? 'Spesialis' : 'Specialist')}</p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            
            {/* Diagnosis (Required) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('records.form.diagnosis', 'Diagnosis Medis')} <span className="text-red-500">*</span>
              </label>
              <textarea
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                rows="3"
                placeholder={t('records.form.diagnosisPlaceholder', 'Hasil diagnosa medis dari dokter penanggung jawab...')}
                className="w-full text-xs font-medium p-3 rounded-xl border border-gray-300 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-y"
                required
              />
            </div>

            {/* Symptoms / Keluhan */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('records.form.symptoms', 'Keluhan / Gejala')}
              </label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                rows="2"
                placeholder={t('records.form.symptomsPlaceholder', 'Keluhan fisik / indikasi gejala awal pasien...')}
                className="w-full text-xs font-medium p-3 rounded-xl border border-gray-300 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-y"
              />
            </div>

            {/* Treatment / Tindakan & ICD-10 Code */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('records.form.treatment', 'Tindakan / Terapi')}
                </label>
                <textarea
                  name="treatment"
                  value={formData.treatment}
                  onChange={handleChange}
                  rows="2"
                  placeholder={t('records.form.treatmentPlaceholder', 'Tindakan medis yang dilakukan...')}
                  className="w-full text-xs font-medium p-3 rounded-xl border border-gray-300 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-y"
                />
              </div>

              {/* ICD-10 Diagnosis Code */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('records.form.diagnosisCode', 'Kode Diagnosis (ICD-10)')}
                </label>
                <input
                  type="text"
                  name="diagnosisCode"
                  value={formData.diagnosisCode}
                  onChange={handleChange}
                  placeholder={t('records.form.diagnosisCodePlaceholder', 'Contoh: J00, A09')}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-gray-300 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
            </div>

            {/* Prescription / Resep */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('records.form.prescription', 'Resep Obat / Instruksi Dosis')}
              </label>
              <textarea
                name="prescription"
                value={formData.prescription}
                onChange={handleChange}
                rows="2"
                placeholder={t('records.form.prescriptionPlaceholder', 'Daftar resep obat & aturan minum (misal: Paracetamol 3x1)...')}
                className="w-full text-xs font-mono p-3 rounded-xl border border-gray-300 focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-y"
              />
            </div>

          </div>

          {/* Modal Footer Actions */}
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
              className="px-5 py-2 bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center space-x-2 transition-all shadow-md"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                  <span>{t('records.form.saving', 'Menyimpan...')}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t('records.form.saveButton', 'Simpan Rekam Medis')}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}

export default CreateRecordModal
