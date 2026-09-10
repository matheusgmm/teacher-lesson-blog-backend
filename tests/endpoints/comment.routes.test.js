jest.mock('../../src/services/comment-service');
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
      owner_id: Number(req.headers['x-test-owner'] || 2),
      role: req.headers['x-test-role'] || 'USER',
    };
    next();
  },
}));

const request = require('supertest');
const app = require('../../src/app');
const commentService = require('../../src/services/comment-service');
const { getUserByToken } = require('../../src/utils/Token.util');

describe('Comment endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/post/:id/comments', () => {
    it('should list comments for an authenticated member', async () => {
      commentService.listByPost.mockResolvedValue({
        data: [
          {
            id: 1,
            content: 'Boa aula.',
            post_id: 4,
            user_id: 2,
            created_at: new Date(),
            updated_at: new Date(),
            user: { id: 2, name: 'Ana', role: 'USER' },
          },
        ],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const res = await request(app)
        .get('/api/post/4/comments')
        .set('Authorization', 'Bearer fake')
        .set('x-test-role', 'USER')
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({
        content: 'Boa aula.',
        author: { name: 'Ana', role: 'USER' },
      });
      expect(commentService.listByPost).toHaveBeenCalledWith('4', expect.objectContaining({ page: '1' }));
    });
  });

  describe('POST /api/post/:id/comments', () => {
    it('should allow a USER to comment', async () => {
      getUserByToken.mockResolvedValue({ id: 2, role: 'USER' });
      commentService.createComment.mockResolvedValue({
        id: 3,
        content: 'Vou aplicar amanhã.',
        post_id: 4,
        user_id: 2,
        created_at: new Date(),
        updated_at: new Date(),
        user: { id: 2, name: 'Ana', role: 'USER' },
      });

      const res = await request(app)
        .post('/api/post/4/comments')
        .set('Authorization', 'Bearer fake')
        .set('x-test-role', 'USER')
        .send({ content: 'Vou aplicar amanhã.' });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ id: 3, content: 'Vou aplicar amanhã.' });
      expect(commentService.createComment).toHaveBeenCalledWith(
        '4',
        expect.objectContaining({ content: 'Vou aplicar amanhã.' }),
        expect.objectContaining({ id: 2 }),
      );
    });
  });

  describe('PATCH /api/post/:id/comments/:commentId', () => {
    it('should update a comment', async () => {
      getUserByToken.mockResolvedValue({ id: 2, role: 'USER' });
      commentService.updateComment.mockResolvedValue({
        id: 3,
        content: 'Texto revisado.',
        post_id: 4,
        user_id: 2,
        created_at: new Date(),
        updated_at: new Date(),
        user: { id: 2, name: 'Ana', role: 'USER' },
      });

      const res = await request(app)
        .patch('/api/post/4/comments/3')
        .set('Authorization', 'Bearer fake')
        .send({ content: 'Texto revisado.' });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('Texto revisado.');
      expect(commentService.updateComment).toHaveBeenCalledWith(
        '4',
        '3',
        expect.objectContaining({ content: 'Texto revisado.' }),
        expect.objectContaining({ id: 2 }),
      );
    });
  });

  describe('DELETE /api/post/:id/comments/:commentId', () => {
    it('should delete a comment', async () => {
      getUserByToken.mockResolvedValue({ id: 1, role: 'ADMIN' });
      commentService.deleteComment.mockResolvedValue({ id: 3 });

      const res = await request(app)
        .delete('/api/post/4/comments/3')
        .set('Authorization', 'Bearer fake')
        .set('x-test-role', 'ADMIN');

      expect(res.status).toBe(200);
      expect(commentService.deleteComment).toHaveBeenCalledWith(
        '4',
        '3',
        expect.objectContaining({ role: 'ADMIN' }),
      );
    });
  });
});
