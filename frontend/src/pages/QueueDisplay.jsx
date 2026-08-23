import React, { useState, useEffect, useRef } from 'react'
import { Activity, Volume2, VolumeX, Clock, Users, ChevronRight, Stethoscope, Sparkles } from 'lucide-react'
import api from '../services/api'

const QueueDisplay = () => {
  const [displayData, setDisplayData] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [audioEnabled, setAudioEnabled] = useState(true)
  const previousServingRef = useRef({})

  // Digital Clock Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Web Audio API Chime Synthesizer for Queue Announcement Sound
  const playQueueChime = () => {
    if (!audioEnabled) return
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()

      const now = ctx.currentTime
      
      // First Note: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.frequency.setValueAtTime(659.25, now)
      gain1.gain.setValueAtTime(0.3, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.5)

      // Second Note: C5 (523.25 Hz)
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.frequency.setValueAtTime(523.25, now + 0.25)
      gain2.gain.setValueAtTime(0.3, now + 0.25)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.25)
      osc2.stop(now + 0.8)
    } catch (err) {
      console.log('Audio playback error:', err)
    }
  }

  // Fetch Queue Display Data
  const fetchQueueData = async () => {
    try {
      const response = await api.get('/visits/queue-display')
      if (response.data?.success) {
        const newData = response.data.data

        // Check if any doctor called a new patient
        newData.forEach(item => {
          const docId = item.doctor.id
          const currentServingId = item.nowServing?.id
          const prevId = previousServingRef.current[docId]

          if (currentServingId && currentServingId !== prevId && item.nowServing?.status === 'CALLED') {
            playQueueChime()
          }
          previousServingRef.current[docId] = currentServingId
        })

        setDisplayData(newData)
      }
    } catch (error) {
      console.error('Failed to fetch queue display:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueueData()
    const interval = setInterval(fetchQueueData, 4000)
    return () => clearInterval(interval)
  }, [audioEnabled])

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between select-none">
      
      {/* 1. TV Display Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[#0052CC] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
              <span>RUMAH SAKIT MEDISYST</span>
              <span className="text-xs font-bold uppercase bg-blue-600 text-white px-2.5 py-0.5 rounded-full">Display Antrean</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide">Papan Informasi Panggilan Antrean Poliklinik Terpadu</p>
          </div>
        </div>

        {/* Clock & Sound Control */}
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
          >
            {audioEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Suara Panggil Aktif</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-red-400" />
                <span>Suara Mute</span>
              </>
            )}
          </button>

          <div className="text-right border-l border-slate-800 pl-6">
            <p className="text-2xl font-black tracking-widest font-mono text-emerald-400">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-xs text-slate-400 font-medium">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </header>

      {/* 2. Doctor Queue Cards Grid */}
      <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-32 text-slate-400 text-sm font-semibold">
            <span>Memuat Layar Panggilan Antrean...</span>
          </div>
        ) : displayData.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-32 text-slate-500 text-sm font-semibold">
            <span>Belum ada antrean dokter hari ini.</span>
          </div>
        ) : (
          displayData.map((item) => {
            const { doctor, nowServing, nextQueue, waitingCount } = item
            const isCalled = nowServing?.status === 'CALLED'
            const isInProgress = nowServing?.status === 'IN_PROGRESS'

            return (
              <div
                key={doctor.id}
                className={`rounded-3xl border flex flex-col justify-between overflow-hidden transition-all duration-500 shadow-2xl ${
                  isCalled
                    ? 'bg-slate-900 border-blue-500 ring-4 ring-blue-500/30'
                    : isInProgress
                    ? 'bg-slate-900 border-emerald-500/80 ring-2 ring-emerald-500/20'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                {/* Card Header (Doctor Info) */}
                <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-900/50 text-blue-400 font-black text-xl flex items-center justify-center border border-blue-700/50 shrink-0">
                    {doctor.prefixLetter}
                  </div>
                  <div className="overflow-hidden">
                    <h2 className="text-base font-bold text-white truncate">{doctor.name}</h2>
                    <p className="text-xs font-semibold text-blue-400">{doctor.department}</p>
                  </div>
                </div>

                {/* Now Serving Big Display */}
                <div className="p-6 text-center flex-1 flex flex-col justify-center items-center relative">
                  {isCalled && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
                      MEMANGGIL 🔊
                    </div>
                  )}
                  {isInProgress && (
                    <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      SEDANG DIPERIKSA 🩺
                    </div>
                  )}

                  <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                    {isInProgress ? 'SEDANG DIPERIKSA DOKTER' : 'SEDANG DIPANGGIL'}
                  </p>

                  {nowServing ? (
                    <>
                      <div className="my-2">
                        <span className={`text-5xl lg:text-6xl font-black tracking-tighter font-mono ${
                          isCalled ? 'text-blue-400 animate-pulse' : 'text-emerald-400'
                        }`}>
                          {nowServing.queueNumberFormatted}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white truncate max-w-[220px]">
                        {nowServing.patientName}
                      </p>
                      <span className="mt-2 inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {nowServing.channel === 'ONLINE_WEBSITE' ? 'Pendaftaran Web' : 'Loket Admisi'}
                      </span>
                    </>
                  ) : (
                    <div className="py-6">
                      <p className="text-3xl font-bold text-slate-600">---</p>
                      <p className="text-xs text-slate-500 mt-1">Belum Ada Panggilan</p>
                    </div>
                  )}
                </div>

                {/* Next Queue & Waiting Footer */}
                <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Berikutnya:</p>
                    <p className="font-bold text-slate-200 font-mono">
                      {nextQueue ? nextQueue.queueNumberFormatted : 'Tidak ada'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Sisa Antrean:</p>
                    <span className="font-extrabold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">
                      {waitingCount} Orang
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </main>

      {/* 3. Ticker Bar Footer */}
      <footer className="bg-blue-600 text-white px-6 py-2.5 flex items-center justify-between text-xs font-bold shadow-2xl">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Informasi: Pasien pendaftaran online web & prioritas IGD harap bersiap saat nomor dipanggil.</span>
        </div>
        <div>
          <span>RS MEDISYST • PRECISISION HEALTHCARE</span>
        </div>
      </footer>

    </div>
  )
}

export default QueueDisplay
