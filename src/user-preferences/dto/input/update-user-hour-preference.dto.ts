import { PartialType } from '@nestjs/swagger';

import { CreateUserHourPreferenceDto } from '../../../user-preferences/dto/input/create-user-hour-preference.dto';

export class UpdateUserHourPreferenceDto extends PartialType(CreateUserHourPreferenceDto) {}
