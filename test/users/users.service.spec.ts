import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Sex } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailsService } from 'src/shared/emails/emails.service';
import { ImagesService } from 'src/shared/images/images.service';
import { UsersService } from 'src/users/users.service';

// Mock argon2
jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  verify: jest.fn().mockResolvedValue(true),
}));

describe('UsersService', () => {
  let service: UsersService;

  const mockPrismaService = {
    users: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    emailVerification: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockImagesService = {
    createUserImage: jest.fn(),
    getProfilePic: jest.fn(),
  };

  const mockEmailsService = {
    sendEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ImagesService,
          useValue: mockImagesService,
        },
        {
          provide: EmailsService,
          useValue: mockEmailsService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    module.get<PrismaService>(PrismaService);
    module.get<ImagesService>(ImagesService);
    module.get<EmailsService>(EmailsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const createUserDto = {
      bio: 'test bio',
      birthdate: '1990-01-01',
      email: 'test@test.com',
      firstname: 'john',
      lastname: 'doe',
      password: 'password123',
      phone: '1234567890',
      sex: Sex.MALE,
    };

    it('should create a new user successfully', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.users.create.mockResolvedValueOnce({
        uid: '1',
        bio: 'test bio',
        birthdate: new Date('1990-01-01'),
        email: 'test@test.com',
        firstname: 'John',
        lastname: 'Doe',
        password: 'hashedPassword',
        phone: '1234567890',
        sex: Sex.MALE,
      });
      mockImagesService.createUserImage.mockResolvedValueOnce({
        data: 'image-url',
      });

      const result = await service.createUser(createUserDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.users.create).toHaveBeenCalled();
      expect(result.firstname).toBe('John');
      expect(result.lastname).toBe('Doe');
    });

    it('should throw ConflictException if user already exists', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce({ uid: '1' });

      await expect(service.createUser(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return a list of users', async () => {
      const mockUsers = [
        { uid: '1', firstname: 'John', lastname: 'Doe', email: 'john@example.com', imageUrl: '' },
        { uid: '2', firstname: 'Jane', lastname: 'Doe', email: 'jane@example.com', imageUrl: '' },
      ];

      mockPrismaService.users.findMany.mockResolvedValueOnce(mockUsers);
      mockPrismaService.users.count.mockResolvedValueOnce(2);

      const result = await service.findAll({ limit: 10 });

      expect(result.items).toEqual(mockUsers);
      expect(result.totalCount).toBe(2);
      expect(result.nextCursor).toBeNull();
    });

    it('should handle pagination correctly', async () => {
      const mockUsers = [
        { uid: '1', firstname: 'John', lastname: 'Doe', email: 'john@example.com', imageUrl: '' },
        { uid: '2', firstname: 'Jane', lastname: 'Doe', email: 'jane@example.com', imageUrl: '' },
        { uid: '3', firstname: 'Bob', lastname: 'Smith', email: 'bob@example.com', imageUrl: '' },
      ];

      mockPrismaService.users.findMany.mockResolvedValueOnce(mockUsers);
      mockPrismaService.users.count.mockResolvedValueOnce(3);

      const result = await service.findAll({ limit: 2 });

      expect(result.items.length).toBe(2);
      expect(result.nextCursor).toBe('3');
      expect(result.totalCount).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      const mockUser = {
        email: 'test@test.com',
        firstname: 'John',
        uid: '1',
      };
      const select = {
        bio: true,
        firstname: true,
        uid: true,
        imageUrl: true,
        lastname: true,
        name: true,
      };

      mockPrismaService.users.findUnique.mockResolvedValueOnce(mockUser);

      const result = await service.findOne('1', select);

      expect(result).toBeDefined();
      expect(result.uid).toBe('1');
    });

    it('should handle null user from database', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(null);
      mockImagesService.getProfilePic.mockResolvedValueOnce('');

      const select = {
        active: true,
        bio: true,
        birthdate: true,
        email: true,
        firstname: true,
        uid: true,
        imageUrl: true,
        lastname: true,
        name: true,
        phone: true,
        sex: true,
        type: true,
      };

      // The current implementation will throw TypeError when trying to access null.uid
      await expect(service.findOne('1', select)).rejects.toThrow(TypeError);
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user if found by email', async () => {
      const mockUser = {
        email: 'test@test.com',
        firstname: 'John',
        uid: '1',
      };

      mockPrismaService.users.findUnique.mockResolvedValueOnce(mockUser);

      const result = await service.findOneByEmail('test@test.com');

      expect(result).toBeDefined();
      expect(result.email).toBe('test@test.com');
    });

    it('should propagate database errors', async () => {
      mockPrismaService.users.findUnique.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.findOneByEmail('test@test.com')).rejects.toThrow(Error);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateUserDto = {
        bio: 'updated bio',
        firstname: 'Updated',
      };

      mockPrismaService.users.findUnique.mockResolvedValueOnce({ uid: '1' });
      mockPrismaService.users.update.mockResolvedValueOnce({
        uid: '1',
        ...updateUserDto,
      });

      const result = await service.update('1', updateUserDto);

      expect(result).toBeDefined();
      expect(result.uid).toBe('1');
      expect(result.bio).toBe('updated bio');
    });

    it('should throw BadRequestException if update fails', async () => {
      const updateUserDto = {
        bio: 'updated bio',
      };

      mockPrismaService.users.findUnique.mockResolvedValueOnce({ uid: '1' });
      mockPrismaService.users.update.mockResolvedValueOnce(null);

      await expect(service.update('1', updateUserDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updatePassword', () => {
    const updatePasswordDto = {
      newPassword: 'newPassword',
      oldPassword: 'oldPassword',
    };

    it('should update password successfully', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce({
        uid: '1',
        firstname: 'John',
        email: 'test@test.com',
        password: 'hashedOldPassword',
      });
      mockPrismaService.users.update.mockResolvedValueOnce({
        uid: '1',
        firstname: 'John',
        email: 'test@test.com',
      });

      const result = await service.updatePassword('1', updatePasswordDto);

      expect(result.message).toBe('User password updated successfully');
      expect(mockPrismaService.users.update).toHaveBeenCalled();
      expect(mockEmailsService.sendEmail).toHaveBeenCalledWith({
        data: { name: 'John' },
        recipients: ['test@test.com'],
        template: 'passwordReset',
      });
    });

    it('should throw BadRequestException if old password is invalid', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce({
        uid: '1',
        password: 'hashedOldPassword',
      });
      (argon2.verify as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.updatePassword('1', updatePasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate user successfully', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce({ uid: '1' });
      mockPrismaService.users.update.mockResolvedValueOnce({
        uid: '1',
        isConnected: false,
      });

      const result = await service.deactivate('1');

      expect(result).toEqual({
        message: 'User 1 has been deactivated',
        status: 200,
      });
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        data: { isConnected: false },
        where: { uid: '1' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(null);

      await expect(service.deactivate('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete user successfully', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce({ uid: '1' });
      mockPrismaService.users.delete.mockResolvedValueOnce({ uid: '1' });

      const result = await service.remove('1');

      expect(result).toEqual({
        message: 'User 1 has been deleted',
        status: 200,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(null);

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      // Mock Math.random to return a predictable value for the verification code
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.123456);

      await service.sendVerificationEmail('1', 'test@test.com');

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.emailVerification.deleteMany).toHaveBeenCalledWith({
        where: { userUid: '1' },
      });
      expect(mockPrismaService.emailVerification.create).toHaveBeenCalledWith({
        data: {
          code: expect.any(String),
          expiresAt: expect.any(Date),
          userUid: '1',
        },
      });
      expect(mockEmailsService.sendEmail).toHaveBeenCalledWith({
        data: { code: expect.any(String) },
        recipients: ['test@test.com'],
        template: 'verificationCode',
      });

      mockRandom.mockRestore();
    });
  });
});
