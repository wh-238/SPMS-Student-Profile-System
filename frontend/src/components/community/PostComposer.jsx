import { useState } from 'react'
import { useTheme } from '../../hooks/useTheme'

function PostComposer({
  title: initialTitle = '',
  content: initialContent = '',
  visibility: initialVisibility = 'public',
  submitLabel = 'Publish post',
  busy = false,
  compact = false,
  onSubmit,
  onCancel
}) {
  const { colors } = useTheme()
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [visibility, setVisibility] = useState(initialVisibility)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    if (!trimmedTitle || !trimmedContent) {
      setError('Please enter both a title and content before submitting.')
      return
    }

    setError('')
    await onSubmit({
      title: trimmedTitle,
      content: trimmedContent,
      visibility
    })

    if (!initialTitle && !initialContent) {
      setTitle('')
      setContent('')
      setVisibility('public')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: colors.bgSecondary,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        padding: compact ? '18px' : '24px',
        boxShadow: `0 10px 28px ${colors.shadow}`
      }}
    >
      <div style={{ display: 'grid', gap: '14px' }}>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Give your post a clear title"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '12px 14px',
            borderRadius: '10px',
            border: `1px solid ${colors.border}`,
            background: colors.bg,
            color: colors.text,
            fontSize: '15px',
            outline: 'none'
          }}
        />

        <textarea
          rows={compact ? 5 : 7}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Share an update, reflection, project note, or blog post..."
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '14px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            background: colors.bg,
            color: colors.text,
            fontSize: '15px',
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            minHeight: compact ? '120px' : '160px'
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: compact ? 'stretch' : 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: colors.textSecondary,
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            Visibility
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: `1px solid ${colors.border}`,
                background: colors.bg,
                color: colors.text,
                fontSize: '14px'
              }}
            >
              <option value="public">Public</option>
              <option value="members">Logged-in users only</option>
            </select>
          </label>

          <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: `1px solid ${colors.border}`,
                  background: colors.bgTertiary,
                  color: colors.text,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={busy}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                background: colors.primary,
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.75 : 1
              }}
            >
              {busy ? 'Saving...' : submitLabel}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: colors.danger,
              color: '#fff',
              padding: '10px 12px',
              borderRadius: '10px',
              fontSize: '13px'
            }}
          >
            {error}
          </div>
        )}
      </div>
    </form>
  )
}

export default PostComposer
