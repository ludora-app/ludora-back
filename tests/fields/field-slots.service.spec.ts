import { Test, TestingModule } from '@nestjs/testing';
import { FieldSlotsService } from 'src/fields/services/field-slots.service';

describe('FieldSlotsService', () => {
  let service: FieldSlotsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FieldSlotsService],
    }).compile();

    service = module.get<FieldSlotsService>(FieldSlotsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
