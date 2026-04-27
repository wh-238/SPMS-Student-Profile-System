import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import ChatWidget from './components/ChatWidget'
import { useTheme } from './hooks/useTheme'
import AdminUsers from './pages/AdminUsers'
import AdminLogs from './pages/AdminLogs'
import AdminCommunity from './pages/AdminCommunity'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import EditProfile from './pages/EditProfile'
import Privacy from './pages/Privacy'
import SearchUsers from './pages/SearchUsers'
import PublicProfile from './pages/PublicProfile'
import Community from './pages/Community'

function GuestRoute({ children }) {
  const { isAuthenticated, isCheckingAuth } = useAuth()

  if (isCheckingAuth) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function AppContent() {
  const { colors } = useTheme()

  return (
    <BrowserRouter>
      <Navbar />
      <ChatWidget />
      <div style={{ background: colors.bg, minHeight: 'calc(100vh - 64px)' }}>
        <Routes>
          <Route path="/" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/privacy"
            element={
              <ProtectedRoute>
                <Privacy />
              </ProtectedRoute>
            }
          />

          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/public-profile/:id"
            element={
              <ProtectedRoute>
                <PublicProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/logs"
            element={
              <ProtectedRoute>
                <AdminLogs />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/community"
            element={
              <ProtectedRoute>
                <AdminCommunity />
              </ProtectedRoute>
            }
          />


        </Routes>
      </div>
    </BrowserRouter>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
