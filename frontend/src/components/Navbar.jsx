import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark, toggleTheme, colors } = useTheme()
  const { isAuthenticated, isCheckingAuth, logout, profile } = useAuth()
  const isMobile = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isMobile) {
      setMenuOpen(false)
    }
  }, [isMobile])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const linkStyle = {
    color: colors.text,
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'color 0.2s',
    padding: isMobile ? '10px 12px' : 0,
    borderRadius: '10px',
    background: isMobile ? colors.bg : 'transparent'
  }

  const renderAuthLinks = () => {
    if (!isAuthenticated && !isCheckingAuth) {
      return (
        <>
          <Link
            to="/login"
            style={linkStyle}
            onMouseEnter={e => e.target.style.color = colors.primary}
            onMouseLeave={e => e.target.style.color = colors.text}
          >
            Login
          </Link>
          <Link
            to="/register"
            style={linkStyle}
            onMouseEnter={e => e.target.style.color = colors.primary}
            onMouseLeave={e => e.target.style.color = colors.text}
          >
            Register
          </Link>
        </>
      )
    }

    if (!isAuthenticated) {
      return null
    }

    return (
      <>
        <Link
          to="/dashboard"
          style={linkStyle}
          onMouseEnter={e => e.target.style.color = colors.primary}
          onMouseLeave={e => e.target.style.color = colors.text}
        >
          Dashboard
        </Link>
        <Link
          to="/community"
          style={linkStyle}
          onMouseEnter={e => e.target.style.color = colors.primary}
          onMouseLeave={e => e.target.style.color = colors.text}
        >
          Community
        </Link>
        {profile?.role === 'admin' && (
          <Link
            to="/admin/community"
            style={linkStyle}
            onMouseEnter={e => e.target.style.color = colors.primary}
            onMouseLeave={e => e.target.style.color = colors.text}
          >
            Moderation
          </Link>
        )}
        <button
          onClick={handleLogout}
          style={{
            background: colors.danger,
            border: 'none',
            color: '#fff',
            padding: isMobile ? '10px 14px' : '6px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 0.2s',
            width: isMobile ? '100%' : 'auto'
          }}
          onMouseEnter={e => e.target.style.opacity = '0.9'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        >
          Logout
        </button>
      </>
    )
  }

  return (
    <nav
      style={{
        background: colors.bgSecondary,
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: `0 2px 8px ${colors.shadow}`
      }}
    >
      <div
        className="container"
        style={{
          padding: isMobile ? '0 16px' : '0 24px'
        }}
      >
        {isMobile ? (
          <div style={{ padding: '10px 0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                minHeight: '44px'
              }}
            >
              <Link
                to="/"
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: colors.primary,
                  textDecoration: 'none',
                  letterSpacing: '-0.5px'
                }}
              >
                SPMS
              </Link>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((value) => !value)}
                  style={{
                    background: colors.bgTertiary,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                    minWidth: '72px',
                    height: '36px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700
                  }}
                >
                  {menuOpen ? 'Close' : 'Menu'}
                </button>

                <button
                  onClick={toggleTheme}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                    minWidth: '36px',
                    height: '36px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    transition: 'background 0.2s, border-color 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.target.style.background = colors.bgTertiary
                    e.target.style.borderColor = colors.primary
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = 'transparent'
                    e.target.style.borderColor = colors.border
                  }}
                  title={isDark ? 'Light Mode' : 'Dark Mode'}
                >
                  {isDark ? 'Light' : 'Dark'}
                </button>
              </div>
            </div>

            {menuOpen && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  paddingTop: '12px'
                }}
              >
                {renderAuthLinks()}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              minHeight: '64px',
              gap: '20px'
            }}
          >
            <Link
              to="/"
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: colors.primary,
                textDecoration: 'none',
                letterSpacing: '-0.5px'
              }}
            >
              SPMS
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
              {renderAuthLinks()}
              <button
                onClick={toggleTheme}
                style={{
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                  minWidth: '36px',
                  height: '36px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  transition: 'background 0.2s, border-color 0.2s'
                }}
                onMouseEnter={e => {
                  e.target.style.background = colors.bgTertiary
                  e.target.style.borderColor = colors.primary
                }}
                onMouseLeave={e => {
                  e.target.style.background = 'transparent'
                  e.target.style.borderColor = colors.border
                }}
                title={isDark ? 'Light Mode' : 'Dark Mode'}
              >
                {isDark ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
