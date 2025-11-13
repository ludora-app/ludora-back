import { PartialType } from '@nestjs/swagger';

import { CreateUserHourPreferenceDto } from './create-user-hour-preference.dto';

export class UpdateUserHourPreferenceDto extends PartialType(CreateUserHourPreferenceDto) {}
