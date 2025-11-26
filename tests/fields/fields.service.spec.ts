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
import { UpdatePrivateFieldDto } from '../../src/fields/dto/input/update-private-field.dto';

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
        images: [
          { file: Buffer.from('test'), name: 'image1.jpg', order: 0 },
          { file: Buffer.from('test2'), name: 'image2.jpg', order: 1 },
        ],
      };

      const coordinates = { lat: 48.8566, lng: 2.3522 };
      const newField = {
        uid: 'field-uid-1',
        address: createDto.address,
        sport: createDto.sport,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
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

      mockGeolocalisationService.getLatitudeAndLongitude.mockResolvedValue(coordinates);
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

      const result = await service.create(createDto);

      expect(result).toEqual({ ...newField, fieldImages: expect.any(Array) });
      expect(mockGeolocalisationService.getLatitudeAndLongitude).toHaveBeenCalledWith(
        createDto.address,
      );
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
        images: [],
      };

      const coordinates = { lat: 48.8566, lng: 2.3522 };
      const existingField = { uid: 'existing-uid' };

      mockGeolocalisationService.getLatitudeAndLongitude.mockResolvedValue(coordinates);
      mockPrismaService.fields.findFirst.mockResolvedValue(existingField);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('findAllVerified', () => {
    it('should return paginated verified fields', async () => {
      const filter = {
        limit: 2,
        sports: [Sport.FOOTBALL],
      };

      const mockFields = [
        {
          uid: 'field-1',
          name: 'Field 1',
          address: 'Address 1',
          sport: Sport.FOOTBALL,
          latitude: 48.8566,
          longitude: 2.3522,
          gameMode: null,
          fieldImages: [],
        },
        {
          uid: 'field-2',
          name: 'Field 2',
          address: 'Address 2',
          sport: Sport.FOOTBALL,
          latitude: 48.8567,
          longitude: 2.3523,
          gameMode: null,
          fieldImages: [],
        },
      ];

      mockPrismaService.fields.findMany.mockResolvedValue(mockFields);

      const result = await service.findAllVerified(filter);

      expect(result).toEqual({
        items: mockFields,
        nextCursor: null,
        totalCount: 2,
      });
      expect(mockPrismaService.fields.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 3,
          where: expect.objectContaining({
            isVerified: true,
            sport: { in: [Sport.FOOTBALL] },
          }),
        }),
      );
    });

    it('should handle cursor pagination', async () => {
      const filter = {
        limit: 10,
        cursor: 'field-cursor-uid',
      };

      mockPrismaService.fields.findMany.mockResolvedValue([]);

      await service.findAllVerified(filter);

      expect(mockPrismaService.fields.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { uid: 'field-cursor-uid' },
          skip: 1,
        }),
      );
    });

    it('should filter by location and distance', async () => {
      const filter = {
        limit: 10,
        latitude: 48.8566,
        longitude: 2.3522,
        maxDistance: 5,
      };

      mockPrismaService.fields.findMany.mockResolvedValue([]);

      await service.findAllVerified(filter);

      expect(mockPrismaService.fields.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('findAllByPartnerUid', () => {
    it('should return fields for a specific partner', async () => {
      const partnerUid = 'partner-uid-1';
      const filter = { limit: 10 };

      const mockPartner = { uid: partnerUid, name: 'Partner 1' };
      const mockFields = [
        {
          uid: 'field-1',
          name: 'Partner Field',
          address: 'Address 1',
          sport: Sport.FOOTBALL,
          latitude: 48.8566,
          longitude: 2.3522,
          gameMode: null,
          fieldImages: [],
        },
      ];

      mockPartnersService.findOne.mockResolvedValue(mockPartner);
      mockPrismaService.fields.findMany.mockResolvedValue(mockFields);

      const result = await service.findAllByPartnerUid(partnerUid, filter);

      expect(result).toEqual({
        items: mockFields,
        nextCursor: null,
        totalCount: 1,
      });
      expect(mockPartnersService.findOne).toHaveBeenCalledWith(partnerUid);
      expect(mockPrismaService.fields.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ partnerUid }),
        }),
      );
    });

    it('should throw NotFoundException if partner does not exist', async () => {
      const partnerUid = 'non-existent';
      const filter = { limit: 10 };

      mockPartnersService.findOne.mockResolvedValue(null);

      await expect(service.findAllByPartnerUid(partnerUid, filter)).rejects.toThrow(
        NotFoundException,
      );
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
        fieldImages: [],
      };

      mockPrismaService.fields.findUnique.mockResolvedValue(mockField);

      const result = await service.findOne(uid);

      expect(result).toEqual(mockField);
      expect(mockPrismaService.fields.findUnique).toHaveBeenCalledWith({
        include: {
          fieldImages: {
            select: {
              order: true,
              uid: true,
              url: true,
            },
          },
        },
        where: { uid },
      });
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

  describe('updatePublicField', () => {
    it('should update a public field without address change', async () => {
      const uid = 'field-uid-1';
      const updateDto: UpdateFieldDto = {
        name: 'Updated Field Name',
      };

      const existingField = {
        uid,
        name: 'Old Name',
        address: '123 Main St',
        sport: Sport.FOOTBALL,
        latitude: 48.8566,
        longitude: 2.3522,
        isVerified: false,
        fieldImages: [],
      };

      mockPrismaService.fields.findUnique.mockResolvedValue(existingField);
      mockPrismaService.fields.update.mockResolvedValue({ ...existingField, ...updateDto });

      await service.updatePublicField(uid, updateDto);

      expect(mockPrismaService.fields.update).toHaveBeenCalledWith({
        data: {
          address: undefined,
          isVerified: undefined,
          latitude: existingField.latitude,
          longitude: existingField.longitude,
          name: updateDto.name,
        },
        where: { uid },
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(`Field ${uid} updated successfully`);
    });

    it('should update a public field with new address', async () => {
      const uid = 'field-uid-1';
      const updateDto: UpdateFieldDto = {
        address: '456 New St',
        name: 'Updated Field',
      };

      const existingField = {
        uid,
        name: 'Old Name',
        address: '123 Main St',
        sport: Sport.FOOTBALL,
        latitude: 48.8566,
        longitude: 2.3522,
        isVerified: false,
        fieldImages: [],
      };

      const newCoordinates = { lat: 48.86, lng: 2.36 };

      mockPrismaService.fields.findUnique.mockResolvedValue(existingField);
      mockGeolocalisationService.getLatitudeAndLongitude.mockResolvedValue(newCoordinates);
      mockPrismaService.fields.findFirst.mockResolvedValue(null);
      mockPrismaService.fields.update.mockResolvedValue({ ...existingField, ...updateDto });

      await service.updatePublicField(uid, updateDto);

      expect(mockGeolocalisationService.getLatitudeAndLongitude).toHaveBeenCalledWith(
        updateDto.address,
      );
      expect(mockPrismaService.fields.update).toHaveBeenCalledWith({
        data: {
          address: updateDto.address,
          isVerified: undefined,
          latitude: newCoordinates.lat,
          longitude: newCoordinates.lng,
          name: updateDto.name,
        },
        where: { uid },
      });
    });

    it('should throw NotFoundException if field does not exist', async () => {
      const uid = 'non-existent';
      const updateDto: UpdateFieldDto = { name: 'Test' };

      mockPrismaService.fields.findUnique.mockResolvedValue(null);

      await expect(service.updatePublicField(uid, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when trying to unverify a verified field', async () => {
      const uid = 'field-uid-1';
      const updateDto: UpdateFieldDto = {
        isVerified: false,
      };

      const existingField = {
        uid,
        name: 'Verified Field',
        address: '123 Main St',
        sport: Sport.FOOTBALL,
        latitude: 48.8566,
        longitude: 2.3522,
        isVerified: true,
        fieldImages: [],
      };

      mockPrismaService.fields.findUnique.mockResolvedValue(existingField);

      await expect(service.updatePublicField(uid, updateDto)).rejects.toThrow(BadRequestException);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'You cannot unverify a field that is already verified',
      );
    });
  });

  describe('updatePartnerField', () => {
    it('should update a partner field', async () => {
      const uid = 'field-uid-1';
      const partnerUid = 'partner-uid-1';
      const updateDto: UpdatePrivateFieldDto = {
        name: 'Updated Partner Field',
        entryFee: 50,
      };

      const existingField = {
        uid,
        partnerUid,
        name: 'Old Name',
        address: '123 Partner St',
        sport: Sport.BASKETBALL,
        latitude: 48.8566,
        longitude: 2.3522,
        isVerified: false,
        entryFee: 30,
        fieldImages: [],
      };

      const existingPartner = { uid: partnerUid, name: 'Partner 1' };

      mockPrismaService.fields.findUnique.mockResolvedValue(existingField);
      mockPartnersService.findOne.mockResolvedValue(existingPartner);
      mockPrismaService.fields.update.mockResolvedValue({ ...existingField, ...updateDto });

      await service.updatePartnerField(uid, partnerUid, updateDto);

      expect(mockPrismaService.fields.update).toHaveBeenCalledWith({
        data: {
          address: undefined,
          entryFee: updateDto.entryFee,
          gameMode: undefined,
          isVerified: undefined,
          latitude: existingField.latitude,
          longitude: existingField.longitude,
          name: updateDto.name,
        },
        where: { uid },
      });
    });

    it('should throw NotFoundException if field does not exist', async () => {
      const uid = 'non-existent';
      const partnerUid = 'partner-uid-1';
      const updateDto: UpdatePrivateFieldDto = { name: 'Test' };

      mockPrismaService.fields.findUnique.mockResolvedValue(null);

      await expect(service.updatePartnerField(uid, partnerUid, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if partner does not exist', async () => {
      const uid = 'field-uid-1';
      const partnerUid = 'non-existent';
      const updateDto: UpdatePrivateFieldDto = { name: 'Test' };

      const existingField = {
        uid,
        partnerUid: 'other-partner',
        name: 'Field',
        fieldImages: [],
      };

      mockPrismaService.fields.findUnique.mockResolvedValue(existingField);
      mockPartnersService.findOne.mockResolvedValue(null);

      await expect(service.updatePartnerField(uid, partnerUid, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if field is not associated with partner', async () => {
      const uid = 'field-uid-1';
      const partnerUid = 'partner-uid-1';
      const updateDto: UpdatePrivateFieldDto = { name: 'Test' };

      const existingField = {
        uid,
        partnerUid: 'different-partner-uid',
        name: 'Field',
        fieldImages: [],
      };

      const existingPartner = { uid: partnerUid, name: 'Partner 1' };

      mockPrismaService.fields.findUnique.mockResolvedValue(existingField);
      mockPartnersService.findOne.mockResolvedValue(existingPartner);

      await expect(service.updatePartnerField(uid, partnerUid, updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update partner field with new address', async () => {
      const uid = 'field-uid-1';
      const partnerUid = 'partner-uid-1';
      const updateDto: UpdatePrivateFieldDto = {
        address: '789 New Partner St',
      };

      const existingField = {
        uid,
        partnerUid,
        name: 'Partner Field',
        address: '123 Old St',
        sport: Sport.BASKETBALL,
        latitude: 48.8566,
        longitude: 2.3522,
        isVerified: false,
        fieldImages: [],
      };

      const existingPartner = { uid: partnerUid, name: 'Partner 1' };
      const newCoordinates = { lat: 48.87, lng: 2.37 };

      mockPrismaService.fields.findUnique.mockResolvedValue(existingField);
      mockPartnersService.findOne.mockResolvedValue(existingPartner);
      mockGeolocalisationService.getLatitudeAndLongitude.mockResolvedValue(newCoordinates);
      mockPrismaService.fields.findFirst.mockResolvedValue(null);
      mockPrismaService.fields.update.mockResolvedValue({ ...existingField, ...updateDto });

      await service.updatePartnerField(uid, partnerUid, updateDto);

      expect(mockGeolocalisationService.getLatitudeAndLongitude).toHaveBeenCalledWith(
        updateDto.address,
      );
      expect(mockPrismaService.fields.update).toHaveBeenCalledWith({
        data: {
          address: updateDto.address,
          entryFee: undefined,
          gameMode: undefined,
          isVerified: undefined,
          latitude: newCoordinates.lat,
          longitude: newCoordinates.lng,
          name: undefined,
        },
        where: { uid },
      });
    });
  });
});
