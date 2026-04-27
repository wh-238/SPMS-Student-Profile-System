import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../context/AuthContext'
import {
  addPostComment,
  createPost,
  deletePost,
  listCommunityPosts,
  reportPost,
  togglePostLike,
  updatePost
} from '../api/communityApi'
import PostComposer from '../components/community/PostComposer'
import PostCard from '../components/community/PostCard'

const filters = [
  { id: 'all', label: 'All posts' },
  { id: 'mine', label: 'My posts' },
  { id: 'public', label: 'Public only' }
]

function Community() {
  const { colors } = useTheme()
  const { profile } = useAuth()
  const [posts, setPosts] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [actingPostId, setActingPostId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadPosts = useCallback(async (nextFilter = filter) => {
    if (!profile) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await listCommunityPosts({ viewer: profile, filter: nextFilter })
      setPosts(result)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load community posts')
    } finally {
      setLoading(false)
    }
  }, [filter, profile])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadPosts(filter)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [filter, loadPosts])

  const runPostAction = async (postId, action, successMessage) => {
    setActingPostId(String(postId))
    setError('')
    setNotice('')

    try {
      await action()
      await loadPosts(filter)
      if (successMessage) {
        setNotice(successMessage)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong while updating the post')
    } finally {
      setActingPostId('')
    }
  }

  return (
    <div style={{ background: colors.bg, minHeight: 'calc(100vh - 64px)', padding: '32px 20px 56px' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: '24px' }}>
        <section
          style={{
            background: `linear-gradient(135deg, ${colors.bgSecondary} 0%, ${colors.bgTertiary} 100%)`,
            border: `1px solid ${colors.border}`,
            borderRadius: '24px',
            padding: '30px',
            boxShadow: `0 16px 40px ${colors.shadow}`
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.7fr) minmax(260px, 0.9fr)',
              gap: '24px',
              alignItems: 'center'
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  background: colors.primary,
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '14px'
                }}
              >
                Community blog
              </div>
              <h1 style={{ fontSize: '38px', fontWeight: 800, color: colors.text, margin: 0, marginBottom: '12px' }}>
                Share updates, project notes, and public reflections
              </h1>
              <p style={{ color: colors.textSecondary, fontSize: '15px', lineHeight: 1.8, margin: 0 }}>
                This page now covers the main social flow your professor asked for: posting blogs, browsing a shared
                feed, liking, commenting, reporting, visibility labels, and moderation support.
              </p>
            </div>

            <div
              style={{
                padding: '18px',
                borderRadius: '18px',
                background: colors.bg,
                border: `1px solid ${colors.border}`
              }}
            >
              <div style={{ color: colors.text, fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
                What users can do
              </div>
              <div style={{ display: 'grid', gap: '10px', color: colors.textSecondary, fontSize: '14px' }}>
                <div>Publish new blog-style posts</div>
                <div>Browse the shared feed</div>
                <div>Edit or delete your own posts</div>
                <div>Like and comment on other posts</div>
                <div>Report content for admin review</div>
                <div>Set each post to public or members only</div>
                {profile?.role === 'admin' && (
                  <Link
                    to="/admin/community"
                    style={{
                      marginTop: '8px',
                      display: 'inline-flex',
                      width: 'fit-content',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: colors.danger,
                      color: '#fff',
                      textDecoration: 'none',
                      fontWeight: 700
                    }}
                  >
                    Open moderation queue
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        <PostComposer
          busy={submitting}
          submitLabel="Publish post"
          onSubmit={async (values) => {
            setSubmitting(true)
            setError('')
            setNotice('')

            try {
              await createPost({ viewer: profile, ...values })
              setNotice('Post published successfully.')
              await loadPosts(filter)
            } catch (err) {
              setError(err.response?.data?.message || 'Failed to publish post')
            } finally {
              setSubmitting(false)
            }
          }}
        />

        <section
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: colors.text, margin: 0, marginBottom: '6px' }}>
              Community feed
            </h2>
            <p style={{ color: colors.textSecondary, fontSize: '14px', margin: 0 }}>
              Posts are sorted by most recently updated.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '999px',
                  border: `1px solid ${filter === item.id ? colors.primary : colors.border}`,
                  background: filter === item.id ? colors.primary : colors.bgSecondary,
                  color: filter === item.id ? '#fff' : colors.text,
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
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
            Loading community posts...
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
            No posts yet for this filter. Publish the first one and the feed will appear here.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '18px' }}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                actionBusy={actingPostId === String(post.id)}
                onEdit={(postId, values) =>
                  runPostAction(
                    postId,
                    () => updatePost({ viewer: profile, postId, ...values }),
                    'Post updated successfully.'
                  )
                }
                onDelete={(postId) =>
                  runPostAction(postId, () => deletePost({ postId }), 'Post deleted successfully.')
                }
                onLike={(postId) =>
                  runPostAction(postId, () => togglePostLike({ viewer: profile, postId }))
                }
                onComment={(postId, content) =>
                  runPostAction(postId, () => addPostComment({ viewer: profile, postId, content }), 'Comment added.')
                }
                onReport={(postId, reason) =>
                  runPostAction(postId, () => reportPost({ viewer: profile, postId, reason }), 'Report submitted for admin review.')
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Community
