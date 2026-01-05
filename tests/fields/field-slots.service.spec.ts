import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { FieldSlotsService } from 'src/fields/services/field-slots.service';
import { FieldsService } from 'src/fields/services/fields.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('FieldSlotsService', () => {
  let service: FieldSlotsService;
  let logger: PinoLogger;
  let prismaService: PrismaService;
  let fieldsService: FieldsService;

  const mockLogger = {
    setContext: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
  const mockPrismaService = {
    fieldSlots: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const mockFieldsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FieldSlotsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FieldsService, useValue: mockFieldsService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<FieldSlotsService>(FieldSlotsService);
    prismaService = module.get<PrismaService>(PrismaService);
    fieldsService = module.get<FieldsService>(FieldsService);
    logger = module.get<PinoLogger>(PinoLogger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
