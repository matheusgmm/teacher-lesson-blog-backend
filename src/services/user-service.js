const userRepository = require('../repositories/user-repository');
const { CodedApiError } = require('../utils/CodedApiError.util');
const { pick } = require('../utils/helpers.util');

async function findUserByEmail(email) {
  if (!email) {
    throw new CodedApiError('EMAIL_REQUIRED', 'Email is required', 400);
  }

  return userRepository.findByEmail(email);
}

async function findUserById(id) {
  if (!id) {
    throw new CodedApiError('USER_ID_REQUIRED', 'User id is required', 400);
  }

  return userRepository.getUserById(Number(id));
}

const ALLOWED_ROLES = ['ADMIN', 'USER'];

function resolveCreateRole(data, requester) {
  if (!requester) {
    return 'USER';
  }

  // Only admins can create other users
  if (requester.role !== 'ADMIN') {
    throw new CodedApiError(
      'FORBIDDEN',
      'Only admins can create other users',
      403,
    );
  }

  if (data.role === undefined || data.role === null || data.role === '') {
    return 'USER';
  }

  if (!ALLOWED_ROLES.includes(data.role)) {
    throw new CodedApiError('INVALID_ROLE', 'Invalid role', 400);
  }

  return data.role;
}

async function createUser(data, requester = null) {
  const name = String(data.name ?? '').trim();
  const email = String(data.email ?? '').trim().toLowerCase();
  const password = String(data.password ?? '');

  if (!name || !email || !password) {
    throw new CodedApiError("NAME_EMAIL_PASSWORD_REQUIRED", 'Name, email and password are required', 400);
  }

  const emailExists = await findUserByEmail(email);
  if (emailExists) {
    throw new CodedApiError("EMAIL_ALREADY_EXISTS", 'Email already exists', 400);
  }

  const role = resolveCreateRole(data, requester);

  return userRepository.createUser({
    name,
    email,
    password,
    role,
  });
}

async function updateUser(targetId, data, requester) {
  const id = Number(targetId);
  const isSelf = requester.id === id;
  const isAdmin = requester.role === 'ADMIN';

  if (!isSelf && !isAdmin) {
    throw new CodedApiError("UNAUTHORIZED", 'Unauthorized, you are not allowed to update this user', 401);
  }

  const alreadyExists = await findUserById(id);
  if (!alreadyExists || alreadyExists.deleted_at) {
    throw new CodedApiError("USER_NOT_FOUND", 'User not found', 404);
  }

  const allowed = isAdmin
    ? pick(data, ['name', 'email', 'password', 'role'])
    : pick(data, ['name', 'email', 'password']);

  if (allowed.role !== undefined) {
    if (!isAdmin) {
      throw new CodedApiError('FORBIDDEN', 'Only admins can change user role', 403);
    }
    if (!ALLOWED_ROLES.includes(allowed.role)) {
      throw new CodedApiError('INVALID_ROLE', 'Invalid role', 400);
    }
  }

  if (allowed.email !== undefined) {
    allowed.email = String(allowed.email).trim().toLowerCase();
    const emailExists = await findUserByEmail(allowed.email);
    if (emailExists && emailExists.id !== id) {
      throw new CodedApiError("EMAIL_ALREADY_EXISTS", 'Email already exists', 400);
    }
  }

  if (allowed.name !== undefined) {
    allowed.name = String(allowed.name).trim();
  }

  if (allowed.password !== undefined && allowed.password === '') {
    delete allowed.password;
  }

  return userRepository.updateUser(id, allowed);
}


async function deleteUser(targetId, requester) {
  const id = Number(targetId);

  if (!targetId || Number.isNaN(id)) {
    throw new CodedApiError('USER_ID_REQUIRED', 'User id is required', 400);
  }

  const isSelf = requester.id === id;
  const isAdmin = requester.role === 'ADMIN';

  if (!isSelf && !isAdmin) {
    throw new CodedApiError("UNAUTHORIZED", 'Unauthorized, you are not allowed to delete this user', 401);
  }

  if (isSelf) {
    throw new CodedApiError("FORBIDDEN", 'You are not allowed to delete yourself', 403);
  }

  const alreadyExists = await findUserById(id);
  if (!alreadyExists || alreadyExists.deleted_at) {
    throw new CodedApiError("USER_NOT_FOUND", 'User not found', 404);
  }

  if (alreadyExists.role === 'ADMIN') {
    const adminCount = await userRepository.countActiveByRole('ADMIN');
    if (adminCount <= 1) {
      throw new CodedApiError('FORBIDDEN', 'Cannot delete the last administrator', 403);
    }
  }

  return userRepository.deactivateUser(id);
}


async function getUserById(id) {
  const user = await findUserById(Number(id));
  if (!user || user.deleted_at) {
    throw new CodedApiError("USER_NOT_FOUND", 'User not found', 404);
  }
  return user;
}


async function getAllActiveUsers({ search, page = 1, limit = 10 } = {}) {
  return userRepository.getAllActiveUsers({ search, page, limit });
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  getAllActiveUsers
};
