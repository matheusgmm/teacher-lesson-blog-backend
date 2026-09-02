const { CodedApiError } = require('../utils/CodedApiError.util');
const { getUserByToken } = require('../utils/Token.util');
const { toPostResponse, toPaginatedResponse } = require('../utils/helpers.util');
const postService = require('../services/post-service');


async function createPost(req, res, next) {
    try {
        const data = req.body;
        const requester = await getUserByToken(req.headers.authorization?.split(' ')[1]);
        if (!requester) {
            throw new CodedApiError('UNAUTHORIZED', 'Unauthorized', 401);
        }
        const result = await postService.createPost(data, requester.id);

        return res.status(201).json({
            status: 201,
            message: "Post created successfully",
            data: toPostResponse(result),
        });

    } catch (error) {
        return next(
            error instanceof CodedApiError
                ? error
                : new CodedApiError('FAILED_CREATE_POST', error.message, 500),
        );
    }
}


async function updatePost(req, res, next) {
    try {
        const targetId = req.params.id || req.query.id;
        const data = req.body;
        const requester = await getUserByToken(req.headers.authorization?.split(' ')[1]);
        if (!requester) {
            throw new CodedApiError('UNAUTHORIZED', 'Unauthorized', 401);
        }

        if (!targetId) {
            throw new CodedApiError('POST_ID_REQUIRED', 'Post id is required', 400);
        }

        const result = await postService.updatePost(targetId, data, requester);

        return res.status(200).json({
            status: 200,
            message: "Post updated successfully",
            data: toPostResponse(result),
        });
    } catch (error) {
        return next(error instanceof CodedApiError
                ? error
                : new CodedApiError('FAILED_UPDATE_POST', error.message, 500),
        );
    }
}

async function deletePost(req, res, next) {
    try {
        const targetId = req.params.id || req.query.id;
        if (!targetId) {
            throw new CodedApiError('POST_ID_REQUIRED', 'Post id is required', 400);
        }

        await postService.deletePost(targetId);

        return res.status(200).json({
            status: 200,
            message: "Post deleted successfully",
            data: null,
        });
    } catch (error) {
        return next(
            error instanceof CodedApiError
                ? error
                : new CodedApiError('FAILED_DELETE_POST', error.message, 500),
        );
    }
}

async function getActivePostById(req, res, next) {
    try {
        const id = req.params.id || req.query.id;
        const result = await postService.getActivePostById(id);

        return res.status(200).json({
            status: 200,
            message: "Post fetched successfully",
            data: toPostResponse(result),
        });
    } catch (error) {
        return next(
            error instanceof CodedApiError
                ? error
                : new CodedApiError('FAILED_GET_POST', error.message, 500),
        );
    }
}

async function getAllActivePosts(req, res, next) {
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const search = req.query.search?.trim() || '';

        const from = String(req.query.from || '').trim();
        const to = String(req.query.to || '').trim();

        const result = await postService.getAllActivePosts({
            search,
            from: from || undefined,
            to: to || undefined,
            page,
            limit,
        });

        return res.status(200).json({
            status: 200,
            message: "Posts fetched successfully",
            ...toPaginatedResponse(result, toPostResponse),
        });
    } catch (error) {
        return next(
            error instanceof CodedApiError
                ? error
                : new CodedApiError('FAILED_GET_POSTS', error.message, 500),
        );
    }
}


module.exports = {
    getAllActivePosts,
    getActivePostById,
    createPost,
    updatePost,
    deletePost,
};
