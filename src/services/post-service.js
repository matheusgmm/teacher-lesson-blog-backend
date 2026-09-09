const { CodedApiError } = require('../utils/CodedApiError.util');
const { resolveCreatedAtFilter } = require('../utils/date-filter.util');
const postRepository = require('../repositories/post-repository');

const TITLE_MAX = 191;
const DESCRIPTION_MAX = 8000;

function toPositiveInt(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

function normalizePostContent(data = {}) {
  const title = String(data.title ?? '').trim();
  const description = String(data.description ?? '').trim();

  if (!title || !description) {
    throw new CodedApiError(
      'TITLE_DESCRIPTION_REQUIRED',
      'Title and description are required',
      400,
    );
  }

  if (title.length > TITLE_MAX) {
    throw new CodedApiError('TITLE_TOO_LONG', `Title must have at most ${TITLE_MAX} characters`, 400);
  }

  if (description.length > DESCRIPTION_MAX) {
    throw new CodedApiError(
      'DESCRIPTION_TOO_LONG',
      `Description must have at most ${DESCRIPTION_MAX} characters`,
      400,
    );
  }

  return { title, description };
}

async function createPost(data, requesterId) {
  const content = normalizePostContent(data);
  return postRepository.createPost(content, requesterId);
}

async function getAllActivePosts({ search, from, to, page = 1, limit = 10 } = {}) {
  const createdAt = resolveCreatedAtFilter(from, to);
  return postRepository.getAllActivePosts({ search, createdAt, page, limit });
}

async function getActivePostById(id) {
  const numericId = toPositiveInt(id);
  if (!numericId) {
    throw new CodedApiError('POST_ID_REQUIRED', 'Post id is required', 400);
  }

  const post = await postRepository.getActivePostById(numericId);
  if (!post) {
    throw new CodedApiError('POST_NOT_FOUND', 'Post not found', 404);
  }

  return post;
}

async function updatePost(targetId, data, requester) {
  const id = toPositiveInt(targetId);
  if (!id) {
    throw new CodedApiError('POST_ID_REQUIRED', 'Post id is required', 400);
  }

  if (!data.title && !data.description) {
    throw new CodedApiError(
      'TITLE_DESCRIPTION_REQUIRED',
      'At least one of title or description is required',
      400,
    );
  }

  const post = await postRepository.getActivePostById(id);

  if (!post) {
    throw new CodedApiError('POST_NOT_FOUND', 'Post not found', 404);
  }

  if (post.user_id !== requester.id) {
    throw new CodedApiError('FORBIDDEN', 'You are not allowed to update this post', 403);
  }

  const nextData = {
    ...data,
    ...(data.title !== undefined ? { title: String(data.title).trim() } : {}),
    ...(data.description !== undefined ? { description: String(data.description).trim() } : {}),
  };

  return postRepository.updatePost(id, nextData);
}

async function deletePost(id) {
  const numericId = toPositiveInt(id);
  if (!numericId) {
    throw new CodedApiError('POST_ID_REQUIRED', 'Post id is required', 400);
  }

  return postRepository.deletePost(numericId);
}

async function getPostById(id) {
  return postRepository.getPostById(id);
}

module.exports = {
  createPost,
  getAllActivePosts,
  getPostById,
  updatePost,
  deletePost,
  getActivePostById,
};
