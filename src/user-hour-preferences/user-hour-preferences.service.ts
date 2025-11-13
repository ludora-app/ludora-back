import { Injectable } from '@nestjs/common';

import { CreateUserHourPreferenceDto } from './dto/create-user-hour-preference.dto';
import { UpdateUserHourPreferenceDto } from './dto/update-user-hour-preference.dto';

@Injectable()
export class UserHourPreferencesService {
  create(createUserHourPreferenceDto: CreateUserHourPreferenceDto) {
    return 'This action adds a new userHourPreference';
  }

  findAll() {
    return `This action returns all userHourPreferences`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userHourPreference`;
  }

  update(id: number, updateUserHourPreferenceDto: UpdateUserHourPreferenceDto) {
    return `This action updates a #${id} userHourPreference`;
  }

  remove(id: number) {
    return `This action removes a #${id} userHourPreference`;
  }
}
