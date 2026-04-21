import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import API from '../api/api'

function Privacy() {
  const [privacy, setPrivacy] = useState({
    show_major: false,
    show_bio: false,
    show_phone: false,
    show_address: false,
    show_birthday: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const { colors } = useTheme()

  useEffect(() => {
    const fetchPrivacy = async () => {
      const res = await API.get('/privacy/me')
      setPrivacy(res.data)
    }
    fetchPrivacy()
  }, [])

  const handleChange = (e) => {
    setPrivacy({
      ...privacy,
      [e.target.name]: e.target.checked
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await API.put('/privacy/me', privacy)
      setSuccess('Privacy settings updated successfully!')
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { name: 'show_major', label: 'Show Major' },
    { name: 'show_bio', label: 'Show Bio' },
    { name: 'show_phone', label: 'Show Phone' },
    { name: 'show_address', label: 'Show Address' },
    { name: 'show_birthday', label: 'Show Birthday' }
  ]

  return (
    <div style={{ background: colors.bg, minHeight: 'calc(100vh - 64px)', padding: '32px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: colors.text, marginBottom: '8px' }}>
          Privacy Settings
        </h1>
        <p style={{ color: colors.textSecondary, fontSize: '15px', marginBottom: '32px' }}>
          Choose which information is visible to other users
        </p>

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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {fields.map((field) => (
            <div
              key={field.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                background: colors.bgSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = colors.bgTertiary)}
              onMouseLeave={(e) => (e.currentTarget.style.background = colors.bgSecondary)}
            >
              <input
                type="checkbox"
                id={field.name}
                name={field.name}
                checked={privacy[field.name] || false}
                onChange={handleChange}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: colors.primary
                }}
              />
              <label
                htmlFor={field.name}
                style={{
                  flex: 1,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: colors.text,
                  cursor: 'pointer',
                  margin: 0
                }}
              >
                {field.label}
              </label>
            </div>
          ))}

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: colors.primary,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => !loading && (e.target.style.background = colors.primaryHover)}
              onMouseLeave={(e) => !loading && (e.target.style.background = colors.primary)}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: colors.bgTertiary,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => (e.target.style.background = colors.border)}
              onMouseLeave={(e) => (e.target.style.background = colors.bgTertiary)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Privacy
