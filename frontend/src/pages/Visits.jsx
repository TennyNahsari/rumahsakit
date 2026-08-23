import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { visitService } from '../services'
import { 
  Calendar, Clock, User, Search, Download, Filter, Eye, Edit, Trash2, Plus, 
  Volume2, CheckCircle2, Play, SkipForward, Printer, Tv, RefreshCw, AlertCircle,
  ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import ThermalTicketModal from '../components/ThermalTicketModal'

const Visits = () => {
  const { t, i18n } = useTranslation()
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeTab, setActiveTab] = useState('ALL') // ALL, SCHEDULED, CALLED, IN_PROGRESS, ONLINE_WEBSITE, EMERGENCY
  const [sortOrder, setSortOrder] = useState('DESC') // DESC (Latest Date), ASC (Earliest Date), QUEUE (Queue No)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  })

  // State for Thermal POS Printing Modal
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  const [selectedTicketData, setSelectedTicketData] = useState(null)

  // State for Excel Export Date Range Modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportDates, setExportDates] = useState({
    startDate: '',
    endDate: ''
  })

  const fetchVisits = async (page = 1) => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 50
      }
      
      const response = await visitService.getVisits(params)
      setVisits(response.data.visits)
      setTotalPages(response.data.pagination.pages)
    } catch (error) {
      toast.error(t('visits.fetchFailed'))
      console.error('Fetch visits error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVisits(currentPage)
  }, [currentPage])

  // Queue Operational Action Handlers
  const handleCallVisit = async (visit) => {
    try {
      await visitService.callVisit(visit.id)
      const queueNo = visit.queueNumberFormatted || visit.queueNumber
      toast.success(`${t('visits.actions.call')} ${queueNo} (${visit.patient?.name})`, {
        icon: '🔊',
        duration: 4000
      })
      fetchVisits(currentPage)
    } catch (error) {
      toast.error(t('visits.fetchFailed'))
    }
  }

  const handleStartVisit = async (visit) => {
    try {
      await visitService.startVisit(visit.id)
      const queueNo = visit.queueNumberFormatted || visit.queueNumber
      toast.success(`${t('visits.actions.start')}: ${visit.patient?.name} (${queueNo})`)
      fetchVisits(currentPage)
    } catch (error) {
      toast.error(t('visits.fetchFailed'))
    }
  }

  const handleCompleteVisit = async (visit) => {
    try {
      const response = await visitService.completeVisit(visit.id)
      const queueNo = visit.queueNumberFormatted || visit.queueNumber
      toast.success(`${t('visits.actions.complete')}: ${queueNo}!`)
      
      if (response.data?.nextVisit) {
        const nextQueueNo = response.data.nextVisit.queueNumberFormatted || response.data.nextVisit.queueNumber
        toast(`${t('visits.status.scheduled')}: ${nextQueueNo} (${response.data.nextVisit.patient?.name})`, {
          icon: '👉'
        })
      }
      fetchVisits(currentPage)
    } catch (error) {
      toast.error(t('visits.fetchFailed'))
    }
  }

  const handleSkipVisit = async (visit) => {
    try {
      await visitService.skipVisit(visit.id)
      const queueNo = visit.queueNumberFormatted || visit.queueNumber
      toast.warn(`${t('visits.actions.skip')} ${queueNo}`)
      fetchVisits(currentPage)
    } catch (error) {
      toast.error(t('visits.fetchFailed'))
    }
  }

  const handleAutoCompleteDay = async () => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan (CANCEL) seluruh sisa antrean yang belum selesai hari ini?')) {
      try {
        const response = await visitService.autoCompleteDay()
        toast.success(`⚡ ${response.updatedCount || 0} antrean berhasil dibatalkan (CANCELLED)!`, {
          icon: '❌',
          duration: 4000
        })
        fetchVisits(currentPage)
      } catch (error) {
        toast.error('Gagal membatalkan antrean hari ini')
      }
    }
  }

  const openPrintTicket = (visit) => {
    const localeDate = new Date(visit.scheduledAt || visit.createdAt).toLocaleDateString(
      i18n.language === 'id' ? 'id-ID' : 'en-US'
    )
    const ticketInfo = {
      queueNumberFormatted: visit.queueNumberFormatted || visit.queueNumber || 'A-1',
      patientName: visit.patient?.name,
      medicalRecordNo: visit.patient?.medicalRecordNo,
      doctorName: visit.doctor?.name,
      department: visit.doctor?.department || 'Poliklinik',
      visitType: visit.visitType,
      channel: visit.channel || 'ONSITE_LOKET',
      date: localeDate
    }
    setSelectedTicketData(ticketInfo)
    setIsTicketModalOpen(true)
  }

  const handleExportSubmit = async (e) => {
    e.preventDefault()
    try {
      toast.loading(t('visits.exporting', 'Mengekspor data...'))
      const params = {
        startDate: exportDates.startDate,
        endDate: exportDates.endDate
      }
      const response = await visitService.exportVisits(params)
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Data_Kunjungan_${exportDates.startDate || 'Semua'}_sampai_${exportDates.endDate || 'Semua'}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.dismiss()
      toast.success(t('visits.exportSuccess', 'Data kunjungan berhasil diekspor'))
      setIsExportModalOpen(false)
    } catch (error) {
      toast.dismiss()
      toast.error(t('visits.exportFailed', 'Gagal mengekspor data'))
      console.error('Export error:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm(t('visits.deleteConfirm'))) {
      try {
        await visitService.deleteVisit(id)
        toast.success(t('visits.deleteSuccess'))
        fetchVisits(currentPage)
      } catch (error) {
        toast.error(t('visits.deleteFailed'))
      }
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      SCHEDULED: { label: t('visits.status.scheduled'), className: 'bg-blue-100 text-blue-800 border-blue-200' },
      CALLED: { label: t('visits.status.called'), className: 'bg-amber-100 text-amber-800 border-amber-300 font-bold animate-pulse' },
      IN_PROGRESS: { label: t('visits.status.inProgress'), className: 'bg-yellow-100 text-yellow-800 border-yellow-300 font-bold' },
      COMPLETED: { label: t('visits.status.completed'), className: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' },
      SKIPPED: { label: t('visits.status.skipped'), className: 'bg-gray-100 text-gray-700 border-gray-300' },
      CANCELLED: { label: t('visits.status.cancelled'), className: 'bg-red-100 text-red-800 border-red-200 font-bold' },
      NO_SHOW: { label: t('visits.status.noShow'), className: 'bg-gray-100 text-gray-800 border-gray-200' }
    }

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800 border-gray-200' }
    
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border inline-block ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const getVisitTypeBadge = (type) => {
    const typeConfig = {
      GENERAL_CHECKUP: { label: t('visits.visitType.generalCheckup'), className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      OUTPATIENT: { label: t('visits.visitType.outpatient'), className: 'bg-blue-50 text-blue-700 border-blue-200' },
      INPATIENT: { label: t('visits.visitType.inpatient'), className: 'bg-purple-50 text-purple-700 border-purple-200' },
      EMERGENCY: { label: t('visits.visitType.emergency'), className: 'bg-red-50 text-red-700 border-red-200 font-bold' },
      MEDICAL_ACTION: { label: t('visits.visitType.medicalAction'), className: 'bg-orange-50 text-orange-700 border-orange-200' }
    }

    const config = typeConfig[type] || { label: type, className: 'bg-gray-50 text-gray-700 border-gray-200' }
    
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${config.className}`}>
        {config.label}
      </span>
    )
  }

  // Filter & Sort Visits List
  const filteredVisits = visits.filter(visit => {
    const matchesSearch = 
      visit.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.patient?.medicalRecordNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (visit.queueNumberFormatted || '').toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (activeTab === 'SCHEDULED') return visit.status === 'SCHEDULED'
    if (activeTab === 'CALLED') return visit.status === 'CALLED'
    if (activeTab === 'IN_PROGRESS') return visit.status === 'IN_PROGRESS'
    if (activeTab === 'CANCELLED') return visit.status === 'CANCELLED'
    if (activeTab === 'ONLINE_WEBSITE') return visit.channel === 'ONLINE_WEBSITE'
    if (activeTab === 'EMERGENCY') return visit.visitType === 'EMERGENCY'

    return true
  }).sort((a, b) => {
    if (sortOrder === 'DESC') {
      return new Date(b.scheduledAt || b.createdAt) - new Date(a.scheduledAt || a.createdAt)
    }
    if (sortOrder === 'ASC') {
      return new Date(a.scheduledAt || a.createdAt) - new Date(b.scheduledAt || b.createdAt)
    }
    if (sortOrder === 'QUEUE') {
      return (a.queueNumberFormatted || '').localeCompare(b.queueNumberFormatted || '')
    }
    return 0
  })

  return (
    <div className="space-y-6">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <span>{t('visits.title')}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('visits.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Open TV Queue Display Screen */}
          <a
            href="/queue-display"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center space-x-2 transition-all shadow-md"
          >
            <Tv className="w-4 h-4 text-emerald-400" />
            <span>{t('visits.openTvDisplay')}</span>
          </a>

          {/* Auto-Complete / Cancel Day Button */}
          <button
            onClick={handleAutoCompleteDay}
            className="px-4 py-2 bg-red-50 text-red-900 border border-red-300 hover:bg-red-100 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-all shadow-sm"
            title="Tutup Operasional Harian: Otomatis Membatalkan (CANCEL) Semua Antrean Belum Terlayani"
          >
            <Zap className="w-4 h-4 text-red-600 fill-red-500" />
            <span>Tutup Hari (Cancel Sisa)</span>
          </button>

          {/* Export Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-xs font-bold rounded-lg flex items-center space-x-2 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-[#0052CC]" />
            <span>{t('visits.exportData')}</span>
          </button>

          {/* Add Visit Button */}
          <Link
            to="/visits/new"
            className="px-4 py-2 bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center space-x-2 transition-all shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t('visits.addVisit')}</span>
          </Link>
        </div>
      </div>

      {/* 2. Queue Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'ALL' ? 'bg-[#0052CC] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('visits.tabs.all')} ({visits.length})
        </button>

        <button
          onClick={() => setActiveTab('SCHEDULED')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'SCHEDULED' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          {t('visits.tabs.scheduled')} ({visits.filter(v => v.status === 'SCHEDULED').length})
        </button>

        <button
          onClick={() => setActiveTab('ONLINE_WEBSITE')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'ONLINE_WEBSITE' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          🌐 {t('visits.tabs.webPriority')} ({visits.filter(v => v.channel === 'ONLINE_WEBSITE').length})
        </button>

        <button
          onClick={() => setActiveTab('EMERGENCY')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'EMERGENCY' ? 'bg-red-600 text-white shadow-sm' : 'bg-red-50 text-red-700 hover:bg-red-100'
          }`}
        >
          🚨 {t('visits.tabs.emergency')} ({visits.filter(v => v.visitType === 'EMERGENCY').length})
        </button>

        <button
          onClick={() => setActiveTab('CALLED')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'CALLED' ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          {t('visits.tabs.called')} ({visits.filter(v => v.status === 'CALLED').length})
        </button>

        <button
          onClick={() => setActiveTab('IN_PROGRESS')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'IN_PROGRESS' ? 'bg-yellow-600 text-white shadow-sm' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
          }`}
        >
          {t('visits.tabs.inProgress')} ({visits.filter(v => v.status === 'IN_PROGRESS').length})
        </button>

        <button
          onClick={() => setActiveTab('CANCELLED')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'CANCELLED' ? 'bg-red-700 text-white shadow-sm' : 'bg-red-50 text-red-800 hover:bg-red-100'
          }`}
        >
          ❌ {t('visits.status.cancelled', 'Dibatalkan')} ({visits.filter(v => v.status === 'CANCELLED').length})
        </button>
      </div>

      {/* 3. Search & Sort Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, queue no. (e.g. A-1, WEB-A-1), MRN, doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] outline-none"
          />
        </div>

        {/* Sort Dropdown Selector */}
        <div className="flex items-center space-x-2 w-full md:w-auto shrink-0">
          <ArrowUpDown className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-bold text-gray-700">{t('visits.sortBy')}</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="text-xs p-2.5 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none bg-white font-semibold text-gray-800"
          >
            <option value="DESC">📅 {t('visits.sortNewest')}</option>
            <option value="ASC">📅 {t('visits.sortOldest')}</option>
            <option value="QUEUE">🎫 {t('visits.sortQueue')}</option>
          </select>

          <button
            onClick={() => fetchVisits(currentPage)}
            className="p-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center space-x-1 text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Visits Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-xs font-semibold text-gray-500">
            <span>{t('common.loading')}</span>
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="text-center py-16 text-xs text-gray-500">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <span>{t('common.noData')}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-gray-900 uppercase text-[10px] tracking-wider font-extrabold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3.5">{t('visits.table.queueNo')}</th>
                  <th className="px-4 py-3.5">{t('visits.table.channel')}</th>
                  <th className="px-4 py-3.5">{t('visits.table.patientName')}</th>
                  <th className="px-4 py-3.5">{t('visits.table.doctorName')}</th>
                  <th className="px-4 py-3.5">{t('visits.table.visitType')}</th>
                  <th className="px-4 py-3.5">{t('visits.table.status')}</th>
                  <th className="px-4 py-3.5 text-center">{t('visits.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVisits.map((visit) => {
                  const queueNo = visit.queueNumberFormatted || visit.queueNumber || 'A-1'
                  const isWeb = visit.channel === 'ONLINE_WEBSITE'
                  const localeDate = new Date(visit.scheduledAt || visit.createdAt).toLocaleDateString(
                    i18n.language === 'id' ? 'id-ID' : 'en-US'
                  )

                  return (
                    <tr key={visit.id} className="hover:bg-blue-50/50 transition-colors">
                      
                      {/* Queue Number Badge */}
                      <td className="px-4 py-3.5 font-extrabold text-sm font-mono text-[#0052CC]">
                        <div className="inline-flex items-center space-x-1 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                          <span>{queueNo}</span>
                        </div>
                      </td>

                      {/* Channel Badge */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                          isWeb ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}>
                          {isWeb ? `🌐 ${t('visits.channel.web')}` : `🏬 ${t('visits.channel.loket')}`}
                        </span>
                      </td>

                      {/* Patient & RM */}
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-gray-900 text-xs">{visit.patient?.name}</p>
                        <p className="text-[10px] font-mono text-gray-500">RM: {visit.patient?.medicalRecordNo || '-'}</p>
                      </td>

                      {/* Doctor & Department */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-gray-800">{visit.doctor?.name}</p>
                        <p className="text-[10px] text-gray-500">{visit.doctor?.department || 'Poliklinik'}</p>
                      </td>

                      {/* Visit Type & Date */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          {getVisitTypeBadge(visit.visitType)}
                          <p className="text-[10px] text-gray-500">
                            {localeDate}
                          </p>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        {getStatusBadge(visit.status)}
                      </td>

                      {/* Operational Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center space-x-1.5">
                          
                          {/* 1. Call Visit */}
                          {(visit.status === 'SCHEDULED' || visit.status === 'CALLED') && (
                            <button
                              onClick={() => handleCallVisit(visit)}
                              title="Call Queue (TV Display)"
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-200 transition-all text-[11px] font-bold flex items-center space-x-1"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span className="hidden lg:inline">{visit.status === 'CALLED' ? t('visits.actions.recall') : t('visits.actions.call')}</span>
                            </button>
                          )}

                          {/* 2. Start Visit */}
                          {(visit.status === 'CALLED' || visit.status === 'SCHEDULED') && (
                            <button
                              onClick={() => handleStartVisit(visit)}
                              title="Start Examination"
                              className="p-1.5 rounded-lg bg-blue-50 text-[#0052CC] hover:bg-[#0052CC] hover:text-white border border-blue-200 transition-all text-[11px] font-bold flex items-center space-x-1"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span className="hidden lg:inline">{t('visits.actions.start')}</span>
                            </button>
                          )}

                          {/* 3. Complete Visit */}
                          {(visit.status === 'IN_PROGRESS' || visit.status === 'CALLED') && (
                            <button
                              onClick={() => handleCompleteVisit(visit)}
                              title="Complete Visit"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition-all text-[11px] font-bold flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="hidden lg:inline">{t('visits.actions.complete')}</span>
                            </button>
                          )}

                          {/* 4. Skip Visit */}
                          {visit.status === 'SCHEDULED' && (
                            <button
                              onClick={() => handleSkipVisit(visit)}
                              title="Skip No-Show Patient"
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-600 hover:text-white border border-gray-300 transition-all text-[11px] font-bold"
                            >
                              <SkipForward className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 5. Print Ticket POS */}
                          <button
                            onClick={() => openPrintTicket(visit)}
                            title="Print Thermal Ticket (58mm/80mm)"
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-800 hover:text-white border border-slate-300 transition-all text-[11px] font-bold"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* 6. Edit Visit */}
                          <Link
                            to={`/visits/${visit.id}/edit`}
                            title="Edit Kunjungan / Status"
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 transition-all text-[11px] font-bold flex items-center space-x-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">{t('common.edit', 'Edit')}</span>
                          </Link>

                          {/* Delete Action */}
                          <button
                            onClick={() => handleDelete(visit.id)}
                            title="Delete Visit"
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-transparent transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Pagination Controls Bar */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-medium text-gray-600">
            {t('common.showing', 'Menampilkan')} <span className="font-bold text-gray-900">{filteredVisits.length}</span> {t('visits.title', 'kunjungan')} • {i18n.language === 'id' ? 'Halaman' : 'Page'} <span className="font-bold text-gray-900">{currentPage}</span> {i18n.language === 'id' ? 'dari' : 'of'} <span className="font-bold text-gray-900">{totalPages || 1}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{t('common.previous', 'Sebelumnya')}</span>
            </button>

            <div className="flex items-center space-x-1">
              {[...Array(totalPages || 1)].map((_, idx) => {
                const pageNum = idx + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      currentPage === pageNum
                        ? 'bg-[#0052CC] text-white shadow-sm'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1"
            >
              <span>{t('common.next', 'Selanjutnya')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 6. Thermal Receipt Printing Modal */}
      <ThermalTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        ticketData={selectedTicketData}
      />

      {/* 7. Export Excel Date Range Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <Download className="w-5 h-5 text-[#0052CC]" />
                <span>Ekspor Excel Data Kunjungan</span>
              </h3>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Pilih rentang tanggal (Start Date & End Date) untuk menyaring data laporan kunjungan pasien yang akan diekspor.
            </p>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0]
                  setExportDates({ startDate: today, endDate: today })
                }}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#0052CC] border border-blue-200 text-[11px] font-bold rounded-md"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => {
                  const end = new Date().toISOString().split('T')[0]
                  const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  setExportDates({ startDate: start, endDate: end })
                }}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded-md"
              >
                7 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date()
                  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
                  const end = now.toISOString().split('T')[0]
                  setExportDates({ startDate: start, endDate: end })
                }}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded-md"
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => setExportDates({ startDate: '', endDate: '' })}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded-md"
              >
                Semua Data
              </button>
            </div>

            {/* Form Date Inputs */}
            <form onSubmit={handleExportSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tanggal Mulai (Start Date)
                  </label>
                  <input
                    type="date"
                    value={exportDates.startDate}
                    onChange={(e) => setExportDates(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tanggal Akhir (End Date)
                  </label>
                  <input
                    type="date"
                    value={exportDates.endDate}
                    onChange={(e) => setExportDates(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1 shadow-md shadow-blue-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File Excel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Visits