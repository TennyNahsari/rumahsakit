import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import PatientDetail from './pages/PatientDetail'
import PatientForm from './pages/PatientForm'
import PatientEdit from './pages/PatientEdit'
import Visits from './pages/Visits'
import VisitForm from './pages/VisitForm'
import VisitDetail from './pages/VisitDetail'
import VisitEdit from './pages/VisitEdit'
import Records from './pages/Records'
import RecordForm from './pages/RecordForm'
import RecordEdit from './pages/RecordEdit'
import RecordDetail from './pages/RecordDetail'
import Rooms from './pages/Rooms'
import RoomForm from './pages/RoomForm'
import RoomEdit from './pages/RoomEdit'
import RoomDetail from './pages/RoomDetail'
import Inpatients from './pages/Inpatients'
import CheckInForm from './pages/CheckInForm'
import InpatientDetail from './pages/InpatientDetail'
import InpatientEdit from './pages/InpatientEdit'
import InpatientHistory from './pages/InpatientHistory'
import Medicines from './pages/Medicines'
import MedicineForm from './pages/MedicineForm'
import MedicineEdit from './pages/MedicineEdit'
import Billing from './pages/Billing'
import BillingForm from './pages/BillingForm'
import BillingDetail from './pages/BillingDetail'
import BillingEdit from './pages/BillingEdit'
import Users from './pages/Users'
import UserForm from './pages/UserForm'
import UserEdit from './pages/UserEdit'
import UserDetail from './pages/UserDetail'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import QueueDisplay from './pages/QueueDisplay'

// Layout
import Layout from './components/Layout'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <Layout>{children}</Layout>
}

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/patients" 
              element={
                <ProtectedRoute>
                  <Patients />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/patients/new" 
              element={
                <ProtectedRoute>
                  <PatientForm />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/patients/:id/edit" 
              element={
                <ProtectedRoute>
                  <PatientEdit />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/patients/:id" 
              element={
                <ProtectedRoute>
                  <PatientDetail />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/visits/new" 
              element={
                <ProtectedRoute>
                  <VisitForm />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/visits/:id/edit" 
              element={
                <ProtectedRoute>
                  <VisitEdit />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/visits/:id" 
              element={
                <ProtectedRoute>
                  <VisitDetail />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/visits" 
              element={
                <ProtectedRoute>
                  <Visits />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/records/new" 
              element={
                <ProtectedRoute>
                  <RecordForm />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/records/:id/edit" 
              element={
                <ProtectedRoute>
                  <RecordEdit />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/records/:id" 
              element={
                <ProtectedRoute>
                  <RecordDetail />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/records" 
              element={
                <ProtectedRoute>
                  <Records />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/rooms/new" 
              element={
                <ProtectedRoute>
                  <RoomForm />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/rooms/:id/edit" 
              element={
                <ProtectedRoute>
                  <RoomEdit />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/rooms/:id" 
              element={
                <ProtectedRoute>
                  <RoomDetail />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/rooms" 
              element={
                <ProtectedRoute>
                  <Rooms />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/inpatients/check-in" 
              element={
                <ProtectedRoute>
                  <CheckInForm />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/inpatients/history" 
              element={
                <ProtectedRoute>
                  <InpatientHistory />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/inpatients/:id/edit" 
              element={
                <ProtectedRoute>
                  <InpatientEdit />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/inpatients/:id" 
              element={
                <ProtectedRoute>
                  <InpatientDetail />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/inpatients" 
              element={
                <ProtectedRoute>
                  <Inpatients />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/medicines/new" 
              element={
                <ProtectedRoute>
                  <MedicineForm />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/medicines/:id/edit" 
              element={
                <ProtectedRoute>
                  <MedicineEdit />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/medicines" 
              element={
                <ProtectedRoute>
                  <Medicines />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/billing/new" 
              element={
                <ProtectedRoute>
                  <BillingForm />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/billing/:id/edit" 
              element={
                <ProtectedRoute>
                  <BillingEdit />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/billing/:id" 
              element={
                <ProtectedRoute>
                  <BillingDetail />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/billing" 
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/users/new" 
              element={
                <ProtectedRoute>
                  <UserForm />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/users/:id/edit" 
              element={
                <ProtectedRoute>
                  <UserEdit />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/users/:id" 
              element={
                <ProtectedRoute>
                  <UserDetail />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/users" 
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              } 
            />
            
            {/* Public TV Queue Display Route */}
            <Route path="/queue-display" element={<QueueDisplay />} />

            {/* Landing Page */}
            <Route path="/" element={<Landing />} />
            
            {/* 404 Route */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600">Page not found</p>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App