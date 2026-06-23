import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { FieldsAdminService } from 'src/fields/services/fields-admin.service';
import { Sport } from 'src/shared/constants/constants';
import { FieldsAdminController } from '../../../src/fields/controllers/fields-admin.controller';

describe('FieldsAdminController', () => {
  let controller: FieldsAdminController;
  let _service: FieldsAdminService;

  const mockFieldsAdminService = {
    findAllFieldsAdmin: jest.fn(),
    findOneForAdmin: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  };

  const mockAdminGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FieldsAdminController],
      providers: [
        {
          provide: FieldsAdminService,
          useValue: mockFieldsAdminService,
        },
      ],
    })
      .overrideGuard(AdminGuard)
      .useValue(mockAdminGuard)
      .compile();

    controller = module.get<FieldsAdminController>(FieldsAdminController);
    _service = module.get<FieldsAdminService>(FieldsAdminService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createField', () => {
    it('should create a field successfully with images', async () => {
      const dto = {
        name: 'New Public Field',
        address: '123 Main St',
        sports: [Sport.FOOTBALL],
      };

      const images = [
        {
          buffer: Buffer.from('img-data-1'),
          originalname: 'img1.jpg',
        },
      ];

      const mockField = {
        uid: 'new-field-uid',
        name: 'New Public Field',
        address: '123 Main St',
      };

      mockFieldsAdminService.create.mockResolvedValue('new-field-uid');
      mockFieldsAdminService.findOneForAdmin.mockResolvedValue(mockField);

      const result = await controller.createField(dto as any, images);

      expect(result).toEqual({
        data: mockField,
        message: 'Field created successfully',
      });
      expect(mockFieldsAdminService.create).toHaveBeenCalledWith({
        ...dto,
        images: [
          {
            file: images[0].buffer,
            name: images[0].originalname,
            order: 0,
          },
        ],
      });
      expect(mockFieldsAdminService.findOneForAdmin).toHaveBeenCalledWith('new-field-uid');
    });

    it('should create a field successfully when images is undefined or empty', async () => {
      const dto = {
        name: 'New Public Field',
        address: '123 Main St',
        sports: [Sport.FOOTBALL],
      };

      const mockField = {
        uid: 'new-field-uid',
        name: 'New Public Field',
        address: '123 Main St',
      };

      mockFieldsAdminService.create.mockResolvedValue('new-field-uid');
      mockFieldsAdminService.findOneForAdmin.mockResolvedValue(mockField);

      const result = await controller.createField(dto as any, undefined as any);

      expect(result).toEqual({
        data: mockField,
        message: 'Field created successfully',
      });
      expect(mockFieldsAdminService.create).toHaveBeenCalledWith({
        ...dto,
        images: [],
      });
    });
  });

  describe('findOneForAdmin', () => {
    it('should return a single field by uid for admin', async () => {
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

      mockFieldsAdminService.findOneForAdmin.mockResolvedValue(mockField);

      const result = await controller.findOneForAdmin(uid);

      expect(result).toEqual({
        data: mockField,
        message: 'Field fetched successfully',
      });
      expect(mockFieldsAdminService.findOneForAdmin).toHaveBeenCalledWith(uid);
    });

    it('should throw NotFoundException if field does not exist for admin', async () => {
      const uid = 'non-existent-uid';

      mockFieldsAdminService.findOneForAdmin.mockResolvedValue(null);

      await expect(controller.findOneForAdmin(uid)).rejects.toThrow(NotFoundException);
      expect(mockFieldsAdminService.findOneForAdmin).toHaveBeenCalledWith(uid);
    });
  });

  describe('findAllFieldsAdmin', () => {
    it('should return all fields for admin', async () => {
      const filters = {
        limit: 10,
      };

      const mockResponse = {
        items: [
          {
            uid: 'field-1',
            name: 'Field 1',
            latitude: 48.8566,
            longitude: 2.3522,
            shortAddress: '123 Main St',
            sports: [Sport.FOOTBALL],
          },
        ],
        nextCursor: null,
        totalCount: 1,
      };

      mockFieldsAdminService.findAllFieldsAdmin.mockResolvedValue(mockResponse);

      const result = await controller.findAllFieldsAdmin(filters as any);

      expect(result).toEqual({
        data: mockResponse,
        message: 'Fields fetched successfully',
      });
      expect(mockFieldsAdminService.findAllFieldsAdmin).toHaveBeenCalledWith(filters);
    });
  });

  describe('update', () => {
    it('should update a field by uid for admin', async () => {
      const uid = 'field-uid-1';
      const updateDto = {
        name: 'Updated Field',
        imagesMetadata: JSON.stringify([
          {
            name: 'test.jpg',
            order: 0,
            status: 'APPROVED',
          },
        ]),
      };
      const images = [
        {
          buffer: Buffer.from('test'),
          originalname: 'test.jpg',
          status: 'APPROVED' as any,
        },
      ];

      const expectedImagesDto = [
        {
          file: images[0].buffer,
          name: images[0].originalname,
          order: 0,
          status: images[0].status,
        },
      ];

      const mockField = {
        uid,
        name: 'Updated Field',
        address: '123 Main St',
        latitude: 48.8566,
        longitude: 2.3522,
        shortAddress: '123 Main St',
        fieldImages: [{ uid: 'img-1', url: 'https://storage/image1.jpg', order: 0 }],
      };

      mockFieldsAdminService.update.mockResolvedValue(mockField);

      const result = await controller.update(uid, updateDto as any, images);

      expect(result).toEqual({
        data: mockField,
        message: 'Field updated successfully',
      });
      expect(mockFieldsAdminService.update).toHaveBeenCalledWith(uid, {
        ...updateDto,
        images: expectedImagesDto,
      });
    });

    it('should throw NotFoundException if service throws it', async () => {
      const uid = 'non-existent-uid';
      const updateDto = { name: 'Updated Field' };

      mockFieldsAdminService.update.mockRejectedValue(new NotFoundException());

      await expect(controller.update(uid, updateDto as any, [])).rejects.toThrow(NotFoundException);
      expect(mockFieldsAdminService.update).toHaveBeenCalledWith(uid, {
        ...updateDto,
        images: [],
      });
    });

    it('should handle imagesMetadata when it is already parsed as an array', async () => {
      const uid = 'field-uid-1';
      const updateDto = {
        name: 'Updated Field',
        imagesMetadata: [
          {
            uid: 'existing-img-uid',
            name: 'existing.jpg',
            order: 1,
            status: 'APPROVED',
          },
        ],
      };

      const mockField = {
        uid,
        name: 'Updated Field',
      };

      mockFieldsAdminService.update.mockResolvedValue(mockField);

      await controller.update(uid, updateDto as any, []);

      expect(mockFieldsAdminService.update).toHaveBeenCalledWith(
        uid,
        expect.objectContaining({
          images: [
            {
              uid: 'existing-img-uid',
              name: 'existing.jpg',
              order: 1,
              status: 'APPROVED',
              file: undefined,
            },
          ],
        }),
      );
    });

    it('should default to empty array when imagesMetadata parsing fails', async () => {
      const uid = 'field-uid-1';
      const updateDto = {
        name: 'Updated Field',
        imagesMetadata: 'invalid-json-string{',
      };

      const mockField = {
        uid,
        name: 'Updated Field',
      };

      mockFieldsAdminService.update.mockResolvedValue(mockField);

      await controller.update(uid, updateDto as any, []);

      expect(mockFieldsAdminService.update).toHaveBeenCalledWith(
        uid,
        expect.objectContaining({
          images: [],
        }),
      );
    });

    it('should merge both existing and new images correctly in the DTO', async () => {
      const uid = 'field-uid-1';
      const updateDto = {
        name: 'Updated Field',
        imagesMetadata: JSON.stringify([
          {
            uid: 'existing-uid',
            name: 'existing.jpg',
            order: 0,
            status: 'APPROVED',
          },
          {
            name: 'new-uploaded.jpg',
            order: 1,
            status: 'PENDING',
          },
        ]),
      };

      const uploadedFiles = [
        {
          buffer: Buffer.from('uploaded-data'),
          originalname: 'new-uploaded.jpg',
        },
      ];

      const mockField = {
        uid,
        name: 'Updated Field',
      };

      mockFieldsAdminService.update.mockResolvedValue(mockField);

      await controller.update(uid, updateDto as any, uploadedFiles);

      expect(mockFieldsAdminService.update).toHaveBeenCalledWith(
        uid,
        expect.objectContaining({
          images: [
            {
              uid: 'existing-uid',
              name: 'existing.jpg',
              order: 0,
              status: 'APPROVED',
              file: undefined,
            },
            {
              uid: undefined,
              name: 'new-uploaded.jpg',
              order: 1,
              status: 'PENDING',
              file: uploadedFiles[0].buffer,
            },
          ],
        }),
      );
    });
  });
});
