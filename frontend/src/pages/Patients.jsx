import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { patientService } from '../services'
import { Search, Plus, Eye, Edit, Trash2, Filter, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

const Patients = () => {
  const { t } = useTranslation()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    gender: '',
    ageRange: ''
  })

  const fetchPatients = async (page = 1, search = '', gender = '') => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 10,
        ...(search && { search }),
        ...(gender && { gender })
      }
      
      const response = await patientService.getPatients(params)
      setPatients(response.data.patients)
      setTotalPages(response.data.pagination.pages)
    } catch (error) {
      toast.error(t('patients.fetchFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients(currentPage, searchTerm, filters.gender)
  }, [currentPage, filters.gender])

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchPatients(1, searchTerm, filters.gender)
  }

  const handleDelete = async (id) => {
    if (window.confirm(t('patients.deleteConfirm'))) {
      try {
        await patientService.deletePatient(id)
        toast.success(t('patients.deleteSuccess'))
        fetchPatients(currentPage, searchTerm)
      } catch (error) {
        toast.error(t('patients.deleteFailed'))
      }
    }
  }

  const handleExport = async () => {
    try {
      toast.loading(t('patients.exporting'))
      const response = await patientService.exportPatients()
      
      // Create blob and download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Data_Pasien_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.dismiss()
      toast.success(t('patients.exportSuccess'))
    } catch (error) {
      toast.dismiss()
      toast.error(t('patients.exportFailed'))
      console.error('Export error:', error)
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('patients.title')}</h1>
          <p className="text-sm text-gray-600">Manage patient information and records</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button 
            onClick={handleExport}
            className="btn bg-green-600 hover:bg-green-700 text-white text-sm"
          >
            <Download className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{t('patients.exportData')}</span>
            <span className="sm:hidden">Export</span>
          </button>
          <Link to="/patients/new" className="btn btn-primary text-sm">
            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{t('patients.registerNew')}</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('patients.searchPlaceholder')}
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>
          
          <div className="flex gap-2">
            <select
              className="form-input min-w-[120px]"
              value={filters.gender}
              onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
            >
              <option value="">All Genders</option>
              <option value="MALE">{t('patients.gender.male')}</option>
              <option value="FEMALE">{t('patients.gender.female')}</option>
              <option value="OTHER">{t('patients.gender.other')}</option>
            </select>
            
            <button className="btn btn-secondary">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="card p-0">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('patients.table.mrn')}</th>
                    <th>{t('patients.table.name')}</th>
                    <th>Age/Gender</th>
                    <th>{t('patients.table.phone')}</th>
                    <th>Visits</th>
                    <th>Registered</th>
                    <th>{t('patients.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {patients.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-gray-500">
                        {t('common.noData')}
                      </td>
                    </tr>
                  ) : (
                    patients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-gray-50">
                        <td className="font-mono text-sm">{patient.medicalRecordNo}</td>
                        <td>
                          <div className="font-medium text-gray-900">{patient.name}</div>
                        </td>
                        <td>
                          <div className="text-sm">
                            <div>{calculateAge(patient.dateOfBirth)} {t('patients.detail.yearsOld')}</div>
                            <div className="text-gray-500">{t(`patients.gender.${patient.gender.toLowerCase()}`)}</div>
                          </div>
                        </td>
                        <td className="text-sm">{patient.phone || '-'}</td>
                        <td>
                          <span className="badge badge-gray">
                            {patient._count?.visits || 0} visits
                          </span>
                        </td>
                        <td className="text-sm text-gray-500">
                          {formatDate(patient.createdAt)}
                        </td>
                        <td>
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/patients/${patient.id}`}
                              className="text-primary-600 hover:text-primary-800"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              to={`/patients/${patient.id}/edit`}
                              className="text-yellow-600 hover:text-yellow-800"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(patient.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {patients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t('common.noData')}
                </div>
              ) : (
                patients.map((patient) => (
                  <div key={patient.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">{patient.name}</div>
                        <div className="text-xs font-mono text-gray-500">MRN: {patient.medicalRecordNo}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/patients/${patient.id}`}
                          className="text-primary-600 hover:text-primary-800 p-1"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/patients/${patient.id}/edit`}
                          className="text-yellow-600 hover:text-yellow-800 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(patient.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Age:</span>
                        <span className="ml-1 font-medium">{calculateAge(patient.dateOfBirth)} yrs</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Gender:</span>
                        <span className="ml-1 font-medium">{t(`patients.gender.${patient.gender.toLowerCase()}`)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <span className="ml-1 font-medium">{patient.phone || '-'}</span>
                      </div>
                      <div>
                        <span className="badge badge-gray text-xs">
                          {patient._count?.visits || 0} visits
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      Registered: {formatDate(patient.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Patients