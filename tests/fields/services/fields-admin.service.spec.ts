import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
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
      update: jest.fn(),
      delete: jest.fn(),
    },
    fieldSports: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockGeolocalisationService = {
    getGeocodeFromAddress: jest.fn(),
    getDetailsFromAddress: jest.fn(),
  };

  const mockStorageService = {
    upload: jest.fn(),
    deleteFile: jest.fn(),
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
          useValue: mockGeolocalisationService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: PinoLogger,
          useValue: {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            setContext: jest.fn(),
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

  describe('update', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should update a field successfully', async () => {
      const uid = 'field-uid-1';
      const dto = {
        name: 'Updated Name',
        sports: [Sport.FOOTBALL, Sport.BASKETBALL],
        address: 'New Address',
        status: 'APPROVED' as any,
        images: [
          {
            uid: 'img-1',
            url: 'https://example.com/fields/img-1.jpg',
            order: 0,
            status: 'APPROVED' as any,
          }, // to keep
          { name: 'new-img.jpg', order: 1, file: Buffer.from('test'), status: 'APPROVED' as any }, // to add
        ],
      };

      const existingField = {
        uid,
        name: 'Old Name',
        address: 'Old Address',
        fieldSports: [{ sport: Sport.FOOTBALL }],
        fieldImages: [
          {
            uid: 'img-1',
            url: 'https://example.com/fields/img-1.jpg',
            order: 0,
            status: 'PENDING',
          },
          {
            uid: 'img-2',
            url: 'https://example.com/fields/img-2.jpg',
            order: 1,
            status: 'PENDING',
          }, // to delete
        ],
      };

      const geoDetails = {
        city: 'Paris',
        country: 'France',
        department: '75',
        latitude: 48.8566,
        longitude: 2.3522,
        zipCode: '75001',
      };

      mockPrismaService.fields.findUnique.mockResolvedValue(existingField);
      mockGeolocalisationService.getDetailsFromAddress.mockResolvedValue(geoDetails);
      mockStorageService.upload.mockResolvedValue({
        data: 'https://example.com/fields/new-img.jpg',
      });

      mockPrismaService.fields.update.mockResolvedValue({
        ...existingField,
        ...geoDetails,
        name: dto.name,
      });

      const result = await service.update(uid, dto as any);

      expect(mockPrismaService.fields.findUnique).toHaveBeenCalledWith({
        where: { uid },
        include: expect.any(Object),
      });

      // sports
      expect(mockPrismaService.fieldSports.createMany).toHaveBeenCalledWith({
        data: [{ fieldUid: uid, sport: Sport.BASKETBALL }],
      });

      // geo
      expect(mockGeolocalisationService.getDetailsFromAddress).toHaveBeenCalledWith(dto.address);

      // images to delete
      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('fields/img-2.jpg');
      expect(mockPrismaService.fieldImages.delete).toHaveBeenCalledWith({
        where: { uid: 'img-2' },
      });

      // images to update
      expect(mockPrismaService.fieldImages.update).toHaveBeenCalledWith({
        where: { uid: 'img-1' },
        data: { order: 0, status: 'APPROVED' },
      });

      // images to add
      expect(mockStorageService.upload).toHaveBeenCalledWith(
        'fields',
        'new-img.jpg',
        expect.any(Buffer),
      );
      expect(mockPrismaService.fieldImages.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          url: 'https://example.com/fields/new-img.jpg',
          fieldUid: uid,
        }),
      });

      // field update
      expect(mockPrismaService.fields.update).toHaveBeenCalledWith({
        where: { uid },
        data: expect.objectContaining({ name: 'Updated Name', address: 'New Address' }),
        include: expect.any(Object),
      });

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if field does not exist', async () => {
      mockPrismaService.fields.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid-uid', {} as any)).rejects.toThrow('Field not found');
    });
  });
});
