jest.mock('../../src/services/post-service');
jest.mock('../../src/services/auth-token-service');
jest.mock('../../src/utils/Token.util', () => ({
  getUserByToken: jest.fn(),
  verifyToken: jest.fn(),
  generateToken: jest.fn(),
  generateRememberMeToken: jest.fn(),
  getExpirationDate: jest.fn(),
  getUserRoleByToken: jest.fn(),
  decodeToken: jest.fn(),
}));
jest.mock('../../src/middlewares/auth-middleware', () => ({
  authenticateToken: (req, res, next) => {
    req.user = {
      owner_id: Number(req.headers['x-test-owner'] || 1),
      role: req.headers['x-test-role'] || 'ADMIN',
    };
    next();
  },
}));

const request = require('supertest');
const app = require('../../src/app');
const postService = require('../../src/services/post-service');
const { getUserByToken } = require('../../src/utils/Token.util');

describe('Post endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/post', () => {
    it('should list paginated posts', async () => {
      postService.getAllActivePosts.mockResolvedValue({
        data: [
          {
            id: 1,
            title: 'Lesson',
            description: 'Desc',
            status: 'PUBLISHED',
            user_id: 1,
            created_at: new Date(),
            updated_at: new Date(),
            user: { id: 1, name: 'Ana', email: 'ana@mail.com' },
          },
        ],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const res = await request(app)
        .get('/api/post')
        .set('Authorization', 'Bearer fake')
        .query({ search: 'Lesson', from: '2026-07-01', to: '2026-09-30' });

      expect(res.status).toBe(200);
      expect(res.body.data[0].title).toBe('Lesson');
      expect(res.body.data[0].author).toMatchObject({ name: 'Ana' });
      expect(postService.getAllActivePosts).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Lesson',
          from: '2026-07-01',
          to: '2026-09-30',
        }),
      );
    });
  });

  describe('POST /api/post', () => {
    it('should create a post when requester is admin', async () => {
      getUserByToken.mockResolvedValue({ id: 1, role: 'ADMIN' });
      postService.createPost.mockResolvedValue({
        id: 9,
        title: 'New',
        description: 'Body',
        status: 'PUBLISHED',
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await request(app)
        .post('/api/post')
        .set('Authorization', 'Bearer fake')
        .set('x-test-role', 'ADMIN')
        .send({ title: 'New', description: 'Body' });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ id: 9, title: 'New' });
    });

    it('should block creation for USER role', async () => {
      const res = await request(app)
        .post('/api/post')
        .set('Authorization', 'Bearer fake')
        .set('x-test-role', 'USER')
        .send({ title: 'New', description: 'Body' });

      expect(res.status).toBe(403);
      expect(postService.createPost).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/post/:id', () => {
    it('should return a post by id', async () => {
      postService.getActivePostById.mockResolvedValue({
        id: 4,
        title: 'Post',
        description: 'Desc',
        status: 'PUBLISHED',
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
        user: { id: 1, name: 'Ana', email: 'ana@mail.com' },
      });

      const res = await request(app)
        .get('/api/post/4')
        .set('Authorization', 'Bearer fake');

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(4);
    });
  });
});
