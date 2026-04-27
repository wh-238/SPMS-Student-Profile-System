import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const navigate = useNavigate()
  const { isDark, toggleTheme, colors } = useTheme()
  const { isAuthenticated, isCheckingAuth, logout, profile } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav
      style={{
        background: colors.bgSecondary,
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: `0 2px 8px ${colors.shadow}`
      }}
    >
      <div className="container" style={{ padding: '0 24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '64px'
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {!isAuthenticated && !isCheckingAuth ? (
              <>
                <Link
                  to="/login"
                  style={{
                    color: colors.textSecondary,
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={e => e.target.style.color = colors.primary}
                  onMouseLeave={e => e.target.style.color = colors.textSecondary}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  style={{
                    color: colors.textSecondary,
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={e => e.target.style.color = colors.primary}
                  onMouseLeave={e => e.target.style.color = colors.textSecondary}
                >
                  Register
                </Link>
              </>
            ) : isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  style={{
                    color: colors.textSecondary,
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={e => e.target.style.color = colors.primary}
                  onMouseLeave={e => e.target.style.color = colors.textSecondary}
                >
                  Dashboard
                </Link>
                <Link
                  to="/community"
                  style={{
                    color: colors.textSecondary,
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={e => e.target.style.color = colors.primary}
                  onMouseLeave={e => e.target.style.color = colors.textSecondary}
                >
                  Community
                </Link>
                {profile?.role === 'admin' && (
                  <Link
                    to="/admin/community"
                    style={{
                      color: colors.textSecondary,
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 500,
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.target.style.color = colors.primary}
                    onMouseLeave={e => e.target.style.color = colors.textSecondary}
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
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.target.style.opacity = '0.9'}
                  onMouseLeave={e => e.target.style.opacity = '1'}
                >
                  Logout
                </button>
              </>
            ) : null}

            <button
              onClick={toggleTheme}
              style={{
                background: 'transparent',
                border: `1px solid ${colors.border}`,
                color: colors.text,
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
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
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
