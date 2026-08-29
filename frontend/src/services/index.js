import api from './api'

export const authService = {
  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  // Register user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh-token', { refreshToken })
    return response.data
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },
}

export const patientService = {
  // Get all patients
  getPatients: async (params = {}) => {
    const response = await api.get('/patients', { params })
    return response.data
  },

  // Get single patient
  getPatient: async (id) => {
    const response = await api.get(`/patients/${id}`)
    return response.data
  },

  // Create patient
  createPatient: async (patientData) => {
    const response = await api.post('/patients', patientData)
    return response.data
  },

  // Update patient
  updatePatient: async (id, patientData) => {
    const response = await api.put(`/patients/${id}`, patientData)
    return response.data
  },

  // Delete patient
  deletePatient: async (id) => {
    const response = await api.delete(`/patients/${id}`)
    return response.data
  },

  // Search patients
  searchPatients: async (query) => {
    const response = await api.get('/patients/search', { params: { q: query } })
    return response.data
  },

  // Export patients to Excel
  exportPatients: async () => {
    const response = await api.get('/patients/export/excel', {
      responseType: 'blob'
    })
    return response
  },
}

export const visitService = {
  // Get all visits
  getVisits: async (params = {}) => {
    const response = await api.get('/visits', { params })
    return response.data
  },

  // Get single visit
  getVisit: async (id) => {
    const response = await api.get(`/visits/${id}`)
    return response.data
  },

  // Create visit
  createVisit: async (visitData) => {
    const response = await api.post('/visits', visitData)
    return response.data
  },

  // Update visit
  updateVisit: async (id, visitData) => {
    const response = await api.put(`/visits/${id}`, visitData)
    return response.data
  },

  // Delete visit
  deleteVisit: async (id) => {
    const response = await api.delete(`/visits/${id}`)
    return response.data
  },

  // Export visits to Excel
  exportVisits: async (params = {}) => {
    const response = await api.get('/visits/export/excel', {
      params,
      responseType: 'blob'
    })
    return response
  },

  // Queue actions
  callVisit: async (id) => {
    const response = await api.post(`/visits/${id}/call`)
    return response.data
  },

  startVisit: async (id) => {
    const response = await api.post(`/visits/${id}/start`)
    return response.data
  },

  completeVisit: async (id) => {
    const response = await api.post(`/visits/${id}/complete`)
    return response.data
  },

  skipVisit: async (id) => {
    const response = await api.post(`/visits/${id}/skip`)
    return response.data
  },

  autoCompleteDay: async () => {
    const response = await api.post('/visits/auto-complete-day')
    return response.data
  }
}

export const recordService = {
  // Get medical records
  getRecords: async (params = {}) => {
    const response = await api.get('/records', { params })
    return response.data
  },

  // Get single medical record
  getRecord: async (id) => {
    const response = await api.get(`/records/${id}`)
    return response.data
  },

  // Create medical record
  createRecord: async (recordData) => {
    const response = await api.post('/records', recordData)
    return response.data
  },

  // Update medical record
  updateRecord: async (id, recordData) => {
    const response = await api.put(`/records/${id}`, recordData)
    return response.data
  },

  // Delete medical record
  deleteRecord: async (id) => {
    const response = await api.delete(`/records/${id}`)
    return response.data
  },

  // Export medical records to Excel
  exportRecords: async (params = {}) => {
    const response = await api.get('/records/export/excel', {
      params,
      responseType: 'blob'
    })
    return response
  },
}

export const medicineService = {
  // Get all medicines
  getMedicines: async (params = {}) => {
    const response = await api.get('/medicines', { params })
    return response.data
  },

  // Get single medicine
  getMedicine: async (id) => {
    const response = await api.get(`/medicines/${id}`)
    return response.data
  },

  // Create medicine
  createMedicine: async (medicineData) => {
    const response = await api.post('/medicines', medicineData)
    return response.data
  },

  // Update medicine
  updateMedicine: async (id, medicineData) => {
    const response = await api.put(`/medicines/${id}`, medicineData)
    return response.data
  },

  // Delete medicine
  deleteMedicine: async (id) => {
    const response = await api.delete(`/medicines/${id}`)
    return response.data
  },

  // Export medicines to Excel
  exportMedicines: async () => {
    const response = await api.get('/medicines/export/excel', {
      responseType: 'blob'
    })
    return response
  },
}

export const billingService = {
  // Get all billings
  getBillings: async (params = {}) => {
    const response = await api.get('/billing', { params })
    return response.data
  },

  // Get single billing
  getBilling: async (id) => {
    const response = await api.get(`/billing/${id}`)
    return response.data
  },

  // Create billing
  createBilling: async (billingData) => {
    const response = await api.post('/billing', billingData)
    return response.data
  },

  // Update billing
  updateBilling: async (id, billingData) => {
    const response = await api.put(`/billing/${id}`, billingData)
    return response.data
  },

  // Record payment
  recordPayment: async (id, paymentData) => {
    const response = await api.post(`/billing/${id}/payment`, paymentData)
    return response.data
  },

  // Delete billing
  deleteBilling: async (id) => {
    const response = await api.delete(`/billing/${id}`)
    return response.data
  },

  // Get billing stats
  getBillingStats: async () => {
    const response = await api.get('/billing/stats')
    return response.data
  },

  // Export billings to Excel
  exportBillings: async (params = {}) => {
    const response = await api.get('/billing/export/excel', {
      params,
      responseType: 'blob'
    })
    return response
  },
}

// User Service
export const userService = {
  // Get all users
  getUsers: async () => {
    const response = await api.get('/users')
    return response.data
  },

  // Get single user
  getUser: async (id) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  // Create user
  createUser: async (userData) => {
    const response = await api.post('/users', userData)
    return response.data
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData)
    return response.data
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  // Export users to Excel
  exportUsers: async () => {
    const response = await api.get('/users/export/excel', {
      responseType: 'blob'
    })
    return response
  },
}

// Dashboard Service
export const dashboardService = {
  // Get dashboard statistics
  getStats: async () => {
    const response = await api.get('/dashboard/stats')
    return response.data
  },

  // Get recent activities
  getActivities: async (params = {}) => {
    const response = await api.get('/dashboard/activities', { params })
    return response.data
  },
}

// Room Service
export const roomService = {
  // Get all rooms with filters
  getRooms: async (params = {}) => {
    const response = await api.get('/rooms', { params })
    return response.data
  },

  // Get single room by ID
  getRoom: async (id) => {
    const response = await api.get(`/rooms/${id}`)
    return response.data
  },

  // Create new room
  createRoom: async (roomData) => {
    const response = await api.post('/rooms', roomData)
    return response.data
  },

  // Update room
  updateRoom: async (id, roomData) => {
    const response = await api.put(`/rooms/${id}`, roomData)
    return response.data
  },

  // Delete room
  deleteRoom: async (id) => {
    const response = await api.delete(`/rooms/${id}`)
    return response.data
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/rooms/dashboard/stats')
    return response.data
  },

  // Export rooms to Excel
  exportRoomsExcel: async (params = {}) => {
    const response = await api.get('/rooms/export', {
      params,
      responseType: 'blob'
    })
    return response
  },
}

// Inpatient Service
export const inpatientService = {
  // Get all active inpatients with filters
  getInpatients: async (params = {}) => {
    const response = await api.get('/inpatients', { params })
    return response.data
  },

  // Get single inpatient occupancy by ID
  getInpatient: async (id) => {
    const response = await api.get(`/inpatients/${id}`)
    return response.data
  },

  // Check-in patient
  checkInPatient: async (checkInData) => {
    const response = await api.post('/inpatients/check-in', checkInData)
    return response.data
  },

  // Update occupancy (change room)
  updateOccupancy: async (id, updateData) => {
    const response = await api.put(`/inpatients/${id}`, updateData)
    return response.data
  },

  // Check-out patient
  checkOutPatient: async (id, checkOutData) => {
    const response = await api.post(`/inpatients/${id}/check-out`, checkOutData)
    return response.data
  },

  // Get occupancy history
  getHistory: async (params = {}) => {
    const response = await api.get('/inpatients/history', { params })
    return response.data
  },

  // Export history to Excel
  exportHistoryExcel: async (params = {}) => {
    const response = await api.get('/inpatients/history/export', {
      params,
      responseType: 'blob'
    })
    return response
  },
}

// Polyclinic Service
export const polyclinicService = {
  // Get all polyclinics
  getPolyclinics: async (params = {}) => {
    const response = await api.get('/polyclinics', { params })
    return response.data
  },

  // Get single polyclinic
  getPolyclinic: async (id) => {
    const response = await api.get(`/polyclinics/${id}`)
    return response.data
  },

  // Create polyclinic
  createPolyclinic: async (data) => {
    const response = await api.post('/polyclinics', data)
    return response.data
  },

  // Update polyclinic
  updatePolyclinic: async (id, data) => {
    const response = await api.put(`/polyclinics/${id}`, data)
    return response.data
  },

  // Delete polyclinic
  deletePolyclinic: async (id) => {
    const response = await api.delete(`/polyclinics/${id}`)
    return response.data
  },
}

// Public Service
export const publicService = {
  getDoctors: async () => {
    const response = await api.get('/users/public/doctors')
    return response.data
  },
  getPolyclinics: async () => {
    const response = await api.get('/polyclinics/public')
    return response.data
  }
}

// Settings Service
export const settingsService = {
  getSocialLinks: async () => {
    const response = await api.get('/settings/social-links')
    return response.data
  },
  updateSocialLinks: async (links) => {
    const response = await api.put('/settings/social-links', links)
    return response.data
  }
}