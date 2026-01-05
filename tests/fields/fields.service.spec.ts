import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { FieldsService } from '../../src/fields/fields.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { StorageService } from '../../src/shared/storage/storage.service';
import { GeolocalisationService } from '../../src/shared/geolocalisation/geolocalisation.service';
import { PartnersService } from '../../src/partners/partners.service';
import { Sport, StorageFolderName } from '../../src/shared/constants/constants';
import { CreatePublicFieldDto } from '../../src/fields/dto/input/create-public-field.dto';
import { UpdateFieldDto } from '../../src/fields/dto/input/update-field.dto';

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
    getSignedUrl: jest.fn(),
  };

  const mockGeolocalisationService = {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FieldsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: GeolocalisationService, useValue: mockGeolocalisationService },
        { provide: PartnersService, useValue: mockPartnersService },
        { provide: PinoLogger, useValue: mockLogger },
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
        sport: Sport.FOOTBALL,
        name: 'Test Field',
        images: [
          { file: Buffer.from('test'), name: 'image1.jpg', order: 0 },
          { file: Buffer.from('test2'), name: 'image2.jpg', order: 1 },
        ],
      };

      const coordinates = { lat: 48.8566, lng: 2.3522, shortAddress: '123 Main St' };
      const newField = {
        uid: 'field-uid-1',
        address: createDto.address,
        sport: createDto.sport,
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

      mockGeolocalisationService.getCoordinatesAndShortAddressFromAddress.mockResolvedValue(
        coordinates,
      );
      mockPrismaService.fields.findFirst.mockResolvedValue(null);
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
        });
      });
      mockStorageService.upload.mockResolvedValue({ data: 'https://storage/image1.jpg' });

      await service.create(createDto);

      expect(
        mockGeolocalisationService.getCoordinatesAndShortAddressFromAddress,
      ).toHaveBeenCalledWith(createDto.address);
      expect(mockPrismaService.fields.findFirst).toHaveBeenCalledWith({
        where: {
          address: createDto.address,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          partnerUid: null,
          sport: createDto.sport,
        },
      });
    });

    it('should throw ConflictException if field location already exists', async () => {
      const createDto: CreatePublicFieldDto = {
        address: '123 Main St',
        sport: Sport.FOOTBALL,
        name: 'Test Field',
        images: [],
      };

      const coordinates = { lat: 48.8566, lng: 2.3522, shortAddress: '123 Main St' };
      const existingField = { uid: 'existing-uid' };

      mockGeolocalisationService.getCoordinatesAndShortAddressFromAddress.mockResolvedValue(
        coordinates,
      );
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
        sport: Sport.FOOTBALL,
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
          sport: Sport.FOOTBALL,
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
        service.verifyFieldLocation(48.8566, 2.3522, '123 Main St', Sport.FOOTBALL),
      ).resolves.not.toThrow();

      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should throw ConflictException if field exists at location', async () => {
      const existingField = { uid: 'existing-uid' };
      mockPrismaService.fields.findFirst.mockResolvedValue(existingField);

      await expect(
        service.verifyFieldLocation(48.8566, 2.3522, '123 Main St', Sport.FOOTBALL),
      ).rejects.toThrow(ConflictException);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
