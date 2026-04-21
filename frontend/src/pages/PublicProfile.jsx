import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import API from '../api/api'

function PublicProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { colors } = useTheme()

  const formatBirthday = (birthday) => {
    if (!birthday) return ''
    const raw = String(birthday)
    if (raw.includes('T')) return raw.split('T')[0]
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  }

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        const res = await API.get(`/profile/public/${id}`)
        setProfile(res.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load public profile')
      } finally {
        setLoading(false)
      }
    }

    fetchPublicProfile()
  }, [id])

  if (loading) {
    return (
      <div style={{ background: colors.bg, minHeight: 'calc(100vh - 64px)', padding: '60px 20px', textAlign: 'center', color: colors.textSecondary }}>
        Loading public profile...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ background: colors.bg, minHeight: 'calc(100vh - 64px)', padding: '32px 20px' }}>
        <div
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            background: colors.danger,
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        >
          {error}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: colors.bg, minHeight: 'calc(100vh - 64px)', padding: '32px 20px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => navigate('/search')}
          style={{
            marginBottom: '20px',
            padding: '10px 16px',
            background: colors.bgSecondary,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => (e.target.style.background = colors.bgTertiary)}
          onMouseLeave={(e) => (e.target.style.background = colors.bgSecondary)}
        >
          ← Back to Search Users
        </button>

        <h1 style={{ fontSize: '30px', fontWeight: 700, color: colors.text, marginBottom: '24px' }}>Public Profile</h1>

        <div
          style={{
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '24px',
            boxShadow: `0 4px 12px ${colors.shadow}`
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: colors.text, marginTop: 0, marginBottom: '16px' }}>{profile.name}</h2>

          {profile.major && (
            <p style={{ margin: 0, marginBottom: '10px', color: colors.textSecondary, fontSize: '15px' }}>
              <strong>Major:</strong> {profile.major}
            </p>
          )}

          {profile.bio && (
            <p style={{ margin: 0, marginBottom: '10px', color: colors.textSecondary, fontSize: '15px' }}>
              <strong>Bio:</strong> {profile.bio}
            </p>
          )}

          {profile.phone && (
            <p style={{ margin: 0, marginBottom: '10px', color: colors.textSecondary, fontSize: '15px' }}>
              <strong>Phone:</strong> {profile.phone}
            </p>
          )}

          {profile.address && (
            <p style={{ margin: 0, marginBottom: '10px', color: colors.textSecondary, fontSize: '15px' }}>
              <strong>Address:</strong> {profile.address}
            </p>
          )}

          {profile.birthday && (
            <p style={{ margin: 0, color: colors.textSecondary, fontSize: '15px' }}>
              <strong>Birthday:</strong> {formatBirthday(profile.birthday)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default PublicProfile