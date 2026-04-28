import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useIsMobile } from '../hooks/useIsMobile'
import API from '../api/api'

function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingUserId, setDeletingUserId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  })
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: ''
  })
  const { colors } = useTheme()
  const isMobile = useIsMobile()

  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return null
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload?.id || null
    } catch {
      return null
    }
  }

  const currentUserId = getCurrentUserId()

  const fetchUsers = async () => {
    try {
      const res = await API.get('/admin/users')
      setUsers(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDeleteUser = async (user) => {
    if (user.id === currentUserId) {
      setError('You cannot delete your own account')
      return
    }

    const confirmed = window.confirm(`Delete user ${user.name} (${user.email})? This action cannot be undone.`)
    if (!confirmed) return

    try {
      setDeletingUserId(user.id)
      setError('')
      setSuccess('')
      await API.delete(`/admin/users/${user.id}`)
      setSuccess(`User ${user.name} deleted successfully`)
      await fetchUsers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user')
    } finally {
      setDeletingUserId(null)
    }
  }

  const validateCreateForm = (form) => {
    const errors = {
      name: '',
      email: '',
      password: ''
    }

    if (!form.name.trim()) {
      errors.name = 'Name is required'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Please enter a valid email'
    }

    if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    return errors
  }

  const handleCreateInputChange = (field, value) => {
    const updated = { ...newUser, [field]: value }
    setNewUser(updated)
    setFieldErrors(validateCreateForm(updated))
  }

  const resetCreateForm = () => {
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'user'
    })
    setFieldErrors({
      name: '',
      email: '',
      password: ''
    })
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    const errors = validateCreateForm(newUser)
    setFieldErrors(errors)

    if (errors.name || errors.email || errors.password) {
      setError('Please fix the form errors before submitting')
      return
    }

    try {
      setCreating(true)
      setError('')
      setSuccess('')

      await API.post('/admin/users', {
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        role: newUser.role
      })

      setSuccess(`User ${newUser.name.trim()} created successfully`)
      resetCreateForm()
      setShowCreateForm(false)
      await fetchUsers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  if (loading)
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textSecondary }}>
        Loading users...
      </div>
    )

  return (
    <div style={{ background: colors.bg, minHeight: 'calc(100vh - 64px)', padding: isMobile ? '20px 14px 32px' : '32px 20px' }}>
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
            cursor: 'pointer',
            width: isMobile ? '100%' : 'auto'
          }}
          onMouseEnter={(e) => (e.target.style.background = colors.bgTertiary)}
          onMouseLeave={(e) => (e.target.style.background = colors.bgSecondary)}
        >
          ← Back to Dashboard
        </button>

        <h1 style={{ fontSize: isMobile ? '28px' : '32px', fontWeight: 700, color: colors.text, marginBottom: '24px' }}>
          Admin Users
        </h1>

        <div style={{ marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(prev => !prev)
              setError('')
              setSuccess('')
              if (showCreateForm) {
                resetCreateForm()
              }
            }}
            style={{
              padding: '10px 14px',
              background: colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {showCreateForm ? 'Close' : '+ Add User'}
          </button>
        </div>

        {showCreateForm && (
          <form
            noValidate
            onSubmit={handleCreateUser}
            style={{
              background: colors.bgSecondary,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '2fr 2fr 2fr 1fr auto',
              gap: '10px',
              alignItems: 'start'
            }}
          >
            <div>
              <input
                type="text"
                placeholder="Name"
                value={newUser.name}
                onChange={(e) => handleCreateInputChange('name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  border: `1px solid ${fieldErrors.name ? colors.danger : colors.border}`,
                  borderRadius: '8px',
                  background: colors.bg,
                  color: colors.text,
                  boxSizing: 'border-box'
                }}
              />
              {fieldErrors.name && <p style={{ margin: '4px 0 0', color: colors.danger, fontSize: '12px' }}>{fieldErrors.name}</p>}
            </div>

            <div>
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => handleCreateInputChange('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  border: `1px solid ${fieldErrors.email ? colors.danger : colors.border}`,
                  borderRadius: '8px',
                  background: colors.bg,
                  color: colors.text,
                  boxSizing: 'border-box'
                }}
              />
              {fieldErrors.email && <p style={{ margin: '4px 0 0', color: colors.danger, fontSize: '12px' }}>{fieldErrors.email}</p>}
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => handleCreateInputChange('password', e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  border: `1px solid ${fieldErrors.password ? colors.danger : colors.border}`,
                  borderRadius: '8px',
                  background: colors.bg,
                  color: colors.text,
                  boxSizing: 'border-box'
                }}
              />
              {fieldErrors.password && <p style={{ margin: '4px 0 0', color: colors.danger, fontSize: '12px' }}>{fieldErrors.password}</p>}
            </div>

            <select
              value={newUser.role}
              onChange={(e) => handleCreateInputChange('role', e.target.value)}
              style={{
                width: '100%',
                padding: '9px 10px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                background: colors.bg,
                color: colors.text,
                boxSizing: 'border-box'
              }}
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>

            <button
              type="submit"
              disabled={creating}
              style={{
                padding: '10px 12px',
                border: 'none',
                borderRadius: '8px',
              background: colors.success,
              color: '#fff',
              fontWeight: 600,
              cursor: creating ? 'not-allowed' : 'pointer',
              opacity: creating ? 0.8 : 1,
              width: isMobile ? '100%' : 'auto'
            }}
          >
              {creating ? 'Adding...' : 'Create'}
            </button>
          </form>
        )}

        {error && (
          <div
            style={{
              background: colors.danger,
              color: '#fff',
              padding: '12px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13px'
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: colors.success,
              color: '#fff',
              padding: '12px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13px'
            }}
          >
            {success}
          </div>
        )}

        <div
          style={{
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: `0 4px 12px ${colors.shadow}`
          }}
        >
          {users.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: colors.textSecondary }}>
              No users found
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  minWidth: isMobile ? '880px' : '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}
              >
                <thead>
                  <tr style={{ background: colors.bgTertiary, borderBottom: `2px solid ${colors.border}` }}>
                    {['ID', 'Name', 'Email', 'Role', 'Major', 'Bio', 'Action'].map(header => (
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
                  {users.map((user, idx) => (
                    <tr
                      key={user.id}
                      style={{
                        background: idx % 2 === 0 ? colors.bgSecondary : colors.bgTertiary,
                        borderBottom: `1px solid ${colors.border}`,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = colors.bgTertiary)}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? colors.bgSecondary : colors.bgTertiary)}
                    >
                      <td style={{ padding: '12px 16px', color: colors.text, borderRight: `1px solid ${colors.border}` }}>
                        {user.id}
                      </td>
                      <td style={{ padding: '12px 16px', color: colors.text, fontWeight: 500, borderRight: `1px solid ${colors.border}` }}>
                        {user.name}
                      </td>
                      <td style={{ padding: '12px 16px', color: colors.textSecondary, borderRight: `1px solid ${colors.border}` }}>
                        {user.email}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          color: '#fff',
                          background: user.role === 'admin' ? '#ef4444' : '#3b82f6',
                          borderRadius: '4px',
                          fontWeight: 500,
                          borderRight: `1px solid ${colors.border}`
                        }}
                      >
                        {user.role}
                      </td>
                      <td style={{ padding: '12px 16px', color: colors.text, borderRight: `1px solid ${colors.border}` }}>
                        {user.major || 'Not set'}
                      </td>
                      <td
                        title={user.bio || 'Not set'}
                        style={{ padding: '12px 16px', color: colors.text, cursor: user.bio ? 'help' : 'default', borderRight: `1px solid ${colors.border}` }}
                      >
                        {user.bio
                          ? (user.bio.length > 30 ? user.bio.substring(0, 30) + '...' : user.bio)
                          : 'Not set'}
                      </td>
                      <td style={{ padding: '12px 16px', color: colors.text }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user)}
                          disabled={deletingUserId === user.id || user.id === currentUserId}
                          title={user.id === currentUserId ? 'You cannot delete your own account' : 'Delete user'}
                          style={{
                            padding: '6px 10px',
                            border: 'none',
                            borderRadius: '6px',
                            background: user.id === currentUserId ? colors.border : colors.danger,
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: deletingUserId === user.id || user.id === currentUserId ? 'not-allowed' : 'pointer',
                            opacity: deletingUserId === user.id ? 0.7 : 1
                          }}
                        >
                          {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                        </button>
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

export default AdminUsers
