import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useIsMobile } from '../hooks/useIsMobile'
import API from '../api/api'

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const { colors } = useTheme()
  const isMobile = useIsMobile()

  const isNameValid = (value) => value.trim().length > 0
  const isEmailValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  const isPasswordValid = (value) => value.length >= 6

  const nameError = nameTouched && !isNameValid(name) ? 'Please enter your full name' : ''
  const emailError = emailTouched && !isEmailValid(email) ? 'Please enter a valid email like name@example.com' : ''
  const passwordError = passwordTouched && !isPasswordValid(password) ? 'Password must be at least 6 characters' : ''

  const handleSubmit = async (e) => {
    e.preventDefault()

    setNameTouched(true)
    setEmailTouched(true)
    setPasswordTouched(true)

    if (!isNameValid(name)) {
      setError('Please enter your full name')
      return
    }

    if (!isEmailValid(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (!isPasswordValid(password)) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await API.post('/auth/register', {
        name,
        email,
        password
      })
      setSuccess('Account created successfully! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed')
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
        padding: isMobile ? '14px' : '20px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: colors.bgSecondary,
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          padding: isMobile ? '24px 18px' : '40px',
          boxShadow: `0 10px 32px ${colors.shadow}`
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>👤</div>
          <h1
            style={{
              fontSize: isMobile ? '24px' : '28px',
              fontWeight: 700,
              color: colors.text,
              margin: 0,
              marginBottom: '8px'
            }}
          >
            Create account
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '14px', margin: 0 }}>
            Join SPMS to get started
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

        {success && (
          <div
            style={{
              background: colors.success,
              color: '#fff',
              padding: '12px 14px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '13px'
            }}
          >
            {success}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!nameTouched) setNameTouched(true)
              }}
              placeholder="John Doe"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${nameError ? colors.danger : colors.border}`,
                borderRadius: '8px',
                background: colors.bg,
                color: colors.text,
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = colors.primary}
              onBlur={e => {
                setNameTouched(true)
                e.target.style.borderColor = nameError ? colors.danger : colors.border
              }}
            />
            {nameError && (
              <p style={{ margin: '6px 0 0', color: colors.danger, fontSize: '12px' }}>
                {nameError}
              </p>
            )}
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
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (!emailTouched) setEmailTouched(true)
              }}
              autoComplete="email"
              placeholder="john@example.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${emailError ? colors.danger : colors.border}`,
                borderRadius: '8px',
                background: colors.bg,
                color: colors.text,
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = colors.primary}
              onBlur={e => {
                setEmailTouched(true)
                e.target.style.borderColor = emailError ? colors.danger : colors.border
              }}
            />
            {emailError && (
              <p style={{ margin: '6px 0 0', color: colors.danger, fontSize: '12px' }}>
                {emailError}
              </p>
            )}
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
              onChange={(e) => {
                setPassword(e.target.value)
                if (!passwordTouched) setPasswordTouched(true)
              }}
              minLength={6}
              autoComplete="new-password"
              placeholder="Create a strong password"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${passwordError ? colors.danger : colors.border}`,
                borderRadius: '8px',
                background: colors.bg,
                color: colors.text,
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = colors.primary}
              onBlur={e => {
                setPasswordTouched(true)
                e.target.style.borderColor = passwordError ? colors.danger : colors.border
              }}
            />
            {passwordError && (
              <p style={{ margin: '6px 0 0', color: colors.danger, fontSize: '12px' }}>
                {passwordError}
              </p>
            )}
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
            {loading ? 'Creating account...' : 'Create account'}
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
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: colors.primary,
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register
