import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Sex } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
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
    },
  };

  const mockImagesService = {
    createUserImage: jest.fn(),
    getProfilePic: jest.fn(),
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
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    module.get<PrismaService>(PrismaService);
    module.get<ImagesService>(ImagesService);
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
        id: '1',
        ...createUserDto,
      });
      mockImagesService.createUserImage.mockResolvedValueOnce({
        data: 'image-url',
      });

      const result = await service.createUser(createUserDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.users.create).toHaveBeenCalled();
      expect(result.firstname).toBe('john');
      expect(result.lastname).toBe('doe');
    });

    it('should throw ConflictException if user already exists', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce({ id: '1' });

      await expect(service.createUser(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      const mockUser = {
        email: 'test@test.com',
        firstname: 'John',
        id: '1',
      };
      const select = {
        bio: true,
        firstname: true,
        id: true,
        image_url: true,
        lastname: true,
        name: true,
      };

      mockPrismaService.users.findUnique.mockResolvedValueOnce(mockUser);
      mockImagesService.getProfilePic.mockResolvedValueOnce('image-url');

      const result = await service.findOne('1', select);

      expect(result.data).toBeDefined();
      expect(result.status).toBe(200);
      expect(result.data.image_url).toBe('image-url');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(null);

      const select = {
        active: true,
        bio: true,
        birthdate: true,
        email: true,
        firstname: true,
        id: true,
        image_url: true,
        lastname: true,
        name: true,
        phone: true,
        sex: true,
        type: true,
      };
      await expect(service.findOne('1', select)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePassword', () => {
    const updatePasswordDto = {
      newPassword: 'newPassword',
      oldPassword: 'oldPassword',
    };

    it('should update password successfully', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce({
        id: '1',
        password: 'hashedOldPassword',
      });
      mockPrismaService.users.update.mockResolvedValueOnce({ id: '1' });

      const result = await service.updatePassword('1', updatePasswordDto);

      expect(result.message).toBe('User password updated successfully');
      expect(mockPrismaService.users.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if old password is invalid', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce({
        id: '1',
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
      mockPrismaService.users.findUnique.mockResolvedValueOnce({ id: '1' });
      mockPrismaService.users.update.mockResolvedValueOnce({
        active: false,
        id: '1',
      });

      const result = await service.deactivate('1');

      expect(result).toEqual({
        message: 'User 1 has been deactivated',
        status: 200,
      });
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        data: { active: false },
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(null);

      await expect(service.deactivate('1')).rejects.toThrow(NotFoundException);
    });
  });
});
