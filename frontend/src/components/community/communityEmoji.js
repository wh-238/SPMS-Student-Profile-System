export const COMMUNITY_EMOJIS = [
  { symbol: '🔥', label: 'On fire' },
  { symbol: '👏', label: 'Applause' },
  { symbol: '💡', label: 'Idea' },
  { symbol: '🧠', label: 'Insight' },
  { symbol: '🎯', label: 'Focused' },
  { symbol: '🚀', label: 'Momentum' },
  { symbol: '🤝', label: 'Support' },
  { symbol: '🌱', label: 'Growth' },
  { symbol: '📚', label: 'Learning' },
  { symbol: '✨', label: 'Spark' },
  { symbol: '🙌', label: 'Celebration' },
  { symbol: '🫶', label: 'Care' }
]

export const appendEmojiToken = (value, emoji) => {
  if (!value) {
    return emoji
  }

  return /[\s]$/.test(value) ? `${value}${emoji}` : `${value} ${emoji}`
}
