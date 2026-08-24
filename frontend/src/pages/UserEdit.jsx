import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { userService, publicService, polyclinicService } from '../services'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const UserEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [polyclinics, setPolyclinics] = useState([])
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'FRONT_DESK',
    department: '',
    phone: '',
    isActive: true,
    password: '' // Optional for edit
  })

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [userRes, polyRes] = await Promise.allSettled([
        userService.getUser(id),
        publicService.getPolyclinics().catch(() => polyclinicService.getPolyclinics())
      ])

      if (userRes.status === 'fulfilled' && userRes.value?.data?.user) {
        const user = userRes.value.data.user
        setFormData({
          email: user.email || '',
          name: user.name || '',
          role: user.role || 'FRONT_DESK',
          department: user.department || '',
          phone: user.phone || '',
          isActive: user.isActive,
          password: ''
        })
      } else {
        toast.error('Gagal memuat data pengguna')
        navigate('/users')
        return
      }

      if (polyRes.status === 'fulfilled') {
        const list = polyRes.value?.data?.polyclinics || polyRes.value?.polyclinics || []
        setPolyclinics(list)
      }
    } catch (error) {
      console.error('Fetch user data error:', error)
      toast.error('Gagal memuat data pengguna')
      navigate('/users')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      // Don't send password if empty
      const updateData = { ...formData }
      if (!updateData.password) {
        delete updateData.password
      }
      
      await userService.updateUser(id, updateData)
      toast.success('Pengguna berhasil diperbarui')
      navigate('/users')
    } catch (error) {
      console.error('Update user error:', error)
      toast.error(error.response?.data?.error || 'Gagal memperbarui pengguna')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-900">Edit Pengguna</h1>
          <p className="text-gray-600">Perbarui informasi pengguna</p>
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
                  Password Baru
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Kosongkan jika tidak ingin mengubah"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Kosongkan jika tidak ingin mengubah password
                </p>
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

          {/* Status */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Pengguna Aktif
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Nonaktifkan untuk melarang pengguna login ke sistem
            </p>
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
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-primary-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserEdit
