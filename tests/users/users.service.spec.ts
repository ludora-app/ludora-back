import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Sex, Provider } from 'generated/prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailsService } from 'src/shared/emails/emails.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { UsersService } from 'src/users/users.service';
import { PinoLogger } from 'nestjs-pino';
import { VerificationCodeUtil } from 'src/shared/utils/verification-code.utils';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  verify: jest.fn().mockResolvedValue(true),
}));

jest.mock('src/shared/utils/verification-code.utils', () => ({
  VerificationCodeUtil: {
    generateVerificationCode: jest.fn().mockReturnValue('123456'),
  },
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
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockStorageService = {
    upload: jest.fn(),
    getSignedUrl: jest.fn(),
  };

  const mockEmailsService = {
    sendEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    fatal: jest.fn(),
    trace: jest.fn(),
    child: jest.fn(),
    setContext: jest.fn(),
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
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: EmailsService,
          useValue: mockEmailsService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    module.get<PrismaService>(PrismaService);
    module.get<StorageService>(StorageService);
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
      mockStorageService.upload.mockResolvedValueOnce({
        data: 'image-url',
      });

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.users.create).toHaveBeenCalled();
      expect(result.firstname).toBe('John');
      expect(result.lastname).toBe('Doe');
    });

    it('should throw ConflictException if user already exists', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce({ uid: '1' });

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
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

    // todo: fix this test
    // it('should handle null user from database', async () => {
    //   mockPrismaService.users.findUnique.mockResolvedValueOnce(null);
    //   mockImagesService.getProfilePic.mockResolvedValueOnce('');

    //   const select = {
    //     active: true,
    //     bio: true,
    //     birthdate: true,
    //     email: true,
    //     firstname: true,
    //     uid: true,
    //     imageUrl: true,
    //     lastname: true,
    //     name: true,
    //     phone: true,
    //     sex: true,
    //     type: true,
    //   };

    //   // The current implementation will throw TypeError when trying to access null.uid
    //   await expect(service.findOne('1', select)).rejects.toThrow(TypeError);
    // });
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

      expect(result).toBeUndefined();
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
        provider: 'LUDORA',
      });
      mockPrismaService.users.update.mockResolvedValueOnce({
        uid: '1',
        firstname: 'John',
        email: 'test@test.com',
      });

      const result = await service.updatePassword('1', updatePasswordDto);

      expect(result).toBeUndefined();
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

      expect(result).toBeUndefined();
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

      expect(result).toBeUndefined();
      expect(mockPrismaService.users.delete).toHaveBeenCalledWith({
        where: { uid: '1' },
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

  describe('sendCodeForPasswordReset', () => {
    it('should send password reset code successfully', async () => {
      const mockUser = {
        uid: '1',
        firstname: 'John',
        email: 'test@test.com',
      };

      mockPrismaService.users.findUnique.mockResolvedValueOnce(mockUser);

      await service.sendCodeForPasswordReset('1', 'test@test.com');

      expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith({
        where: { uid: '1' },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.emailVerification.deleteMany).toHaveBeenCalledWith({
        where: { userUid: '1' },
      });
      expect(mockPrismaService.emailVerification.create).toHaveBeenCalledWith({
        data: {
          code: '123456',
          expiresAt: expect.any(Date),
          userUid: '1',
        },
      });
      expect(mockEmailsService.sendEmail).toHaveBeenCalledWith({
        data: { code: '123456', name: 'John' },
        recipients: ['test@test.com'],
        template: 'passwordResetRequest',
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(null);

      await expect(service.sendCodeForPasswordReset('1', 'test@test.com')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockEmailsService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('updatePasswordRequest', () => {
    it('should initiate password reset request successfully', async () => {
      const mockUser = {
        uid: '1',
        firstname: 'John',
        email: 'test@test.com',
        provider: Provider.LUDORA,
      };

      // Mock for findOne call
      mockPrismaService.users.findUnique.mockResolvedValueOnce(mockUser);
      // Mock for sendCodeForPasswordReset call
      mockPrismaService.users.findUnique.mockResolvedValueOnce(mockUser);

      await service.updatePasswordRequest('1');

      expect(mockPrismaService.users.findUnique).toHaveBeenCalled();
      expect(mockEmailsService.sendEmail).toHaveBeenCalledWith({
        data: { code: '123456', name: 'John' },
        recipients: ['test@test.com'],
        template: 'passwordResetRequest',
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(null);

      await expect(service.updatePasswordRequest('1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is GOOGLE provider', async () => {
      const mockUser = {
        uid: '1',
        firstname: 'John',
        email: 'test@test.com',
        provider: 'GOOGLE',
      };

      mockPrismaService.users.findUnique.mockResolvedValueOnce(mockUser);

      await expect(service.updatePasswordRequest('1')).rejects.toThrow(BadRequestException);
      expect(mockEmailsService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('changeForgottenPassword', () => {
    const forgottenPasswordDto = {
      newPassword: 'newPassword123',
      verificationCode: '123456',
    };

    it('should change forgotten password successfully', async () => {
      const mockUser = {
        uid: '1',
        firstname: 'John',
        email: 'test@test.com',
      };

      const mockVerificationCode = {
        uid: 'verification-uid',
        code: '123456',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes in future
        userUid: '1',
      };

      mockPrismaService.users.findUnique.mockResolvedValueOnce(mockUser);
      mockPrismaService.emailVerification.findFirst.mockResolvedValueOnce(mockVerificationCode);
      mockPrismaService.users.update.mockResolvedValueOnce({
        ...mockUser,
        password: 'hashedPassword',
      });

      await service.changeForgottenPassword('1', forgottenPasswordDto);

      expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith({
        where: { uid: '1' },
      });
      expect(mockPrismaService.emailVerification.findFirst).toHaveBeenCalledWith({
        where: { code: '123456', userUid: '1' },
      });
      expect(argon2.hash).toHaveBeenCalledWith('newPassword123');
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        data: { password: 'hashedPassword' },
        where: { uid: '1' },
      });
      expect(mockPrismaService.emailVerification.delete).toHaveBeenCalledWith({
        where: { uid: 'verification-uid' },
      });
      expect(mockEmailsService.sendEmail).toHaveBeenCalledWith({
        data: { name: 'John' },
        recipients: ['test@test.com'],
        template: 'passwordReset',
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(null);

      await expect(service.changeForgottenPassword('1', forgottenPasswordDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.emailVerification.findFirst).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if verification code not found', async () => {
      const mockUser = {
        uid: '1',
        firstname: 'John',
        email: 'test@test.com',
      };

      mockPrismaService.users.findUnique.mockResolvedValueOnce(mockUser);
      mockPrismaService.emailVerification.findFirst.mockResolvedValueOnce(null);

      await expect(service.changeForgottenPassword('1', forgottenPasswordDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.users.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if verification code is expired', async () => {
      const mockUser = {
        uid: '1',
        firstname: 'John',
        email: 'test@test.com',
      };

      const mockVerificationCode = {
        uid: 'verification-uid',
        code: '123456',
        expiresAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes in past (expired)
        userUid: '1',
      };

      mockPrismaService.users.findUnique.mockResolvedValueOnce(mockUser);
      mockPrismaService.emailVerification.findFirst.mockResolvedValueOnce(mockVerificationCode);

      await expect(service.changeForgottenPassword('1', forgottenPasswordDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.users.update).not.toHaveBeenCalled();
    });
  });
});
