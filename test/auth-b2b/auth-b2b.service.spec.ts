import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthB2BService } from 'src/auth-b2b/auth-b2b.service';
import { PartnersService } from 'src/partners/partners.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';
import { UsersService } from 'src/users/users.service';

describe('AuthB2bService', () => {
  let service: AuthB2BService;

  const mockPrismaService = {
    users: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
    findOneByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockPartnersService = {
    findOneByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockGeolocalisationService = {
    getCoordinatesFromAddress: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock_token'),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
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
      ],
    }).compile();

    service = module.get<AuthB2BService>(AuthB2BService);
    module.get<PrismaService>(PrismaService);
    module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
