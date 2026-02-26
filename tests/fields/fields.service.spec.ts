import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { FieldsService } from 'src/fields/services/fields.service';
import { CreatePublicFieldDto } from '../../src/fields/dto/input/create-public-field.dto';
import { UpdateFieldDto } from '../../src/fields/dto/input/update-field.dto';
import { PartnersService } from '../../src/partners/partners.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { Sport, StorageFolderName } from '../../src/shared/constants/constants';
import { EmailsService } from '../../src/shared/emails/emails.service';
import { GeolocalisationService } from '../../src/shared/geolocalisation/geolocalisation.service';
import { StorageService } from '../../src/shared/storage/storage.service';

describe('FieldsService', () => {
  let service: FieldsService;
  let prismaService: PrismaService;
  let storageService: StorageService;
  let geolocalisationService: GeolocalisationService;
  let partnersService: PartnersService;
  let logger: PinoLogger;

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

  const mockStorageService = {
    upload: jest.fn(),
  };

  const mockGeolocalisationService = {
    getDetailsFromAddress: jest.fn(),
    getCoordinatesAndShortAddressFromAddress: jest.fn(),
    getLatitudeAndLongitude: jest.fn(),
  };

  const mockPartnersService = {
    findOne: jest.fn(),
  };

  const mockLogger = {
    setContext: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  const mockEmailsService = {
    sendNewFieldAdministrationRequestEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FieldsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: GeolocalisationService, useValue: mockGeolocalisationService },
        { provide: PartnersService, useValue: mockPartnersService },
        { provide: PinoLogger, useValue: mockLogger },
        { provide: EmailsService, useValue: mockEmailsService },
      ],
    }).compile();

    service = module.get<FieldsService>(FieldsService);
    prismaService = module.get<PrismaService>(PrismaService);
    storageService = module.get<StorageService>(StorageService);
    geolocalisationService = module.get<GeolocalisationService>(GeolocalisationService);
    partnersService = module.get<PartnersService>(PartnersService);
    logger = module.get<PinoLogger>(PinoLogger);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a public field with images', async () => {
      const createDto: CreatePublicFieldDto = {
        address: '123 Main St',
        sports: [Sport.FOOTBALL],
        name: 'Test Field',
        images: [
          { file: Buffer.from('test'), name: 'image1.jpg', order: 0 },
          { file: Buffer.from('test2'), name: 'image2.jpg', order: 1 },
        ],
      };

      const coordinates = { lat: 48.8566, lng: 2.3522, shortAddress: '123 Main St' };
      const geoDetails = {
        address: '123 Main St, Paris',
        city: 'Paris',
        country: 'France',
        department: 'Île-de-France',
        latitude: 48.8566,
        longitude: 2.3522,
        shortAddress: '123 Main St',
        zipCode: '75001',
      };
      const newField = {
        uid: 'field-uid-1',
        address: createDto.address,
        sports: createDto.sports,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        shortAddress: coordinates.shortAddress,
        partnerUid: null,
        name: null,
        entryFee: null,
        gameMode: null,
        isVerified: false,
      };

      const fieldImages = [
        { uid: 'img-1', url: 'https://storage/image1.jpg', order: 0 },
        { uid: 'img-2', url: 'https://storage/image2.jpg', order: 1 },
      ];

      mockGeolocalisationService.getDetailsFromAddress.mockResolvedValue(geoDetails);
      mockPrismaService.fields.findFirst.mockResolvedValue(null);
      mockEmailsService.sendNewFieldAdministrationRequestEmail.mockResolvedValue(undefined);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          fields: {
            create: jest.fn().mockResolvedValue(newField),
          },
          fieldImages: {
            create: jest
              .fn()
              .mockResolvedValueOnce(fieldImages[0])
              .mockResolvedValueOnce(fieldImages[1]),
          },
          fieldSports: {
            create: jest.fn().mockResolvedValue({ fieldUid: 'field-uid-1', sport: 'FOOTBALL' }),
          },
        });
      });
      mockStorageService.upload.mockResolvedValue({ data: 'https://storage/image1.jpg' });

      await service.create(createDto);

      expect(mockGeolocalisationService.getDetailsFromAddress).toHaveBeenCalledWith(
        createDto.address,
      );
      expect(mockPrismaService.fields.findFirst).toHaveBeenCalledWith({
        where: {
          address: createDto.address,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          partnerUid: null,
          fieldSports: {
            some: {
              sport: {
                in: createDto.sports,
              },
            },
          },
        },
      });
    });

    it('should throw ConflictException if field location already exists', async () => {
      const createDto: CreatePublicFieldDto = {
        address: '123 Main St',
        sports: [Sport.FOOTBALL],
        name: 'Test Field',
        images: [],
      };

      const geoDetails = {
        address: '123 Main St, Paris',
        city: 'Paris',
        country: 'France',
        department: 'Île-de-France',
        latitude: 48.8566,
        longitude: 2.3522,
        shortAddress: '123 Main St',
        zipCode: '75001',
      };
      const existingField = { uid: 'existing-uid' };

      mockGeolocalisationService.getDetailsFromAddress.mockResolvedValue(geoDetails);
      mockPrismaService.fields.findFirst.mockResolvedValue(existingField);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a field by uid', async () => {
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

      const result = await service.findOne(uid);

      expect(result).toEqual(
        expect.objectContaining({
          uid,
          name: 'Test Field',
          sports: [Sport.FOOTBALL],
          fieldImages: expect.arrayContaining([
            expect.objectContaining({
              url: 'image1.jpg',
              order: 0,
            }),
          ]),
        }),
      );
      expect(mockPrismaService.fields.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { uid },
        }),
      );
    });
  });

  describe('verifyFieldLocation', () => {
    it('should pass if no field exists at location', async () => {
      mockPrismaService.fields.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyFieldLocation(48.8566, 2.3522, '123 Main St', [Sport.FOOTBALL]),
      ).resolves.not.toThrow();

      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should throw ConflictException if field exists at location', async () => {
      const existingField = { uid: 'existing-uid' };
      mockPrismaService.fields.findFirst.mockResolvedValue(existingField);

      await expect(
        service.verifyFieldLocation(48.8566, 2.3522, '123 Main St', [Sport.FOOTBALL]),
      ).rejects.toThrow(ConflictException);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('findAllPublicFields', () => {
    it('should return all public fields without filters', async () => {
      const mockFields = [
        {
          uid: 'field-1',
          name: 'Field 1',
          address: '123 Main St',
          shortAddress: '123 Main St',
          latitude: 48.8566,
          longitude: 2.3522,
          partnerUid: null,
          fieldImages: [{ url: 'image1.jpg', order: 0 }],
          fieldSports: [{ sport: Sport.FOOTBALL }],
        },
        {
          uid: 'field-2',
          name: 'Field 2',
          address: '456 Oak Ave',
          shortAddress: '456 Oak Ave',
          latitude: 48.857,
          longitude: 2.353,
          partnerUid: null,
          fieldImages: [{ url: 'image2.jpg', order: 0 }],
          fieldSports: [{ sport: Sport.BASKETBALL }],
        },
      ];

      mockPrismaService.fields.findMany.mockResolvedValue(mockFields);

      const result = await service.findAllPublicFields({ limit: 10 });

      expect(result).toEqual({
        items: expect.arrayContaining([
          expect.objectContaining({
            uid: 'field-1',
            name: 'Field 1',
            sports: [Sport.FOOTBALL],
          }),
          expect.objectContaining({
            uid: 'field-2',
            name: 'Field 2',
            sports: [Sport.BASKETBALL],
          }),
        ]),
        nextCursor: null,
        totalCount: 2,
      });

      expect(mockPrismaService.fields.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 11,
          where: { partnerUid: null },
          include: {
            fieldImages: { orderBy: { order: 'asc' }, select: { order: true, url: true }, take: 1 },
            fieldSports: { select: { sport: true } },
          },
        }),
      );
    });

    it('should filter by sports', async () => {
      const mockFields = [
        {
          uid: 'field-1',
          name: 'Field 1',
          address: '123 Main St',
          shortAddress: '123 Main St',
          latitude: 48.8566,
          longitude: 2.3522,
          partnerUid: null,
          fieldImages: [{ url: 'image1.jpg', order: 0 }],
          fieldSports: [{ sport: Sport.BASKETBALL }],
        },
      ];

      mockPrismaService.fields.findMany.mockResolvedValue(mockFields);

      const result = await service.findAllPublicFields({
        limit: 10,
        sports: [Sport.BASKETBALL],
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(
        expect.objectContaining({
          uid: 'field-1',
          sports: [Sport.BASKETBALL],
        }),
      );

      expect(mockPrismaService.fields.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 11,
          where: {
            partnerUid: null,
            fieldSports: { some: { sport: { in: [Sport.BASKETBALL] } } },
          },
          include: {
            fieldImages: { orderBy: { order: 'asc' }, select: { order: true, url: true }, take: 1 },
            fieldSports: { select: { sport: true } },
          },
        }),
      );
    });

    it('should filter by search term', async () => {
      const mockFields = [
        {
          uid: 'field-1',
          name: 'Stade de France',
          address: '123 Main St',
          shortAddress: '123 Main St',
          latitude: 48.8566,
          longitude: 2.3522,
          partnerUid: null,
          fieldImages: [{ url: 'image1.jpg', order: 0 }],
          fieldSports: [{ sport: Sport.FOOTBALL }],
        },
      ];

      mockPrismaService.fields.findMany.mockResolvedValue(mockFields);

      const result = await service.findAllPublicFields({
        limit: 10,
        search: 'Stade',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(
        expect.objectContaining({
          uid: 'field-1',
          name: 'Stade de France',
        }),
      );

      expect(mockPrismaService.fields.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 11,
          where: {
            partnerUid: null,
            OR: [
              { name: { contains: 'Stade', mode: 'insensitive' } },
              { address: { contains: 'Stade', mode: 'insensitive' } },
            ],
          },
          include: {
            fieldImages: { orderBy: { order: 'asc' }, select: { order: true, url: true }, take: 1 },
            fieldSports: { select: { sport: true } },
          },
        }),
      );
    });

    it('should handle cursor-based pagination', async () => {
      const mockFields = [
        {
          uid: 'field-2',
          name: 'Field 2',
          address: '456 Oak Ave',
          shortAddress: '456 Oak Ave',
          latitude: 48.857,
          longitude: 2.353,
          partnerUid: null,
          fieldImages: [{ url: 'image2.jpg', order: 0 }],
          fieldSports: [{ sport: Sport.BASKETBALL }],
        },
        {
          uid: 'field-3',
          name: 'Field 3',
          address: '789 Pine St',
          shortAddress: '789 Pine St',
          latitude: 48.858,
          longitude: 2.354,
          partnerUid: null,
          fieldImages: [{ url: 'image3.jpg', order: 0 }],
          fieldSports: [{ sport: Sport.FOOTBALL }],
        },
      ];

      mockPrismaService.fields.findMany.mockResolvedValue(mockFields);

      const result = await service.findAllPublicFields({
        limit: 10,
        cursor: 'field-1',
      });

      expect(result.items).toHaveLength(2);

      expect(mockPrismaService.fields.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 11,
          skip: 1,
          cursor: { uid: 'field-1' },
          where: { partnerUid: null },
          include: {
            fieldImages: { orderBy: { order: 'asc' }, select: { order: true, url: true }, take: 1 },
            fieldSports: { select: { sport: true } },
          },
        }),
      );
    });

    it('should return nextCursor when more items exist', async () => {
      const mockFields = [
        {
          uid: 'field-1',
          name: 'Field 1',
          address: '123 Main St',
          shortAddress: '123 Main St',
          latitude: 48.8566,
          longitude: 2.3522,
          partnerUid: null,
          fieldImages: [{ url: 'image1.jpg', order: 0 }],
          fieldSports: [{ sport: Sport.FOOTBALL }],
        },
        {
          uid: 'field-2',
          name: 'Field 2',
          address: '456 Oak Ave',
          shortAddress: '456 Oak Ave',
          latitude: 48.857,
          longitude: 2.353,
          partnerUid: null,
          fieldImages: [{ url: 'image2.jpg', order: 0 }],
          fieldSports: [{ sport: Sport.BASKETBALL }],
        },
        {
          uid: 'field-3',
          name: 'Field 3',
          address: '789 Pine St',
          shortAddress: '789 Pine St',
          latitude: 48.858,
          longitude: 2.354,
          partnerUid: null,
          fieldImages: [{ url: 'image3.jpg', order: 0 }],
          fieldSports: [{ sport: Sport.FOOTBALL }],
        },
      ];

      mockPrismaService.fields.findMany.mockResolvedValue(mockFields);

      const result = await service.findAllPublicFields({ limit: 2 });

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBe('field-3');
      expect(result.totalCount).toBe(2);

      expect(mockPrismaService.fields.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 3,
          where: { partnerUid: null },
          include: {
            fieldImages: { orderBy: { order: 'asc' }, select: { order: true, url: true }, take: 1 },
            fieldSports: { select: { sport: true } },
          },
        }),
      );
    });

    it('should combine multiple filters', async () => {
      const mockFields = [
        {
          uid: 'field-1',
          name: 'Stade de Basket',
          address: '123 Main St',
          shortAddress: '123 Main St',
          latitude: 48.8566,
          longitude: 2.3522,
          partnerUid: null,
          fieldImages: [{ url: 'image1.jpg', order: 0 }],
          fieldSports: [{ sport: Sport.BASKETBALL }],
        },
      ];

      mockPrismaService.fields.findMany.mockResolvedValue(mockFields);

      const result = await service.findAllPublicFields({
        limit: 10,
        sports: [Sport.BASKETBALL],
        search: 'Basket',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(
        expect.objectContaining({
          uid: 'field-1',
          name: 'Stade de Basket',
          sports: [Sport.BASKETBALL],
        }),
      );

      expect(mockPrismaService.fields.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 11,
          where: {
            partnerUid: null,
            fieldSports: { some: { sport: { in: [Sport.BASKETBALL] } } },
            OR: [
              { name: { contains: 'Basket', mode: 'insensitive' } },
              { address: { contains: 'Basket', mode: 'insensitive' } },
            ],
          },
          include: {
            fieldImages: { orderBy: { order: 'asc' }, select: { order: true, url: true }, take: 1 },
            fieldSports: { select: { sport: true } },
          },
        }),
      );
    });

    it('should return empty array when no fields found', async () => {
      mockPrismaService.fields.findMany.mockResolvedValue([]);

      const result = await service.findAllPublicFields({ limit: 10 });

      expect(result).toEqual({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });
    });
  });
});
