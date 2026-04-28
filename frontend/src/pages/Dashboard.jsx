import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useIsMobile } from '../hooks/useIsMobile'
import API from '../api/api'

function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { colors } = useTheme()
  const isMobile = useIsMobile()

  const formatBirthday = (birthday) => {
    if (!birthday) return 'Not set'
    const raw = String(birthday)
    if (raw.includes('T')) return raw.split('T')[0]
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return 'Not set'
    return date.toISOString().split('T')[0]
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get('/profile/me')
        setProfile(res.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textSecondary }}>
        Loading profile...
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          background: colors.danger,
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
          marginTop: '20px'
        }}
      >
        {error}
      </div>
    )
  }

  if (!profile) {
    return (
      <div
        style={{
          background: colors.danger,
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
          marginTop: '20px'
        }}
      >
        Profile not found
      </div>
    )
  }

  const quickLinks = [
    { to: '/edit-profile', label: 'Edit Profile', background: '#f59e0b', hover: '#d97706', textColor: '#fff' },
    { to: '/privacy', label: 'Privacy Settings', background: colors.bgTertiary, hover: colors.border, textColor: colors.text, border: `1px solid ${colors.border}` },
    { to: '/search', label: 'Search Users', background: '#06b6d4', hover: '#0891b2', textColor: '#fff' },
    { to: '/community', label: 'Community Feed', background: '#8b5cf6', hover: '#7c3aed', textColor: '#fff' }
  ]

  const adminLinks = [
    { to: '/admin/users', label: 'Admin Users', background: '#ef4444', hover: '#dc2626' },
    { to: '/admin/logs', label: 'Admin Logs', background: '#1f2937', hover: '#111827' },
    { to: '/admin/community', label: 'Community Moderation', background: '#7c2d12', hover: '#9a3412' }
  ]

  return (
    <div style={{ background: colors.bg, minHeight: 'calc(100vh - 64px)', padding: isMobile ? '20px 14px 32px' : '32px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: isMobile ? '28px' : '40px' }}>
          <h1 style={{ fontSize: isMobile ? '28px' : '32px', fontWeight: 700, color: colors.text, margin: 0, marginBottom: '8px' }}>
            Welcome to SPMS Dashboard
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: isMobile ? '14px' : '15px', margin: 0, lineHeight: 1.7 }}>
            Manage your profile, explore other users, and publish community posts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {quickLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                display: 'inline-block',
                padding: '10px 18px',
                background: item.background,
                color: item.textColor,
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'background 0.2s',
                border: item.border || 'none',
                width: isMobile ? '100%' : 'auto',
                boxSizing: 'border-box',
                textAlign: 'center'
              }}
              onMouseEnter={(event) => (event.target.style.background = item.hover)}
              onMouseLeave={(event) => (event.target.style.background = item.background)}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {profile.role === 'admin' && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {adminLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'inline-block',
                  padding: '10px 18px',
                  background: item.background,
                  color: '#fff',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'background 0.2s',
                  width: isMobile ? '100%' : 'auto',
                  boxSizing: 'border-box',
                  textAlign: 'center'
                }}
                onMouseEnter={(event) => (event.target.style.background = item.hover)}
                onMouseLeave={(event) => (event.target.style.background = item.background)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}

        <div
          style={{
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: isMobile ? '20px' : '32px',
            boxShadow: `0 4px 12px ${colors.shadow}`
          }}
        >
          <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: colors.text, marginTop: 0, marginBottom: '24px' }}>
            My Profile
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: isMobile ? '16px' : '20px' }}>
            {[
              { label: 'Name', value: profile.name },
              { label: 'Email', value: profile.email },
              { label: 'Role', value: profile.role },
              { label: 'Major', value: profile.major || 'Not set' },
              { label: 'Bio', value: profile.bio || 'Not set' },
              { label: 'Phone', value: profile.phone || 'Not set' },
              { label: 'Address', value: profile.address || 'Not set' },
              { label: 'Birthday', value: formatBirthday(profile.birthday) }
            ].map((item) => (
              <div key={item.label}>
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: colors.textSecondary,
                    margin: 0,
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    fontSize: '15px',
                    color: colors.text,
                    margin: 0,
                    fontWeight: item.value === 'Not set' ? 400 : 500
                  }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
