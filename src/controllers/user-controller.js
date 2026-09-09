const { getUserByToken } = require('../utils/Token.util');
const { toUserResponse, toPaginatedResponse } = require('../utils/helpers.util');
const { CodedApiError } = require('../utils/CodedApiError.util');
const userService = require('../services/user-service');

async function createUser(req, res, next) {
    try {
        const requester = await getUserByToken(req.headers.authorization?.split(' ')[1]);
        if (!requester) {
            throw new CodedApiError('UNAUTHORIZED', 'Unauthorized', 401);
        }

        const user = await userService.createUser(req.body, requester);

        return res.status(201).json({
            status: 201,
            message: 'User created successfully',
            data: toUserResponse(user),
        });
    } catch (error) {
        return next(
            error instanceof CodedApiError
                ? error
                : new CodedApiError('CREATE_USER_FAILED', error.message, 500),
        );
    }
}

async function updateUser(req, res, next) {
    try {
        const data = req.body;
        const requester = await getUserByToken(req.headers.authorization?.split(' ')[1]);
        if (!requester) {
            throw new CodedApiError("UNAUTHORIZED", 'Unauthorized', 401);
        }

        const target = req.params.id || requester.id;
        const user = await userService.updateUser(target, data, requester);

        return res.status(200).json({
            status: 200,
            message: 'User updated successfully',
            data: toUserResponse(user),
        });

    } catch (error) {
        return next(
            error instanceof CodedApiError
                ? error
                : new CodedApiError('UPDATE_USER_FAILED', error.message, 500),
        );
    }
}

async function deleteUser(req, res, next) {
    try {
        const requester = await getUserByToken(req.headers.authorization?.split(' ')[1]);
        if (!requester) {
            throw new CodedApiError('UNAUTHORIZED', 'Unauthorized', 401);
        }

        const targetId = req.params.id || req.query.id;
        if (!targetId) {
            throw new CodedApiError('USER_ID_REQUIRED', 'User id is required', 400);
        }

        await userService.deleteUser(targetId, requester);

        return res.status(200).json({
            status: 200,
            message: 'User deleted successfully',
            data: null,
        });
    } catch (error) {
        return next(
            error instanceof CodedApiError
                ? error
                : new CodedApiError('DELETE_USER_FAILED', error.message, 500),
        );
    }
}

async function getUserById(req, res, next) {
    try {
        const id = req.params.id || req.query.id;
        if (!id) {
            throw new CodedApiError('USER_ID_REQUIRED', 'User id is required', 400);
        }
        const user = await userService.getUserById(id);
        return res.status(200).json({
            status: 200,
            message: 'User fetched successfully',
            data: toUserResponse(user),
        });
    }
    catch (error) {
        return next(
            error instanceof CodedApiError
                ? error
                : new CodedApiError('GET_USER_FAILED', error.message, 500),
        );
    }
}

async function getAllActiveUsers(req, res, next) {
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const search = req.query.search?.trim() || '';
        const result = await userService.getAllActiveUsers({ search, page, limit });

        return res.status(200).json({
            status: 200,
            message: 'Users fetched successfully',
            ...toPaginatedResponse(result, toUserResponse),
        });
    }
    catch (error) {
        return next(
            error instanceof CodedApiError
                ? error
                : new CodedApiError('GET_USERS_FAILED', error.message, 500),
        );
    }
}

module.exports = { createUser, updateUser, deleteUser, getUserById, getAllActiveUsers };
