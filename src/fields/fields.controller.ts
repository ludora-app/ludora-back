import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { ConflictResponseDto } from 'src/shared/dto/errors/conflict-response.dto';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { UploadedFilesCustom } from 'src/shared/decorators/uploaded-files.decorator';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { FastifyFilesInterceptor } from 'src/shared/interceptors/fastify-file.interceptor';
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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { FieldsService } from './fields.service';
import { FieldFilterDto } from './dto/input/field-filter.dto';
import { CreatePublicFieldDto } from './dto/input/create-public-field.dto';
import { CreatePrivateFieldDto } from './dto/input/create-private-field.dto';
import { FieldResponseDto, PaginatedFieldResponse } from './dto/output/field-response';

// ? Guards at endpoint level for the whole controller because some routes will be accessible by both B2C and B2B users.
@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Post()
  @UseGuards(AuthB2CGuard)
  @Protected()
  @UseInterceptors(new FastifyFilesInterceptor('images'))
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ type: ResponseTypeDto<FieldResponseDto> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiConflictResponse({ type: ConflictResponseDto })
  @ApiOperation({ summary: 'Create a public field' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createFieldDto: Omit<CreatePublicFieldDto, 'images'>,
    @UploadedFilesCustom() images: { buffer: Buffer; originalname: string }[],
  ) {
    const imagesDto = Array.isArray(images)
      ? images.map(
          (image, index) => (
            console.log(image.originalname),
            {
              file: image.buffer,
              name: image.originalname,
              order: index,
            }
          ),
        )
      : [];

    const response = await this.fieldsService.create({
      ...createFieldDto,
      images: imagesDto,
    });

    return {
      data: response,
      message: 'Field created successfully',
    };
  }

  @Get('list-verified/collection')
  @UseGuards(AuthB2CGuard)
  @Protected()
  @ApiOkResponse({ type: PaginatedFieldResponse })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all verified fields' })
  async findAllVerified(
    @Query() filter: FieldFilterDto,
  ): Promise<PaginationResponseTypeDto<FieldResponseDto>> {
    const data = await this.fieldsService.findAll(filter);

    return {
      data,
      message: 'Fields fetched successfully',
    };
  }

  @Post('private')
  @UseGuards(AuthB2CGuard)
  @Protected()
  @UseInterceptors(new FastifyFilesInterceptor('images'))
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ type: ResponseTypeDto<FieldResponseDto> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiOperation({ summary: 'Create a private field' })
  @HttpCode(HttpStatus.CREATED)
  async createPrivateField(
    @Body() createFieldDto: CreatePrivateFieldDto,
    @UploadedFilesCustom() images: { buffer: Buffer; originalname: string }[],
  ) {
    const imagesDto = Array.isArray(images)
      ? images.map((image, index) => ({
          file: image.buffer,
          name: image.originalname,
          order: index,
        }))
      : [];

    const response = await this.fieldsService.createPrivateField({
      ...createFieldDto,
      images: imagesDto,
    });

    return {
      data: response,
      message: 'Private field created successfully',
    };
  }

  @Get(':uid')
  @UseGuards(AuthB2CGuard)
  @Protected()
  @ApiOkResponse({ type: ResponseTypeDto<FieldResponseDto> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a field by uid' })
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

  // @Patch('update-public/:uid')
  // @UseGuards(AuthB2CGuard)
  // @Protected()
  // @ApiNoContentResponse({ description: 'Field updated successfully' })
  // @ApiBadRequestResponse({ type: BadRequestResponseDto })
  // @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  // @ApiNotFoundResponse({ type: NotFoundResponseDto })
  // @ApiOperation({ summary: 'Update a public field' })
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async updatePublicField(@Param('uid') uid: string, @Body() updateFieldDto: UpdateFieldDto) {
  //   return this.fieldsService.updatePublicField(uid, updateFieldDto);
  // }

  // @Patch('update-private/:uid')
  // @UseGuards(AuthB2BGuard)
  // @Protected()
  // @ApiNoContentResponse({ description: 'Field updated successfully' })
  // @ApiBadRequestResponse({ type: BadRequestResponseDto })
  // @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  // @ApiNotFoundResponse({ type: NotFoundResponseDto })
  // @ApiOperation({ summary: 'Update a partner field' })
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async updatePartnerField(
  //   @Req() request: Request,
  //   @Param('uid') uid: string,
  //   @Body() updatePrivateFieldDto: UpdatePrivateFieldDto,
  // ) {
  //   const partnerUid = request['user'].organisationUid;
  //   return this.fieldsService.updatePartnerField(uid, partnerUid, updatePrivateFieldDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.fieldsService.remove(+id);
  // }
}
