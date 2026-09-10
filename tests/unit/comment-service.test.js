jest.mock('../../src/repositories/comment-repository');
jest.mock('../../src/repositories/post-repository');

const commentRepository = require('../../src/repositories/comment-repository');
const postRepository = require('../../src/repositories/post-repository');
const commentService = require('../../src/services/comment-service');

describe('comment-service', () => {
  const post = { id: 4, deleted_at: null };
  const requester = { id: 2, role: 'USER' };
  const comment = {
    id: 9,
    content: 'Boa sequência.',
    post_id: 4,
    user_id: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    postRepository.getActivePostById.mockResolvedValue(post);
  });

  describe('createComment', () => {
    it('should create a comment on an active post', async () => {
      commentRepository.createComment.mockResolvedValue({ ...comment, user: { id: 2, name: 'Ana', role: 'USER' } });

      const result = await commentService.createComment(
        4,
        { content: 'Boa sequência.' },
        requester,
      );

      expect(commentRepository.createComment).toHaveBeenCalledWith({
        content: 'Boa sequência.',
        postId: 4,
        userId: 2,
      });
      expect(result.id).toBe(9);
    });

    it('should reject empty content', async () => {
      await expect(
        commentService.createComment(4, { content: '  ' }, requester),
      ).rejects.toMatchObject({ code: 'CONTENT_REQUIRED' });
    });

    it('should reject content shorter than 3 characters', async () => {
      await expect(
        commentService.createComment(4, { content: 'oi' }, requester),
      ).rejects.toMatchObject({ code: 'CONTENT_TOO_SHORT' });
    });

    it('should return 404 when the post is gone', async () => {
      postRepository.getActivePostById.mockResolvedValue(null);

      await expect(
        commentService.createComment(99, { content: 'Ainda dá tempo?' }, requester),
      ).rejects.toMatchObject({ code: 'POST_NOT_FOUND' });
    });
  });

  describe('updateComment', () => {
    it('should allow the author to edit', async () => {
      commentRepository.getActiveById.mockResolvedValue(comment);
      commentRepository.updateComment.mockResolvedValue({ ...comment, content: 'Texto novo.' });

      const result = await commentService.updateComment(
        4,
        9,
        { content: 'Texto novo.' },
        requester,
      );

      expect(commentRepository.updateComment).toHaveBeenCalledWith(9, 'Texto novo.');
      expect(result.content).toBe('Texto novo.');
    });

    it('should forbid another user from editing', async () => {
      commentRepository.getActiveById.mockResolvedValue(comment);

      await expect(
        commentService.updateComment(4, 9, { content: 'Hack' }, { id: 8, role: 'ADMIN' }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
      expect(commentRepository.updateComment).not.toHaveBeenCalled();
    });
  });

  describe('deleteComment', () => {
    it('should allow the author to soft-delete', async () => {
      commentRepository.getActiveById.mockResolvedValue(comment);
      commentRepository.deactivateComment.mockResolvedValue({ id: 9 });

      await commentService.deleteComment(4, 9, requester);

      expect(commentRepository.deactivateComment).toHaveBeenCalledWith(9);
    });

    it('should allow an admin to moderate another comment', async () => {
      commentRepository.getActiveById.mockResolvedValue(comment);
      commentRepository.deactivateComment.mockResolvedValue({ id: 9 });

      await commentService.deleteComment(4, 9, { id: 1, role: 'ADMIN' });

      expect(commentRepository.deactivateComment).toHaveBeenCalledWith(9);
    });

    it('should forbid a member from deleting someone else comment', async () => {
      commentRepository.getActiveById.mockResolvedValue(comment);

      await expect(
        commentService.deleteComment(4, 9, { id: 8, role: 'USER' }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('should hide a comment that belongs to another post', async () => {
      commentRepository.getActiveById.mockResolvedValue({ ...comment, post_id: 12 });

      await expect(
        commentService.deleteComment(4, 9, requester),
      ).rejects.toMatchObject({ code: 'COMMENT_NOT_FOUND' });
    });
  });
});
