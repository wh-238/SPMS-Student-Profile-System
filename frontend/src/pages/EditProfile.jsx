import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useIsMobile } from '../hooks/useIsMobile'
import API from '../api/api'

function EditProfile() {
  const [form, setForm] = useState({
    name: '',
    major: '',
    bio: '',
    phone: '',
    address: '',
    birthday: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const { colors } = useTheme()
  const isMobile = useIsMobile()

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await API.get('/profile/me')
      setForm(res.data)
    }
    fetchProfile()
  }, [])

  const handleChange = (e) => {
    const value = e.target.name === 'phone' ? e.target.value.replace(/\D/g, '') : e.target.value

    setForm({
      ...form,
      [e.target.name]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await API.put('/profile/me', form)
      setSuccess('Profile updated successfully!')
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'major', label: 'Major', type: 'text' },
    { name: 'bio', label: 'Bio', type: 'textarea' },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'address', label: 'Address', type: 'text' },
    { name: 'birthday', label: 'Birthday', type: 'date' }
  ]

  return (
    <div style={{ background: colors.bg, minHeight: 'calc(100vh - 64px)', padding: isMobile ? '20px 14px 32px' : '32px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: 700, color: colors.text, marginBottom: '8px' }}>
          Edit Profile
        </h1>
        <p style={{ color: colors.textSecondary, fontSize: isMobile ? '14px' : '15px', marginBottom: '24px' }}>
          Update your personal information
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {fields.map((field) => (
            <div key={field.name}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: colors.text,
                  marginBottom: '8px'
                }}
              >
                {field.label}
                {field.required && <span style={{ color: colors.danger }}>*</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  name={field.name}
                  value={form[field.name] || ''}
                  onChange={handleChange}
                  rows={4}
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
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = colors.primary)}
                  onBlur={(e) => (e.target.style.borderColor = colors.border)}
                />
              ) : (
                <input
                  type={field.type}
                  name={field.name}
                  value={field.type === 'date' ? form[field.name]?.split('T')[0] || '' : form[field.name] || ''}
                  onChange={handleChange}
                  inputMode={field.name === 'phone' ? 'numeric' : undefined}
                  pattern={field.name === 'phone' ? '[0-9]*' : undefined}
                  required={field.required}
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
                  onFocus={(e) => (e.target.style.borderColor = colors.primary)}
                  onBlur={(e) => (e.target.style.borderColor = colors.border)}
                />
              )}
            </div>
          ))}

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
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
              {loading ? 'Saving...' : 'Save Changes'}
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

export default EditProfile
