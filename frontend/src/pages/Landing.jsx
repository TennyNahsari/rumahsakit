import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Building2, Users, Calendar, FileText, Bed, Stethoscope, 
  Pill, CreditCard, ShieldCheck, CheckCircle2, ArrowRight, 
  Sparkles, Activity, Clock, Server, Lock, Play, ChevronRight,
  Phone, Mail, UserCheck, X, Check, BarChart3, AlertCircle,
  HeartPulse, Award, MapPin, PhoneCall, Heart, Star, Car, Brain,
  Languages, ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import ThermalTicketModal from '../components/ThermalTicketModal'

const Landing = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  const [createdTicketData, setCreatedTicketData] = useState(null)
  const [dbDoctors, setDbDoctors] = useState([])
  const [dbPolyclinics, setDbPolyclinics] = useState([])
  const [bookingForm, setBookingForm] = useState({
    patientName: '',
    phone: '',
    email: '',
    poly: 'Poli Penyakit Dalam',
    doctor: '',
    date: '',
    visitType: 'OUTPATIENT',
    paymentType: 'BPJS Kesehatan',
    complaint: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const mapDepartmentToPoly = (dept = '') => {
    if (!dept) return 'Poli Penyakit Dalam'
    const lower = dept.toLowerCase()
    if (lower.includes('anak')) return 'Poli Anak & Tumbuh Kembang'
    if (lower.includes('obgyn') || lower.includes('kebidanan') || lower.includes('ginekologi') || lower.includes('kandungan')) return 'Poli Kebidanan & Kandungan'
    if (lower.includes('jantung') || lower.includes('kardio') || lower.includes('pembuluh')) return 'Pusat Jantung & Pembuluh Darah'
    if (lower.includes('bedah')) return 'Poli Bedah Umum & Laparoskopi'
    if (lower.includes('saraf') || lower.includes('neuro') || lower.includes('stroke')) return 'Poli Saraf & Neurologi'
    if (lower.includes('penyakit dalam') || lower.includes('dalam')) return 'Poli Penyakit Dalam'
    return dept.startsWith('Poli') ? dept : `Poli ${dept}`
  }

  React.useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [docRes, polyRes] = await Promise.allSettled([
        api.get('/users/public/doctors'),
        api.get('/polyclinics/public')
      ])

      if (docRes.status === 'fulfilled' && docRes.value?.data?.data?.doctors) {
        const docs = docRes.value.data.data.doctors
        setDbDoctors(docs)
        if (docs.length > 0) {
          const firstDoc = docs[0]
          setBookingForm(prev => ({
            ...prev,
            doctor: firstDoc.name,
            poly: mapDepartmentToPoly(firstDoc.department)
          }))
        }
      }

      if (polyRes.status === 'fulfilled' && polyRes.value?.data) {
        const polyList = polyRes.value.data.data?.polyclinics || polyRes.value.data.polyclinics || []
        setDbPolyclinics(polyList)
      }
    } catch (err) {
      console.error('Fetch public initial data error:', err)
    }
  }

  // Specialty Medical Clinics / Services
  const medicalServices = [
    {
      id: 'internal',
      title: 'Poliklinik Penyakit Dalam',
      englishTitle: 'Internal Medicine Clinic',
      icon: HeartPulse,
      color: 'bg-blue-50 text-[#0052CC] border-blue-200',
      description: 'Penanganan penyakit metabolik, diabetes, hipertensi, pencernaan, dan gangguan ginjal oleh tim konsultan senior.',
      features: ['Konsultasi Diabetes & Endokrin', 'Endoskopi Saluran Cerna', 'Skrining Kardiometabolik']
    },
    {
      id: 'pediatric',
      title: 'Poliklinik Anak & Tumbuh Kembang',
      englishTitle: 'Pediatric & Child Health',
      icon: Users,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      description: 'Layanan kesehatan anak terlengkap dari imunisasi rutin, tumbuh kembang, hingga penanganan penyakit infeksi anak.',
      features: ['Imunisasi Lengkap Anak', 'Klinik Tumbuh Kembang & Terapi', 'Rawat Intensif Anak (PICU/NICU)']
    },
    {
      id: 'obgyn',
      title: 'Kebidanan & Kandungan (Obgyn)',
      englishTitle: 'Obstetrics & Gynecology',
      icon: Heart,
      color: 'bg-pink-50 text-pink-600 border-pink-200',
      description: 'Pemeriksaan kehamilan USG 4D, persalinan aman (ERACS), pemeriksaan pap smear, dan kesehatan reproduksi wanita.',
      features: ['Pemeriksaan Kehamilan USG 4D', 'Persalinan Metode ERACS', 'Skrining Kanker Serviks']
    },
    {
      id: 'cardio',
      title: 'Pusat Jantung & Pembuluh Darah',
      englishTitle: 'Cardiovascular Center',
      icon: Activity,
      color: 'bg-red-50 text-red-600 border-red-200',
      description: 'Diagnosis presisi gangguan ritme jantung, EKG, Echocardiography, dan rehabilitasi jantung terpadu.',
      features: ['Echocardiography Doppler', 'Treadmill Stress Test', 'Unit Perawatan Intensi Jantung (ICCU)']
    },
    {
      id: 'surgery',
      title: 'Poliklinik Bedah Umum & Ortopedi',
      englishTitle: 'General & Orthopedic Surgery',
      icon: Stethoscope,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      description: 'Bedah minimal invasif (Laparoskopi), operasi fraktur tulang, serta perawatan luka kronis dan pasca operasi.',
      features: ['Bedah Laparoskopi Minimal Invasif', 'Operasi Tulang & Sendi (Ortopedi)', 'Kamar Bedah Steril HEPA Filter']
    },
    {
      id: 'neuro',
      title: 'Poliklinik Saraf & Stroke Unit',
      englishTitle: 'Neurology & Stroke Center',
      icon: Brain,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      description: 'Penanganan cepat serangan stroke akur, migrain kronis, saraf terjepit (HNP), dan pemeriksaan EEG.',
      features: ['Unit Stroke 24 Jam Cepat Tanggap', 'Pemeriksaan EEG & EMG', 'Terapi Saraf & Neurologi']
    },
    {
      id: 'emergency',
      title: 'Instalasi Gawat Darurat 24 Jam',
      englishTitle: '24/7 Emergency & Trauma Center',
      icon: Car,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      description: 'Tim dokter IGD dan perawat resusitasi bersertifikasi ACLS/ATLS siap menangani kondisi darurat medis 24 jam.',
      features: ['Hotline Ambulans Jemput 24 Jam', 'Ruang Resusitasi Kritis', 'Laboratorium & Radiologi Cepat']
    },
    {
      id: 'pharmacy_lab',
      title: 'Penunjang Medis (Farmasi & Lab)',
      englishTitle: 'Diagnostic Lab & Pharmacy',
      icon: Pill,
      color: 'bg-teal-50 text-teal-600 border-teal-200',
      description: 'Laboratorium klinik otomatis 24 jam, CT-Scan 128 Slice, dan Instalasi Farmasi obat terverifikasi barcode.',
      features: ['Laboratorium Darah & PCR 24/7', 'CT-Scan 128 Slice & X-Ray Digital', 'Depot Farmasi Obet Lengkap']
    }
  ]

  const getDynamicServices = () => {
    const isEn = i18n.language === 'en'

    const iconMap = {
      Stethoscope, HeartPulse, Users, Heart, Activity, Brain, Pill, Building2, Car, ShieldCheck
    }

    if (dbPolyclinics && dbPolyclinics.length > 0) {
      return dbPolyclinics.map((poly) => {
        const iconComp = iconMap[poly.icon] || Stethoscope
        const title = isEn ? (poly.englishName || poly.name) : poly.name
        const englishTitle = poly.englishName ? poly.englishName.toUpperCase() : 'SPECIALTY CLINIC'
        const description = isEn ? (poly.englishDescription || poly.description) : poly.description
        const features = Array.isArray(poly.services) && poly.services.length > 0
          ? poly.services
          : [`Konsultasi ${poly.name}`, `Pemeriksaan Diagnostik ${poly.name}`]

        const matchingDocs = dbDoctors.filter(d => 
          d.department && (
            d.department.toLowerCase().includes(poly.name.toLowerCase()) ||
            poly.name.toLowerCase().includes(d.department.toLowerCase())
          )
        )

        return {
          id: poly.id,
          deptRaw: poly.name,
          title,
          englishTitle,
          icon: iconComp,
          color: poly.color || 'bg-blue-50 text-[#0052CC] border-blue-200',
          description: description || 'Layanan kesehatan spesialis terpadu.',
          features,
          doctors: matchingDocs
        }
      })
    }

    if (!dbDoctors || dbDoctors.length === 0) return medicalServices

    // Group doctors by department
    const deptMap = {}
    dbDoctors.forEach((doc) => {
      const dept = doc.department || 'Poli Umum'
      if (!deptMap[dept]) {
        deptMap[dept] = []
      }
      deptMap[dept].push(doc)
    })

    const uniqueDepts = Object.keys(deptMap)

    return uniqueDepts.map((dept, index) => {
      const lower = dept.toLowerCase()
      const docCount = deptMap[dept].length
      const polyName = mapDepartmentToPoly(dept)

      const preset = medicalServices.find((s) => 
        s.title.toLowerCase().includes(lower) || 
        lower.includes(s.id) ||
        (lower.includes('anak') && s.id === 'pediatric') ||
        (lower.includes('obgyn') && s.id === 'obgyn') ||
        (lower.includes('jantung') && s.id === 'cardio') ||
        (lower.includes('bedah') && s.id === 'surgery') ||
        (lower.includes('saraf') && s.id === 'neuro') ||
        (lower.includes('dalam') && s.id === 'internal')
      )

      let icon = Stethoscope
      let color = 'bg-blue-50 text-[#0052CC] border-blue-200'
      let englishTitle = `${dept} Specialty Center`
      let description = isEn ? `Integrated specialized medical care for ${dept}.` : `Penanganan medis terpadu spesialis ${dept} oleh tim konsultan dokter senior.`
      let features = isEn ? [
        `Specialist ${dept} Consultation`,
        `Diagnostic Examination for ${dept}`,
        `${docCount} Registered Specialist Doctors`
      ] : [
        `Konsultasi Spesialis ${dept}`,
        `Pemeriksaan Diagnostik ${dept}`,
        `${docCount} Dokter DPJP Terdaftar`
      ]

      if (preset) {
        icon = preset.icon
        color = preset.color
        englishTitle = preset.englishTitle
        description = isEn ? `Comprehensive specialized medical treatment for ${dept}.` : preset.description
        features = [
          ...preset.features.slice(0, 2),
          isEn ? `${docCount} Registered DPJP Doctors` : `${docCount} Dokter DPJP Terdaftar`
        ]
      } else {
        if (lower.includes('anak')) { icon = Users; color = 'bg-emerald-50 text-emerald-600 border-emerald-200'; }
        else if (lower.includes('obgyn') || lower.includes('kandungan') || lower.includes('kebidanan')) { icon = Heart; color = 'bg-pink-50 text-pink-600 border-pink-200'; }
        else if (lower.includes('jantung') || lower.includes('kardio')) { icon = Activity; color = 'bg-red-50 text-red-600 border-red-200'; }
        else if (lower.includes('bedah')) { icon = Stethoscope; color = 'bg-indigo-50 text-indigo-600 border-indigo-200'; }
        else if (lower.includes('saraf') || lower.includes('neuro')) { icon = Brain; color = 'bg-purple-50 text-purple-600 border-purple-200'; }
      }

      return {
        id: `dept-${index}`,
        deptRaw: dept,
        title: isEn ? `${dept} Clinic` : polyName,
        englishTitle,
        icon,
        color,
        description,
        features,
        doctors: deptMap[dept]
      }
    })
  }

  // Inpatient Wards & Rooms
  const inpatientRooms = [
    {
      class: 'Suite VVIP MediSyst',
      beds: '1 Bed / Room',
      price: 'Rp 2.500.000 / day',
      features: ['Ruang Tamu Keluarga Terpisah', 'Bed Pasien Elektrik Otomatis', 'Smart TV 50" & WiFi High-Speed', 'Sofa Bed Keluarga & Mini Bar', 'Kamar Mandi Air Hangat Premium']
    },
    {
      class: 'VIP Executive',
      beds: '1 Bed / Room',
      price: 'Rp 1.500.000 / day',
      features: ['Bed Pasien Elektrik', 'Smart TV & AC Sentral', 'Sofa Penunggu Pasien', 'Kamar Mandi Dalam', 'Fasilitas Konsultasi Harian']
    },
    {
      class: 'Kelas 1 (Deluxe)',
      beds: '2 Bed / Room',
      price: 'Rp 750.000 / day',
      features: ['2 Tempat Tidur dengan Tirai Penyekat', 'AC & TV LED', 'Kamar Mandi Dalam', 'Lemari Penyimpanan Pasien', 'Nurses Call Button di Setiap Bed']
    },
    {
      class: 'Kelas 2 & 3 (Standard)',
      beds: '3-4 Bed / Room',
      price: 'BPJS Kesehatan Ready',
      features: ['Tirai Penyekat Privasi', 'Ruangan Ber-AC & Ventilasi Higienis', 'Kamar Mandi Bersih Terawat', 'Pemantauan Keperawatan 24 Jam', 'Tercover Penuh BPJS Kesehatan']
    }
  ]

  // Lead Doctors
  const leadDoctors = [
    {
      name: 'dr. Hendra Wijaya, Sp.PD',
      specialty: 'Spesialis Penyakit Dalam',
      experience: '14+ Years Experience',
      days: 'Mon - Fri (09:00 - 15:00)',
      imageBadge: 'Diabetes & Metabolic Consultant'
    },
    {
      name: 'dr. Rina Lestari, Sp.A',
      specialty: 'Spesialis Anak & Tumbuh Kembang',
      experience: '10+ Years Experience',
      days: 'Mon - Sat (08:00 - 14:00)',
      imageBadge: 'Child Health Consultant'
    },
    {
      name: 'dr. Agung Pratama, Sp.B',
      specialty: 'Spesialis Bedah Umum & Laparoskopi',
      experience: '12+ Years Experience',
      days: 'Tue, Thu, Sat (13:00 - 18:00)',
      imageBadge: 'Minimally Invasive Surgery'
    },
    {
      name: 'dr. Maya Indah, Sp.OG',
      specialty: 'Spesialis Kebidanan & Kandungan',
      experience: '11+ Years Experience',
      days: 'Mon, Wed, Fri (10:00 - 16:00)',
      imageBadge: 'ERACS Delivery Specialist'
    }
  ]

  // Patient Journey Steps for Hospital
  const patientJourneySteps = [
    {
      number: '01',
      title: i18n.language === 'en' ? 'Online Registration & Booking' : 'Pendaftaran & Janji Temu',
      role: i18n.language === 'en' ? 'Patient / Family' : 'Pasien / Keluarga',
      desc: i18n.language === 'en' ? 'Patients register online via website/WhatsApp or directly at the MediSyst Hospital admission counter.' : 'Pasien mendaftar secara online via website/WA atau langsung di loket admisi pendaftaran RS MediSyst.'
    },
    {
      number: '02',
      title: i18n.language === 'en' ? 'Triage & Vital Assessment' : 'Triase & Asesmen Vital',
      role: i18n.language === 'en' ? 'Clinic Nurse' : 'Perawat Poliklinik',
      desc: i18n.language === 'en' ? 'Blood pressure, temperature, weight, and allergy history check in the triage room.' : 'Pemeriksaan tekanan darah, suhu, berat badan, dan riwayat alergi di ruang triase poliklinik.'
    },
    {
      number: '03',
      title: i18n.language === 'en' ? 'Specialist Consultation' : 'Konsultasi Spesialis',
      role: i18n.language === 'en' ? 'Specialist Doctor' : 'Dokter Spesialis',
      desc: i18n.language === 'en' ? 'Physical examination by specialist doctors, electronic medical records (EMR) entry, and treatment planning.' : 'Pemeriksaan fisik langsung oleh dokter spesialis, pencatatan rekam medis EMR, dan penentuan terapi.'
    },
    {
      number: '04',
      title: i18n.language === 'en' ? 'Diagnostics & E-Prescription' : 'Penunjang & E-Resep',
      role: i18n.language === 'en' ? '24H Lab & Pharmacy' : 'Lab & Farmasi 24H',
      desc: i18n.language === 'en' ? 'Blood tests and radiology if required, with barcoded medication collection at the pharmacy.' : 'Pemeriksaan darah/radiologi jika diperlukan, dan pengambilan obat di instalasi farmasi ber-barcode.'
    },
    {
      number: '05',
      title: i18n.language === 'en' ? 'Discharge / Admission' : 'Pemulangan / Admisi',
      role: i18n.language === 'en' ? 'Cashier & Inpatient Wards' : 'Kasir & Admisi Wards',
      desc: i18n.language === 'en' ? 'Billing settlement (BPJS / Insurance / Self-Pay) or ward admission guidance if recommended.' : 'Pelunasan billing (BPJS / Asuransi / Umum) atau pengarahan ke bangsal rawat inap jika disarankan dokter.'
    }
  ]

  // Patient Testimonials
  const patientTestimonials = [
    {
      name: 'Rahmat Hidayat',
      patientType: i18n.language === 'en' ? 'VIP Inpatient' : 'Pasien Rawat Inap VIP',
      quote: i18n.language === 'en' ? 'Surgical procedure at MediSyst Hospital was exceptionally professional. Dr. Agung was very communicative and nurses were attentive 24/7.' : 'Penanganan operasi bedah di RS MediSyst sangat profesional. Dokter Agung sangat komunikatif dan perawat bangsal melayani dengan ramah 24 jam.'
    },
    {
      name: 'Ratna Dewi',
      patientType: i18n.language === 'en' ? 'Maternity & ERACS Patient' : 'Pasien Kebidanan & ERACS',
      quote: i18n.language === 'en' ? 'Delivering my second child with ERACS method was extremely comfortable. VVIP suite was spotless, spacious, and family amenities were top tier.' : 'Persalinan anak kedua saya dengan metode ERACS berjalan sangat nyaman. Kamar Suite VVIP bersih, luas, dan fasilitas untuk keluarga sangat memuaskan.'
    },
    {
      name: 'Bambang Sugianto',
      patientType: i18n.language === 'en' ? 'BPJS Outpatient' : 'Pasien BPJS Kesehatan Poliklinik',
      quote: i18n.language === 'en' ? 'Online registration at MediSyst Hospital eliminated queue times. BPJS claim process was smooth and pharmacy dispensing was fast.' : 'Pendaftaran online RS MediSyst sangat cepat tanpa antrean mengular. Proses klaim BPJS lancar dan pelayanan obat farmasi tidak menunggu lama.'
    }
  ]

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    if (!bookingForm.patientName || !bookingForm.phone || !bookingForm.date) {
      toast.error(t('landing.modal.fillError', 'Mohon lengkapi Nama Pasien, No. Telepon, dan Tanggal Kunjungan.'))
      return
    }

    setIsSubmitting(true)
    try {
      const response = await api.post('/visits/public-booking', bookingForm)
      if (response.data?.success) {
        const { queueNumberFormatted, visit } = response.data.data

        const ticketInfo = {
          queueNumberFormatted: queueNumberFormatted || visit.queueNumberFormatted,
          patientName: visit.patient.name,
          medicalRecordNo: visit.patient.medicalRecordNo,
          doctorName: visit.doctor.name,
          department: bookingForm.poly || visit.doctor.department,
          visitType: visit.visitType,
          channel: 'ONLINE_WEBSITE',
          date: new Date(visit.scheduledAt).toLocaleDateString('id-ID')
        }

        setCreatedTicketData(ticketInfo)
        setIsAppointmentModalOpen(false)
        setIsTicketModalOpen(true)

        toast.success(`Janji Temu Berhasil! No. Antrean Web: ${queueNumberFormatted}`, {
          duration: 6000,
          icon: '🎫'
        })

        setBookingForm({
          patientName: '',
          phone: '',
          email: '',
          poly: 'Poli Penyakit Dalam',
          doctor: 'dr. Hendra Wijaya, Sp.PD',
          date: '',
          visitType: 'OUTPATIENT',
          paymentType: 'BPJS Kesehatan',
          complaint: ''
        })
      }
    } catch (error) {
      console.error('Booking submit error:', error)
      toast.error(error.response?.data?.error || 'Gagal mendaftarkan janji temu online')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openBookingForDoctor = (docName, polyName) => {
    const selectedDoc = dbDoctors.find(d => d.name === docName)
    const dept = selectedDoc?.department || polyName
    setBookingForm(prev => ({
      ...prev,
      doctor: docName,
      poly: mapDepartmentToPoly(dept)
    }))
    setIsAppointmentModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#1A1C1E] font-sans antialiased selection:bg-[#0052CC] selection:text-white">
      
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#D9DADC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-[#0052CC] rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-[#1A1C1E] tracking-tight">
                Medi<span className="text-[#0052CC]">Syst</span> <span className="text-xs uppercase bg-blue-50 text-[#0052CC] font-semibold px-2 py-0.5 rounded border border-blue-200">Hospital</span>
              </span>
              <p className="text-[10px] text-gray-500 font-medium -mt-1 tracking-wider uppercase">Rumah Sakit Umum Terpadu</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-7 text-sm font-medium text-gray-600">
            <a href="#overview" className="hover:text-[#0052CC] transition-colors">{t('landing.nav.about')}</a>
            <a href="#services" className="hover:text-[#0052CC] transition-colors">{t('landing.nav.services')}</a>
            <a href="#doctors" className="hover:text-[#0052CC] transition-colors">{t('landing.nav.doctors')}</a>
            <a href="#facilities" className="hover:text-[#0052CC] transition-colors">{t('landing.nav.facilities')}</a>
            <a href="#journey" className="hover:text-[#0052CC] transition-colors">{t('landing.nav.journey')}</a>
            <a href="#contact" className="hover:text-[#0052CC] transition-colors">{t('landing.nav.contact')}</a>
          </nav>

          {/* Action CTAs & Language Switcher */}
          <div className="flex items-center space-x-3">
            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="p-2 text-gray-600 hover:text-[#0052CC] hover:bg-gray-100 rounded-lg flex items-center space-x-1.5 border border-gray-200 text-xs font-semibold uppercase"
              >
                <Languages className="w-4 h-4 text-[#0052CC]" />
                <span>{i18n.language}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl py-1.5 z-50 border border-gray-200 animate-fadeIn">
                  <button
                    onClick={() => {
                      i18n.changeLanguage('id')
                      setLangDropdownOpen(false)
                    }}
                    className={`flex items-center justify-between px-4 py-2 text-xs w-full text-left font-medium ${
                      i18n.language === 'id' ? 'bg-blue-50 text-[#0052CC] font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>Bahasa Indonesia</span>
                    {i18n.language === 'id' && <Check className="w-3.5 h-3.5 text-[#0052CC]" />}
                  </button>
                  <button
                    onClick={() => {
                      i18n.changeLanguage('en')
                      setLangDropdownOpen(false)
                    }}
                    className={`flex items-center justify-between px-4 py-2 text-xs w-full text-left font-medium ${
                      i18n.language === 'en' ? 'bg-blue-50 text-[#0052CC] font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>English</span>
                    {i18n.language === 'en' && <Check className="w-3.5 h-3.5 text-[#0052CC]" />}
                  </button>
                </div>
              )}
            </div>

            {user && (
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-[#0052CC] text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm"
              >
                <span>{t('landing.nav.dashboard')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section id="overview" className="pt-8 pb-16 lg:pt-14 lg:pb-24 overflow-hidden relative bg-[#0F172A]">
        {/* High-Resolution Sharp Hospital Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-85 pointer-events-none transform scale-105"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1920&q=80')` }}
        />
        {/* Modern Vibrant Gradient Mask for contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/50 to-slate-950/70 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-white/60 shadow-2xl shadow-slate-950/40 text-center my-4">
            {/* Pill Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0052CC] text-xs font-bold mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('landing.hero.badge')}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold text-[#1A1C1E] tracking-tight leading-[1.15]">
              {t('landing.hero.titlePart1')} <br className="hidden sm:inline" />
              <span className="text-[#0052CC]">{t('landing.hero.titlePart2')}</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed font-medium">
              {t('landing.hero.subtitle')}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setIsAppointmentModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#0052CC] text-white font-bold text-base hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2"
              >
                <Calendar className="w-5 h-5" />
                <span>{t('landing.hero.bookCta')}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="#contact"
                className="w-full sm:w-auto px-8 py-4 rounded-xl border border-red-200 bg-red-50 text-red-700 font-bold text-base hover:bg-red-100 transition-all flex items-center justify-center space-x-2"
              >
                <Car className="w-5 h-5 text-red-600" />
                <span>{t('landing.hero.igdHotline')}</span>
              </a>
            </div>
          </div>

          {/* Trust Highlights */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-white/60 shadow-lg">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#0052CC]">{t('landing.hero.stat1')}</p>
              <p className="text-xs text-gray-600 font-bold mt-1">{t('landing.hero.stat1Label')}</p>
            </div>
            <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-white/60 shadow-lg">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#0052CC]">{t('landing.hero.stat2')}</p>
              <p className="text-xs text-gray-600 font-bold mt-1">{t('landing.hero.stat2Label')}</p>
            </div>
            <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-white/60 shadow-lg">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#0052CC]">{t('landing.hero.stat3')}</p>
              <p className="text-xs text-gray-600 font-bold mt-1">{t('landing.hero.stat3Label')}</p>
            </div>
            <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-white/60 shadow-lg">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#0052CC]">{t('landing.hero.stat4')}</p>
              <p className="text-xs text-gray-600 font-bold mt-1">{t('landing.hero.stat4Label')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Medical Specialty Services */}
      <section id="services" className="py-20 bg-white border-y border-[#D9DADC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0052CC] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {t('landing.services.badge')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1C1E] mt-4 tracking-tight">
              {t('landing.services.title')}
            </h2>
            <p className="text-gray-600 mt-3 text-sm sm:text-base">
              {t('landing.services.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {getDynamicServices().map((service) => {
              const IconComp = service.icon
              const firstDoctor = service.doctors?.[0]
              return (
                <div
                  key={service.id}
                  className="bg-[#F8F9FB] rounded-2xl p-6 border border-[#D9DADC] hover:border-[#0052CC] transition-all hover:shadow-lg group flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${service.color}`}>
                      <IconComp className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{service.englishTitle}</span>
                    <h3 className="text-lg font-bold text-[#1A1C1E] mt-1 group-hover:text-[#0052CC] transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">
                      {service.description}
                    </p>

                    <ul className="mt-4 space-y-2 border-t border-gray-200 pt-4">
                      {service.features.map((feat, fIdx) => (
                        <li key={fIdx} className="text-[11px] text-gray-700 flex items-center space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      if (firstDoctor) {
                        openBookingForDoctor(firstDoctor.name, service.deptRaw)
                      } else {
                        setIsAppointmentModalOpen(true)
                      }
                    }}
                    className="mt-6 w-full text-xs font-bold text-[#0052CC] py-2 rounded-lg bg-white border border-blue-200 hover:bg-[#0052CC] hover:text-white transition-all flex items-center justify-center space-x-1"
                  >
                    <span>{t('landing.services.bookConsultation')}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4. Our Specialist Doctors */}
      <section id="doctors" className="py-20 bg-[#F8F9FB] relative overflow-hidden">
        {/* High Resolution Online Unsplash Medical Center Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1920&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8F9FB]/90 via-[#F8F9FB]/75 to-[#F8F9FB] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0052CC] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {t('landing.doctors.badge')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1C1E] mt-4 tracking-tight">
              {t('landing.doctors.title')}
            </h2>
            <p className="text-gray-600 mt-3 text-sm sm:text-base">
              {t('landing.doctors.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(dbDoctors.length > 0 ? dbDoctors : leadDoctors).map((doc, idx) => {
              const docName = doc.name
              const docDept = doc.department || doc.specialty || 'Poliklinik Spesialis'
              const docPhone = doc.phone || '+62 812-3456-7890'
              const docBadge = doc.department ? `Spesialis ${doc.department}` : (doc.imageBadge || 'Konsultan Senior')

              // Online professional doctor photos curated from Unsplash
              const doctorPhotos = [
                'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80', // Male Dr 1
                'https://images.unsplash.com/photo-1594824813566-7885a3964670?auto=format&fit=crop&w=600&q=80', // Female Dr 1
                'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80', // Male Dr 2
                'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80', // Female Dr 2
                'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80'
              ]
              const photoUrl = doc.avatarUrl || doctorPhotos[idx % doctorPhotos.length]

              return (
                <div key={doc.id || idx} className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-[#D9DADC] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    {/* Doctor Photo */}
                    <div className="relative mb-4 overflow-hidden rounded-2xl border-2 border-blue-100 group-hover:border-[#0052CC] transition-colors shadow-sm">
                      <img 
                        src={photoUrl} 
                        alt={docName}
                        className="w-full h-52 object-cover object-top transform group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute top-3 left-3 bg-[#0052CC] text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-md">
                        {docBadge}
                      </div>
                    </div>

                    <h3 className="text-base font-extrabold text-[#1A1C1E]">{docName}</h3>
                    <p className="text-xs font-bold text-[#0052CC] mt-0.5">{docDept}</p>
                    <p className="text-[11px] text-gray-500 mt-1">📞 {docPhone}</p>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 text-[11px] text-gray-600">
                      <p className="font-bold text-gray-700 mb-0.5">{t('landing.doctors.schedule')}</p>
                      <p>{doc.days || 'Senin - Sabtu (08:00 - 16:00)'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => openBookingForDoctor(docName, docDept)}
                    className="mt-6 w-full text-xs font-bold text-white py-3 rounded-xl bg-[#0052CC] hover:bg-blue-700 transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/25"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t('landing.doctors.book')}</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 5. Inpatient Rooms & Wards */}
      <section id="facilities" className="py-20 bg-white border-y border-[#D9DADC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0052CC] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {t('landing.facilities.badge')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1C1E] mt-4 tracking-tight">
              {t('landing.facilities.title')}
            </h2>
            <p className="text-gray-600 mt-3 text-sm sm:text-base">
              {t('landing.facilities.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {inpatientRooms.map((room, idx) => (
              <div key={idx} className="bg-[#F8F9FB] p-6 rounded-2xl border border-[#D9DADC] hover:border-[#0052CC] transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-[#0052CC] uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                      {room.beds}
                    </span>
                    <Bed className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1A1C1E] mb-1">{room.class}</h3>
                  <p className="text-sm font-extrabold text-emerald-600 mb-4">{room.price}</p>

                  <ul className="space-y-2 border-t border-gray-200 pt-4">
                    {room.features.map((f, i) => (
                      <li key={i} className="text-xs text-gray-700 flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setIsAppointmentModalOpen(true)}
                  className="mt-6 w-full text-xs font-bold text-[#0052CC] py-2 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 transition-all"
                >
                  {t('landing.facilities.info')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Patient Care Journey */}
      <section id="journey" className="py-20 bg-[#F8F9FB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0052CC] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {t('landing.journey.badge')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1C1E] mt-4 tracking-tight">
              {t('landing.journey.title')}
            </h2>
            <p className="text-gray-600 mt-3 text-sm sm:text-base">
              {t('landing.journey.subtitle')}
            </p>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-[#D9DADC] -translate-y-1/2 z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 relative z-10">
              {patientJourneySteps.map((step, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-[#D9DADC] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-10 h-10 rounded-xl bg-[#0052CC] text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-blue-500/20">
                        {step.number}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {step.role}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-[#1A1C1E] mb-2">{step.title}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-[#0052CC] font-medium flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>{t('landing.journey.bpjsSync')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Patient Testimonials */}
      <section className="py-20 bg-white border-y border-[#D9DADC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0052CC] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {t('landing.testimonials.badge')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1C1E] mt-4 tracking-tight">
              {t('landing.testimonials.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {patientTestimonials.map((tItem, idx) => (
              <div key={idx} className="bg-[#F8F9FB] p-8 rounded-2xl border border-[#D9DADC] shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex space-x-1 mb-4 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm italic leading-relaxed mb-6">
                  "{tItem.quote}"
                </p>
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-bold text-[#1A1C1E]">{tItem.name}</h4>
                  <p className="text-xs text-[#0052CC] font-semibold">{tItem.patientType}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Emergency Contact & Map Section */}
      <section id="contact" className="py-16 bg-[#0052CC] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <div className="inline-flex items-center space-x-2 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                <Car className="w-4 h-4" />
                <span>{t('landing.emergency.badge')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {t('landing.emergency.title')}
              </h2>
              <p className="mt-3 text-blue-100 text-sm sm:text-base max-w-2xl">
                {t('landing.emergency.subtitle')}
              </p>
            </div>
            <div className="bg-white text-gray-900 p-6 rounded-2xl shadow-xl border border-blue-200 text-center">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('landing.emergency.hotlineTitle')}</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-red-600 mt-1 flex items-center justify-center space-x-2">
                <PhoneCall className="w-6 h-6 animate-bounce text-red-600" />
                <span>(021) 555-9999</span>
              </p>
              <p className="text-xs text-gray-500 mt-2">{t('landing.emergency.waInfo')}</p>
              <button
                onClick={() => setIsAppointmentModalOpen(true)}
                className="mt-4 w-full py-3 rounded-xl bg-[#0052CC] text-white font-bold text-xs hover:bg-blue-700 transition-all"
              >
                {t('landing.emergency.bookCta')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="bg-white border-t border-[#D9DADC] py-12 text-xs text-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-[#0052CC] rounded-lg flex items-center justify-center text-white">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-base font-bold text-gray-900">RS MediSyst</span>
              </div>
              <p className="text-gray-500 text-xs">
                {t('landing.footer.tagline')}
              </p>
              <p className="text-gray-700 flex items-center space-x-1 font-medium">
                <MapPin className="w-4 h-4 text-[#0052CC]" />
                <span>{t('landing.footer.address')}</span>
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3">{t('landing.footer.clinicsTitle')}</h4>
              <ul className="space-y-2">
                <li><a href="#services" className="hover:text-[#0052CC]">Poliklinik Penyakit Dalam</a></li>
                <li><a href="#services" className="hover:text-[#0052CC]">Poliklinik Anak & Tumbuh Kembang</a></li>
                <li><a href="#services" className="hover:text-[#0052CC]">Kebidanan & Kandungan (Obgyn)</a></li>
                <li><a href="#services" className="hover:text-[#0052CC]">Pusat Jantung & Pembuluh Darah</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3">{t('landing.footer.insuranceTitle')}</h4>
              <ul className="space-y-2">
                <li><span className="text-gray-600">BPJS Kesehatan Bridging</span></li>
                <li><span className="text-gray-600">Prudential & Manulife</span></li>
                <li><span className="text-gray-600">Allianz & Mandiri Inhealth</span></li>
                <li><span className="text-gray-600">Asuransi Swasta Cashless</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3">{t('landing.footer.contactTitle')}</h4>
              <p className="text-gray-500">Call Center Pendaftaran:</p>
              <p className="font-bold text-[#0052CC] text-sm">(021) 555-8888</p>
              <div className="mt-3 flex items-center space-x-2 text-gray-700">
                <Mail className="w-4 h-4 text-[#0052CC]" />
                <span>info@medisyst-hospital.com</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-gray-500">
            <p>&copy; {new Date().getFullYear()} {t('landing.footer.rights')}</p>
            <div className="flex space-x-4 mt-3 sm:mt-0">
              <span className="hover:underline cursor-pointer">Hak Pasien & Keluarga</span>
              <span>•</span>
              <span className="hover:underline cursor-pointer">Jadwal Dokter</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 10. Interactive Appointment Modal */}
      {isAppointmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#D9DADC] max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setIsAppointmentModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 text-[#0052CC] rounded-xl flex items-center justify-center border border-blue-200">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1A1C1E]">{t('landing.modal.title')}</h3>
                <p className="text-xs text-gray-500">{t('landing.modal.subtitle')}</p>
              </div>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('landing.modal.patientName')}</label>
                  <input
                    type="text"
                    required
                    placeholder="Budi Santoso"
                    value={bookingForm.patientName}
                    onChange={(e) => setBookingForm({ ...bookingForm, patientName: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('landing.modal.phone')}</label>
                  <input
                    type="tel"
                    required
                    placeholder="08123456789"
                    value={bookingForm.phone}
                    onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] outline-none"
                  />
                </div>
              </div>

              {/* Doctor first, then Specialty Clinic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('landing.modal.doctor')}</label>
                  <select
                    value={bookingForm.doctor}
                    onChange={(e) => {
                      const docName = e.target.value
                      const selectedDoc = dbDoctors.find(d => d.name === docName)
                      let dept = selectedDoc?.department
                      if (!dept) {
                        if (docName.includes('Sp.PD')) dept = 'Penyakit Dalam'
                        else if (docName.includes('Sp.A')) dept = 'Anak'
                        else if (docName.includes('Sp.OG')) dept = 'Kebidanan & Kandungan'
                        else if (docName.includes('Sp.JP')) dept = 'Jantung'
                        else if (docName.includes('Sp.B')) dept = 'Bedah'
                        else if (docName.includes('Sp.N') || docName.includes('Sp.S')) dept = 'Saraf'
                      }
                      const autoPoly = mapDepartmentToPoly(dept)
                      setBookingForm(prev => ({
                        ...prev,
                        doctor: docName,
                        poly: autoPoly
                      }))
                    }}
                    className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none bg-white font-medium"
                  >
                    {dbDoctors.length > 0 ? (
                      dbDoctors.map(doc => (
                        <option key={doc.id} value={doc.name}>
                          {doc.name} ({doc.department || 'Spesialis'})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="dr. Ahmad Hidayat, Sp.PD">dr. Ahmad Hidayat, Sp.PD (Penyakit Dalam)</option>
                        <option value="dr. Siti Nurhaliza, Sp.A">dr. Siti Nurhaliza, Sp.A (Anak)</option>
                        <option value="dr. Budi Santoso, Sp.OG">dr. Budi Santoso, Sp.OG (Kebidanan & Kandungan)</option>
                        <option value="dr. Rina Kusuma, Sp.JP">dr. Rina Kusuma, Sp.JP (Jantung)</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('landing.modal.poly')}</label>
                  <select
                    value={bookingForm.poly}
                    onChange={(e) => setBookingForm({ ...bookingForm, poly: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none bg-white"
                  >
                    <option value="Poli Penyakit Dalam">Poli Penyakit Dalam</option>
                    <option value="Poli Anak & Tumbuh Kembang">Poli Anak & Tumbuh Kembang</option>
                    <option value="Poli Kebidanan & Kandungan">Poli Kebidanan & Kandungan</option>
                    <option value="Pusat Jantung & Pembuluh Darah">Pusat Jantung & Pembuluh Darah</option>
                    <option value="Poli Bedah Umum & Laparoskopi">Poli Bedah Umum & Laparoskopi</option>
                    <option value="Poli Saraf & Neurologi">Poli Saraf & Neurologi</option>
                    {![
                      'Poli Penyakit Dalam',
                      'Poli Anak & Tumbuh Kembang',
                      'Poli Kebidanan & Kandungan',
                      'Pusat Jantung & Pembuluh Darah',
                      'Poli Bedah Umum & Laparoskopi',
                      'Poli Saraf & Neurologi'
                    ].includes(bookingForm.poly) && bookingForm.poly && (
                      <option value={bookingForm.poly}>{bookingForm.poly}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('landing.modal.date', 'Tanggal Kunjungan *')}</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('landing.modal.visitType', 'Tipe Kunjungan *')}</label>
                  <select
                    value={bookingForm.visitType}
                    onChange={(e) => setBookingForm({ ...bookingForm, visitType: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none bg-white font-medium"
                  >
                    <option value="OUTPATIENT">📋 Rawat Jalan (Outpatient)</option>
                    <option value="GENERAL_CHECKUP">🩺 General Checkup / MCU</option>
                    <option value="INPATIENT">🛏️ Rawat Inap (Inpatient)</option>
                    <option value="EMERGENCY">🚨 Gawat Darurat / UGD (Emergency)</option>
                    <option value="MEDICAL_ACTION">💉 Tindakan Medis (Medical Action)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('landing.modal.paymentType', 'Jenis Penjamin *')}</label>
                  <select
                    value={bookingForm.paymentType}
                    onChange={(e) => setBookingForm({ ...bookingForm, paymentType: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] outline-none bg-white font-medium"
                  >
                    <option value="BPJS Kesehatan">BPJS Kesehatan</option>
                    <option value="Pasien Umum / Mandiri">Pasien Umum / Mandiri</option>
                    <option value="Asuransi Swasta Cashless">Asuransi Swasta Rekanan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t('landing.modal.complaint')}</label>
                <textarea
                  rows="2"
                  placeholder="Deskripsi keluhan atau gejala yang dirasakan..."
                  value={bookingForm.complaint}
                  onChange={(e) => setBookingForm({ ...bookingForm, complaint: e.target.value })}
                  className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] outline-none"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAppointmentModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  {t('landing.modal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-lg bg-[#0052CC] text-white text-xs font-bold hover:bg-blue-700 transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>{t('landing.modal.submitting')}</span>
                  ) : (
                    <>
                      <span>{t('landing.modal.submit')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. Thermal Ticket Modal Print */}
      <ThermalTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        ticketData={createdTicketData}
      />
    </div>
  )
}

export default Landing
