const { prisma } = require('../config/prisma');
const {
  generateToken,
  generateRememberMeToken,
  getExpirationDate,
} = require('../utils/Token.util');

async function createAuthToken(data) {
  const rememberMe = Boolean(data.rememberMe ?? data.remember_me);
  const token = rememberMe
    ? generateRememberMeToken(data.owner_id, data.role)
    : generateToken(data.owner_id, data.role);

  return prisma.authToken.create({
    data: {
      token,
      owner_id: data.owner_id,
      expires_at: getExpirationDate(rememberMe),
      remember_me: rememberMe,
    },
  });
}

async function deleteAuthToken(token) {
  return prisma.authToken.delete({
    where: { token },
  });
}

async function findToken(token) {
  return prisma.authToken.findUnique({
    where: { token },
    select: {
      id: true,
      token: true,
      owner_id: true,
      remember_me: true,
      expires_at: true,
      created_at: true,
      updated_at: true,
    },
  });
}

module.exports = {
  createAuthToken,
  deleteAuthToken,
  findToken,
};
