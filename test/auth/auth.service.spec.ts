import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User_type, Provider } from '@prisma/client';
import * as argon2 from 'argon2';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    $transaction: jest.fn().mockImplementation((callback) =>
      callback({
        user_tokens: {
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn().mockResolvedValue({ id: '1', token: 'mock_token' }),
          update: jest.fn().mockResolvedValue({ id: '1', token: 'mock_token' }),
          delete: jest.fn().mockResolvedValue({ id: '1' }),
        },
      }),
    ),
    users: {
      findUnique: jest.fn(),
    },
    user_tokens: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: '1', token: 'mock_token' }),
      update: jest.fn().mockResolvedValue({ id: '1', token: 'mock_token' }),
      delete: jest.fn().mockResolvedValue({ id: '1' }),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockUsersService = {
    createGoogleUser: jest.fn(),
    createOrganisation: jest.fn(),
    createUser: jest.fn(),
    findOneByEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    module.get<PrismaService>(PrismaService);
    module.get<JwtService>(JwtService);
    module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        birthdate: new Date().toString(),
        email: 'test@test.com',
        firstname: 'John',
        lastname: 'Doe',
        password: 'password',
        type: User_type.USER,
      };

      const mockUser = { id: '1', ...registerDto };
      mockUsersService.createUser.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock_token');

      const result = await service.register(registerDto);

      expect(result).toEqual({
        data: { access_token: 'mock_token' },
        message: 'User created successfully',
        status: 201,
      });
      expect(mockUsersService.createUser).toHaveBeenCalled();
    });

    it('should register a new organisation', async () => {
      const registerDto = {
        email: 'org@test.com',
        name: 'Test Org',
        password: 'password',
        type: User_type.ORGANISATION,
      };

      const mockOrg = { id: '1', ...registerDto };
      mockUsersService.createOrganisation.mockResolvedValue(mockOrg);
      mockJwtService.sign.mockReturnValue('mock_token');

      const result = await service.register(registerDto);

      expect(result).toEqual({
        data: { access_token: 'mock_token' },
        message: 'User created successfully',
        status: 201,
      });
      expect(mockUsersService.createOrganisation).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const loginDto = {
        email: 'test@test.com',
        password: 'password',
      };

      const hashedPassword = await argon2.hash('password');
      const mockUser = {
        email: loginDto.email,
        id: '1',
        password: hashedPassword,
      };

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock_token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        data: { access_token: 'mock_token' },
        message: 'Token created successfully',
        status: 200,
      });
    });

    it('should throw BadRequestException when user not found', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@test.com', password: 'password' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyEmail', () => {
    it('should return true when email is available', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);

      const result = await service.verifyEmail({ email: 'new@test.com' });

      expect(result).toEqual({
        data: { isAvailable: true },
        message: 'Email is available to use',
      });
    });

    it('should return false when email is already used', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue({ id: '1' });

      const result = await service.verifyEmail({ email: 'existing@test.com' });

      expect(result).toEqual({
        data: { isAvailable: false },
        message: 'Email is already used',
      });
    });
  });

  describe('validateGoogleUser', () => {
    it('should validate and return token for new Google user', async () => {
      const googleUser = {
        email: 'google@test.com',
        firstname: 'Google',
        lastname: 'User',
        provider: Provider.GOOGLE,
      };

      mockPrismaService.users.findUnique.mockResolvedValue(null);
      mockUsersService.createGoogleUser.mockResolvedValue({
        id: '1',
        provider: Provider.GOOGLE,
        ...googleUser,
      });
      mockJwtService.sign.mockReturnValue('mock_token');

      const result = await service.validateGoogleUser(googleUser);

      expect(result).toEqual({ access_token: 'mock_token' });
    });
  });
});
