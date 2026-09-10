const {
  pick,
  toUserResponse,
  toPostResponse,
  toCommentResponse,
  toPaginatedResponse,
} = require('../../src/utils/helpers.util');

describe('helpers.util', () => {
  describe('pick', () => {
    it('should return only the requested fields that exist on the object', () => {
      const data = { name: 'Ana', email: 'ana@mail.com', password: '123', role: 'ADMIN' };

      expect(pick(data, ['name', 'email'])).toEqual({
        name: 'Ana',
        email: 'ana@mail.com',
      });
    });

    it('should ignore undefined fields', () => {
      expect(pick({ name: 'Ana', email: undefined }, ['name', 'email'])).toEqual({
        name: 'Ana',
      });
    });
  });

  describe('toUserResponse', () => {
    it('should map the user without exposing password', () => {
      const user = {
        id: 1,
        name: 'Admin',
        email: 'admin@mail.com',
        password: 'secret-hash',
        role: 'ADMIN',
        created_at: '2026-01-01',
        updated_at: '2026-01-02',
        deleted_at: null,
      };

      expect(toUserResponse(user)).toEqual({
        id: 1,
        name: 'Admin',
        email: 'admin@mail.com',
        role: 'ADMIN',
        created_at: '2026-01-01',
        updated_at: '2026-01-02',
      });
      expect(toUserResponse(user)).not.toHaveProperty('password');
    });

    it('should return null when user is falsy', () => {
      expect(toUserResponse(null)).toBeNull();
    });
  });

  describe('toPostResponse', () => {
    it('should map post and author', () => {
      const post = {
        id: 10,
        title: 'Lesson 1',
        description: 'Content',
        status: 'PUBLISHED',
        user_id: 1,
        created_at: '2026-01-01',
        updated_at: '2026-01-02',
        user: { id: 1, name: 'Ana', email: 'ana@mail.com', password: 'x' },
      };

      expect(toPostResponse(post)).toEqual({
        id: 10,
        title: 'Lesson 1',
        description: 'Content',
        status: 'PUBLISHED',
        user_id: 1,
        author: { id: 1, name: 'Ana', email: 'ana@mail.com' },
        created_at: '2026-01-01',
        updated_at: '2026-01-02',
      });
    });
  });

  describe('toCommentResponse', () => {
    it('should map the comment with a public author', () => {
      const comment = {
        id: 7,
        content: 'Boa aula.',
        post_id: 4,
        user_id: 2,
        created_at: '2026-01-01',
        updated_at: '2026-01-02',
        user: { id: 2, name: 'Ana', role: 'USER', email: 'ana@mail.com' },
      };

      expect(toCommentResponse(comment)).toEqual({
        id: 7,
        content: 'Boa aula.',
        post_id: 4,
        user_id: 2,
        author: { id: 2, name: 'Ana', role: 'USER' },
        created_at: '2026-01-01',
        updated_at: '2026-01-02',
      });
      expect(toCommentResponse(comment).author).not.toHaveProperty('email');
    });
  });

  describe('toPaginatedResponse', () => {
    it('should map the list and keep meta', () => {
      const result = toPaginatedResponse(
        {
          data: [{ id: 1, name: 'A', email: 'a@mail.com', role: 'USER', created_at: null, updated_at: null }],
          meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
        toUserResponse,
      );

      expect(result.meta.total).toBe(1);
      expect(result.data[0]).toMatchObject({ id: 1, name: 'A' });
    });
  });
});
