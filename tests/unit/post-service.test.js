jest.mock('../../src/repositories/post-repository');

const postRepository = require('../../src/repositories/post-repository');
const postService = require('../../src/services/post-service');

describe('post-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a post when title and description are provided', async () => {
      postRepository.createPost.mockResolvedValue({ id: 1, title: 'Lesson' });

      const result = await postService.createPost(
        { title: 'Lesson', description: 'Body' },
        10,
      );

      expect(postRepository.createPost).toHaveBeenCalledWith(
        { title: 'Lesson', description: 'Body' },
        10,
      );
      expect(result.id).toBe(1);
    });

    it('should fail without title/description', async () => {
      await expect(postService.createPost({ title: 'Title only' }, 1)).rejects.toMatchObject({
        code: 'TITLE_DESCRIPTION_REQUIRED',
      });
    });
  });

  describe('updatePost', () => {
    it('should update when the requester owns the post', async () => {
      postRepository.getActivePostById.mockResolvedValue({
        id: 5,
        user_id: 10,
        deleted_at: null,
      });
      postRepository.updatePost.mockResolvedValue({ id: 5, title: 'Updated' });

      const result = await postService.updatePost(
        5,
        { title: 'Updated' },
        { id: 10, role: 'USER' },
      );

      expect(result.title).toBe('Updated');
    });

    it('should forbid updating another user post', async () => {
      postRepository.getActivePostById.mockResolvedValue({
        id: 5,
        user_id: 10,
        deleted_at: null,
      });

      await expect(
        postService.updatePost(5, { title: 'Hack' }, { id: 99, role: 'USER' }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('should return 404 when post does not exist', async () => {
      postRepository.getActivePostById.mockResolvedValue(null);

      await expect(
        postService.updatePost(999, { title: 'X' }, { id: 1 }),
      ).rejects.toMatchObject({ code: 'POST_NOT_FOUND' });
    });
  });

  describe('getAllActivePosts', () => {
    it('should forward a created_at range to the repository', async () => {
      postRepository.getAllActivePosts.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
      });

      await postService.getAllActivePosts({
        search: 'aula',
        from: '2026-07-01',
        to: '2026-07-31',
        page: 2,
        limit: 10,
      });

      expect(postRepository.getAllActivePosts).toHaveBeenCalledWith({
        search: 'aula',
        createdAt: {
          gte: expect.any(Date),
          lte: expect.any(Date),
        },
        page: 2,
        limit: 10,
      });
    });

    it('should reject an inverted date range', async () => {
      await expect(
        postService.getAllActivePosts({ from: '2026-08-10', to: '2026-08-01' }),
      ).rejects.toMatchObject({ code: 'INVALID_DATE_RANGE' });
      expect(postRepository.getAllActivePosts).not.toHaveBeenCalled();
    });
  });

  describe('deletePost', () => {
    it('should require an id', async () => {
      await expect(postService.deletePost()).rejects.toMatchObject({
        code: 'POST_ID_REQUIRED',
      });
    });
  });
});
