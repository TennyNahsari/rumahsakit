import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Bell, ChevronDown, LogOut, User, Settings, Languages, Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const { t, i18n } = useTranslation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
  }

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
      <div className="px-3 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start">
            {/* Hamburger Menu Button */}
            <button
              onClick={onMenuClick}
              className="p-2 text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex ml-2 md:mr-24 items-center space-x-2 cursor-pointer" onClick={() => window.location.href = '/'}>
              <div className="w-8 h-8 bg-[#0052CC] rounded-lg flex items-center justify-center text-white">
                <span className="text-sm font-extrabold">M</span>
              </div>
              <span className="self-center text-base md:text-xl font-bold whitespace-nowrap text-[#1A1C1E]">
                Medi<span className="text-[#0052CC]">Syst</span> <span className="text-xs uppercase bg-blue-50 text-[#0052CC] font-semibold px-2 py-0.5 rounded border border-blue-200">HMS</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
            </button>
            
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg flex items-center space-x-1"
              >
                <Languages className="w-5 h-5" />
                <span className="text-xs font-medium uppercase">{i18n.language}</span>
              </button>
              
              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <button
                    onClick={() => {
                      i18n.changeLanguage('en')
                      setLangDropdownOpen(false)
                    }}
                    className={`flex items-center px-4 py-2 text-sm w-full text-left ${
                      i18n.language === 'en' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => {
                      i18n.changeLanguage('id')
                      setLangDropdownOpen(false)
                    }}
                    className={`flex items-center px-4 py-2 text-sm w-full text-left ${
                      i18n.language === 'id' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Indonesia
                  </button>
                </div>
              )}
            </div>
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-3 p-2 text-sm rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <div className="font-medium text-gray-900">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.role}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                    <User className="w-4 h-4 mr-3" />
                    {t('navbar.profile')}
                  </button>
                  <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                    <Settings className="w-4 h-4 mr-3" />
                    {t('navbar.settings')}
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    {t('navbar.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar