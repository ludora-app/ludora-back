import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { FieldsController } from '../../src/fields/fields.controller';
import { AuthB2CGuard } from '../../src/auth/guards/auth-b2c.guard';
import { AuthB2BGuard } from '../../src/auth/guards/auth-b2b.guard';
import { Sport } from '../../src/shared/constants/constants';
import { CreatePublicFieldDto } from '../../src/fields/dto/input/create-public-field.dto';
import { UpdateFieldDto } from '../../src/fields/dto/input/update-field.dto';
import { FieldFilterDto } from '../../src/fields/dto/input/field-filter.dto';
import { PublicFieldFilterDto } from '../../src/fields/dto/input/public-field-filter.dto';
import { FieldsService } from 'src/fields/services/fields.service';
import { FieldSlotsService } from 'src/fields/services/field-slots.service';

describe('FieldsController', () => {
  let controller: FieldsController;
  let service: FieldsService;

  const mockFieldsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findAllPublicFields: jest.fn(),
  };

  const mockFieldSlotsService = {
    create: jest.fn(),
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
        {
          provide: FieldSlotsService,
          useValue: mockFieldSlotsService,
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
        sports: [Sport.FOOTBALL],
        name: 'Test Field',
      };

      const mockImages = [
        { buffer: Buffer.from('image1'), originalname: 'image1.jpg' },
        { buffer: Buffer.from('image2'), originalname: 'image2.jpg' },
      ];

      const mockResponse = {
        uid: 'field-uid-1',
        address: '123 Main St',
        sport: Sport.FOOTBALL,
        fieldImages: [],
      };

      mockFieldsService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(createFieldDto, mockImages);

      expect(result).toEqual({
        data: mockResponse,
        message: 'Field created successfully',
      });
      expect(mockFieldsService.create).toHaveBeenCalledWith({
        ...createFieldDto,
        images: [
          { file: mockImages[0].buffer, name: 'image1.jpg', order: 0 },
          { file: mockImages[1].buffer, name: 'image2.jpg', order: 1 },
        ],
      });
    });

    it('should create a new field without images (undefined)', async () => {
      const createFieldDto: Omit<CreatePublicFieldDto, 'images'> = {
        address: '123 Main St',
        sports: [Sport.FOOTBALL],
        name: 'Test Field',
      };

      const mockResponse = {
        uid: 'field-uid-1',
        address: '123 Main St',
        sport: Sport.FOOTBALL,
        fieldImages: [],
      };

      mockFieldsService.create.mockResolvedValue(mockResponse);

      // Call with undefined images (as would happen when no files are uploaded)
      const result = await controller.create(createFieldDto, undefined as any);

      expect(result).toEqual({
        data: mockResponse,
        message: 'Field created successfully',
      });
      expect(mockFieldsService.create).toHaveBeenCalledWith({
        ...createFieldDto,
        images: [],
      });
    });

    it('should create a new field without images (empty array)', async () => {
      const createFieldDto: Omit<CreatePublicFieldDto, 'images'> = {
        address: '123 Main St',
        sports: [Sport.FOOTBALL],
        name: 'Test Field',
      };

      const mockResponse = {
        uid: 'field-uid-1',
        address: '123 Main St',
        sport: Sport.FOOTBALL,
        fieldImages: [],
      };

      mockFieldsService.create.mockResolvedValue(mockResponse);

      // Call with empty array
      const result = await controller.create(createFieldDto, []);

      expect(result).toEqual({
        data: mockResponse,
        message: 'Field created successfully',
      });
      expect(mockFieldsService.create).toHaveBeenCalledWith({
        ...createFieldDto,
        images: [],
      });
    });

    it('should handle non-array images gracefully', async () => {
      const createFieldDto: Omit<CreatePublicFieldDto, 'images'> = {
        address: '123 Main St',
        sports: [Sport.FOOTBALL],
        name: 'Test Field',
      };

      const mockResponse = {
        uid: 'field-uid-1',
        address: '123 Main St',
        sport: Sport.FOOTBALL,
        fieldImages: [],
      };

      mockFieldsService.create.mockResolvedValue(mockResponse);

      // Call with non-array value (e.g., empty object or other unexpected value)
      const result = await controller.create(createFieldDto, {} as any);

      expect(result).toEqual({
        data: mockResponse,
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

      mockFieldsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAllVerified(filter);

      expect(result).toEqual({
        data: mockResponse,
        message: 'Fields fetched successfully',
      });
      expect(mockFieldsService.findAll).toHaveBeenCalledWith(filter);
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

      mockFieldsService.findAll.mockResolvedValue(mockResponse);

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

      mockFieldsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAllVerified(filter);

      expect(result.data.nextCursor).toBe('field-3');
      expect(mockFieldsService.findAll).toHaveBeenCalledWith(filter);
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

  describe('findAllPublicFields', () => {
    it('should return all public fields without filters', async () => {
      const filters: PublicFieldFilterDto = {
        limit: 10,
      };

      const mockResponse = {
        items: [
          {
            uid: 'field-1',
            name: 'Public Field 1',
            latitude: 48.8566,
            longitude: 2.3522,
            shortAddress: '123 Main St',
            sports: [Sport.FOOTBALL],
          },
          {
            uid: 'field-2',
            name: 'Public Field 2',
            latitude: 48.857,
            longitude: 2.353,
            shortAddress: '456 Oak Ave',
            sports: [Sport.BASKETBALL],
          },
        ],
        nextCursor: null,
        totalCount: 2,
      };

      mockFieldsService.findAllPublicFields.mockResolvedValue(mockResponse);

      const result = await controller.findAllPublicFields(filters);

      expect(result).toEqual({
        data: mockResponse,
        message: 'Public fields fetched successfully',
      });
      expect(mockFieldsService.findAllPublicFields).toHaveBeenCalledWith(filters);
    });

    it('should filter public fields by sports', async () => {
      const filters: PublicFieldFilterDto = {
        limit: 10,
        sports: [Sport.BASKETBALL],
      };

      const mockResponse = {
        items: [
          {
            uid: 'field-2',
            name: 'Basketball Court',
            latitude: 48.857,
            longitude: 2.353,
            shortAddress: '456 Oak Ave',
            sports: [Sport.BASKETBALL],
          },
        ],
        nextCursor: null,
        totalCount: 1,
      };

      mockFieldsService.findAllPublicFields.mockResolvedValue(mockResponse);

      const result = await controller.findAllPublicFields(filters);

      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].sports).toContain(Sport.BASKETBALL);
      expect(mockFieldsService.findAllPublicFields).toHaveBeenCalledWith(filters);
    });

    it('should filter public fields by search term', async () => {
      const filters: PublicFieldFilterDto = {
        limit: 10,
        search: 'Stade',
      };

      const mockResponse = {
        items: [
          {
            uid: 'field-1',
            name: 'Stade de France',
            latitude: 48.8566,
            longitude: 2.3522,
            shortAddress: '123 Main St',
            sports: [Sport.FOOTBALL],
          },
        ],
        nextCursor: null,
        totalCount: 1,
      };

      mockFieldsService.findAllPublicFields.mockResolvedValue(mockResponse);

      const result = await controller.findAllPublicFields(filters);

      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].name).toContain('Stade');
      expect(mockFieldsService.findAllPublicFields).toHaveBeenCalledWith(filters);
    });

    it('should handle cursor pagination', async () => {
      const filters: PublicFieldFilterDto = {
        limit: 10,
        cursor: 'field-1',
      };

      const mockResponse = {
        items: [
          {
            uid: 'field-2',
            name: 'Public Field 2',
            latitude: 48.857,
            longitude: 2.353,
            shortAddress: '456 Oak Ave',
            sports: [Sport.BASKETBALL],
          },
        ],
        nextCursor: 'field-3',
        totalCount: 1,
      };

      mockFieldsService.findAllPublicFields.mockResolvedValue(mockResponse);

      const result = await controller.findAllPublicFields(filters);

      expect(result.data.nextCursor).toBe('field-3');
      expect(mockFieldsService.findAllPublicFields).toHaveBeenCalledWith(filters);
    });

    it('should combine multiple filters (sports + search)', async () => {
      const filters: PublicFieldFilterDto = {
        limit: 10,
        sports: [Sport.BASKETBALL],
        search: 'Court',
      };

      const mockResponse = {
        items: [
          {
            uid: 'field-1',
            name: 'Basketball Court',
            latitude: 48.8566,
            longitude: 2.3522,
            shortAddress: '123 Main St',
            sports: [Sport.BASKETBALL],
          },
        ],
        nextCursor: null,
        totalCount: 1,
      };

      mockFieldsService.findAllPublicFields.mockResolvedValue(mockResponse);

      const result = await controller.findAllPublicFields(filters);

      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].sports).toContain(Sport.BASKETBALL);
      expect(result.data.items[0].name).toContain('Court');
      expect(mockFieldsService.findAllPublicFields).toHaveBeenCalledWith(filters);
    });

    it('should handle empty results', async () => {
      const filters: PublicFieldFilterDto = {
        limit: 10,
        sports: [Sport.VOLLEYBALL],
      };

      const mockResponse = {
        items: [],
        nextCursor: null,
        totalCount: 0,
      };

      mockFieldsService.findAllPublicFields.mockResolvedValue(mockResponse);

      const result = await controller.findAllPublicFields(filters);

      expect(result).toEqual({
        data: mockResponse,
        message: 'Public fields fetched successfully',
      });
      expect(result.data.items).toHaveLength(0);
    });

    it('should return nextCursor when more items exist', async () => {
      const filters: PublicFieldFilterDto = {
        limit: 2,
      };

      const mockResponse = {
        items: [
          {
            uid: 'field-1',
            name: 'Public Field 1',
            latitude: 48.8566,
            longitude: 2.3522,
            shortAddress: '123 Main St',
            sports: [Sport.FOOTBALL],
          },
          {
            uid: 'field-2',
            name: 'Public Field 2',
            latitude: 48.857,
            longitude: 2.353,
            shortAddress: '456 Oak Ave',
            sports: [Sport.BASKETBALL],
          },
        ],
        nextCursor: 'field-3',
        totalCount: 2,
      };

      mockFieldsService.findAllPublicFields.mockResolvedValue(mockResponse);

      const result = await controller.findAllPublicFields(filters);

      expect(result.data.items).toHaveLength(2);
      expect(result.data.nextCursor).toBe('field-3');
      expect(result.data.nextCursor).not.toBeNull();
    });
  });
});
