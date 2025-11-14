import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserSportPreferencesService } from './user-sport-preferences.service';
import { CreateUserSportPreferenceDto } from './dto/create-user-sport-preference.dto';
import { UpdateUserSportPreferenceDto } from './dto/update-user-sport-preference.dto';

@Controller('user-sport-preferences')
export class UserSportPreferencesController {
  constructor(private readonly userSportPreferencesService: UserSportPreferencesService) {}

  @Post()
  create(@Body() createUserSportPreferenceDto: CreateUserSportPreferenceDto) {
    return this.userSportPreferencesService.create(createUserSportPreferenceDto);
  }

  @Get()
  findAll() {
    return this.userSportPreferencesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userSportPreferencesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserSportPreferenceDto: UpdateUserSportPreferenceDto) {
    return this.userSportPreferencesService.update(+id, updateUserSportPreferenceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userSportPreferencesService.remove(+id);
  }
}
