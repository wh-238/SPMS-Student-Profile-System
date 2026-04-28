import { useTheme } from '../../hooks/useTheme'
import { COMMUNITY_EMOJIS } from './communityEmoji'

function EmojiTray({ label = 'SESMag emoji tray', onPick }) {
  const { colors } = useTheme()

  return (
    <div
      style={{
        display: 'grid',
        gap: '8px',
        padding: '12px',
        borderRadius: '14px',
        background: colors.bg,
        border: `1px solid ${colors.border}`
      }}
    >
      <div style={{ color: colors.textSecondary, fontSize: '12px', fontWeight: 700, letterSpacing: '0.03em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {COMMUNITY_EMOJIS.map((item) => (
          <button
            key={item.symbol}
            type="button"
            title={item.label}
            aria-label={item.label}
            onClick={() => onPick(item.symbol)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              border: `1px solid ${colors.border}`,
              background: colors.bgSecondary,
              cursor: 'pointer',
              fontSize: '20px',
              lineHeight: 1
            }}
          >
            {item.symbol}
          </button>
        ))}
      </div>
    </div>
  )
}

export default EmojiTray
