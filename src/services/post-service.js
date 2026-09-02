const { CodedApiError } = require('../utils/CodedApiError.util');
const { resolveCreatedAtFilter } = require('../utils/date-filter.util');
const postRepository = require('../repositories/post-repository');



async function createPost(data, requesterId) {
    if (!data.title || !data.description) {
        throw new CodedApiError("TITLE_DESCRIPTION_REQUIRED", 'Title and description are required', 400);
    }
    return postRepository.createPost(data, requesterId);
}

// open to all users
async function getAllActivePosts({ search, from, to, page = 1, limit = 10 } = {}) {
    const createdAt = resolveCreatedAtFilter(from, to);
    return postRepository.getAllActivePosts({ search, createdAt, page, limit });
}

// open to all users
async function getActivePostById(id) {
    return postRepository.getActivePostById(id);
}

async function updatePost(targetId, data, requester) {

    const id = Number(targetId);
    if (!id) {
        throw new CodedApiError("POST_ID_REQUIRED", 'Post id is required', 400);
    }

    if (!data.title && !data.description) {
        throw new CodedApiError("TITLE_DESCRIPTION_REQUIRED", 'At least one of title or description is required', 400);
    }

    const post = await postRepository.getActivePostById(id);

    if (!post || post.deleted_at) {
        throw new CodedApiError("POST_NOT_FOUND", 'Post not found', 404);
    }

    if (post.user_id !== requester.id) {
        throw new CodedApiError("FORBIDDEN", 'You are not allowed to update this post', 403);
    }

    return postRepository.updatePost(id, data);
}

async function deletePost(id) {
    if (!id) {
        throw new CodedApiError("POST_ID_REQUIRED", 'Post id is required', 400);
    }

    return postRepository.deletePost(id);
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