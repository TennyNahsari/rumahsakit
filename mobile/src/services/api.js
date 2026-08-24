import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT Token from AsyncStorage
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error fetching access token from storage', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
          const { accessToken } = refreshRes.data.data;
          await AsyncStorage.setItem('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      }
    }
    return Promise.reject(error);
  }
);

// API Service Methods
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  logout: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (e) {
      console.log('Logout API call error:', e.message);
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    }
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const publicService = {
  getDoctors: async () => {
    const response = await api.get('/users/public/doctors');
    return response.data;
  },
  getPolyclinics: async () => {
    const response = await api.get('/polyclinics/public');
    return response.data;
  },
  bookPublicAppointment: async (bookingData) => {
    const response = await api.post('/visits/public-booking', bookingData);
    return response.data;
  },
};

export const polyclinicService = {
  getPolyclinics: async (params) => {
    const response = await api.get('/polyclinics', { params });
    return response.data;
  },
  getPolyclinicById: async (id) => {
    const response = await api.get(`/polyclinics/${id}`);
    return response.data;
  },
  createPolyclinic: async (data) => {
    const response = await api.post('/polyclinics', data);
    return response.data;
  },
  updatePolyclinic: async (id, data) => {
    const response = await api.put(`/polyclinics/${id}`, data);
    return response.data;
  },
  deletePolyclinic: async (id) => {
    const response = await api.delete(`/polyclinics/${id}`);
    return response.data;
  },
};

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
  getActivities: async () => {
    const response = await api.get('/dashboard/activities');
    return response.data;
  },
};

export const predictionService = {
  train: async () => {
    const response = await api.post('/predictions/train');
    return response.data;
  },
  predict: async (days = 7) => {
    const response = await api.post('/predictions/predict', { days });
    return response.data;
  },
};

export const userService = {
  getUsers: async (params) => {
    const response = await api.get('/users', { params });
    return response.data;
  },
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  createUser: async (data) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  updateUser: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export const patientService = {
  getPatients: async (params) => {
    const response = await api.get('/patients', { params });
    return response.data;
  },
  getPatientById: async (id) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },
  createPatient: async (data) => {
    const response = await api.post('/patients', data);
    return response.data;
  },
  updatePatient: async (id, data) => {
    const response = await api.put(`/patients/${id}`, data);
    return response.data;
  },
  deletePatient: async (id) => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  },
};

export const visitService = {
  getVisits: async (params) => {
    const response = await api.get('/visits', { params });
    return response.data;
  },
  getVisitById: async (id) => {
    const response = await api.get(`/visits/${id}`);
    return response.data;
  },
  createVisit: async (data) => {
    const response = await api.post('/visits', data);
    return response.data;
  },
  updateVisit: async (id, data) => {
    const response = await api.put(`/visits/${id}`, data);
    return response.data;
  },
  deleteVisit: async (id) => {
    const response = await api.delete(`/visits/${id}`);
    return response.data;
  },
  callVisit: async (id) => {
    const response = await api.post(`/visits/${id}/call`);
    return response.data;
  },
  startVisit: async (id) => {
    const response = await api.post(`/visits/${id}/start`);
    return response.data;
  },
  completeVisit: async (id) => {
    const response = await api.post(`/visits/${id}/complete`);
    return response.data;
  },
  skipVisit: async (id) => {
    const response = await api.post(`/visits/${id}/skip`);
    return response.data;
  },
};

export const recordService = {
  getRecords: async (params) => {
    const response = await api.get('/records', { params });
    return response.data;
  },
  getRecordById: async (id) => {
    const response = await api.get(`/records/${id}`);
    return response.data;
  },
  createRecord: async (data) => {
    const response = await api.post('/records', data);
    return response.data;
  },
  updateRecord: async (id, data) => {
    const response = await api.put(`/records/${id}`, data);
    return response.data;
  },
  deleteRecord: async (id) => {
    const response = await api.delete(`/records/${id}`);
    return response.data;
  },
};

export const medicineService = {
  getMedicines: async (params) => {
    const response = await api.get('/medicines', { params });
    return response.data;
  },
  getMedicineById: async (id) => {
    const response = await api.get(`/medicines/${id}`);
    return response.data;
  },
  createMedicine: async (data) => {
    const response = await api.post('/medicines', data);
    return response.data;
  },
  updateMedicine: async (id, data) => {
    const response = await api.put(`/medicines/${id}`, data);
    return response.data;
  },
  deleteMedicine: async (id) => {
    const response = await api.delete(`/medicines/${id}`);
    return response.data;
  },
  addBatch: async (id, data) => {
    const response = await api.post(`/medicines/${id}/batch`, data);
    return response.data;
  },
};

export const roomService = {
  getRooms: async (params) => {
    const response = await api.get('/rooms', { params });
    return response.data;
  },
  getRoomById: async (id) => {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },
  createRoom: async (data) => {
    const response = await api.post('/rooms', data);
    return response.data;
  },
  updateRoom: async (id, data) => {
    const response = await api.put(`/rooms/${id}`, data);
    return response.data;
  },
  deleteRoom: async (id) => {
    const response = await api.delete(`/rooms/${id}`);
    return response.data;
  },
};

export const inpatientService = {
  getInpatients: async (params) => {
    const response = await api.get('/inpatients', { params });
    return response.data;
  },
  getInpatientById: async (id) => {
    const response = await api.get(`/inpatients/${id}`);
    return response.data;
  },
  checkIn: async (data) => {
    const response = await api.post('/inpatients/check-in', data);
    return response.data;
  },
  updateInpatient: async (id, data) => {
    const response = await api.put(`/inpatients/${id}`, data);
    return response.data;
  },
  checkOut: async (id, data) => {
    const response = await api.post(`/inpatients/${id}/check-out`, data);
    return response.data;
  },
  getHistory: async (params) => {
    const response = await api.get('/inpatients/history', { params });
    return response.data;
  },
};

export const billingService = {
  getBillings: async (params) => {
    try {
      const response = await api.get('/billing', { params });
      return response.data;
    } catch (e) {
      const response = await api.get('/billings', { params });
      return response.data;
    }
  },
  getBillingById: async (id) => {
    try {
      const response = await api.get(`/billing/${id}`);
      return response.data;
    } catch (e) {
      const response = await api.get(`/billings/${id}`);
      return response.data;
    }
  },
  createBilling: async (data) => {
    const response = await api.post('/billing', data);
    return response.data;
  },
  updateBilling: async (id, data) => {
    const response = await api.put(`/billing/${id}`, data);
    return response.data;
  },
  deleteBilling: async (id) => {
    const response = await api.delete(`/billing/${id}`);
    return response.data;
  },
  processPayment: async (id, data) => {
    const response = await api.put(`/billing/${id}`, { status: 'PAID', ...data });
    return response.data;
  },
};

export default api;
