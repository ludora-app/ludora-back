import { ApiProperty } from '@nestjs/swagger';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

import { HourPreferenceData } from '../input/create-hour-preference.dto';

/**
 * @description standard response for a userHourPreference resource
 */

export class HourPreferenceResponseDto extends ResponseTypeDto<HourPreferenceData> {
  @ApiProperty({ type: HourPreferenceData })
  readonly data: HourPreferenceData;
}

/**
 * @description standard response for a paginated userHourPreference resource, used to type swagger return
 */
export const PaginatedHourPreferenceResponseDto = toPaginationResponseType(HourPreferenceData);
