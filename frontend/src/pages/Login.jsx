import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../context/AuthContext'
import API from '../api/api'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { colors } = useTheme()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await API.post('/auth/login', {
        email,
        password
      })
      const isValid = await login(res.data.token)
      navigate(isValid ? '/dashboard' : '/login', { replace: true })
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.bg,
        padding: '20px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: colors.bgSecondary,
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          padding: '40px',
          boxShadow: `0 10px 32px ${colors.shadow}`
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔐</div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: colors.text,
              margin: 0,
              marginBottom: '8px'
            }}
          >
            Welcome back
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '14px', margin: 0 }}>
            Sign in to your SPMS account
          </p>
        </div>

        {error && (
          <div
            style={{
              background: colors.danger,
              color: '#fff',
              padding: '12px 14px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '13px'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: colors.text,
                marginBottom: '6px'
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                background: colors.bg,
                color: colors.text,
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = colors.primary}
              onBlur={e => e.target.style.borderColor = colors.border}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: colors.text,
                marginBottom: '6px'
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                background: colors.bg,
                color: colors.text,
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = colors.primary}
              onBlur={e => e.target.style.borderColor = colors.border}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background 0.2s',
              marginTop: '8px'
            }}
            onMouseEnter={e => !loading && (e.target.style.background = colors.primaryHover)}
            onMouseLeave={e => !loading && (e.target.style.background = colors.primary)}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div
          style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '13px',
            color: colors.textSecondary
          }}
        >
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{
              color: colors.primary,
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login