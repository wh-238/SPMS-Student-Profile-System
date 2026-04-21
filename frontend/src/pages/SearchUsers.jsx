import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import API from '../api/api'

function SearchUsers() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { colors } = useTheme()

  const formatBirthday = (birthday) => {
    if (!birthday) return ''
    const raw = String(birthday)
    if (raw.includes('T')) return raw.split('T')[0]
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  }

  const fetchUsers = async (targetPage = 1, currentKeyword = keyword) => {
    try {
      setLoading(true)
      const res = await API.get(
        `/users/search?keyword=${encodeURIComponent(currentKeyword)}&page=${targetPage}&limit=4&sort=asc`
      )

      setUsers(res.data.users || [])
      setPage(res.data.page || 1)
      setTotalPages(res.data.totalPages || 0)
      setMessage(res.data.message || '')
    } catch (err) {
      setUsers([])
      setMessage(err.response?.data?.message || 'Failed to search users')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await fetchUsers(1, keyword)
  }

  const handlePrev = async () => {
    if (page > 1) {
      await fetchUsers(page - 1, keyword)
    }
  }

  const handleNext = async () => {
    if (page < totalPages) {
      await fetchUsers(page + 1, keyword)
    }
  }

  return (
    <div style={{ background: colors.bg, minHeight: 'calc(100vh - 64px)', padding: '32px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
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
          ← Back to Dashboard
        </button>

        <h1 style={{ fontSize: '32px', fontWeight: 700, color: colors.text, marginBottom: '32px' }}>
          Search Users
        </h1>

        <div
          style={{
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
            boxShadow: `0 4px 12px ${colors.shadow}`
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="Enter a name to search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                background: colors.bg,
                color: colors.text,
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => (e.target.style.borderColor = colors.primary)}
              onBlur={(e) => (e.target.style.borderColor = colors.border)}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 24px',
                background: colors.primary,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => !loading && (e.target.style.background = colors.primaryHover)}
              onMouseLeave={(e) => !loading && (e.target.style.background = colors.primary)}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {!loading && message && (
          <div
            style={{
              background: colors.bgTertiary,
              border: `1px solid ${colors.border}`,
              color: colors.textSecondary,
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '14px'
            }}
          >
            {message}
          </div>
        )}

        {!loading && users.length > 0 && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
              }}
            >
              {users.map((user) => (
                <div
                  key={user.id}
                  style={{
                    background: colors.bgSecondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: `0 2px 8px ${colors.shadow}`,
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = `0 8px 16px ${colors.shadow}`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = `0 2px 8px ${colors.shadow}`
                  }}
                >
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.text, margin: 0, marginBottom: '12px' }}>
                    {user.name}
                  </h3>

                  {user.major && (
                    <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0, marginBottom: '8px' }}>
                      <strong>Major:</strong> {user.major}
                    </p>
                  )}

                  {user.bio && (
                    <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0, marginBottom: '8px' }}>
                      <strong>Bio:</strong> {user.bio}
                    </p>
                  )}

                  {user.phone && (
                    <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0, marginBottom: '8px' }}>
                      <strong>Phone:</strong> {user.phone}
                    </p>
                  )}

                  {user.address && (
                    <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0, marginBottom: '8px' }}>
                      <strong>Address:</strong> {user.address}
                    </p>
                  )}

                  {user.birthday && (
                    <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0, marginBottom: '12px' }}>
                      <strong>Birthday:</strong> {formatBirthday(user.birthday)}
                    </p>
                  )}

                  <Link
                    to={`/public-profile/${user.id}`}
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      background: colors.primary,
                      color: '#fff',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 600,
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => (e.target.style.background = colors.primaryHover)}
                    onMouseLeave={(e) => (e.target.style.background = colors.primary)}
                  >
                    View Profile
                  </Link>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={handlePrev}
                disabled={page <= 1}
                style={{
                  padding: '8px 16px',
                  background: page <= 1 ? colors.border : colors.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.5 : 1,
                  fontSize: '14px',
                  fontWeight: 600
                }}
                onMouseEnter={(e) => page > 1 && (e.target.style.background = colors.primaryHover)}
                onMouseLeave={(e) => page > 1 && (e.target.style.background = colors.primary)}
              >
                ← Previous
              </button>

              <span style={{ color: colors.text, fontSize: '14px', fontWeight: 600 }}>
                Page {page} of {totalPages || 1}
              </span>

              <button
                onClick={handleNext}
                disabled={page >= totalPages}
                style={{
                  padding: '8px 16px',
                  background: page >= totalPages ? colors.border : colors.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages ? 0.5 : 1,
                  fontSize: '14px',
                  fontWeight: 600
                }}
                onMouseEnter={(e) => page < totalPages && (e.target.style.background = colors.primaryHover)}
                onMouseLeave={(e) => page < totalPages && (e.target.style.background = colors.primary)}
              >
                Next →
              </button>
            </div>
          </>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textSecondary }}>
            Searching...
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchUsers
