const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const {
  listPosts,
  listPostsByUser,
  createPost,
  updatePost,
  deletePost,
  togglePostLike,
  addComment,
  reportPost
} = require('../controllers/postsController');

router.use(authMiddleware);

router.get('/', listPosts);
router.get('/user/:userId', listPostsByUser);
router.post('/', createPost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);
router.post('/:id/likes/toggle', togglePostLike);
router.post('/:id/comments', addComment);
router.post('/:id/reports', reportPost);

module.exports = router;
