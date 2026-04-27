import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../context/AuthContext'
import { listReportedPosts, moderatePost } from '../api/communityApi'
import PostCard from '../components/community/PostCard'

function AdminCommunity() {
  const navigate = useNavigate()
  const { colors } = useTheme()
  const { profile } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [actingPostId, setActingPostId] = useState('')

  const loadReportedPosts = useCallback(async () => {
    if (!profile) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await listReportedPosts({ viewer: profile })
      setPosts(result.filter((post) => post.report_count > 0 && post.status === 'active'))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load moderation queue')
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadReportedPosts()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadReportedPosts])

  if (!profile) {
    return null
  }

  if (profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div style={{ background: colors.bg, minHeight: 'calc(100vh - 64px)', padding: '32px 20px 56px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gap: '24px' }}>
        <button
          type="button"
          onClick={() => navigate('/community')}
          style={{
            width: 'fit-content',
            padding: '10px 16px',
            background: colors.bgSecondary,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {'<- Back to Community'}
        </button>

        <section
          style={{
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '20px',
            padding: '28px',
            boxShadow: `0 12px 28px ${colors.shadow}`
          }}
        >
          <h1 style={{ fontSize: '34px', fontWeight: 800, color: colors.text, margin: 0, marginBottom: '10px' }}>
            Community moderation
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '15px', lineHeight: 1.8, margin: 0 }}>
            Review reported content here. Dismissing clears the reports; removing the post hides it from the feed and
            should later be logged by the backend for audit purposes.
          </p>
        </section>

        {error && (
          <div
            style={{
              background: colors.danger,
              color: '#fff',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px'
            }}
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            style={{
              background: colors.success,
              color: '#fff',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px'
            }}
          >
            {notice}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '70px 20px', textAlign: 'center', color: colors.textSecondary }}>
            Loading moderation queue...
          </div>
        ) : posts.length === 0 ? (
          <div
            style={{
              background: colors.bgSecondary,
              border: `1px dashed ${colors.border}`,
              borderRadius: '18px',
              padding: '40px 24px',
              color: colors.textSecondary,
              textAlign: 'center'
            }}
          >
            No reported posts right now.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '18px' }}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                actionBusy={actingPostId === String(post.id)}
                showModeration
                onModerate={async (postId, action) => {
                  setActingPostId(String(postId))
                  setError('')
                  setNotice('')

                  try {
                    await moderatePost({
                      viewer: profile,
                      postId,
                      action,
                      note: action === 'remove' ? 'Removed by admin moderation queue' : 'Reports dismissed by admin'
                    })
                    setNotice(action === 'remove' ? 'Post removed from the community feed.' : 'Reports dismissed successfully.')
                    await loadReportedPosts()
                  } catch (err) {
                    setError(err.response?.data?.message || 'Failed to update moderation status')
                  } finally {
                    setActingPostId('')
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminCommunity
