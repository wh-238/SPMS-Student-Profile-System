import { createContext, useState, useEffect } from 'react'

export const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : true
  })

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const theme = {
    isDark,
    toggleTheme: () => setIsDark(!isDark),
    colors: isDark ? {
      bg: '#0f172a',
      bgSecondary: '#1e293b',
      bgTertiary: '#334155',
      text: '#e2e8f0',
      textSecondary: '#cbd5e1',
      border: '#475569',
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      success: '#10b981',
      danger: '#ef4444',
      shadow: 'rgba(0, 0, 0, 0.3)'
    } : {
      bg: '#f9fafb',
      bgSecondary: '#ffffff',
      bgTertiary: '#f3f4f6',
      text: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      primary: '#2563eb',
      primaryHover: '#1d4ed8',
      success: '#059669',
      danger: '#dc2626',
      shadow: 'rgba(0, 0, 0, 0.08)'
    }
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}
