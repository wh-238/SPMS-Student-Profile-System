import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import API from '../api/api'

function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { colors } = useTheme()

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

  if (loading)
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textSecondary }}>
        Loading profile...
      </div>
    )

  if (error)
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

  if (!profile)
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

  return (
    <div style={{ background: colors.bg, minHeight: 'calc(100vh - 64px)', padding: '32px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 欢迎标题 */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: colors.text, margin: 0, marginBottom: '8px' }}>
            Welcome to SPMS Dashboard
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '15px', margin: 0 }}>
            Manage your profile and explore the system
          </p>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <Link
            to="/edit-profile"
            style={{
              display: 'inline-block',
              padding: '10px 18px',
              background: '#f59e0b',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => (e.target.style.background = '#d97706')}
            onMouseLeave={e => (e.target.style.background = '#f59e0b')}
          >
            ✏️ Edit Profile
          </Link>
          <Link
            to="/privacy"
            style={{
              display: 'inline-block',
              padding: '10px 18px',
              background: colors.bgTertiary,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => (e.target.style.background = colors.border)}
            onMouseLeave={e => (e.target.style.background = colors.bgTertiary)}
          >
            🔒 Privacy Settings
          </Link>
          <Link
            to="/search"
            style={{
              display: 'inline-block',
              padding: '10px 18px',
              background: '#06b6d4',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => (e.target.style.background = '#0891b2')}
            onMouseLeave={e => (e.target.style.background = '#06b6d4')}
          >
            🔍 Search Users
          </Link>
        </div>

        {/* Admin 按钮 */}
        {profile.role === 'admin' && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <Link
              to="/admin/users"
              style={{
                display: 'inline-block',
                padding: '10px 18px',
                background: '#ef4444',
                color: '#fff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => (e.target.style.background = '#dc2626')}
              onMouseLeave={e => (e.target.style.background = '#ef4444')}
            >
              👥 Admin Users
            </Link>
            <Link
              to="/admin/logs"
              style={{
                display: 'inline-block',
                padding: '10px 18px',
                background: '#1f2937',
                color: '#fff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => (e.target.style.background = '#111827')}
              onMouseLeave={e => (e.target.style.background = '#1f2937')}
            >
              📋 Admin Logs
            </Link>
          </div>
        )}

        {/* 个人信息卡片 */}
        <div
          style={{
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '32px',
            boxShadow: `0 4px 12px ${colors.shadow}`
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: colors.text, marginTop: 0, marginBottom: '24px' }}>
            My Profile
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {[
              { label: 'Name', value: profile.name },
              { label: 'Email', value: profile.email },
              { label: 'Role', value: profile.role },
              { label: 'Major', value: profile.major || 'Not set' },
              { label: 'Bio', value: profile.bio || 'Not set' },
              { label: 'Phone', value: profile.phone || 'Not set' },
              { label: 'Address', value: profile.address || 'Not set' },
              { label: 'Birthday', value: formatBirthday(profile.birthday) }
            ].map(item => (
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