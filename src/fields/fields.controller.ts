import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthB2CGuard } from 'src/auth-b2c/guards/auth-b2c.guard';
import { AuthB2BGuard } from 'src/auth-b2b/guards/auth-b2b.guard';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { ConflictResponseDto } from 'src/shared/dto/errors/conflict-response.dto';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { FieldsService } from './fields.service';
import { FieldFilterDto } from './dto/input/field-filter.dto';
import { CreatePublicFieldDto } from './dto/input/create-public-field.dto';
import { FieldResponseDto, PaginatedFieldResponse } from './dto/output/field-response';

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
  @ApiConflictResponse({ type: ConflictResponseDto }) // ! Handle case where the field already exists By location and sport
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

  @Get('list-verified')
  @UseGuards(AuthB2CGuard)
  @ApiOkResponse({ type: PaginatedFieldResponse })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAllVerified(
    @Query() filter: FieldFilterDto,
  ): Promise<PaginationResponseTypeDto<FieldResponseDto>> {
    const data = await this.fieldsService.findAllVerified(filter);

    return {
      data,
      message: 'Fields fetched successfully',
    };
  }

  @Get('list-by-partner')
  @UseGuards(AuthB2BGuard)
  @ApiOkResponse({ type: PaginatedFieldResponse })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAllByPartnerUid(@Req() request: Request, @Query() filter: FieldFilterDto) {
    const partnerUid = request['user'].organisationUid;
    const data = await this.fieldsService.findAllByPartnerUid(partnerUid, filter);
    return {
      data,
      message: 'Fields fetched successfully',
    };
  }

  @Get(':uid')
  @UseGuards(AuthB2CGuard)
  @ApiOkResponse({ type: ResponseTypeDto<FieldResponseDto> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('uid') uid: string) {
    const field = await this.fieldsService.findOne(uid);

    if (!field) {
      throw new NotFoundException(`Field with uid ${uid} not found`);
    }

    return {
      data: field,
      message: 'Field fetched successfully',
    };
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateFieldDto: UpdateFieldDto) {
  //   return this.fieldsService.update(+id, updateFieldDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.fieldsService.remove(+id);
  // }
}
