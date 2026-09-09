jest.mock('../../src/repositories/user-repository');

const userRepository = require('../../src/repositories/user-repository');
const userService = require('../../src/services/user-service');
const { CodedApiError } = require('../../src/utils/CodedApiError.util');

describe('user-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a public user always with role USER', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.createUser.mockResolvedValue({
        id: 1,
        name: 'John',
        email: 'john@mail.com',
        role: 'USER',
      });

      const result = await userService.createUser({
        name: 'John',
        email: 'john@mail.com',
        password: '123456',
        role: 'ADMIN', // privilege escalation attempt
      });

      expect(userRepository.createUser).toHaveBeenCalledWith({
        name: 'John',
        email: 'john@mail.com',
        password: '123456',
        role: 'USER',
      });
      expect(result.role).toBe('USER');
    });

    it('should allow an admin to create a user with role ADMIN', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.createUser.mockResolvedValue({
        id: 2,
        name: 'Maria',
        email: 'maria@mail.com',
        role: 'ADMIN',
      });

      await userService.createUser(
        { name: 'Maria', email: 'maria@mail.com', password: '123456', role: 'ADMIN' },
        { id: 1, role: 'ADMIN' },
      );

      expect(userRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'ADMIN' }),
      );
    });

    it('should forbid a regular user from creating another user', async () => {
      await expect(
        userService.createUser(
          { name: 'X', email: 'x@mail.com', password: '123' },
          { id: 2, role: 'USER' },
        ),
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
        statusCode: 403,
      });
    });

    it('should fail when required fields are missing', async () => {
      await expect(userService.createUser({ name: 'Only name' })).rejects.toBeInstanceOf(
        CodedApiError,
      );
    });

    it('should fail when email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: 99, email: 'john@mail.com' });

      await expect(
        userService.createUser({
          name: 'John',
          email: 'john@mail.com',
          password: '123',
        }),
      ).rejects.toMatchObject({ code: 'EMAIL_ALREADY_EXISTS' });
    });
  });

  describe('updateUser', () => {
    const existing = {
      id: 2,
      name: 'Target',
      email: 'target@mail.com',
      role: 'USER',
      deleted_at: null,
    };

    it('should allow self-update without changing role', async () => {
      userRepository.getUserById.mockResolvedValue(existing);
      userRepository.updateUser.mockResolvedValue({ ...existing, name: 'New name' });

      await userService.updateUser(2, { name: 'New name', role: 'ADMIN' }, {
        id: 2,
        role: 'USER',
      });

      expect(userRepository.updateUser).toHaveBeenCalledWith(2, { name: 'New name' });
    });

    it('should forbid a regular user from updating another user', async () => {
      await expect(
        userService.updateUser(3, { name: 'Hack' }, { id: 2, role: 'USER' }),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });
  });

  describe('deleteUser', () => {
    it('should prevent self-deletion', async () => {
      await expect(
        userService.deleteUser(1, { id: 1, role: 'ADMIN' }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('should allow an admin to delete another user', async () => {
      userRepository.getUserById.mockResolvedValue({
        id: 3,
        role: 'USER',
        deleted_at: null,
      });
      userRepository.deactivateUser.mockResolvedValue({ id: 3 });

      await userService.deleteUser(3, { id: 1, role: 'ADMIN' });

      expect(userRepository.deactivateUser).toHaveBeenCalledWith(3);
    });

    it('should prevent deleting the last administrator', async () => {
      userRepository.getUserById.mockResolvedValue({
        id: 3,
        role: 'ADMIN',
        deleted_at: null,
      });
      userRepository.countActiveByRole.mockResolvedValue(1);

      await expect(
        userService.deleteUser(3, { id: 1, role: 'ADMIN' }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
      expect(userRepository.deactivateUser).not.toHaveBeenCalled();
    });
  });
});
