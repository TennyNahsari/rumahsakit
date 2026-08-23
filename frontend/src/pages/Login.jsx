import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

const Login = () => {
  const { login, loading, error } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(formData)
    } catch (error) {
      // Error is handled in the context
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#D9DADC] shadow-xl space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-[#0052CC] rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <span className="text-xl font-extrabold">M</span>
          </div>
          <h2 className="mt-4 text-center text-2xl font-extrabold text-[#1A1C1E] tracking-tight">
            Masuk ke <span className="text-[#0052CC]">MediSyst HMS</span>
          </h2>
          <p className="mt-1.5 text-center text-xs text-gray-500 font-medium">
            Sistem Informasi Manajemen Rumah Sakit (SIMRS)
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="form-input"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="form-input pr-10"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[#0052CC] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0052CC] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Memproses Masuk...
                </div>
              ) : (
                'Masuk ke Sistem'
              )}
            </button>
          </div>
          
          <div className="text-center space-y-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Kredensial Demo: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800 font-mono">admin@klinik.com / admin123</code>
            </p>
            <div>
              <a href="/" className="text-xs font-semibold text-[#0052CC] hover:underline">
                &larr; Kembali ke Halaman Utama Landing
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login