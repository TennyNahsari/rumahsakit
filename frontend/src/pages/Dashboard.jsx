import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { Users, UserPlus, Calendar, FileText, TrendingUp, Activity, Brain, Loader2, AlertCircle } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { predictionAPI } from '../services/api'

const Dashboard = () => {
  const { user } = useAuth()
  const { t } = useTranslation()

  // AI Prediction state
  const [predictions, setPredictions] = useState(null)
  const [isTraining, setIsTraining] = useState(false)
  const [isPredicting, setIsPredicting] = useState(false)
  const [predictionError, setPredictionError] = useState(null)
  const [trainingMessage, setTrainingMessage] = useState(null)

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
    </div>
  )
}

export default Dashboard
