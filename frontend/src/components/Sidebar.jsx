import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  FileText,
  Pill,
  CreditCard,
  Settings,
  Activity,
  Bed,
  Building2,
  X
} from 'lucide-react'

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const { t } = useTranslation()

  const navigation = [
    {
      name: 'dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'DOCTOR', 'NURSE', 'FRONT_DESK', 'PHARMACY', 'LABORATORY']
    },
    {
      name: 'patients',
      href: '/patients',
      icon: UserPlus,
      roles: ['ADMIN', 'DOCTOR', 'NURSE', 'FRONT_DESK']
    },
    {
      name: 'polyclinics',
      label: 'Poliklinik',
      href: '/polyclinics',
      icon: Building2,
      roles: ['ADMIN', 'DOCTOR', 'NURSE', 'FRONT_DESK']
    },
    {
      name: 'visits',
      href: '/visits',
      icon: Calendar,
      roles: ['ADMIN', 'DOCTOR', 'NURSE', 'FRONT_DESK']
    },
    {
      name: 'records',
      href: '/records',
      icon: FileText,
      roles: ['ADMIN', 'DOCTOR', 'NURSE']
    },
    {
      name: 'rooms',
      href: '/rooms',
      icon: Bed,
      roles: ['ADMIN', 'NURSE', 'FRONT_DESK']
    },
    {
      name: 'inpatients',
      href: '/inpatients',
      icon: Building2,
      roles: ['ADMIN', 'DOCTOR', 'NURSE', 'FRONT_DESK']
    },
    {
      name: 'medicines',
      href: '/medicines',
      icon: Pill,
      roles: ['ADMIN', 'PHARMACY']
    },
    {
      name: 'billing',
      href: '/billing',
      icon: CreditCard,
      roles: ['ADMIN', 'FRONT_DESK']
    },
    {
      name: 'users',
      href: '/users',
      icon: Users,
      roles: ['ADMIN']
    }
  ]

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  )

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-16 z-30 w-64 h-screen bg-white border-r border-gray-200 
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg md:hidden"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="h-full px-3 py-4 overflow-y-auto">
          <ul className="space-y-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={() => onClose()}
                    className={({ isActive }) =>
                      `flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group ${
                        isActive ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600' : ''
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" />
                    <span className="ml-3 font-medium">{t(`sidebar.${item.name}`)}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
          
          <div className="pt-4 mt-4 border-t border-gray-200">
            <ul className="space-y-2">
              <li>
                <NavLink
                  to="/"
                  onClick={() => onClose()}
                  className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100 group"
                >
                  <Building2 className="w-5 h-5 text-[#0052CC] transition duration-75" />
                  <span className="ml-3 font-medium text-xs font-semibold text-[#0052CC]">Halaman Landing</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/reports"
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group ${
                      isActive ? 'bg-primary-50 text-[#0052CC] border-r-2 border-[#0052CC] font-semibold' : ''
                    }`
                  }
                >
                  <Activity className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" />
                  <span className="ml-3 font-medium">Laporan</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/settings"
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group ${
                      isActive ? 'bg-primary-50 text-[#0052CC] border-r-2 border-[#0052CC] font-semibold' : ''
                    }`
                  }
                >
                  <Settings className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" />
                  <span className="ml-3 font-medium">Pengaturan</span>
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar