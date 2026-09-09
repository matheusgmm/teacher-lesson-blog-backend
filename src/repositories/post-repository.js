const { prisma } = require('../config/prisma');

const POST_PUBLIC_SELECT = {
  id: true,
  title: true,
  description: true,
  status: true,
  created_at: true,
  updated_at: true,
  user_id: true,
  user: {
    select: { id: true, name: true, email: true },
  },
};

async function createPost(data, requesterId) {
  return prisma.post.create({
    data: {
      title: data.title,
      description: data.description,
      user_id: requesterId,
      status: 'PUBLISHED',
    },
    select: POST_PUBLIC_SELECT,
  });
}

async function updatePost(id, data) {
  return prisma.post.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      updated_at: new Date(),
    },
    select: POST_PUBLIC_SELECT,
  });
}

async function deletePost(id) {
  return prisma.post.update({
    where: { id },
    data: {
      status: 'DELETED',
      updated_at: new Date(),
      deleted_at: new Date(),
    },
  });
}

async function getAllActivePosts({ search, createdAt, page = 1, limit = 10 } = {}) {
  const take = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const currentPage = Math.max(Number(page) || 1, 1);
  const skip = (currentPage - 1) * take;

  const where = {
    deleted_at: null,
    ...(search ? {
      OR: [
        { title: { contains: search } },
        { description: { contains: search } },
      ],
    } : {}),
    ...(createdAt ? { created_at: createdAt } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take,
      select: POST_PUBLIC_SELECT,
    }),
    prisma.post.count({ where }),
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

async function getActivePostById(id) {
  return prisma.post.findFirst({
    where: { id, deleted_at: null },
    select: POST_PUBLIC_SELECT,
  });
}

async function getPostById(id) {
  return prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
    },
  });
}

module.exports = {
  createPost,
  updatePost,
  deletePost,
  getAllActivePosts,
  getActivePostById,
  getPostById,
};
