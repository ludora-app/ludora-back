import { OmitType } from '@nestjs/swagger';

import { FieldFilterDto } from './field-filter.dto';

/**
 * @description DTO for filtering the fields of the current partner
 * Used by partners to filter their own fields
 */
export class MyFieldsFilterDto extends OmitType(FieldFilterDto, [
  'type',
  'duration',
  'userLat',
  'userLon',
  'maxDistance',
]) {}
