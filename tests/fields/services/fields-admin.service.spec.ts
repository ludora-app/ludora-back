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
      create: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
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
    _geolocalisationService = module.get<GeolocalisationService>(GeolocalisationService);
    _storageService = module.get<StorageService>(StorageService);

    jest.clearAllMocks();
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
        creator: null,
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

    it('should handle cursor pagination correctly', async () => {
      mockPrismaService.fields.findMany.mockResolvedValue([]);
      await service.findAllFieldsAdmin({ cursor: 'cursor-uid-1', limit: 10 } as any);

      expect(mockPrismaService.fields.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { uid: 'cursor-uid-1' },
          skip: 1,
        }),
      );
    });

    it('should handle search filtering correctly', async () => {
      mockPrismaService.fields.findMany.mockResolvedValue([]);
      await service.findAllFieldsAdmin({ search: 'nice field' } as any);

      expect(mockPrismaService.fields.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'nice field', mode: 'insensitive' } },
              { address: { contains: 'nice field', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should handle sports filtering correctly', async () => {
      mockPrismaService.fields.findMany.mockResolvedValue([]);
      await service.findAllFieldsAdmin({ sports: [Sport.FOOTBALL, Sport.BASKETBALL] } as any);

      expect(mockPrismaService.fields.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fieldSports: {
              some: {
                sport: {
                  in: [Sport.FOOTBALL, Sport.BASKETBALL],
                },
              },
            },
          }),
        }),
      );
    });

    it('should return nextCursor when fields count exceeds the limit', async () => {
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
        {
          uid: 'field-2',
          name: 'Admin Field 2',
          address: '456 Side St',
          shortAddress: '456 Side St',
          latitude: 48.8566,
          longitude: 2.3522,
          fieldImages: [{ url: 'image2.jpg', order: 0 }],
          fieldSports: [{ sport: Sport.BASKETBALL }],
        },
      ];

      mockPrismaService.fields.findMany.mockResolvedValue(mockFields);

      // Limit is 1, mock returns 2 items (exceeds limit)
      const result = await service.findAllFieldsAdmin({ limit: 1 } as any);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].uid).toBe('field-1');
      expect(result.nextCursor).toBe('field-2');
      expect(result.totalCount).toBe(1);
    });
  });

  describe('update', () => {
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
        partner: null,
        creator: null,
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

    it('should update field with unchanged address without calling geolocalisation service', async () => {
      const uid = 'field-uid-1';
      const dto = {
        name: 'Updated Name',
        address: 'Same Address',
        sports: [Sport.FOOTBALL],
        status: 'APPROVED' as any,
      };

      const existingField = {
        uid,
        name: 'Old Name',
        address: 'Same Address',
        fieldSports: [{ sport: Sport.FOOTBALL }],
        fieldImages: [],
      };

      mockPrismaService.fields.findUnique.mockResolvedValue(existingField);
      mockPrismaService.fields.update.mockResolvedValue({
        ...existingField,
        name: dto.name,
        partner: null,
        creator: null,
      });

      await service.update(uid, dto as any);

      expect(mockGeolocalisationService.getDetailsFromAddress).not.toHaveBeenCalled();
      expect(mockPrismaService.fields.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            address: 'Same Address',
          }),
        }),
      );
    });

    it('should update field successfully when images are undefined', async () => {
      const uid = 'field-uid-1';
      const dto = {
        name: 'Updated Name',
        sports: [Sport.FOOTBALL],
        status: 'APPROVED' as any,
        images: undefined,
      };

      const existingField = {
        uid,
        name: 'Old Name',
        address: 'Same Address',
        fieldSports: [{ sport: Sport.FOOTBALL }],
        fieldImages: [],
      };

      mockPrismaService.fields.findUnique.mockResolvedValue(existingField);
      mockPrismaService.fields.update.mockResolvedValue({
        ...existingField,
        name: dto.name,
        partner: null,
        creator: null,
      });

      await service.update(uid, dto as any);

      expect(mockPrismaService.fieldImages.create).not.toHaveBeenCalled();
      expect(mockPrismaService.fieldImages.update).not.toHaveBeenCalled();
      expect(mockPrismaService.fieldImages.delete).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a field with images and sports successfully', async () => {
      const dto = {
        name: 'Public Field',
        address: '123 Main St',
        sports: [Sport.FOOTBALL],
        images: [
          {
            name: 'field.jpg',
            file: Buffer.from('image-data'),
          },
        ],
      };

      const mockGeoDetails = {
        city: 'Paris',
        country: 'France',
        department: '75',
        latitude: 48.8566,
        longitude: 2.3522,
        zipCode: '75001',
        shortAddress: '123 Main St Short',
      };

      const mockCreatedField = {
        uid: 'new-field-uid',
        name: 'Public Field',
        address: '123 Main St',
        ...mockGeoDetails,
      };

      mockGeolocalisationService.getDetailsFromAddress.mockResolvedValue(mockGeoDetails);
      mockStorageService.upload.mockResolvedValue({ data: 'https://storage/field.jpg' });
      mockPrismaService.fields.create.mockResolvedValue(mockCreatedField);
      mockPrismaService.fieldImages.create.mockResolvedValue({
        uid: 'img-1',
        url: 'https://storage/field.jpg',
      });

      const result = await service.create(dto as any);

      expect(result).toBe('new-field-uid');
      expect(mockGeolocalisationService.getDetailsFromAddress).toHaveBeenCalledWith('123 Main St');
      expect(mockStorageService.upload).toHaveBeenCalledWith(
        'fields',
        'field.jpg',
        expect.any(Buffer),
      );
      expect(mockPrismaService.fields.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          address: '123 Main St',
          city: 'Paris',
          latitude: 48.8566,
          longitude: 2.3522,
        }),
      });
      expect(mockPrismaService.fieldSports.create).toHaveBeenCalledWith({
        data: {
          fieldUid: 'new-field-uid',
          sport: Sport.FOOTBALL,
        },
      });
      expect(mockPrismaService.fieldImages.create).toHaveBeenCalledWith({
        data: {
          fieldUid: 'new-field-uid',
          order: 0,
          url: 'https://storage/field.jpg',
          status: 'APPROVED',
        },
      });
    });

    it('should use provided lat/lng/shortAddress if they are provided', async () => {
      const dto = {
        name: 'Public Field',
        address: '123 Main St',
        sports: [Sport.FOOTBALL],
        lat: 45.0,
        lng: -1.0,
        shortAddress: 'Provided Short Address',
      };

      const mockGeoDetails = {
        city: 'Paris',
        country: 'France',
        department: '75',
        latitude: 48.8566,
        longitude: 2.3522,
        zipCode: '75001',
        shortAddress: '123 Main St Short',
      };

      const mockCreatedField = {
        uid: 'new-field-uid',
        name: 'Public Field',
        address: '123 Main St',
      };

      mockGeolocalisationService.getDetailsFromAddress.mockResolvedValue(mockGeoDetails);
      mockPrismaService.fields.create.mockResolvedValue(mockCreatedField);

      const result = await service.create(dto as any);

      expect(result).toBe('new-field-uid');
      expect(mockPrismaService.fields.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          latitude: 45.0,
          longitude: -1.0,
          shortAddress: 'Provided Short Address',
        }),
      });
    });
  });
});
