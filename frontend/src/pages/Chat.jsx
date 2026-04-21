import { useEffect, useState } from 'react'
import API from '../api/api'

function Chat() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  // 获取用户信息
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get('/profile/me')
        setProfile(res.data)
      } catch (err) {
        setError('Failed to load profile')
      }
    }

    fetchProfile()
  }, [])

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !profile) return

    const userMessage = inputMessage
    setInputMessage('')

    // 添加用户消息到界面
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    setLoading(true)
    try {
      const response = await API.post('/chat/send', {
        message: userMessage,
        userId: profile.id
      })

      // 添加 AI 回复
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: response.data.message }
      ])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get response')
      console.error('Chat error:', err)
    } finally {
      setLoading(false)
    }
  }

  // 清空对话
  const handleClearChat = async () => {
    if (profile) {
      try {
        await API.delete(`/chat/history/${profile.id}`)
        setMessages([])
      } catch (err) {
        console.error('Failed to clear chat:', err)
      }
    }
  }

  // 按 Enter 发送
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8 mx-auto">
          <h1 className="mb-4">AI Chat Bot</h1>

          {error && <div className="alert alert-danger">{error}</div>}

          <div
            className="card shadow-sm"
            style={{ height: '600px', overflowY: 'auto' }}
          >
            <div className="card-body">
              {messages.length === 0 && (
                <div className="text-center text-muted mt-5">
                  <p>Start a conversation with AI assistant</p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className="mb-3">
                  {msg.role === 'user' ? (
                    <div className="text-end">
                      <span className="badge bg-primary p-2">
                        {msg.content}
                      </span>
                    </div>
                  ) : (
                    <div className="text-start">
                      <span className="badge bg-success p-2">
                        {msg.content}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="text-start">
                  <span className="badge bg-success p-2">
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Typing...
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3">
            <div className="input-group mb-3">
              <textarea
                className="form-control"
                placeholder="Type your message here... (Shift+Enter for newline)"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                rows="2"
                disabled={loading}
              />
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-primary"
                onClick={handleSendMessage}
                disabled={loading || !inputMessage.trim()}
              >
                Send
              </button>

              <button
                className="btn btn-warning"
                onClick={handleClearChat}
                disabled={loading || messages.length === 0}
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat
