import { ApiConsumes } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import { FieldsService } from './fields.service';
import { UpdateFieldDto } from './dto/input/update-field.dto';
import { CreatePublicFieldDto } from './dto/input/create-public-field.dto';

@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  create(
    @Body() createFieldDto: Omit<CreatePublicFieldDto, 'images'>,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    const imagesDto = images.map((image, index) => ({
      file: image.buffer,
      name: image.originalname,
      order: index,
    }));

    return this.fieldsService.create({
      ...createFieldDto,
      images: imagesDto,
    });
  }

  @Get()
  findAll() {
    return this.fieldsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fieldsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFieldDto: UpdateFieldDto) {
    return this.fieldsService.update(+id, updateFieldDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fieldsService.remove(+id);
  }
}
