import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { FieldsController } from '../../src/fields/fields.controller';
import { FieldsService } from '../../src/fields/fields.service';
import { AuthB2CGuard } from '../../src/auth-b2c/guards/auth-b2c.guard';
import { AuthB2BGuard } from '../../src/auth-b2b/guards/auth-b2b.guard';
import { Sport } from '../../src/shared/constants/constants';
import { CreatePublicFieldDto } from '../../src/fields/dto/input/create-public-field.dto';
import { UpdateFieldDto } from '../../src/fields/dto/input/update-field.dto';
import { UpdatePrivateFieldDto } from '../../src/fields/dto/input/update-private-field.dto';
import { FieldFilterDto } from '../../src/fields/dto/input/field-filter.dto';

describe('FieldsController', () => {
  let controller: FieldsController;
  let service: FieldsService;

  const mockFieldsService = {
    create: jest.fn(),
    findAllVerified: jest.fn(),
    findAllByPartnerUid: jest.fn(),
    findOne: jest.fn(),
    updatePublicField: jest.fn(),
    updatePartnerField: jest.fn(),
  };

  const mockAuthB2CGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockAuthB2BGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FieldsController],
      providers: [
        {
          provide: FieldsService,
          useValue: mockFieldsService,
        },
      ],
    })
      .overrideGuard(AuthB2CGuard)
      .useValue(mockAuthB2CGuard)
      .overrideGuard(AuthB2BGuard)
      .useValue(mockAuthB2BGuard)
      .compile();

    controller = module.get<FieldsController>(FieldsController);
    service = module.get<FieldsService>(FieldsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new field with images', async () => {
      const createFieldDto: Omit<CreatePublicFieldDto, 'images'> = {
        address: '123 Main St',
        sport: Sport.FOOTBALL,
      };

      const mockFiles = [
        {
          buffer: Buffer.from('test1'),
          originalname: 'image1.jpg',
        } as Express.Multer.File,
        {
          buffer: Buffer.from('test2'),
          originalname: 'image2.jpg',
        } as Express.Multer.File,
      ];

      const mockCreatedField = {
        uid: 'field-uid-1',
        address: '123 Main St',
        sport: Sport.FOOTBALL,
        latitude: 48.8566,
        longitude: 2.3522,
        name: null,
        partnerUid: null,
        entryFee: null,
        gameMode: null,
        isVerified: false,
        fieldImages: [
          { uid: 'img-1', url: 'https://storage/image1.jpg', order: 0 },
          { uid: 'img-2', url: 'https://storage/image2.jpg', order: 1 },
        ],
      };

      mockFieldsService.create.mockResolvedValue(mockCreatedField);

      const result = await controller.create(createFieldDto, mockFiles);

      expect(result).toEqual({
        data: mockCreatedField,
        message: 'Field created successfully',
      });
      expect(mockFieldsService.create).toHaveBeenCalledWith({
        ...createFieldDto,
        images: [
          { file: mockFiles[0].buffer, name: mockFiles[0].originalname, order: 0 },
          { file: mockFiles[1].buffer, name: mockFiles[1].originalname, order: 1 },
        ],
      });
    });

    it('should create a field without images', async () => {
      const createFieldDto: Omit<CreatePublicFieldDto, 'images'> = {
        address: '123 Main St',
        sport: Sport.BASKETBALL,
      };

      const mockCreatedField = {
        uid: 'field-uid-2',
        address: '123 Main St',
        sport: Sport.BASKETBALL,
        latitude: 48.8566,
        longitude: 2.3522,
        name: null,
        partnerUid: null,
        entryFee: null,
        gameMode: null,
        isVerified: false,
        fieldImages: [],
      };

      mockFieldsService.create.mockResolvedValue(mockCreatedField);

      const result = await controller.create(createFieldDto, []);

      expect(result).toEqual({
        data: mockCreatedField,
        message: 'Field created successfully',
      });
      expect(mockFieldsService.create).toHaveBeenCalledWith({
        ...createFieldDto,
        images: [],
      });
    });
  });

  describe('findAllVerified', () => {
    it('should return paginated verified fields', async () => {
      const filter: FieldFilterDto = {
        limit: 10,
        sports: [Sport.FOOTBALL],
      };

      const mockResponse = {
        items: [
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
        ],
        nextCursor: null,
        totalCount: 1,
      };

      mockFieldsService.findAllVerified.mockResolvedValue(mockResponse);

      const result = await controller.findAllVerified(filter);

      expect(result).toEqual({
        data: mockResponse,
        message: 'Fields fetched successfully',
      });
      expect(mockFieldsService.findAllVerified).toHaveBeenCalledWith(filter);
    });

    it('should handle empty results', async () => {
      const filter: FieldFilterDto = {
        limit: 10,
      };

      const mockResponse = {
        items: [],
        nextCursor: null,
        totalCount: 0,
      };

      mockFieldsService.findAllVerified.mockResolvedValue(mockResponse);

      const result = await controller.findAllVerified(filter);

      expect(result).toEqual({
        data: mockResponse,
        message: 'Fields fetched successfully',
      });
    });

    it('should handle cursor pagination', async () => {
      const filter: FieldFilterDto = {
        limit: 10,
        cursor: 'field-cursor-uid',
      };

      const mockResponse = {
        items: [
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
        ],
        nextCursor: 'field-3',
        totalCount: 1,
      };

      mockFieldsService.findAllVerified.mockResolvedValue(mockResponse);

      const result = await controller.findAllVerified(filter);

      expect(result.data.nextCursor).toBe('field-3');
      expect(mockFieldsService.findAllVerified).toHaveBeenCalledWith(filter);
    });
  });

  describe('findAllByPartnerUid', () => {
    it('should return fields for a specific partner', async () => {
      const partnerUid = 'partner-uid-1';
      const filter: FieldFilterDto = {
        limit: 10,
      };

      const mockRequest = {
        user: {
          organisationUid: partnerUid,
        },
      } as any;

      const mockResponse = {
        items: [
          {
            uid: 'field-1',
            name: 'Partner Field',
            address: 'Partner Address',
            sport: Sport.FOOTBALL,
            latitude: 48.8566,
            longitude: 2.3522,
            gameMode: null,
            fieldImages: [],
          },
        ],
        nextCursor: null,
        totalCount: 1,
      };

      mockFieldsService.findAllByPartnerUid.mockResolvedValue(mockResponse);

      const result = await controller.findAllByPartnerUid(mockRequest, filter);

      expect(result).toEqual({
        data: mockResponse,
        message: 'Fields fetched successfully',
      });
      expect(mockFieldsService.findAllByPartnerUid).toHaveBeenCalledWith(partnerUid, filter);
    });

    it('should handle filters for partner fields', async () => {
      const partnerUid = 'partner-uid-1';
      const filter: FieldFilterDto = {
        limit: 5,
        sports: [Sport.BASKETBALL],
        name: 'Court',
      };

      const mockRequest = {
        user: {
          organisationUid: partnerUid,
        },
      } as any;

      const mockResponse = {
        items: [],
        nextCursor: null,
        totalCount: 0,
      };

      mockFieldsService.findAllByPartnerUid.mockResolvedValue(mockResponse);

      await controller.findAllByPartnerUid(mockRequest, filter);

      expect(mockFieldsService.findAllByPartnerUid).toHaveBeenCalledWith(partnerUid, filter);
    });
  });

  describe('findOne', () => {
    it('should return a single field by uid', async () => {
      const uid = 'field-uid-1';
      const mockField = {
        uid,
        name: 'Test Field',
        address: '123 Main St',
        sport: Sport.FOOTBALL,
        latitude: 48.8566,
        longitude: 2.3522,
        partnerUid: null,
        entryFee: null,
        gameMode: null,
        isVerified: true,
        fieldImages: [{ uid: 'img-1', url: 'https://storage/image1.jpg', order: 0 }],
      };

      mockFieldsService.findOne.mockResolvedValue(mockField);

      const result = await controller.findOne(uid);

      expect(result).toEqual({
        data: mockField,
        message: 'Field fetched successfully',
      });
      expect(mockFieldsService.findOne).toHaveBeenCalledWith(uid);
    });

    it('should throw NotFoundException if field does not exist', async () => {
      const uid = 'non-existent-uid';

      mockFieldsService.findOne.mockResolvedValue(null);

      await expect(controller.findOne(uid)).rejects.toThrow(NotFoundException);
      expect(mockFieldsService.findOne).toHaveBeenCalledWith(uid);
    });
  });

  describe('updatePublicField', () => {
    it('should update a public field', async () => {
      const uid = 'field-uid-1';
      const updateDto: UpdateFieldDto = {
        name: 'Updated Field Name',
        address: '456 New St',
      };

      mockFieldsService.updatePublicField.mockResolvedValue(undefined);

      const result = await controller.updatePublicField(uid, updateDto);

      expect(result).toBeUndefined();
      expect(mockFieldsService.updatePublicField).toHaveBeenCalledWith(uid, updateDto);
    });

    it('should update only name', async () => {
      const uid = 'field-uid-1';
      const updateDto: UpdateFieldDto = {
        name: 'Just Name Update',
      };

      mockFieldsService.updatePublicField.mockResolvedValue(undefined);

      await controller.updatePublicField(uid, updateDto);

      expect(mockFieldsService.updatePublicField).toHaveBeenCalledWith(uid, updateDto);
    });

    it('should update verification status', async () => {
      const uid = 'field-uid-1';
      const updateDto: UpdateFieldDto = {
        isVerified: true,
      };

      mockFieldsService.updatePublicField.mockResolvedValue(undefined);

      await controller.updatePublicField(uid, updateDto);

      expect(mockFieldsService.updatePublicField).toHaveBeenCalledWith(uid, updateDto);
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

      const mockRequest = {
        user: {
          organisationUid: partnerUid,
        },
      } as any;

      mockFieldsService.updatePartnerField.mockResolvedValue(undefined);

      const result = await controller.updatePartnerField(mockRequest, uid, updateDto);

      expect(result).toBeUndefined();
      expect(mockFieldsService.updatePartnerField).toHaveBeenCalledWith(uid, partnerUid, updateDto);
    });

    it('should update entry fee and game mode', async () => {
      const uid = 'field-uid-1';
      const partnerUid = 'partner-uid-1';
      const updateDto: UpdatePrivateFieldDto = {
        entryFee: 100,
        gameMode: 'COMPETITIVE' as any,
      };

      const mockRequest = {
        user: {
          organisationUid: partnerUid,
        },
      } as any;

      mockFieldsService.updatePartnerField.mockResolvedValue(undefined);

      await controller.updatePartnerField(mockRequest, uid, updateDto);

      expect(mockFieldsService.updatePartnerField).toHaveBeenCalledWith(uid, partnerUid, updateDto);
    });

    it('should update address for partner field', async () => {
      const uid = 'field-uid-1';
      const partnerUid = 'partner-uid-1';
      const updateDto: UpdatePrivateFieldDto = {
        address: '789 Partner St',
      };

      const mockRequest = {
        user: {
          organisationUid: partnerUid,
        },
      } as any;

      mockFieldsService.updatePartnerField.mockResolvedValue(undefined);

      await controller.updatePartnerField(mockRequest, uid, updateDto);

      expect(mockFieldsService.updatePartnerField).toHaveBeenCalledWith(uid, partnerUid, updateDto);
    });

    it('should update verification status for partner field', async () => {
      const uid = 'field-uid-1';
      const partnerUid = 'partner-uid-1';
      const updateDto: UpdatePrivateFieldDto = {
        isVerified: true,
      };

      const mockRequest = {
        user: {
          organisationUid: partnerUid,
        },
      } as any;

      mockFieldsService.updatePartnerField.mockResolvedValue(undefined);

      await controller.updatePartnerField(mockRequest, uid, updateDto);

      expect(mockFieldsService.updatePartnerField).toHaveBeenCalledWith(uid, partnerUid, updateDto);
    });
  });
});
