const bcrypt = require('bcryptjs');
const { CodedApiError } = require('../utils/CodedApiError.util');
const { toUserResponse } = require('../utils/helpers.util');
const { getUserByToken } = require('../utils/Token.util');
const userService = require('../services/user-service');
const authTokenService = require('../services/auth-token-service');

async function register(req, res, next) {
    try {
        const { name, email, password, role } = req.body;
        const rawToken = req.headers.authorization?.split(' ')[1]?.trim();

        const requester = rawToken ? await getUserByToken(rawToken) : null;

        const user = await userService.createUser(
            { name, email, password, role },
            requester,
        );

        return res.status(201).json({
            status: 201,
            message: 'User created successfully',
            data: toUserResponse(user),
        });
    } catch (error) {
        return next(
            error instanceof CodedApiError
                ? error
                : new CodedApiError('REGISTER_FAILED', error.message, 500),
        );
    }
}

async function login(req, res, next) {
    try {
        const { email, password, rememberMe } = req.body;

        if (!email || !password) {
            throw new CodedApiError("INVALID_CREDENTIALS", 'Invalid login credentials', 400);
        }

        const user = await userService.findUserByEmail(email);
        if (!user || user.deleted_at) {
            throw new CodedApiError("INVALID_CREDENTIALS", 'Invalid login credentials', 401);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new CodedApiError("INVALID_CREDENTIALS", 'Invalid login credentials', 401);
        }

        const token = await authTokenService.createToken({
            owner_id: user.id,
            role: user.role,
            remember_me: rememberMe || false,
        });

        return res.status(200).json({
            status: 200,
            message: 'Login successful',
            data: {
                user: toUserResponse(user),
                token: token.token,
            },
        });
    } catch (error) {
        return next(
            error instanceof CodedApiError
                ? error
                : new CodedApiError('LOGIN_FAILED', error.message, 500),
        );
    }
}

async function logout(req, res, next) {
    try {
        const rawToken = req.headers.authorization?.split(' ')[1] || req.body.token;
        const token = rawToken?.trim();
        if (!token) {
            throw new CodedApiError("TOKEN_REQUIRED", 'Token is required', 400);
        }

        await authTokenService.deleteToken(token);

        return res.status(200).json({
            status: 200,
            message: 'Logout successful',
        });
    } catch (error) {
        return next(
            error instanceof CodedApiError
                ? error
                : new CodedApiError('LOGOUT_FAILED', error.message, 500),
        );
    }
}

module.exports = { register, login, logout };
