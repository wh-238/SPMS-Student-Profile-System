import { useEffect, useRef, useState } from 'react'
import API from '../api/api'

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'))
  const messagesEndRef = useRef(null)

  // 检查认证状态
  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
      try {
        const res = await API.get('/profile/me')
        setProfile(res.data)
      } catch (err) {
        setProfile(null)
      }
    } else {
      setIsAuthenticated(false)
      setProfile(null)
      setIsOpen(false) // 登出时关闭弹窗
      setMessages([]) // 清空消息
    }
  }

  // 监听 token 变化和页面可见性
  useEffect(() => {
    checkAuth()

    // 监听 storage 事件（其他标签页改变）
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        checkAuth()
      }
    }

    // 监听页面可见性（从其他标签页切回来）
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('auth-change', checkAuth)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-change', checkAuth)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  // 如果未登录则不显示气泡
  if (!isAuthenticated) return null

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !profile) return

    const userMessage = inputMessage
    setInputMessage('')
    setError('')

    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    setLoading(true)
    try {
      const response = await API.post('/chat/send', {
        message: userMessage,
        userId: profile.id
      })
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: response.data.message }
      ])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get response')
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = async () => {
    if (profile) {
      try {
        await API.delete(`/chat/history/${profile.id}`)
        setMessages([])
        setError('')
      } catch (err) {
        console.error('Failed to clear chat:', err)
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: '24px', left: '24px', zIndex: 9999 }}>
      {/* 弹窗 */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '70px',
            left: '0',
            width: '360px',
            height: '520px',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #e0e0e0'
          }}
        >
          {/* 头部 */}
          <div
            style={{
              background: '#0d6efd',
              color: '#fff',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '15px' }}>🤖 AI Chat Bot</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleClearChat}
                disabled={messages.length === 0}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: messages.length === 0 ? 0.5 : 1
                }}
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '18px',
                  cursor: 'pointer',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* 消息区 */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              background: '#f8f9fa'
            }}
          >
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#aaa', marginTop: '40px', fontSize: '14px' }}>
                👋 Ask me anything about SPMS!
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '8px 12px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user' ? '#0d6efd' : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#212529',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    border: msg.role === 'assistant' ? '1px solid #e0e0e0' : 'none'
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '16px 16px 16px 4px',
                    background: '#fff',
                    border: '1px solid #e0e0e0',
                    fontSize: '14px',
                    color: '#888',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                  }}
                >
                  <span className="spinner-border spinner-border-sm me-1" style={{ width: '12px', height: '12px' }}></span>
                  Typing...
                </div>
              </div>
            )}

            {error && (
              <div style={{ fontSize: '13px', color: '#dc3545', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 输入区 */}
          <div
            style={{
              padding: '10px 12px',
              borderTop: '1px solid #e0e0e0',
              background: '#fff',
              display: 'flex',
              gap: '8px',
              flexShrink: 0
            }}
          >
            <textarea
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Message... (Enter to send)"
              style={{
                flex: 1,
                resize: 'none',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !inputMessage.trim()}
              style={{
                background: '#0d6efd',
                border: 'none',
                color: '#fff',
                borderRadius: '8px',
                padding: '0 14px',
                cursor: loading || !inputMessage.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !inputMessage.trim() ? 0.6 : 1,
                fontSize: '18px'
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* 气泡按钮 */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#0d6efd',
          border: 'none',
          color: '#fff',
          fontSize: '26px',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(13,110,253,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s'
        }}
        title="AI Chat Bot"
      >
        {isOpen ? '×' : '🤖'}
      </button>
    </div>
  )
}

export default ChatWidget
