import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { Sport } from 'src/shared/constants/constants';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { FieldsAdminService } from '../../../src/fields/services/fields-admin.service';

describe('FieldsAdminService', () => {
  let service: FieldsAdminService;
  let _prismaService: PrismaService;
  let _geolocalisationService: GeolocalisationService;
  let _storageService: StorageService;

  const mockPrismaService = {
    fields: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    fieldImages: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FieldsAdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: GeolocalisationService,
          useValue: {
            getGeocodeFromAddress: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FieldsAdminService>(FieldsAdminService);
    _prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneForAdmin', () => {
    it('should return a field by uid for admin', async () => {
      const uid = 'field-uid-1';
      const mockField = {
        uid,
        name: 'Test Field',
        address: '123 Main St',
        fieldSports: [{ sport: Sport.FOOTBALL }],
        latitude: 48.8566,
        longitude: 2.3522,
        shortAddress: '123 Main St Short',
        gameMode: null,
        entryFee: null,
        isVerified: true,
        fieldImages: [{ url: 'image1.jpg', order: 0, uid: 'img-1' }],
        partner: {
          uid: 'partner-1',
          rank: 0,
        },
      };

      mockPrismaService.fields.findUnique.mockResolvedValue(mockField);

      const result = await service.findOneForAdmin(uid);

      expect(result).toEqual(
        expect.objectContaining({
          uid,
          name: 'Test Field',
          sports: [Sport.FOOTBALL],
        }),
      );
      expect(mockPrismaService.fields.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { uid },
        }),
      );
    });

    it('should return null if field not found for admin', async () => {
      mockPrismaService.fields.findUnique.mockResolvedValue(null);
      const result = await service.findOneForAdmin('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('findAllFieldsAdmin', () => {
    it('should return all fields for admin', async () => {
      const mockFields = [
        {
          uid: 'field-1',
          name: 'Admin Field 1',
          address: '123 Main St',
          shortAddress: '123 Main St',
          latitude: 48.8566,
          longitude: 2.3522,
          fieldImages: [{ url: 'image1.jpg', order: 0 }],
          fieldSports: [{ sport: Sport.FOOTBALL }],
        },
      ];

      mockPrismaService.fields.findMany.mockResolvedValue(mockFields);

      const result = await service.findAllFieldsAdmin({ limit: 10 } as any);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Admin Field 1');
      expect(mockPrismaService.fields.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 11,
          where: {},
        }),
      );
    });

    it('should filter by status for admin', async () => {
      const mockFields = [];
      mockPrismaService.fields.findMany.mockResolvedValue(mockFields);

      await service.findAllFieldsAdmin({ limit: 10, status: 'PENDING' as any });

      expect(mockPrismaService.fields.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
          }),
        }),
      );
    });
  });
});
