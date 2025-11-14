import { PartialType } from '@nestjs/swagger';
import { CreateUserSportPreferenceDto } from './create-user-sport-preference.dto';

export class UpdateUserSportPreferenceDto extends PartialType(CreateUserSportPreferenceDto) {}
