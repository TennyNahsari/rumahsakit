import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { Users, UserPlus, Calendar, FileText, TrendingUp, Activity, Brain, Loader2, AlertCircle, Share2, Instagram, Twitter, Youtube, Facebook, Linkedin, Save, CheckCircle2 } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { predictionAPI, settingsAPI } from '../services/api'
import toast from 'react-hot-toast'

const ThreadsIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.186 24h-.007c-3.582-.024-6.334-1.205-8.18-3.511C2.205 18.239 1.486 15.116 1.862 11.2c.48-5.006 3.65-9.15 8.113-10.596C11.393.13 13.016-.07 14.65.023c3.486.2 6.467 1.776 8.39 4.437 1.636 2.264 2.11 5.12 1.334 8.043-.918 3.461-3.418 6.064-6.86 7.143-1.63.51-3.324.63-5.034.356a.75.75 0 01.238-1.48c1.472.237 2.932.133 4.336-.307 2.946-.924 5.087-3.153 5.872-6.113.666-2.508.256-4.962-1.155-6.914-1.656-2.29-4.22-3.647-7.22-3.82-1.405-.08-2.798.093-4.14.526-3.83 1.24-6.55 4.802-6.96 9.096-.32 3.364.296 6.046 1.83 7.973 1.583 1.981 3.947 2.99 7.02 3.01h.007c3.157 0 5.674-.95 7.48-2.825 1.588-1.648 2.378-3.923 2.348-6.764-.02-1.897-.47-3.535-1.34-4.87-.962-1.478-2.346-2.483-4.004-2.906-1.486-.38-3.037-.253-4.484.366-1.57.671-2.756 1.874-3.43 3.477-.66 1.57-.756 3.297-.278 4.993.447 1.585 1.48 2.868 2.91 3.611 1.252.651 2.68.887 4.13.682.385-.054.672.336.56.708-.108.358-.456.577-.837.63-1.708.24-3.39-.036-4.86-.798-1.782-.924-3.07-2.52-3.626-4.493-.596-2.112-.476-4.263.348-6.22.842-2.003 2.324-3.506 4.285-4.344 1.808-.773 3.743-.932 5.6-.458 2.072.528 3.8 1.783 5.002 3.627 1.087 1.666 1.65 3.71 1.674 6.077.037 3.376-.88 6.076-2.726 8.026-2.158 2.24-5.12 3.373-8.8 3.373z"/>
  </svg>
)

const Dashboard = () => {
  const { user } = useAuth()
  const { t } = useTranslation()

  // AI Prediction state
  const [predictions, setPredictions] = useState(null)
  const [isTraining, setIsTraining] = useState(false)
  const [isPredicting, setIsPredicting] = useState(false)
  const [predictionError, setPredictionError] = useState(null)
  const [trainingMessage, setTrainingMessage] = useState(null)

  // Social Links state
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    twitter: '',
    youtube: '',
    facebook: '',
    linkedin: '',
    threads: ''
  })
  const [isSavingSocial, setIsSavingSocial] = useState(false)
  const [isLoadingSocial, setIsLoadingSocial] = useState(false)

  useEffect(() => {
    fetchSocialLinks()
  }, [])

  const fetchSocialLinks = async () => {
    try {
      setIsLoadingSocial(true)
      const res = await settingsAPI.getSocialLinks()
      if (res?.success && res?.data) {
        setSocialLinks(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch social links:', err)
    } finally {
      setIsLoadingSocial(false)
    }
  }

  const handleSaveSocialLinks = async (e) => {
    e.preventDefault()
    try {
      setIsSavingSocial(true)
      const res = await settingsAPI.updateSocialLinks(socialLinks)
      if (res?.success) {
        toast.success('Link social media berhasil diperbarui!')
      } else {
        toast.error('Gagal memperbarui link social media')
      }
    } catch (err) {
      console.error('Failed to update social links:', err)
      toast.error(err.response?.data?.error || 'Gagal menyimpan link social media')
    } finally {
      setIsSavingSocial(false)
    }
  }

  const stats = [
    {
      name: 'totalPatients',
      value: '2,543',
      change: '+12%',
      changeType: 'increase',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      name: 'todayVisits',
      value: '87',
      change: '+5%',
      changeType: 'increase',
      icon: Calendar,
      color: 'bg-green-500'
    },
    {
      name: 'pendingRecords',
      value: '23',
      change: '-2%',
      changeType: 'decrease',
      icon: FileText,
      color: 'bg-yellow-500'
    },
    {
      name: 'monthlyRevenue',
      value: 'Rp 125.430.000',
      change: '+18%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'bg-purple-500'
    }
  ]

  // Handle Train & Fetch
  const handleTrainModels = async () => {
    try {
      setIsTraining(true)
      setPredictionError(null)
      setTrainingMessage(null)
      
      const result = await predictionAPI.train()
      
      if (result.success) {
        setTrainingMessage(t('dashboard.ai.trainingSuccess'))
        setTimeout(() => setTrainingMessage(null), 5000)
      } else {
        setPredictionError(t('dashboard.ai.trainingFailed'))
      }
    } catch (error) {
      console.error('Training error:', error)
      setPredictionError(error.response?.data?.error || t('dashboard.ai.mlServiceUnavailable'))
    } finally {
      setIsTraining(false)
    }
  }

  // Handle Predict
  const handleGetPredictions = async () => {
    try {
      setIsPredicting(true)
      setPredictionError(null)
      
      const result = await predictionAPI.predict(7)
      
      if (result.success && result.data) {
        setPredictions(result.data)
      } else {
        setPredictionError(t('dashboard.ai.predictionFailed'))
      }
    } catch (error) {
      console.error('Prediction error:', error)
      setPredictionError(error.response?.data?.error || t('dashboard.ai.mlServiceUnavailable'))
    } finally {
      setIsPredicting(false)
    }
  }

  // Format chart data for visits
  const getVisitChartData = () => {
    if (!predictions?.visits) return []
    
    return predictions.visits.map(day => {
      const dataPoint = { date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
      day.top3.forEach((item, idx) => {
        dataPoint[item.type] = item.value
      })
      return dataPoint
    })
  }

  // Format chart data for rooms
  const getRoomChartData = () => {
    if (!predictions?.rooms) return []
    
    return predictions.rooms.map(day => {
      const dataPoint = { date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
      day.top3.forEach((item, idx) => {
        dataPoint[item.type] = item.value
      })
      return dataPoint
    })
  }

  // Get unique visit types from predictions
  const getUniqueVisitTypes = () => {
    if (!predictions?.visits) return []
    const types = new Set()
    predictions.visits.forEach(day => {
      day.top3.forEach(item => types.add(item.type))
    })
    return Array.from(types)
  }

  // Get unique room types from predictions
  const getUniqueRoomTypes = () => {
    if (!predictions?.rooms) return []
    const types = new Set()
    predictions.rooms.forEach(day => {
      day.top3.forEach(item => types.add(item.type))
    })
    return Array.from(types)
  }

  // Color mapping for visit types
  const visitColors = {
    'GENERAL_CHECKUP': '#3b82f6',
    'OUTPATIENT': '#8b5cf6',
    'INPATIENT': '#10b981',
    'EMERGENCY': '#ef4444',
    'MEDICAL_ACTION': '#f59e0b'
  }

  // Color mapping for room types
  const roomColors = {
    'VIP': '#8b5cf6',
    'KELAS_1': '#3b82f6',
    'KELAS_2': '#10b981',
    'KELAS_3': '#f59e0b',
    'ICU': '#ef4444',
    'NICU': '#ec4899',
    'PICU': '#06b6d4',
    'ISOLATION': '#6366f1'
  }

  const recentActivities = [
    {
      id: 1,
      type: 'New Patient',
      description: 'Budi Santoso registered as new patient',
      time: '5 minutes ago',
      icon: UserPlus,
      color: 'text-blue-600'
    },
    {
      id: 2,
      type: 'Visit Completed',
      description: 'dr. Sarah completed consultation with patient',
      time: '15 minutes ago',
      icon: Activity,
      color: 'text-green-600'
    },
    {
      id: 3,
      type: 'New Record',
      description: 'Medical record updated for patient MRN20241024001',
      time: '1 hour ago',
      icon: FileText,
      color: 'text-yellow-600'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0052CC] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>MediSyst HMS • SIMRS Terpusat</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Selamat Datang, {user?.name || 'Dokter/Pengguna'}!
            </h1>
            <p className="mt-1 text-sm text-blue-100 font-medium">
              Role: <span className="uppercase font-bold bg-blue-900/50 px-2.5 py-0.5 rounded text-white">{user?.role}</span> • Sistem informasi operasional medis & bangsal rawat inap berjalan normal.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-white text-[#0052CC] font-bold text-xs rounded-lg hover:bg-blue-50 transition-all shadow-sm"
            >
              Halaman Landing
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 md:w-12 md:h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
                <div className="ml-3 md:ml-4 flex-1">
                  <p className="text-xs md:text-sm font-medium text-gray-600">{t(`dashboard.${stat.name}`)}</p>
                  <p className="text-lg md:text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-600 ml-2 hidden sm:inline">{t('dashboard.fromLastMonth')}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('dashboard.recentActivities')}</h2>
          <button className="text-xs md:text-sm text-blue-600 hover:text-blue-800 font-medium">
            {t('dashboard.viewAll')}
          </button>
        </div>
        <div className="space-y-4">
          {recentActivities.map((activity) => {
            const Icon = activity.icon
            return (
              <div key={activity.id} className="flex items-start">
                <div className={`flex-shrink-0 ${activity.color}`}>
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                  <p className="text-xs md:text-sm text-gray-500">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <button className="btn btn-primary justify-center text-sm md:text-base">
          <UserPlus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">New Patient</span>
          <span className="sm:hidden">New</span>
        </button>
        <button className="btn btn-secondary justify-center text-sm md:text-base">
          <Calendar className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Schedule Visit</span>
          <span className="sm:hidden">Schedule</span>
        </button>
        <button className="btn btn-secondary justify-center text-sm md:text-base">
          <FileText className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">View Records</span>
          <span className="sm:hidden">Records</span>
        </button>
        <button className="btn btn-secondary justify-center text-sm md:text-base">
          <TrendingUp className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">View Reports</span>
          <span className="sm:hidden">Reports</span>
        </button>
      </div>

      {/* AI Prediction Section */}
      <div className="card mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
            <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('dashboard.ai.title')}</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleTrainModels}
              disabled={isTraining || isPredicting}
              className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTraining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>{t('dashboard.ai.training')}</span>
                </>
              ) : (
                <span>{t('dashboard.ai.trainButton')}</span>
              )}
            </button>
            <button
              onClick={handleGetPredictions}
              disabled={isTraining || isPredicting}
              className="btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPredicting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>{t('dashboard.ai.predicting')}</span>
                </>
              ) : (
                <span>{t('dashboard.ai.predictButton')}</span>
              )}
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {trainingMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            {trainingMessage}
          </div>
        )}
        
        {predictionError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{predictionError}</span>
          </div>
        )}

        {/* Predictions Display */}
        {predictions ? (
          <div className="space-y-6">
            {/* Visit Predictions */}
            <div>
              <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-3">
                {t('dashboard.ai.visitPredictions')}
              </h3>
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={getVisitChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ fontSize: 12 }}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: 11 }}
                      formatter={(value) => t(`dashboard.ai.visitType.${value}`)}
                    />
                    {getUniqueVisitTypes().map((type) => (
                      <Line
                        key={type}
                        type="monotone"
                        dataKey={type}
                        stroke={visitColors[type] || '#6366f1'}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name={type}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Mobile Table for Visit Predictions */}
              <div className="mt-4 lg:hidden overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 py-2 text-left">{t('dashboard.ai.date')}</th>
                      <th className="px-2 py-2 text-left">{t('dashboard.ai.top3')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.visits.map((day, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-2 py-2 whitespace-nowrap">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-2 py-2">
                          <div className="space-y-1">
                            {day.top3.map((item, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <span 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: visitColors[item.type] }}
                                />
                                <span className="font-medium">
                                  {t(`dashboard.ai.visitType.${item.type}`)}:
                                </span>
                                <span>{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Room Predictions */}
            <div>
              <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-3">
                {t('dashboard.ai.roomPredictions')}
              </h3>
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getRoomChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ fontSize: 12 }}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: 11 }}
                      formatter={(value) => t(`dashboard.ai.roomType.${value}`)}
                    />
                    {getUniqueRoomTypes().map((type) => (
                      <Bar
                        key={type}
                        dataKey={type}
                        fill={roomColors[type] || '#6366f1'}
                        name={type}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Mobile Table for Room Predictions */}
              <div className="mt-4 lg:hidden overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 py-2 text-left">{t('dashboard.ai.date')}</th>
                      <th className="px-2 py-2 text-left">{t('dashboard.ai.top3')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.rooms.map((day, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-2 py-2 whitespace-nowrap">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-2 py-2">
                          <div className="space-y-1">
                            {day.top3.map((item, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <span 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: roomColors[item.type] }}
                                />
                                <span className="font-medium">
                                  {t(`dashboard.ai.roomType.${item.type}`)}:
                                </span>
                                <span>{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-xs text-gray-500 text-right">
              {t('dashboard.ai.generatedAt')}: {new Date(predictions.generated_at).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Brain className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">{t('dashboard.ai.noPredictions')}</p>
            <p className="text-xs mt-2">{t('dashboard.ai.clickPredict')}</p>
          </div>
        )}
      </div>

      {/* Social Media Links Configuration Section */}
      <div className="card mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 mb-6 gap-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-50 text-[#0052CC] rounded-xl flex items-center justify-center border border-blue-100 shadow-sm">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-gray-900">Pengaturan Link Social Media Footer</h2>
              <p className="text-xs text-gray-500">Kelola tautan akun media sosial yang tampil pada bagian footer landing page rumah sakit</p>
            </div>
          </div>
          {user?.role === 'ADMIN' && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
              Akses Admin Active
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSocialLinks} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Instagram */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center space-x-1.5">
                <Instagram className="w-4 h-4 text-pink-600" />
                <span>Instagram</span>
              </label>
              <input
                type="url"
                placeholder="https://instagram.com/namakamu"
                value={socialLinks.instagram}
                onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                disabled={user?.role !== 'ADMIN'}
                className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] outline-none disabled:bg-gray-50 transition-all font-medium"
              />
            </div>

            {/* Twitter / X */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center space-x-1.5">
                <Twitter className="w-4 h-4 text-sky-500" />
                <span>Twitter / X</span>
              </label>
              <input
                type="url"
                placeholder="https://twitter.com/namakamu"
                value={socialLinks.twitter}
                onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                disabled={user?.role !== 'ADMIN'}
                className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] outline-none disabled:bg-gray-50 transition-all font-medium"
              />
            </div>

            {/* YouTube */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center space-x-1.5">
                <Youtube className="w-4 h-4 text-red-600" />
                <span>YouTube</span>
              </label>
              <input
                type="url"
                placeholder="https://youtube.com/@channelkamu"
                value={socialLinks.youtube}
                onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                disabled={user?.role !== 'ADMIN'}
                className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] outline-none disabled:bg-gray-50 transition-all font-medium"
              />
            </div>

            {/* Facebook */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center space-x-1.5">
                <Facebook className="w-4 h-4 text-blue-600" />
                <span>Facebook</span>
              </label>
              <input
                type="url"
                placeholder="https://facebook.com/halamankamu"
                value={socialLinks.facebook}
                onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                disabled={user?.role !== 'ADMIN'}
                className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] outline-none disabled:bg-gray-50 transition-all font-medium"
              />
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center space-x-1.5">
                <Linkedin className="w-4 h-4 text-blue-700" />
                <span>LinkedIn</span>
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/company/namaperusahaan"
                value={socialLinks.linkedin}
                onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                disabled={user?.role !== 'ADMIN'}
                className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] outline-none disabled:bg-gray-50 transition-all font-medium"
              />
            </div>

            {/* Threads */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center space-x-1.5">
                <div className="text-gray-900">
                  <ThreadsIcon className="w-4 h-4" />
                </div>
                <span>Threads</span>
              </label>
              <input
                type="url"
                placeholder="https://threads.net/@namakamu"
                value={socialLinks.threads}
                onChange={(e) => setSocialLinks({ ...socialLinks, threads: e.target.value })}
                disabled={user?.role !== 'ADMIN'}
                className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] outline-none disabled:bg-gray-50 transition-all font-medium"
              />
            </div>
          </div>

          {user?.role === 'ADMIN' && (
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSocial || isLoadingSocial}
                className="px-6 py-2.5 rounded-xl bg-[#0052CC] text-white text-xs font-bold hover:bg-blue-700 transition-all flex items-center space-x-2 shadow-md shadow-blue-600/20 disabled:opacity-50"
              >
                {isSavingSocial ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Link Social Media</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default Dashboard
