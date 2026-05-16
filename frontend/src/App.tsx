import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import apiClient from './api/client'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Garage from './pages/Garage'
import CarDetails from './pages/CarDetails'
import ServiceCenters from './pages/ServiceCenters'
import ServiceCenterMap from './pages/ServiceCenterMap'
import ServiceCenterDetails from './pages/ServiceCenterDetails'
import Bookings from './pages/Bookings'
import Notifications from './pages/Notifications'
import EducationalContent from './pages/EducationalContent'
import MaintenanceHistory from './pages/MaintenanceHistory'
import MaintenanceCalendar from './pages/MaintenanceCalendar'
import ComponentsView from './pages/ComponentsView'
import Chat from './pages/Chat'
import QuizPage from './pages/QuizPage'
import AdminPanel from './pages/AdminPanel'
import ServiceCenterBookings from './pages/ServiceCenterBookings'
import ServiceCenterClients from './pages/ServiceCenterClients'
import ServiceCenterReviews from './pages/ServiceCenterReviews'
import ServiceCenterSettings from './pages/ServiceCenterSettings'
import ServiceCenterOperations from './pages/ServiceCenterOperations'
import ServiceCenterOperationCreate from './pages/ServiceCenterOperationCreate'
import ServiceCenterInvoices from './pages/ServiceCenterInvoices'
import ClientDocuments from './pages/ClientDocuments'
import Layout from './components/Layout'

const queryClient = new QueryClient()

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function RoleRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: string[]
  children: React.ReactNode
}) {
  const { user } = useAuthStore()
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function App() {
  const { token, isAuthenticated, setUser } = useAuthStore()

  useEffect(() => {
    if (!token || !isAuthenticated) {
      return
    }

    apiClient
      .get('/auth/me')
      .then((response) => {
        setUser(response.data)
      })
      .catch(() => {})
  }, [token, isAuthenticated, setUser])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="garage" element={<Garage />} />
            <Route path="cars/:id" element={<CarDetails />} />
            <Route path="cars/:id/components" element={<ComponentsView />} />
            <Route path="cars/:id/history" element={<MaintenanceHistory />} />
            <Route path="maintenance-history" element={<MaintenanceHistory />} />
            <Route path="service-centers" element={<ServiceCenters />} />
            <Route path="service-centers/:id" element={<ServiceCenterDetails />} />
            <Route path="service-centers/map" element={<ServiceCenterMap />} />
            <Route path="bookings" element={<Bookings />} />
            <Route
              path="my-documents"
              element={
                <RoleRoute allowedRoles={['USER']}>
                  <ClientDocuments />
                </RoleRoute>
              }
            />
            <Route path="notifications" element={<Notifications />} />
            <Route path="educational-content" element={<EducationalContent />} />
            <Route path="quizzes/:id" element={<QuizPage />} />
            <Route path="maintenance-calendar" element={<MaintenanceCalendar />} />
            <Route path="chat/:receiverId?" element={<Chat />} />
            <Route
              path="admin"
              element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminPanel />
                </RoleRoute>
              }
            />
            <Route
              path="service-center/bookings"
              element={
                <RoleRoute allowedRoles={['SERVICE_CENTER']}>
                  <ServiceCenterBookings />
                </RoleRoute>
              }
            />
            <Route
              path="service-center/clients"
              element={
                <RoleRoute allowedRoles={['SERVICE_CENTER']}>
                  <ServiceCenterClients />
                </RoleRoute>
              }
            />
            <Route
              path="service-center/operations/new"
              element={
                <RoleRoute allowedRoles={['SERVICE_CENTER']}>
                  <ServiceCenterOperationCreate />
                </RoleRoute>
              }
            />
            <Route
              path="service-center/operations"
              element={
                <RoleRoute allowedRoles={['SERVICE_CENTER']}>
                  <ServiceCenterOperations />
                </RoleRoute>
              }
            />
            <Route
              path="service-center/invoices"
              element={
                <RoleRoute allowedRoles={['SERVICE_CENTER']}>
                  <ServiceCenterInvoices />
                </RoleRoute>
              }
            />
            <Route
              path="service-center/reviews"
              element={
                <RoleRoute allowedRoles={['SERVICE_CENTER']}>
                  <ServiceCenterReviews />
                </RoleRoute>
              }
            />
            <Route
              path="service-center/settings"
              element={
                <RoleRoute allowedRoles={['SERVICE_CENTER']}>
                  <ServiceCenterSettings />
                </RoleRoute>
              }
            />
          </Route>
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(8, 17, 29, 0.94)',
              color: '#f8fafc',
              border: '1px solid rgba(148, 163, 184, 0.14)',
              borderRadius: '18px',
              boxShadow: '0 28px 56px -28px rgba(2, 6, 23, 0.9)',
            },
            success: {
              iconTheme: {
                primary: '#34d399',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#fb7185',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
