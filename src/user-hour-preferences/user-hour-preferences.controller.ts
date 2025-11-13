import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { UserHourPreferencesService } from './user-hour-preferences.service';
import { CreateUserHourPreferenceDto } from './dto/create-user-hour-preference.dto';
import { UpdateUserHourPreferenceDto } from './dto/update-user-hour-preference.dto';

@Controller('user-hour-preferences')
export class UserHourPreferencesController {
  constructor(private readonly userHourPreferencesService: UserHourPreferencesService) {}

  @Post()
  create(@Body() createUserHourPreferenceDto: CreateUserHourPreferenceDto) {
    return this.userHourPreferencesService.create(createUserHourPreferenceDto);
  }

  @Get()
  findAll() {
    return this.userHourPreferencesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userHourPreferencesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserHourPreferenceDto: UpdateUserHourPreferenceDto,
  ) {
    return this.userHourPreferencesService.update(+id, updateUserHourPreferenceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userHourPreferencesService.remove(+id);
  }
}
