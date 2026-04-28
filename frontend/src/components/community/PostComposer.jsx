import { useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { useIsMobile } from '../../hooks/useIsMobile'
import EmojiTray from './EmojiTray'
import { appendEmojiToken } from './communityEmoji'

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
  const isMobile = useIsMobile()
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [visibility, setVisibility] = useState(initialVisibility)
  const [activeField, setActiveField] = useState('content')
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    if (!trimmedContent) {
      setError('Add some text or emoji to your post before submitting.')
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
      setActiveField('content')
    }
  }

  const handleEmojiPick = (emoji) => {
    setError('')

    if (activeField === 'title') {
      setTitle((value) => appendEmojiToken(value, emoji))
      return
    }

    setContent((value) => appendEmojiToken(value, emoji))
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: colors.bgSecondary,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        padding: isMobile ? '18px' : compact ? '18px' : '24px',
        boxShadow: `0 10px 28px ${colors.shadow}`
      }}
    >
      <div style={{ display: 'grid', gap: '14px' }}>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onFocus={() => setActiveField('title')}
          placeholder="Optional title for your post"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '12px 14px',
            borderRadius: '10px',
            border: `1px solid ${colors.border}`,
            background: colors.bg,
            color: colors.text,
            fontSize: isMobile ? '14px' : '15px',
            outline: 'none'
          }}
        />

        <textarea
          rows={compact ? 5 : 7}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onFocus={() => setActiveField('content')}
          placeholder="Share an update, reflection, project note, blog post, or just a few emojis..."
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '14px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            background: colors.bg,
            color: colors.text,
            fontSize: isMobile ? '14px' : '15px',
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            minHeight: isMobile ? '140px' : compact ? '120px' : '160px'
          }}
        />

        <EmojiTray
          label={`SESMag quick emoji set · now adding to ${activeField === 'title' ? 'title' : 'post body'}`}
          onPick={handleEmojiPick}
        />

        <div style={{ color: colors.textSecondary, fontSize: '13px', lineHeight: 1.6 }}>
          Emoji-only posts are welcome here. Leave the title blank if you want and publish straight from the emoji tray.
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile || compact ? 'stretch' : 'center',
            gap: '12px',
            flexWrap: 'wrap',
            flexDirection: isMobile ? 'column' : 'row'
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: isMobile ? 'stretch' : 'center',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '10px',
              color: colors.textSecondary,
              fontSize: '14px',
              fontWeight: 500,
              width: isMobile ? '100%' : 'auto'
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
                fontSize: '14px',
                width: isMobile ? '100%' : 'auto'
              }}
            >
              <option value="public">Public</option>
              <option value="members">Logged-in users only</option>
            </select>
          </label>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginLeft: isMobile ? 0 : 'auto',
              width: isMobile ? '100%' : 'auto',
              flexDirection: isMobile ? 'column-reverse' : 'row'
            }}
          >
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
                  cursor: 'pointer',
                  width: isMobile ? '100%' : 'auto'
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
                opacity: busy ? 0.75 : 1,
                width: isMobile ? '100%' : 'auto'
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
