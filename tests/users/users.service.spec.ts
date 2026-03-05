import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { Provider, Sex } from 'generated/prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailsService } from 'src/shared/emails/emails.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { UsersService } from 'src/users/users.service';

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
    $queryRaw: jest.fn(),
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
    emailVerification: {
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
    },
    friends: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    users: {
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockStorageService = {
    createDefaultProfilePicture: jest
      .fn()
      .mockResolvedValue({ data: 'https://example.com/default-avatar.png' }),
    upload: jest.fn(),
  };

  const mockEmailsService = {
    sendEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockLogger = {
    child: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    info: jest.fn(),
    setContext: jest.fn(),
    trace: jest.fn(),
    warn: jest.fn(),
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
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('') },
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
        bio: 'test bio',
        birthdate: new Date('1990-01-01'),
        email: 'test@test.com',
        firstname: 'John',
        lastname: 'Doe',
        password: 'hashedPassword',
        phone: '1234567890',
        sex: Sex.MALE,
        uid: '1',
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
    const connectedUserUid = 'connected-uid';

    it('should return a list of users', async () => {
      const mockUsers = [
        {
          firstname: 'John',
          imageUrl: '',
          lastname: 'Doe',
          uid: '1',
          userSportPreferences: [
            { level: 3, sport: 'BASKETBALL', uid: 'sp1' },
            { level: 2, sport: 'FOOTBALL', uid: 'sp2' },
          ],
        },
        {
          firstname: 'Jane',
          imageUrl: '',
          lastname: 'Doe',
          uid: '2',
          userSportPreferences: [{ level: 4, sport: 'TENNIS', uid: 'sp3' }],
        },
      ];

      mockPrismaService.users.findUnique.mockResolvedValueOnce({
        city: 'Paris',
        userSportPreferences: [{ level: 3, sport: 'BASKETBALL' }],
      });
      mockPrismaService.$queryRaw.mockResolvedValueOnce([
        { score: 1000, total_count: BigInt(2), uid: '1' },
        { score: 500, total_count: BigInt(2), uid: '2' },
      ]);
      mockPrismaService.users.findMany.mockResolvedValueOnce(mockUsers);

      const result = await service.findAll({ limit: 10 }, connectedUserUid);

      expect(result.items.length).toBe(2);
      expect(result.items[0].uid).toBe('1');
      expect(result.items[0].sportPreferences).toEqual([
        { level: 3, sport: 'BASKETBALL', uid: 'sp1' },
        { level: 2, sport: 'FOOTBALL', uid: 'sp2' },
      ]);
      expect(result.items[1].uid).toBe('2');
      expect(result.items[1].sportPreferences).toEqual([{ level: 4, sport: 'TENNIS', uid: 'sp3' }]);
      expect(result.totalCount).toBe(2);
      expect(result.nextCursor).toBeNull();
    });

    it('should handle pagination correctly', async () => {
      const mockUsers = [
        {
          firstname: 'John',
          imageUrl: '',
          lastname: 'Doe',
          uid: '1',
          userSportPreferences: [{ level: 3, sport: 'BASKETBALL', uid: 'sp1' }],
        },
        {
          firstname: 'Jane',
          imageUrl: '',
          lastname: 'Doe',
          uid: '2',
          userSportPreferences: [{ level: 2, sport: 'FOOTBALL', uid: 'sp2' }],
        },
      ];

      mockPrismaService.users.findUnique.mockResolvedValueOnce({
        city: null,
        userSportPreferences: [{ level: 3, sport: 'BASKETBALL' }],
      });
      mockPrismaService.$queryRaw.mockResolvedValueOnce([
        { score: 1000, total_count: BigInt(3), uid: '1' },
        { score: 500, total_count: BigInt(3), uid: '2' },
        { score: 200, total_count: BigInt(3), uid: '3' },
      ]);
      mockPrismaService.users.findMany.mockResolvedValueOnce(mockUsers);

      const result = await service.findAll({ limit: 2 }, connectedUserUid);

      expect(result.items.length).toBe(2);
      expect(result.nextCursor).toBe('2');
      expect(result.totalCount).toBe(3);
    });

    it('should return empty when connected user has no sports, no city and no name filter', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce({
        city: null,
        userSportPreferences: [],
      });

      const result = await service.findAll({ limit: 10 }, connectedUserUid);

      expect(result.items).toEqual([]);
      expect(result.nextCursor).toBeNull();
      expect(result.totalCount).toBe(0);
      expect(mockPrismaService.$queryRaw).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when connected user does not exist', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(null);

      await expect(service.findAll({ limit: 10 }, 'unknown-uid')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.$queryRaw).not.toHaveBeenCalled();
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
        imageUrl: true,
        lastname: true,
        name: true,
        uid: true,
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
        email: 'test@test.com',
        firstname: 'John',
        password: 'hashedOldPassword',
        provider: 'LUDORA',
        uid: '1',
      });
      mockPrismaService.users.update.mockResolvedValueOnce({
        email: 'test@test.com',
        firstname: 'John',
        uid: '1',
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
        password: 'hashedOldPassword',
        uid: '1',
      });
      (argon2.verify as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.updatePassword('1', updatePasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateEmail', () => {
    it('should update email successfully', async () => {
      const newEmail = 'newemail@test.com';

      mockPrismaService.users.findUnique.mockResolvedValueOnce({
        email: 'oldemail@test.com',
        firstname: 'John',
        uid: '1',
      });
      mockPrismaService.users.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.users.update.mockResolvedValueOnce({
        email: newEmail,
        uid: '1',
      });

      const result = await service.updateEmail('1', newEmail);

      expect(result).toBeUndefined();
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        data: { email: newEmail },
        where: { uid: '1' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const newEmail = 'newemail@test.com';

      mockPrismaService.users.findUnique.mockResolvedValueOnce(null);

      await expect(service.updateEmail('1', newEmail)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if email already exists', async () => {
      const newEmail = 'existing@test.com';

      mockPrismaService.users.findUnique.mockResolvedValueOnce({
        email: 'oldemail@test.com',
        firstname: 'John',
        uid: '1',
      });
      mockPrismaService.users.findUnique.mockResolvedValueOnce({
        email: newEmail,
        firstname: 'Jane',
        uid: '2',
      });

      await expect(service.updateEmail('1', newEmail)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.users.update).not.toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('should deactivate user successfully', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce({ uid: '1' });
      mockPrismaService.users.update.mockResolvedValueOnce({
        isConnected: false,
        uid: '1',
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

  describe('deletionRequest', () => {
    it('should set deletedAt when user has no deletion request', async () => {
      mockPrismaService.users.updateMany.mockResolvedValueOnce({ count: 1 });

      await service.deletionRequest('user-123');

      expect(mockPrismaService.users.updateMany).toHaveBeenCalledWith({
        data: { deletedAt: expect.any(Date) },
        where: { deletedAt: null, uid: 'user-123' },
      });
      expect(mockPrismaService.users.updateMany).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when user already has a deletion request', async () => {
      mockPrismaService.users.updateMany.mockResolvedValueOnce({ count: 0 });

      await expect(service.deletionRequest('user-123')).rejects.toThrow(
        new BadRequestException('User already has a deletion request'),
      );
      expect(mockPrismaService.users.updateMany).toHaveBeenCalledWith({
        data: { deletedAt: expect.any(Date) },
        where: { deletedAt: null, uid: 'user-123' },
      });
    });
  });

  describe('cancelDeletionRequest', () => {
    it('should clear deletedAt when user has a deletion request', async () => {
      mockPrismaService.users.updateMany.mockResolvedValueOnce({ count: 1 });

      await service.cancelDeletionRequest('user-123');

      expect(mockPrismaService.users.updateMany).toHaveBeenCalledWith({
        data: { deletedAt: null },
        where: { deletedAt: { not: null }, uid: 'user-123' },
      });
      expect(mockPrismaService.users.updateMany).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when user has no deletion request', async () => {
      mockPrismaService.users.updateMany.mockResolvedValueOnce({ count: 0 });

      await expect(service.cancelDeletionRequest('user-123')).rejects.toThrow(
        new BadRequestException('User does not have a deletion request'),
      );
      expect(mockPrismaService.users.updateMany).toHaveBeenCalledWith({
        data: { deletedAt: null },
        where: { deletedAt: { not: null }, uid: 'user-123' },
      });
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
        template: 'verificationLink',
      });

      mockRandom.mockRestore();
    });
  });

  describe('sendCodeForPasswordReset', () => {
    it('should send password reset code successfully', async () => {
      const mockUser = {
        email: 'test@test.com',
        firstname: 'John',
        uid: '1',
      };

      await service.sendCodeForPasswordReset(mockUser as any);

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
  });

  describe('sendCodeForPasswordResetRequest', () => {
    it('should initiate password reset request successfully', async () => {
      const mockUser = {
        email: 'test@test.com',
        firstname: 'John',
        provider: Provider.LUDORA,
        uid: '1',
      };

      mockPrismaService.users.findUnique.mockResolvedValueOnce(mockUser);

      await service.sendCodeForPasswordResetRequest('test@test.com');

      expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith({
        select: {
          city: true,
          email: true,
          firstname: true,
          imageUrl: true,
          isEmailVerified: true,
          lastname: true,
          provider: true,
          uid: true,
        },
        where: { email: 'test@test.com' },
      });
      expect(mockEmailsService.sendEmail).toHaveBeenCalledWith({
        data: { code: '123456', name: 'John' },
        recipients: ['test@test.com'],
        template: 'passwordResetRequest',
      });
    });

    it('should return silently and log error if user not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(null);

      await service.sendCodeForPasswordResetRequest('test@test.com');

      expect(mockLogger.error).toHaveBeenCalledWith('User not found for email: test@test.com');
      expect(mockEmailsService.sendEmail).not.toHaveBeenCalled();
    });

    it('should return silently and log error if user is GOOGLE provider', async () => {
      const mockUser = {
        email: 'test@test.com',
        firstname: 'John',
        provider: 'GOOGLE',
        uid: '1',
      };

      mockPrismaService.users.findUnique.mockResolvedValueOnce(mockUser);

      await service.sendCodeForPasswordResetRequest('test@test.com');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'User is a Google user, cannot send password reset code',
      );
      expect(mockEmailsService.sendEmail).not.toHaveBeenCalled();
    });
  });
});
