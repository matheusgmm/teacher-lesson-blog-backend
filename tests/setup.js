jest.mock('../src/config/prisma', () => ({
  prisma: {
    user: {},
    post: {},
    comment: {},
    authToken: {},
    $disconnect: jest.fn(),
  },
}));
