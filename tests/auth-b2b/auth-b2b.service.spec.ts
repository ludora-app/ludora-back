import * as argon2 from 'argon2';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserType } from 'generated/prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { AuthB2BService } from '../../src/auth-b2b/auth-b2b.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UsersService } from '../../src/users/users.service';
import { PartnersService } from '../../src/partners/partners.service';
import { GeolocalisationService } from '../../src/shared/geolocalisation/geolocalisation.service';

describe('AuthB2BService', () => {
  let service: AuthB2BService;
  let usersService: UsersService;
  let partnersService: PartnersService;
  let jwtService: JwtService;
  let prismaService: PrismaService;

  const mockUsersService = {
    findOneByEmail: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockPartnersService = {
    findOneByEmail: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('development'),
  };

  const mockGeolocalisationService = {
    getLatitudeAndLongitude: jest.fn(),
  };

  const mockPrismaService = {
    $transaction: jest.fn(),
    userTokens: {
      create: jest.fn(),
    },
    refreshTokens: {
      create: jest.fn(),
    },
  };

  const mockPinoLogger = {
    setContext: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthB2BService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: PartnersService,
          useValue: mockPartnersService,
        },
        {
          provide: GeolocalisationService,
          useValue: mockGeolocalisationService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PinoLogger,
          useValue: mockPinoLogger,
        },
      ],
    }).compile();

    service = module.get<AuthB2BService>(AuthB2BService);
    usersService = module.get<UsersService>(UsersService);
    partnersService = module.get<PartnersService>(PartnersService);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto = {
      email: 'partner@test.com',
      password: 'Password123!',
    };

    const mockUser = {
      uid: 'user-123',
      email: 'partner@test.com',
      password: '$argon2id$v=19$m=65536,t=3,p=4$hashedpassword',
      type: UserType.PARTNER,
      firstname: 'John',
      lastname: 'Doe',
    };

    const mockPartner = {
      uid: 'partner-123',
      email: 'partner@test.com',
      name: 'Test Partner',
      address: '123 Main St',
      phone: '+33612345678',
    };

    it('should login successfully and return tokens', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      mockPartnersService.findOneByEmail.mockResolvedValue(mockPartner);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);
      mockJwtService.sign
        .mockReturnValueOnce('mock_access_token')
        .mockReturnValueOnce('mock_refresh_token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
      });
      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith('partner@test.com');
      expect(mockPartnersService.findOneByEmail).toHaveBeenCalledWith('partner@test.com');
      expect(argon2.verify).toHaveBeenCalledWith(mockUser.password, loginDto.password);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        1,
        {
          uid: mockUser.uid,
          organisationUid: mockPartner.uid,
        },
        { expiresIn: '1d' },
      );
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        2,
        {
          uid: mockUser.uid,
          organisationUid: mockPartner.uid,
        },
        { expiresIn: '7d' },
      );
    });

    it('should login successfully with deviceUid', async () => {
      const loginDtoWithDevice = {
        ...loginDto,
        deviceUid: 'device-123',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      mockPartnersService.findOneByEmail.mockResolvedValue(mockPartner);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);
      mockJwtService.sign
        .mockReturnValueOnce('mock_access_token')
        .mockReturnValueOnce('mock_refresh_token');

      const result = await service.login(loginDtoWithDevice);

      expect(result).toEqual({
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
      });
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        1,
        {
          uid: mockUser.uid,
          organisationUid: mockPartner.uid,
          deviceUid: 'device-123',
        },
        { expiresIn: '1d' },
      );
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        2,
        {
          uid: mockUser.uid,
          organisationUid: mockPartner.uid,
          deviceUid: 'device-123',
        },
        { expiresIn: '7d' },
      );
    });

    it('should format email to lowercase', async () => {
      const loginDtoUpperCase = {
        email: 'PARTNER@TEST.COM',
        password: 'Password123!',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      mockPartnersService.findOneByEmail.mockResolvedValue(mockPartner);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);
      mockJwtService.sign
        .mockReturnValueOnce('mock_access_token')
        .mockReturnValueOnce('mock_refresh_token');

      await service.login(loginDtoUpperCase);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith('partner@test.com');
      expect(mockPartnersService.findOneByEmail).toHaveBeenCalledWith('PARTNER@TEST.COM');
    });

    it('should throw NotFoundException when user is not found', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith('partner@test.com');
      expect(mockPartnersService.findOneByEmail).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user is not a PARTNER', async () => {
      const nonPartnerUser = {
        ...mockUser,
        type: UserType.USER,
      };

      mockUsersService.findOneByEmail.mockResolvedValue(nonPartnerUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith('partner@test.com');
      expect(mockPartnersService.findOneByEmail).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when partner is not found', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      mockPartnersService.findOneByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith('partner@test.com');
      expect(mockPartnersService.findOneByEmail).toHaveBeenCalledWith('partner@test.com');
    });

    it('should throw NotFoundException when password is invalid', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      mockPartnersService.findOneByEmail.mockResolvedValue(mockPartner);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(argon2.verify).toHaveBeenCalledWith(mockUser.password, loginDto.password);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should log error when user is not found', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(NotFoundException);
      expect(mockPinoLogger.error).toHaveBeenCalledWith(
        `User not found with email ${loginDto.email}`,
      );
    });

    it('should log error when user is not a partner', async () => {
      const nonPartnerUser = {
        ...mockUser,
        type: UserType.USER,
      };

      mockUsersService.findOneByEmail.mockResolvedValue(nonPartnerUser);

      await expect(service.login(loginDto)).rejects.toThrow(NotFoundException);
      expect(mockPinoLogger.error).toHaveBeenCalledWith(
        `User is not a partner with email ${loginDto.email} and user uid ${nonPartnerUser.uid}`,
      );
    });

    it('should log error when partner is not found', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      mockPartnersService.findOneByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(NotFoundException);
      expect(mockPinoLogger.error).toHaveBeenCalledWith(
        `Partner not found with email ${loginDto.email} and user uid ${mockUser.uid}`,
      );
    });
  });
});
