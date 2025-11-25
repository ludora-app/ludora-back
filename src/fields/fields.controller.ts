import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthB2CGuard } from 'src/auth-b2c/guards/auth-b2c.guard';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { ConflictResponseDto } from 'src/shared/dto/errors/conflict-response.dto';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FieldsService } from './fields.service';
import { UpdateFieldDto } from './dto/input/update-field.dto';
import { FieldResponseDto } from './dto/output/field-response';
import { CreatePublicFieldDto } from './dto/input/create-public-field.dto';

// ? Guards at endpoint level for the whole controller because some routes will be accessible by both B2C and B2B users.
@Controller('fields')
@ApiBearerAuth('JWT-auth')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Post()
  @UseGuards(AuthB2CGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ type: ResponseTypeDto<FieldResponseDto> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiConflictResponse({ type: ConflictResponseDto })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createFieldDto: Omit<CreatePublicFieldDto, 'images'>,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    const imagesDto = images.map((image, index) => ({
      file: image.buffer,
      name: image.originalname,
      order: index,
    }));

    const response = await this.fieldsService.create({
      ...createFieldDto,
      images: imagesDto,
    });

    return {
      data: response,
      message: 'Field created successfully',
    };
  }

  @Get()
  findAll() {
    return this.fieldsService.findAll();
  }

  @Get(':id')
  findOne(@Param('uid') uid: string) {
    return this.fieldsService.findOne(uid);
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
