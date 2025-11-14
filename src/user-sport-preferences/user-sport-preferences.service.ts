import { PinoLogger } from 'nestjs-pino';
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';

import { CreateUserSportPreferenceDto } from './dto/create-user-sport-preference.dto';
import { UpdateUserSportPreferenceDto } from './dto/update-user-sport-preference.dto';

@Injectable()
export class UserSportPreferencesService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UserSportPreferencesService.name);
  }
  create(createUserSportPreferenceDto: CreateUserSportPreferenceDto) {
    return 'This action adds a new userSportPreference';
  }

  findAll() {
    return `This action returns all userSportPreferences`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userSportPreference`;
  }

  update(id: number, updateUserSportPreferenceDto: UpdateUserSportPreferenceDto) {
    return `This action updates a #${id} userSportPreference`;
  }

  remove(id: number) {
    return `This action removes a #${id} userSportPreference`;
  }
}
