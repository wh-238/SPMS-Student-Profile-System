import API from './api'

const STORAGE_KEY = 'spms-community-posts'

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const shouldUseFallback = (error) => {
  const status = error?.response?.status
  return !error?.response || status === 404 || status === 405 || status === 501
}

const readLocalPosts = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const writeLocalPosts = (posts) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
}

const normalizeComment = (comment = {}) => ({
  id: comment.id || createId('comment'),
  user_id: Number(comment.user_id ?? comment.author_id ?? 0),
  author_name: comment.author_name || comment.author?.name || 'Unknown user',
  content: comment.content || '',
  created_at: comment.created_at || new Date().toISOString()
})

const normalizeReport = (report = {}) => ({
  id: report.id || createId('report'),
  reporter_id: Number(report.reporter_id ?? report.user_id ?? 0),
  reporter_name: report.reporter_name || report.reporter?.name || 'Unknown user',
  reason: report.reason || '',
  created_at: report.created_at || new Date().toISOString()
})

const normalizePost = (post = {}) => {
  const comments = Array.isArray(post.comments) ? post.comments.map(normalizeComment) : []
  const reports = Array.isArray(post.reports) ? post.reports.map(normalizeReport) : []
  const likedBy = Array.isArray(post.liked_by)
    ? post.liked_by.map(Number)
    : Array.isArray(post.likes)
      ? post.likes.map((like) => Number(like.user_id ?? like))
      : []

  return {
    id: post.id || createId('post'),
    user_id: Number(post.user_id ?? post.author_id ?? 0),
    author_id: Number(post.author_id ?? post.user_id ?? 0),
    author_name: post.author_name || post.author?.name || 'Unknown user',
    title: post.title || '',
    content: post.content || '',
    visibility: post.visibility === 'members' ? 'members' : 'public',
    status: post.status || 'active',
    created_at: post.created_at || new Date().toISOString(),
    updated_at: post.updated_at || post.created_at || new Date().toISOString(),
    moderation_note: post.moderation_note || '',
    comments,
    reports,
    liked_by: [...new Set(likedBy.filter((value) => Number.isInteger(value) && value > 0))]
  }
}

const sortPosts = (posts) =>
  [...posts].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

const shapePostForViewer = (post, viewer = {}) => {
  const viewerId = Number(viewer?.id || 0)
  const isAdmin = viewer?.role === 'admin'

  return {
    ...post,
    like_count: post.liked_by.length,
    comment_count: post.comments.length,
    report_count: post.reports.length,
    is_liked: viewerId > 0 ? post.liked_by.includes(viewerId) : false,
    can_edit: viewerId > 0 && post.user_id === viewerId,
    can_delete: viewerId > 0 && (post.user_id === viewerId || isAdmin),
    can_report: viewerId > 0 && post.user_id !== viewerId,
    can_moderate: isAdmin,
    visibility_label: post.visibility === 'members' ? 'Logged-in users only' : 'Public'
  }
}

const getVisibleLocalPosts = ({ viewer, userId, reportedOnly = false }) => {
  const isAdmin = viewer?.role === 'admin'

  return sortPosts(readLocalPosts())
    .filter((post) => (isAdmin ? true : post.status === 'active'))
    .filter((post) => (userId ? post.user_id === Number(userId) : true))
    .filter((post) => (reportedOnly ? post.reports.length > 0 : true))
    .map((post) => shapePostForViewer(normalizePost(post), viewer))
}

const requestOrFallback = async (requestFn, fallbackFn) => {
  try {
    return await requestFn()
  } catch (error) {
    if (shouldUseFallback(error)) {
      return fallbackFn()
    }
    throw error
  }
}

export const listCommunityPosts = async ({ viewer, filter = 'all' }) =>
  requestOrFallback(
    async () => {
      const res = await API.get('/posts', { params: { filter } })
      const payload = Array.isArray(res.data) ? res.data : res.data.posts || []
      return sortPosts(payload.map(normalizePost)).map((post) => shapePostForViewer(post, viewer))
    },
    async () => {
      const posts = getVisibleLocalPosts({ viewer })
      if (filter === 'mine') {
        return posts.filter((post) => post.user_id === Number(viewer?.id))
      }
      if (filter === 'public') {
        return posts.filter((post) => post.visibility === 'public')
      }
      return posts
    }
  )

export const listUserPosts = async ({ viewer, userId }) =>
  requestOrFallback(
    async () => {
      const res = await API.get(`/posts/user/${userId}`)
      const payload = Array.isArray(res.data) ? res.data : res.data.posts || []
      return sortPosts(payload.map(normalizePost)).map((post) => shapePostForViewer(post, viewer))
    },
    async () => getVisibleLocalPosts({ viewer, userId })
  )

export const createPost = async ({ viewer, title, content, visibility }) =>
  requestOrFallback(
    async () => {
      const res = await API.post('/posts', { title, content, visibility })
      return shapePostForViewer(normalizePost(res.data.post || res.data), viewer)
    },
    async () => {
      const posts = readLocalPosts()
      const now = new Date().toISOString()
      const nextPost = normalizePost({
        id: createId('post'),
        user_id: viewer.id,
        author_name: viewer.name,
        title,
        content,
        visibility,
        created_at: now,
        updated_at: now,
        comments: [],
        reports: [],
        liked_by: [],
        status: 'active'
      })
      const updatedPosts = sortPosts([nextPost, ...posts])
      writeLocalPosts(updatedPosts)
      return shapePostForViewer(nextPost, viewer)
    }
  )

export const updatePost = async ({ viewer, postId, title, content, visibility }) =>
  requestOrFallback(
    async () => {
      const res = await API.put(`/posts/${postId}`, { title, content, visibility })
      return shapePostForViewer(normalizePost(res.data.post || res.data), viewer)
    },
    async () => {
      let updatedPost = null
      const updatedPosts = sortPosts(
        readLocalPosts().map((post) => {
          if (String(post.id) !== String(postId)) {
            return normalizePost(post)
          }

          updatedPost = normalizePost({
            ...post,
            title,
            content,
            visibility,
            updated_at: new Date().toISOString()
          })
          return updatedPost
        })
      )

      writeLocalPosts(updatedPosts)
      return updatedPost ? shapePostForViewer(updatedPost, viewer) : null
    }
  )

export const deletePost = async ({ postId }) =>
  requestOrFallback(
    async () => {
      await API.delete(`/posts/${postId}`)
      return true
    },
    async () => {
      const updatedPosts = readLocalPosts().filter((post) => String(post.id) !== String(postId))
      writeLocalPosts(updatedPosts)
      return true
    }
  )

export const togglePostLike = async ({ viewer, postId }) =>
  requestOrFallback(
    async () => {
      const res = await API.post(`/posts/${postId}/likes/toggle`)
      return shapePostForViewer(normalizePost(res.data.post || res.data), viewer)
    },
    async () => {
      let updatedPost = null
      const viewerId = Number(viewer.id)
      const updatedPosts = sortPosts(
        readLocalPosts().map((post) => {
          const normalized = normalizePost(post)
          if (String(normalized.id) !== String(postId)) {
            return normalized
          }

          const likedBy = normalized.liked_by.includes(viewerId)
            ? normalized.liked_by.filter((id) => id !== viewerId)
            : [...normalized.liked_by, viewerId]

          updatedPost = normalizePost({
            ...normalized,
            liked_by: likedBy
          })

          return updatedPost
        })
      )

      writeLocalPosts(updatedPosts)
      return updatedPost ? shapePostForViewer(updatedPost, viewer) : null
    }
  )

export const addPostComment = async ({ viewer, postId, content }) =>
  requestOrFallback(
    async () => {
      const res = await API.post(`/posts/${postId}/comments`, { content })
      return shapePostForViewer(normalizePost(res.data.post || res.data), viewer)
    },
    async () => {
      let updatedPost = null
      const nextComment = normalizeComment({
        id: createId('comment'),
        user_id: viewer.id,
        author_name: viewer.name,
        content,
        created_at: new Date().toISOString()
      })

      const updatedPosts = sortPosts(
        readLocalPosts().map((post) => {
          const normalized = normalizePost(post)
          if (String(normalized.id) !== String(postId)) {
            return normalized
          }

          updatedPost = normalizePost({
            ...normalized,
            comments: [...normalized.comments, nextComment],
            updated_at: new Date().toISOString()
          })

          return updatedPost
        })
      )

      writeLocalPosts(updatedPosts)
      return updatedPost ? shapePostForViewer(updatedPost, viewer) : null
    }
  )

export const reportPost = async ({ viewer, postId, reason }) =>
  requestOrFallback(
    async () => {
      const res = await API.post(`/posts/${postId}/reports`, { reason })
      return shapePostForViewer(normalizePost(res.data.post || res.data), viewer)
    },
    async () => {
      let updatedPost = null
      const nextReport = normalizeReport({
        id: createId('report'),
        reporter_id: viewer.id,
        reporter_name: viewer.name,
        reason,
        created_at: new Date().toISOString()
      })

      const updatedPosts = sortPosts(
        readLocalPosts().map((post) => {
          const normalized = normalizePost(post)
          if (String(normalized.id) !== String(postId)) {
            return normalized
          }

          const alreadyReported = normalized.reports.some(
            (report) => Number(report.reporter_id) === Number(viewer.id)
          )

          updatedPost = normalizePost({
            ...normalized,
            reports: alreadyReported ? normalized.reports : [...normalized.reports, nextReport]
          })

          return updatedPost
        })
      )

      writeLocalPosts(updatedPosts)
      return updatedPost ? shapePostForViewer(updatedPost, viewer) : null
    }
  )

export const listReportedPosts = async ({ viewer }) =>
  requestOrFallback(
    async () => {
      const res = await API.get('/admin/posts/reports')
      const payload = Array.isArray(res.data) ? res.data : res.data.posts || []
      return sortPosts(payload.map(normalizePost)).map((post) => shapePostForViewer(post, viewer))
    },
    async () => getVisibleLocalPosts({ viewer, reportedOnly: true })
  )

export const moderatePost = async ({ viewer, postId, action, note }) =>
  requestOrFallback(
    async () => {
      const res = await API.post(`/admin/posts/${postId}/moderate`, { action, note })
      return shapePostForViewer(normalizePost(res.data.post || res.data), viewer)
    },
    async () => {
      let updatedPost = null
      const updatedPosts = sortPosts(
        readLocalPosts().map((post) => {
          const normalized = normalizePost(post)
          if (String(normalized.id) !== String(postId)) {
            return normalized
          }

          updatedPost = normalizePost({
            ...normalized,
            status: action === 'remove' ? 'removed' : normalized.status,
            reports: action === 'dismiss' ? [] : normalized.reports,
            moderation_note: note || normalized.moderation_note,
            updated_at: new Date().toISOString()
          })

          return updatedPost
        })
      )

      writeLocalPosts(updatedPosts)
      return updatedPost ? shapePostForViewer(updatedPost, viewer) : null
    }
  )
