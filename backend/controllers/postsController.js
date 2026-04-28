const pool = require('../config/db');
const logChange = require('../utils/logChange');

const VALID_VISIBILITIES = new Set(['public', 'members']);

const buildPostResponse = (post, commentMap, likeMap, reportMap) => ({
  id: post.id,
  user_id: post.user_id,
  author_id: post.user_id,
  author_name: post.author_name,
  title: post.title,
  content: post.content,
  visibility: post.visibility,
  status: post.status,
  moderation_note: post.moderation_note || '',
  created_at: post.created_at,
  updated_at: post.updated_at,
  liked_by: likeMap.get(post.id) || [],
  comments: commentMap.get(post.id) || [],
  reports: reportMap.get(post.id) || []
});

const getNestedMapsForPosts = async (postIds) => {
  const commentMap = new Map();
  const likeMap = new Map();
  const reportMap = new Map();

  if (!postIds.length) {
    return { commentMap, likeMap, reportMap };
  }

  const [commentsResult, likesResult, reportsResult] = await Promise.all([
    pool.query(
      `
      SELECT
        pc.id,
        pc.post_id,
        pc.user_id,
        pc.content,
        pc.created_at,
        users.name AS author_name
      FROM post_comments pc
      JOIN users ON users.id = pc.user_id
      WHERE pc.post_id = ANY($1::bigint[])
      ORDER BY pc.created_at ASC, pc.id ASC
      `,
      [postIds]
    ),
    pool.query(
      `
      SELECT post_id, user_id
      FROM post_likes
      WHERE post_id = ANY($1::bigint[])
      ORDER BY post_id ASC, created_at ASC
      `,
      [postIds]
    ),
    pool.query(
      `
      SELECT
        pr.id,
        pr.post_id,
        pr.reporter_id,
        pr.reason,
        pr.status,
        pr.reviewed_by,
        pr.reviewed_at,
        pr.created_at,
        users.name AS reporter_name
      FROM post_reports pr
      JOIN users ON users.id = pr.reporter_id
      WHERE pr.post_id = ANY($1::bigint[])
        AND pr.status = 'pending'
      ORDER BY pr.created_at ASC, pr.id ASC
      `,
      [postIds]
    )
  ]);

  commentsResult.rows.forEach((row) => {
    if (!commentMap.has(row.post_id)) {
      commentMap.set(row.post_id, []);
    }

    commentMap.get(row.post_id).push({
      id: row.id,
      user_id: row.user_id,
      author_name: row.author_name,
      content: row.content,
      created_at: row.created_at
    });
  });

  likesResult.rows.forEach((row) => {
    if (!likeMap.has(row.post_id)) {
      likeMap.set(row.post_id, []);
    }

    likeMap.get(row.post_id).push(row.user_id);
  });

  reportsResult.rows.forEach((row) => {
    if (!reportMap.has(row.post_id)) {
      reportMap.set(row.post_id, []);
    }

    reportMap.get(row.post_id).push({
      id: row.id,
      reporter_id: row.reporter_id,
      reporter_name: row.reporter_name,
      reason: row.reason,
      status: row.status,
      reviewed_by: row.reviewed_by,
      reviewed_at: row.reviewed_at,
      created_at: row.created_at
    });
  });

  return { commentMap, likeMap, reportMap };
};

const fetchPosts = async ({ whereClause = '', params = [] }) => {
  const result = await pool.query(
    `
    SELECT
      p.id,
      p.user_id,
      p.title,
      p.content,
      p.visibility,
      p.status,
      p.moderation_note,
      p.created_at,
      p.updated_at,
      users.name AS author_name
    FROM posts p
    JOIN users ON users.id = p.user_id
    ${whereClause}
    ORDER BY p.updated_at DESC, p.id DESC
    `,
    params
  );

  const postIds = result.rows.map((row) => row.id);
  const { commentMap, likeMap, reportMap } = await getNestedMapsForPosts(postIds);

  return result.rows.map((row) => buildPostResponse(row, commentMap, likeMap, reportMap));
};

const fetchSinglePost = async (postId) => {
  const posts = await fetchPosts({
    whereClause: 'WHERE p.id = $1',
    params: [postId]
  });

  return posts[0] || null;
};

const getPostRecord = async (postId) => {
  const result = await pool.query(
    `
    SELECT id, user_id, title, visibility, status
    FROM posts
    WHERE id = $1
    `,
    [postId]
  );

  return result.rows[0] || null;
};

const validatePostPayload = ({ title, content, visibility }) => {
  const trimmedTitle = typeof title === 'string' ? title.trim() : '';
  const trimmedContent = typeof content === 'string' ? content.trim() : '';
  const normalizedVisibility = VALID_VISIBILITIES.has(visibility) ? visibility : '';

  if (trimmedTitle.length > 200) {
    return { error: 'Title must be 200 characters or fewer' };
  }

  if (!trimmedContent) {
    return { error: 'Content is required' };
  }

  if (!normalizedVisibility) {
    return { error: 'Visibility must be public or members' };
  }

  return {
    title: trimmedTitle,
    content: trimmedContent,
    visibility: normalizedVisibility
  };
};

exports.listPosts = async (req, res) => {
  try {
    const filter = req.query.filter || 'all';
    const userId = req.user.id;

    let whereClause = `WHERE p.status = 'active'`;
    let params = [];

    if (filter === 'mine') {
      whereClause = 'WHERE p.user_id = $1';
      params = [userId];
    } else if (filter === 'public') {
      whereClause = `WHERE p.status = 'active' AND p.visibility = 'public'`;
    }

    const posts = await fetchPosts({ whereClause, params });
    res.json({ posts });
  } catch (error) {
    console.error('listPosts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listPostsByUser = async (req, res) => {
  try {
    const targetUserId = Number(req.params.userId);

    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const posts = await fetchPosts({
      whereClause: `WHERE p.user_id = $1 AND p.status = 'active'`,
      params: [targetUserId]
    });

    res.json({ posts });
  } catch (error) {
    console.error('listPostsByUser error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createPost = async (req, res) => {
  try {
    const validated = validatePostPayload(req.body);

    if (validated.error) {
      return res.status(400).json({ message: validated.error });
    }

    const result = await pool.query(
      `
      INSERT INTO posts (user_id, title, content, visibility)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [req.user.id, validated.title, validated.content, validated.visibility]
    );

    await logChange(req.user.id, 'CREATE_POST', `Created post "${validated.title}" (id=${result.rows[0].id})`);

    const post = await fetchSinglePost(result.rows[0].id);
    return res.status(201).json({ post });
  } catch (error) {
    console.error('createPost error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const validated = validatePostPayload(req.body);

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    if (validated.error) {
      return res.status(400).json({ message: validated.error });
    }

    const post = await getPostRecord(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own posts' });
    }

    await pool.query(
      `
      UPDATE posts
      SET title = $1,
          content = $2,
          visibility = $3
      WHERE id = $4
      `,
      [validated.title, validated.content, validated.visibility, postId]
    );

    await logChange(req.user.id, 'UPDATE_POST', `Updated post "${validated.title}" (id=${postId})`);

    const updatedPost = await fetchSinglePost(postId);
    return res.json({ post: updatedPost });
  } catch (error) {
    console.error('updatePost error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const postId = Number(req.params.id);

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await getPostRecord(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isOwner = post.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to delete this post' });
    }

    await pool.query('DELETE FROM posts WHERE id = $1', [postId]);

    await logChange(
      req.user.id,
      isAdmin && !isOwner ? 'ADMIN_DELETE_POST' : 'DELETE_POST',
      `Deleted post "${post.title}" (id=${postId})`
    );

    return res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('deletePost error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.togglePostLike = async (req, res) => {
  try {
    const postId = Number(req.params.id);

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await getPostRecord(postId);

    if (!post || post.status !== 'active') {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existing = await pool.query(
      `
      SELECT 1
      FROM post_likes
      WHERE post_id = $1 AND user_id = $2
      `,
      [postId, req.user.id]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2',
        [postId, req.user.id]
      );
    } else {
      await pool.query(
        `
        INSERT INTO post_likes (post_id, user_id)
        VALUES ($1, $2)
        `,
        [postId, req.user.id]
      );
    }

    const updatedPost = await fetchSinglePost(postId);
    return res.json({ post: updatedPost });
  } catch (error) {
    console.error('togglePostLike error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await getPostRecord(postId);

    if (!post || post.status !== 'active') {
      return res.status(404).json({ message: 'Post not found' });
    }

    await pool.query(
      `
      INSERT INTO post_comments (post_id, user_id, content)
      VALUES ($1, $2, $3)
      `,
      [postId, req.user.id, content]
    );

    await logChange(req.user.id, 'COMMENT_POST', `Commented on post id=${postId}`);

    const updatedPost = await fetchSinglePost(postId);
    return res.status(201).json({ post: updatedPost });
  } catch (error) {
    console.error('addComment error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.reportPost = async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    if (!reason) {
      return res.status(400).json({ message: 'Report reason is required' });
    }

    const post = await getPostRecord(postId);

    if (!post || post.status !== 'active') {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user_id === req.user.id) {
      return res.status(400).json({ message: 'You cannot report your own post' });
    }

    const existing = await pool.query(
      `
      SELECT id
      FROM post_reports
      WHERE post_id = $1
        AND reporter_id = $2
        AND status = 'pending'
      `,
      [postId, req.user.id]
    );

    if (existing.rows.length === 0) {
      await pool.query(
        `
        INSERT INTO post_reports (post_id, reporter_id, reason)
        VALUES ($1, $2, $3)
        `,
        [postId, req.user.id, reason]
      );

      await logChange(req.user.id, 'REPORT_POST', `Reported post id=${postId}`);
    }

    const updatedPost = await fetchSinglePost(postId);
    return res.status(201).json({ post: updatedPost });
  } catch (error) {
    console.error('reportPost error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getReportedPostsForAdmin = async (req, res) => {
  try {
    const posts = await fetchPosts({
      whereClause: `
        WHERE p.id IN (
          SELECT DISTINCT post_id
          FROM post_reports
          WHERE status = 'pending'
        )
      `
    });

    res.json({ posts });
  } catch (error) {
    console.error('getReportedPostsForAdmin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.moderatePost = async (req, res) => {
  const client = await pool.connect();

  try {
    const postId = Number(req.params.id);
    const action = req.body.action;
    const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    if (!['dismiss', 'remove'].includes(action)) {
      return res.status(400).json({ message: 'Invalid moderation action' });
    }

    await client.query('BEGIN');

    const postResult = await client.query(
      `
      SELECT id, title, status
      FROM posts
      WHERE id = $1
      FOR UPDATE
      `,
      [postId]
    );

    if (postResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Post not found' });
    }

    if (action === 'remove') {
      await client.query(
        `
        UPDATE posts
        SET status = 'removed',
            moderation_note = $1
        WHERE id = $2
        `,
        [note || 'Removed by admin', postId]
      );

      await client.query(
        `
        UPDATE post_reports
        SET status = 'resolved',
            reviewed_by = $1,
            reviewed_at = CURRENT_TIMESTAMP
        WHERE post_id = $2
          AND status = 'pending'
        `,
        [req.user.id, postId]
      );
    } else {
      await client.query(
        `
        UPDATE post_reports
        SET status = 'dismissed',
            reviewed_by = $1,
            reviewed_at = CURRENT_TIMESTAMP
        WHERE post_id = $2
          AND status = 'pending'
        `,
        [req.user.id, postId]
      );
    }

    await client.query('COMMIT');

    await logChange(
      req.user.id,
      action === 'remove' ? 'ADMIN_REMOVE_POST' : 'ADMIN_DISMISS_POST_REPORT',
      `${action === 'remove' ? 'Removed' : 'Dismissed reports for'} post "${postResult.rows[0].title}" (id=${postId})`
    );

    const updatedPost = await fetchSinglePost(postId);
    return res.json({ post: updatedPost });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('moderatePost rollback error:', rollbackError);
    }

    console.error('moderatePost error:', error);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};
