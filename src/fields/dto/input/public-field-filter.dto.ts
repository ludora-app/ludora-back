import { OmitType } from '@nestjs/swagger';

import { FieldFilterDto } from './field-filter.dto';

export class PublicFieldFilterDto extends OmitType(FieldFilterDto, [
  'type',
  'duration',
  'userLat',
  'userLon',
  'timezone',
  'date',
  'gameModes',
]) {}
