const { prisma } = require('../config/prisma');

const COMMENT_PUBLIC_SELECT = {
  id: true,
  content: true,
  post_id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
  user: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
};

async function createComment({ content, postId, userId }) {
  return prisma.comment.create({
    data: {
      content,
      post_id: postId,
      user_id: userId,
    },
    select: COMMENT_PUBLIC_SELECT,
  });
}

async function getActiveById(id) {
  return prisma.comment.findFirst({
    where: { id, deleted_at: null },
    select: COMMENT_PUBLIC_SELECT,
  });
}

async function listByPost({ postId, page = 1, limit = 10 } = {}) {
  const take = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const currentPage = Math.max(Number(page) || 1, 1);
  const skip = (currentPage - 1) * take;

  const where = {
    post_id: postId,
    deleted_at: null,
  };

  const [data, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      skip,
      take,
      select: COMMENT_PUBLIC_SELECT,
    }),
    prisma.comment.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: currentPage,
      limit: take,
      total,
      totalPages: Math.ceil(total / take) || 1,
    },
  };
}

async function updateComment(id, content) {
  return prisma.comment.update({
    where: { id },
    data: {
      content,
      updated_at: new Date(),
    },
    select: COMMENT_PUBLIC_SELECT,
  });
}

async function deactivateComment(id) {
  return prisma.comment.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      updated_at: new Date(),
    },
  });
}

module.exports = {
  createComment,
  getActiveById,
  listByPost,
  updateComment,
  deactivateComment,
};
