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
});
