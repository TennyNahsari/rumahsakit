import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { userService, publicService, polyclinicService } from '../services'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const UserForm = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [polyclinics, setPolyclinics] = useState([])
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'FRONT_DESK',
    department: '',
    phone: ''
  })

  useEffect(() => {
    fetchPolyclinics()
  }, [])

  const fetchPolyclinics = async () => {
    try {
      const res = await publicService.getPolyclinics().catch(() => polyclinicService.getPolyclinics())
      const list = res?.data?.polyclinics || res?.polyclinics || []
      setPolyclinics(list)
    } catch (err) {
      console.error('Fetch polyclinics error in UserForm:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      await userService.createUser(formData)
      toast.success('Pengguna berhasil ditambahkan')
      navigate('/users')
    } catch (error) {
      console.error('Create user error:', error)
      toast.error(error.response?.data?.error || 'Gagal menambahkan pengguna')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/users"
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Pengguna</h1>
          <p className="text-gray-600">Tambah pengguna baru ke sistem</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Personal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="contoh@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>
          </div>

          {/* Role & Department */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Role & Departemen</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="ADMIN">Administrator</option>
                  <option value="DOCTOR">Dokter</option>
                  <option value="NURSE">Perawat</option>
                  <option value="FRONT_DESK">Front Desk</option>
                  <option value="PHARMACY">Farmasi</option>
                  <option value="LABORATORY">Laboratorium</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departemen / Poliklinik
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white font-medium"
                >
                  <option value="">-- Pilih Departemen / Poliklinik --</option>
                  {polyclinics.length > 0 ? (
                    polyclinics.map((poly) => (
                      <option key={poly.id} value={poly.name}>
                        🏥 {poly.name} ({poly.code || 'POLI'})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Penyakit Dalam">Poliklinik Penyakit Dalam</option>
                      <option value="Anak">Poliklinik Anak & Tumbuh Kembang</option>
                      <option value="Obstetri & Ginekologi">Kebidanan & Kandungan (Obgyn)</option>
                      <option value="Jantung dan Pembuluh Darah">Pusat Jantung & Pembuluh Darah</option>
                      <option value="Bedah Umum">Poliklinik Bedah Umum & Ortopedi</option>
                      <option value="Saraf">Poliklinik Saraf & Stroke Unit</option>
                    </>
                  )}
                  {formData.department && !polyclinics.some(p => p.name === formData.department) && (
                    <option value={formData.department}>{formData.department}</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Link
              to="/users"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-primary-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserForm
