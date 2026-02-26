import { Test, TestingModule } from '@nestjs/testing';
import { PartnersService } from 'src/partners/partners.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';

describe('PartnersService', () => {
  let service: PartnersService;

  const mockPrismaService = {
    partners: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockGeolocalisationService = {
    getDetailsFromAddress: jest.fn(),
    getCoordinatesAndShortAddressFromAddress: jest.fn(),
    getLatitudeAndLongitude: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartnersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: GeolocalisationService,
          useValue: mockGeolocalisationService,
        },
      ],
    }).compile();

    service = module.get<PartnersService>(PartnersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
