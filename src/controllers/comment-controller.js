const { CodedApiError } = require('../utils/CodedApiError.util');
const { getUserByToken } = require('../utils/Token.util');
const { toCommentResponse, toPaginatedResponse } = require('../utils/helpers.util');
const commentService = require('../services/comment-service');

async function listComments(req, res, next) {
  try {
    const result = await commentService.listByPost(req.params.id, {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
    });

    return res.status(200).json({
      status: 200,
      message: 'Comments fetched successfully',
      ...toPaginatedResponse(result, toCommentResponse),
    });
  } catch (error) {
    return next(
      error instanceof CodedApiError
        ? error
        : new CodedApiError('FAILED_GET_COMMENTS', error.message, 500),
    );
  }
}

async function createComment(req, res, next) {
  try {
    const requester = await getUserByToken(req.headers.authorization?.split(' ')[1]);
    if (!requester) {
      throw new CodedApiError('UNAUTHORIZED', 'Unauthorized', 401);
    }

    const comment = await commentService.createComment(req.params.id, req.body, requester);

    return res.status(201).json({
      status: 201,
      message: 'Comment created successfully',
      data: toCommentResponse(comment),
    });
  } catch (error) {
    return next(
      error instanceof CodedApiError
        ? error
        : new CodedApiError('FAILED_CREATE_COMMENT', error.message, 500),
    );
  }
}

async function updateComment(req, res, next) {
  try {
    const requester = await getUserByToken(req.headers.authorization?.split(' ')[1]);
    if (!requester) {
      throw new CodedApiError('UNAUTHORIZED', 'Unauthorized', 401);
    }

    const comment = await commentService.updateComment(
      req.params.id,
      req.params.commentId,
      req.body,
      requester,
    );

    return res.status(200).json({
      status: 200,
      message: 'Comment updated successfully',
      data: toCommentResponse(comment),
    });
  } catch (error) {
    return next(
      error instanceof CodedApiError
        ? error
        : new CodedApiError('FAILED_UPDATE_COMMENT', error.message, 500),
    );
  }
}

async function deleteComment(req, res, next) {
  try {
    const requester = await getUserByToken(req.headers.authorization?.split(' ')[1]);
    if (!requester) {
      throw new CodedApiError('UNAUTHORIZED', 'Unauthorized', 401);
    }

    await commentService.deleteComment(req.params.id, req.params.commentId, requester);

    return res.status(200).json({
      status: 200,
      message: 'Comment deleted successfully',
      data: null,
    });
  } catch (error) {
    return next(
      error instanceof CodedApiError
        ? error
        : new CodedApiError('FAILED_DELETE_COMMENT', error.message, 500),
    );
  }
}

module.exports = {
  listComments,
  createComment,
  updateComment,
  deleteComment,
};
