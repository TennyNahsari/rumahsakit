import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { recordService } from '../services'
import { FileText, Download, Eye, Edit, Trash2, Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const Records = () => {
  const { t, i18n } = useTranslation()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    patientName: '',
    startDate: '',
    endDate: ''
  })

  const fetchRecords = async (page = 1) => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 10,
        patientName: filters.patientName,
        startDate: filters.startDate,
        endDate: filters.endDate
      }
      
      const response = await recordService.getRecords(params)
      setRecords(response.data.records)
      setTotalPages(response.data.pagination.pages)
    } catch (error) {
      toast.error(t('records.fetchFailed'))
      console.error('Fetch records error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords(currentPage)
  }, [currentPage, filters.patientName, filters.startDate, filters.endDate])

  const handleExport = async () => {
    try {
      toast.loading(t('records.exporting'))
      const params = {
        patientName: filters.patientName,
        startDate: filters.startDate,
        endDate: filters.endDate
      }
      const response = await recordService.exportRecords(params)
      
      // Create blob and download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Rekam_Medis_${filters.startDate || 'Semua'}_sd_${filters.endDate || 'Semua'}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.dismiss()
      toast.success(t('records.exportSuccess'))
    } catch (error) {
      toast.dismiss()
      toast.error(t('records.exportFailed'))
      console.error('Export error:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm(t('records.deleteConfirm'))) {
      try {
        await recordService.deleteRecord(id)
        toast.success(t('records.deleteSuccess'))
        fetchRecords(currentPage)
      } catch (error) {
        toast.error(t('records.deleteFailed'))
      }
    }
  }

  const calculateAge = (dateOfBirth) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const formatDate = (dateString) => {
    const locale = i18n.language === 'id' ? 'id-ID' : 'en-US'
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    const locale = i18n.language === 'id' ? 'id-ID' : 'en-US'
    return new Date(dateString).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('records.title')}</h1>
          <p className="text-sm text-gray-600">{t('records.subtitle')}</p>
        </div>
        <Link to="/records/new" className="btn btn-primary text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">{t('records.addRecord')}</span>
          <span className="sm:hidden">Add Record</span>
        </Link>
      </div>

      {/* Filters Card */}
      <div className="card bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filter Nama Pasien */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center space-x-1">
              <Search className="w-3.5 h-3.5 text-[#0052CC]" />
              <span>Nama Pasien</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama pasien..."
                value={filters.patientName}
                onChange={(e) => setFilters(prev => ({ ...prev, patientName: e.target.value }))}
                className="w-full text-xs p-2.5 pl-9 rounded-lg border border-gray-300 focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] outline-none"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              {filters.patientName && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, patientName: '' }))}
                  className="absolute right-2.5 top-2.5 text-xs text-gray-400 hover:text-gray-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Tanggal Mulai */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              {t('records.filters.startDate')}
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none"
            />
          </div>

          {/* Tanggal Akhir */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              {t('records.filters.endDate')}
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none"
            />
          </div>

          {/* Tombol Ekspor */}
          <div className="flex items-end">
            <button 
              onClick={handleExport}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-2 w-full shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{t('records.exportData')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('common.noData')}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('records.table.patient')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('records.table.doctor')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('records.table.diagnosis')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('records.table.symptoms')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('records.table.date')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('records.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.patient.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.patient.medicalRecordNo}
                        </div>
                        <div className="text-sm text-gray-500">
                          {calculateAge(record.patient.dateOfBirth)} {t('records.table.yearsOld')} • {record.patient.gender === 'MALE' ? 'L' : 'P'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.doctor.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.doctor.department}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {record.diagnosisCode && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                              {record.diagnosisCode}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-900 mt-1">
                          {record.diagnosis || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {record.symptoms || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(record.createdAt)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(record.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/records/${record.id}`}
                            className="text-primary-600 hover:text-primary-900"
                            title={t('common.view')}
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/records/${record.id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                            title={t('common.edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="text-red-600 hover:text-red-900"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-200">
              {records.map((record) => (
                <div key={record.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">{record.patient.name}</div>
                      <div className="text-xs text-gray-500">
                        {record.patient.medicalRecordNo} • {calculateAge(record.patient.dateOfBirth)} yrs • {record.patient.gender === 'MALE' ? 'L' : 'P'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <Link
                        to={`/records/${record.id}`}
                        className="text-primary-600 hover:text-primary-900 p-1"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/records/${record.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Doctor:</span>
                      <span className="ml-1 font-medium text-gray-900">{record.doctor.name}</span>
                      <span className="ml-1 text-xs text-gray-500">({record.doctor.department})</span>
                    </div>
                    {(record.diagnosisCode || record.diagnosis) && (
                      <div>
                        <span className="text-gray-500">Diagnosis:</span>
                        {record.diagnosisCode && (
                          <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {record.diagnosisCode}
                          </span>
                        )}
                        {record.diagnosis && (
                          <div className="mt-1 text-gray-900">{record.diagnosis}</div>
                        )}
                      </div>
                    )}
                    {record.symptoms && (
                      <div>
                        <span className="text-gray-500">Symptoms:</span>
                        <div className="mt-1 text-gray-900">{record.symptoms}</div>
                      </div>
                    )}
                    <div className="text-xs text-gray-400 pt-1">
                      {formatDate(record.createdAt)} • {formatTime(record.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    <span className="hidden sm:inline">Halaman </span>
                    <span className="font-medium">{currentPage}</span>
                    <span className="hidden sm:inline"> dari </span>
                    <span className="sm:hidden">/</span>
                    <span className="font-medium">{totalPages}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="btn btn-secondary text-sm disabled:opacity-50"
                    >
                      <span className="hidden sm:inline">Sebelumnya</span>
                      <span className="sm:hidden">Prev</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="btn btn-secondary text-sm disabled:opacity-50"
                    >
                      <span className="hidden sm:inline">Selanjutnya</span>
                      <span className="sm:hidden">Next</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Records