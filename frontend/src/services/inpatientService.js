import api from './api'

const inpatientService = {
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
  checkInPatient: async (data) => {
    const response = await api.post('/inpatients/check-in', data)
    return response.data
  },

  // Update occupancy (edit check-in, change room)
  updateOccupancy: async (id, data) => {
    const response = await api.put(`/inpatients/${id}`, data)
    return response.data
  },

  // Update occupancy status (PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED)
  updateStatus: async (id, data) => {
    const response = await api.patch(`/inpatients/${id}/status`, data)
    return response.data
  },

  // Check-out patient
  checkOutPatient: async (id, data) => {
    const response = await api.post(`/inpatients/${id}/check-out`, data)
    return response.data
  },

  // Get occupancy history (checked-out patients)
  getHistory: async (params = {}) => {
    const response = await api.get('/inpatients/history', { params })
    return response.data
  },

  // Delete inpatient occupancy
  deleteInpatient: async (id) => {
    const response = await api.delete(`/inpatients/${id}`)
    return response.data
  },
}

export default inpatientService
