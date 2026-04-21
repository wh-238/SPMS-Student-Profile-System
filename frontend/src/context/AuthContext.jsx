import { createContext, useContext, useEffect, useState } from 'react'
import API from '../api/api'

const AuthContext = createContext(null)

const getStoredToken = () => localStorage.getItem('token')

const clearStoredToken = () => localStorage.removeItem('token')

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [profile, setProfile] = useState(null)

  const validateSession = async () => {
    const token = getStoredToken()

    if (!token) {
      setIsAuthenticated(false)
      setProfile(null)
      setIsCheckingAuth(false)
      return false
    }

    setIsCheckingAuth(true)

    try {
      const res = await API.get('/profile/me')
      setProfile(res.data)
      setIsAuthenticated(true)
      return true
    } catch {
      clearStoredToken()
      setProfile(null)
      setIsAuthenticated(false)
      return false
    } finally {
      setIsCheckingAuth(false)
    }
  }

  useEffect(() => {
    validateSession()

    const handleStorageChange = (event) => {
      if (event.key === 'token') {
        validateSession()
      }
    }

    const handleAuthChange = () => {
      validateSession()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateSession()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('auth-change', handleAuthChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-change', handleAuthChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const login = async (token) => {
    localStorage.setItem('token', token)
    window.dispatchEvent(new Event('auth-change'))
    return validateSession()
  }

  const logout = () => {
    clearStoredToken()
    setProfile(null)
    setIsAuthenticated(false)
    setIsCheckingAuth(false)
    window.dispatchEvent(new Event('auth-change'))
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isCheckingAuth,
        profile,
        login,
        logout,
        refreshSession: validateSession
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}