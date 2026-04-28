import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'
import API from '../api/api'
import { listUserPosts } from '../api/communityApi'
import PostCard from '../components/community/PostCard'

function PublicProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { colors } = useTheme()
  const { profile: viewer } = useAuth()
  const isMobile = useIsMobile()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [error, setError] = useState('')
  const [postError, setPostError] = useState('')

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

  useEffect(() => {
    const fetchPosts = async () => {
      if (!viewer) {
        return
      }

      setPostsLoading(true)
      setPostError('')

      try {
        const result = await listUserPosts({ viewer, userId: id })
        setPosts(result.filter((post) => post.status === 'active'))
      } catch (err) {
        setPostError(err.response?.data?.message || "Failed to load this user's posts")
      } finally {
        setPostsLoading(false)
      }
    }

    fetchPosts()
  }, [id, viewer])

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
    <div style={{ background: colors.bg, minHeight: 'calc(100vh - 64px)', padding: isMobile ? '20px 14px 40px' : '32px 20px 56px' }}>
      <div style={{ maxWidth: '920px', margin: '0 auto', display: 'grid', gap: '24px' }}>
        <button
          type="button"
          onClick={() => navigate('/search')}
          style={{
            width: isMobile ? '100%' : 'fit-content',
            padding: '10px 16px',
            background: colors.bgSecondary,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {'<- Back to Search Users'}
        </button>

        <section
          style={{
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: isMobile ? '20px' : '28px',
            boxShadow: `0 8px 18px ${colors.shadow}`
          }}
        >
          <h1 style={{ fontSize: isMobile ? '26px' : '30px', fontWeight: 700, color: colors.text, marginBottom: '24px' }}>Public Profile</h1>

          <h2 style={{ fontSize: isMobile ? '22px' : '24px', fontWeight: 700, color: colors.text, marginTop: 0, marginBottom: '16px' }}>
            {profile.name}
          </h2>

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
        </section>

        <section style={{ display: 'grid', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: colors.text, margin: 0, marginBottom: '6px' }}>
              {profile.name}&apos;s posts
            </h2>
            <p style={{ color: colors.textSecondary, fontSize: '14px', margin: 0 }}>
              Posts below reflect the new community/blog feature and respect each post&apos;s visibility setting.
            </p>
          </div>

          {postError && (
            <div
              style={{
                background: colors.danger,
                color: '#fff',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '14px'
              }}
            >
              {postError}
            </div>
          )}

          {postsLoading ? (
            <div style={{ padding: '50px 20px', textAlign: 'center', color: colors.textSecondary }}>
              Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <div
              style={{
                background: colors.bgSecondary,
                border: `1px dashed ${colors.border}`,
                borderRadius: '16px',
                padding: '32px 20px',
                color: colors.textSecondary,
                textAlign: 'center'
              }}
            >
              This user has not published any visible posts yet.
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                showAuthor={false}
              />
            ))
          )}
        </section>
      </div>
    </div>
  )
}

export default PublicProfile
