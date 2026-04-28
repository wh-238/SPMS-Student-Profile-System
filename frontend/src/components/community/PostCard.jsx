import { useMemo, useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { useIsMobile } from '../../hooks/useIsMobile'
import PostComposer from './PostComposer'
import EmojiTray from './EmojiTray'
import { appendEmojiToken } from './communityEmoji'

const formatPostTime = (value) => {
  try {
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  } catch {
    return value
  }
}

function PostCard({
  post,
  showAuthor = true,
  showModeration = false,
  actionBusy = false,
  onEdit,
  onDelete,
  onLike,
  onComment,
  onReport,
  onModerate
}) {
  const { colors } = useTheme()
  const isMobile = useIsMobile()
  const [isEditing, setIsEditing] = useState(false)
  const [comment, setComment] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [showReportBox, setShowReportBox] = useState(false)
  const displayTitle = post.title?.trim() || 'SESMag quick post'

  const visibilityStyles = useMemo(
    () => ({
      background: post.visibility === 'members' ? '#f59e0b' : colors.success,
      label: post.visibility === 'members' ? 'Members only' : 'Public'
    }),
    [colors.success, post.visibility]
  )

  const handleComment = async () => {
    const trimmed = comment.trim()
    if (!trimmed) {
      return
    }

    await onComment(post.id, trimmed)
    setComment('')
    setShowComments(true)
  }

  const handleReport = async () => {
    const trimmed = reportReason.trim()
    if (!trimmed) {
      return
    }

    await onReport(post.id, trimmed)
    setReportReason('')
    setShowReportBox(false)
  }

  return (
    <article
      style={{
        background: colors.bgSecondary,
        border: `1px solid ${colors.border}`,
        borderRadius: '18px',
        padding: isMobile ? '18px' : '24px',
        boxShadow: `0 14px 32px ${colors.shadow}`
      }}
    >
      {isEditing ? (
        <PostComposer
          compact
          busy={actionBusy}
          title={post.title}
          content={post.content}
          visibility={post.visibility}
          submitLabel="Save changes"
          onCancel={() => setIsEditing(false)}
          onSubmit={async (values) => {
            await onEdit(post.id, values)
            setIsEditing(false)
          }}
        />
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '16px',
              marginBottom: '18px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ flex: '1 1 320px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '5px 10px',
                    borderRadius: '999px',
                    background: visibilityStyles.background,
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                >
                  {visibilityStyles.label}
                </span>

                {post.report_count > 0 && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '5px 10px',
                      borderRadius: '999px',
                      background: colors.danger,
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  >
                    {post.report_count} report{post.report_count === 1 ? '' : 's'}
                  </span>
                )}

                {post.status !== 'active' && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '5px 10px',
                      borderRadius: '999px',
                      background: colors.bgTertiary,
                      color: colors.text,
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  >
                    Removed
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: colors.text, margin: 0, marginBottom: '8px' }}>
                {displayTitle}
              </h2>

              <div style={{ color: colors.textSecondary, fontSize: '13px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                {showAuthor && <span>By {post.author_name}</span>}
                <span>Published {formatPostTime(post.created_at)}</span>
                {post.updated_at !== post.created_at && <span>Updated {formatPostTime(post.updated_at)}</span>}
              </div>
            </div>

            {((post.can_edit && onEdit) || (post.can_delete && onDelete)) && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {post.can_edit && onEdit && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    style={{
                      padding: '9px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${colors.border}`,
                      background: colors.bgTertiary,
                      color: colors.text,
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                )}

                {post.can_delete && onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(post.id)}
                    disabled={actionBusy}
                    style={{
                      padding: '9px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: colors.danger,
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: actionBusy ? 'not-allowed' : 'pointer',
                      opacity: actionBusy ? 0.75 : 1
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>

          <p style={{ color: colors.text, fontSize: isMobile ? '14px' : '15px', lineHeight: 1.8, marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
            {post.content}
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              paddingTop: '16px',
              borderTop: `1px solid ${colors.border}`
            }}
          >
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
              <button
                type="button"
                onClick={() => setShowComments((value) => !value)}
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${colors.border}`,
                  background: colors.bg,
                  color: colors.text,
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flex: isMobile ? '1 1 100%' : '0 1 auto'
                }}
              >
                Comments ({post.comment_count})
              </button>

              {onLike && (
                <button
                  type="button"
                  onClick={() => onLike(post.id)}
                  disabled={actionBusy}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${post.is_liked ? colors.primary : colors.border}`,
                    background: post.is_liked ? colors.primary : colors.bg,
                    color: post.is_liked ? '#fff' : colors.text,
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: actionBusy ? 'not-allowed' : 'pointer',
                    flex: isMobile ? '1 1 100%' : '0 1 auto'
                  }}
                >
                  {post.is_liked ? 'Liked' : 'Like'} ({post.like_count})
                </button>
              )}

              {post.can_report && onReport && (
                <button
                  type="button"
                  onClick={() => setShowReportBox((value) => !value)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${colors.border}`,
                    background: colors.bg,
                    color: colors.text,
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flex: isMobile ? '1 1 100%' : '0 1 auto'
                  }}
                >
                  Report
                </button>
              )}
            </div>

            <span style={{ color: colors.textSecondary, fontSize: '13px' }}>
              {post.visibility_label}
            </span>
          </div>

          {showComments && (
            <div
              style={{
                marginTop: '18px',
                paddingTop: '18px',
                borderTop: `1px solid ${colors.border}`,
                display: 'grid',
                gap: '14px'
              }}
            >
              <div style={{ display: 'grid', gap: '10px' }}>
                {post.comments.length === 0 ? (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      background: colors.bg,
                      color: colors.textSecondary,
                      fontSize: '14px'
                    }}
                  >
                    No comments yet. Be the first to respond.
                  </div>
                ) : (
                  post.comments.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        background: colors.bg,
                        border: `1px solid ${colors.border}`
                      }}
                    >
                      <div style={{ color: colors.text, fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
                        {item.author_name}
                      </div>
                      <div style={{ color: colors.textSecondary, fontSize: '12px', marginBottom: '8px' }}>
                        {formatPostTime(item.created_at)}
                      </div>
                      <div style={{ color: colors.text, fontSize: '14px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {item.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {onComment && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
                  <div style={{ flex: '1 1 300px', display: 'grid', gap: '10px' }}>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="Add a comment or just drop an emoji..."
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '12px',
                        borderRadius: '12px',
                        border: `1px solid ${colors.border}`,
                        background: colors.bg,
                        color: colors.text,
                        fontSize: '14px',
                        resize: 'vertical',
                        minHeight: '84px'
                      }}
                    />
                    <EmojiTray
                      label="Quick emoji replies"
                      onPick={(emoji) => {
                        setComment((value) => appendEmojiToken(value, emoji))
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleComment}
                    disabled={actionBusy}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: colors.primary,
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: actionBusy ? 'not-allowed' : 'pointer',
                      width: isMobile ? '100%' : 'auto',
                      alignSelf: isMobile ? 'stretch' : 'flex-start'
                    }}
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>
          )}

          {showReportBox && onReport && (
            <div
              style={{
                marginTop: '18px',
                padding: '18px',
                borderRadius: '14px',
                background: colors.bg,
                border: `1px solid ${colors.border}`
              }}
            >
              <div style={{ color: colors.text, fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
                Tell the admin why this post should be reviewed
              </div>
              <textarea
                rows={3}
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
                placeholder="Example: spam, offensive language, misleading information..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px',
                  borderRadius: '12px',
                  border: `1px solid ${colors.border}`,
                  background: colors.bgSecondary,
                  color: colors.text,
                  fontSize: '14px',
                  resize: 'vertical',
                  minHeight: '90px',
                  marginBottom: '12px'
                }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowReportBox(false)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${colors.border}`,
                    background: colors.bgSecondary,
                    color: colors.text,
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReport}
                  disabled={actionBusy}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: colors.danger,
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: actionBusy ? 'not-allowed' : 'pointer'
                  }}
                >
                  Submit report
                </button>
              </div>
            </div>
          )}

          {showModeration && post.report_count > 0 && (
            <div
              style={{
                marginTop: '18px',
                paddingTop: '18px',
                borderTop: `1px solid ${colors.border}`
              }}
            >
              <div style={{ color: colors.text, fontSize: '15px', fontWeight: 700, marginBottom: '10px' }}>
                Reports
              </div>

              <div style={{ display: 'grid', gap: '10px', marginBottom: '14px' }}>
                {post.reports.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      background: colors.bg,
                      border: `1px solid ${colors.border}`
                    }}
                  >
                    <div style={{ color: colors.text, fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
                      {item.reporter_name}
                    </div>
                    <div style={{ color: colors.textSecondary, fontSize: '12px', marginBottom: '8px' }}>
                      {formatPostTime(item.created_at)}
                    </div>
                    <div style={{ color: colors.text, fontSize: '14px', lineHeight: 1.7 }}>
                      {item.reason}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => onModerate(post.id, 'dismiss')}
                  disabled={actionBusy}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: `1px solid ${colors.border}`,
                    background: colors.bg,
                    color: colors.text,
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: actionBusy ? 'not-allowed' : 'pointer'
                  }}
                >
                  Dismiss reports
                </button>
                <button
                  type="button"
                  onClick={() => onModerate(post.id, 'remove')}
                  disabled={actionBusy}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: colors.danger,
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: actionBusy ? 'not-allowed' : 'pointer'
                  }}
                >
                  Remove post
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </article>
  )
}

export default PostCard
