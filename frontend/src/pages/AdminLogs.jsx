import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import API from '../api/api'

function AdminLogs() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { colors } = useTheme()

  // 格式化时间为本地时间
  const formatTime = (isoTime) => {
    try {
      const date = new Date(isoTime)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/New_York' // 美东时间
      })
    } catch (e) {
      return isoTime
    }
  }

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await API.get('/admin/logs')
        setLogs(res.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load logs')
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  if (loading)
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textSecondary }}>
        Loading logs...
      </div>
    )

  if (error)
    return (
      <div
        style={{
          background: colors.danger,
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
          margin: '20px'
        }}
      >
        {error}
      </div>
    )

  return (
    <div style={{ background: colors.bg, minHeight: 'calc(100vh - 64px)', padding: '32px 20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{
            marginBottom: '20px',
            padding: '10px 16px',
            background: colors.bgSecondary,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => (e.target.style.background = colors.bgTertiary)}
          onMouseLeave={(e) => (e.target.style.background = colors.bgSecondary)}
        >
          ← Back to Dashboard
        </button>

        <h1 style={{ fontSize: '32px', fontWeight: 700, color: colors.text, marginBottom: '32px' }}>
          Admin Logs
        </h1>

        <div
          style={{
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: `0 4px 12px ${colors.shadow}`
          }}
        >
          {logs.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: colors.textSecondary }}>
              No logs found
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}
              >
                <thead>
                  <tr style={{ background: colors.bgTertiary, borderBottom: `2px solid ${colors.border}` }}>
                    {['ID', 'User ID', 'Name', 'Action', 'Details', 'Changed At'].map(header => (
                      <th
                        key={header}
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: colors.text,
                          borderRight: `1px solid ${colors.border}`
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => (
                    <tr
                      key={log.id}
                      style={{
                        background: idx % 2 === 0 ? colors.bgSecondary : colors.bgTertiary,
                        borderBottom: `1px solid ${colors.border}`,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = colors.bgTertiary)}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? colors.bgSecondary : colors.bgTertiary)}
                    >
                      <td style={{ padding: '12px 16px', color: colors.text, borderRight: `1px solid ${colors.border}` }}>
                        {log.id}
                      </td>
                      <td style={{ padding: '12px 16px', color: colors.text, borderRight: `1px solid ${colors.border}` }}>
                        {log.user_id}
                      </td>
                      <td style={{ padding: '12px 16px', color: colors.text, borderRight: `1px solid ${colors.border}` }}>
                        {log.name || 'Unknown'}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          color: '#fff',
                          background: '#3b82f6',
                          borderRadius: '4px',
                          fontWeight: 500,
                          borderRight: `1px solid ${colors.border}`
                        }}
                      >
                        {log.action}
                      </td>
                      <td style={{ padding: '12px 16px', color: colors.textSecondary, borderRight: `1px solid ${colors.border}` }}>
                        {log.details}
                      </td>
                      <td style={{ padding: '12px 16px', color: colors.text }}>
                        {formatTime(log.changed_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminLogs