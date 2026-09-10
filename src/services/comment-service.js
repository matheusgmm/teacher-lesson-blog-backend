const { CodedApiError } = require('../utils/CodedApiError.util');
const commentRepository = require('../repositories/comment-repository');
const postRepository = require('../repositories/post-repository');

const CONTENT_MIN = 3;
const CONTENT_MAX = 1000;

function toPositiveInt(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

function normalizeContent(raw) {
  const content = String(raw ?? '').trim();

  if (!content) {
    throw new CodedApiError('CONTENT_REQUIRED', 'Content is required', 400);
  }

  if (content.length < CONTENT_MIN) {
    throw new CodedApiError(
      'CONTENT_TOO_SHORT',
      `Content must have at least ${CONTENT_MIN} characters`,
      400,
    );
  }

  if (content.length > CONTENT_MAX) {
    throw new CodedApiError(
      'CONTENT_TOO_LONG',
      `Content must have at most ${CONTENT_MAX} characters`,
      400,
    );
  }

  return content;
}

async function assertActivePost(postId) {
  const id = toPositiveInt(postId);
  if (!id) {
    throw new CodedApiError('POST_ID_REQUIRED', 'Post id is required', 400);
  }

  const post = await postRepository.getActivePostById(id);
  if (!post) {
    throw new CodedApiError('POST_NOT_FOUND', 'Post not found', 404);
  }

  return id;
}

async function listByPost(postId, { page = 1, limit = 10 } = {}) {
  const id = await assertActivePost(postId);
  return commentRepository.listByPost({ postId: id, page, limit });
}

async function createComment(postId, data, requester) {
  if (!requester?.id) {
    throw new CodedApiError('UNAUTHORIZED', 'Unauthorized', 401);
  }

  const id = await assertActivePost(postId);
  const content = normalizeContent(data.content);

  return commentRepository.createComment({
    content,
    postId: id,
    userId: requester.id,
  });
}

async function getOwnedComment(postId, commentId) {
  const activePostId = await assertActivePost(postId);
  const id = toPositiveInt(commentId);

  if (!id) {
    throw new CodedApiError('COMMENT_ID_REQUIRED', 'Comment id is required', 400);
  }

  const comment = await commentRepository.getActiveById(id);
  if (!comment || comment.post_id !== activePostId) {
    throw new CodedApiError('COMMENT_NOT_FOUND', 'Comment not found', 404);
  }

  return comment;
}

async function updateComment(postId, commentId, data, requester) {
  if (!requester?.id) {
    throw new CodedApiError('UNAUTHORIZED', 'Unauthorized', 401);
  }

  const comment = await getOwnedComment(postId, commentId);

  if (comment.user_id !== requester.id) {
    throw new CodedApiError(
      'FORBIDDEN',
      'You are not allowed to update this comment',
      403,
    );
  }

  return commentRepository.updateComment(comment.id, normalizeContent(data.content));
}

async function deleteComment(postId, commentId, requester) {
  if (!requester?.id) {
    throw new CodedApiError('UNAUTHORIZED', 'Unauthorized', 401);
  }

  const comment = await getOwnedComment(postId, commentId);
  const isAuthor = comment.user_id === requester.id;
  const isAdmin = requester.role === 'ADMIN';

  if (!isAuthor && !isAdmin) {
    throw new CodedApiError(
      'FORBIDDEN',
      'You are not allowed to delete this comment',
      403,
    );
  }

  return commentRepository.deactivateComment(comment.id);
}

module.exports = {
  CONTENT_MIN,
  CONTENT_MAX,
  listByPost,
  createComment,
  updateComment,
  deleteComment,
};
