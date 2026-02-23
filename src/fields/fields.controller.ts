import { FastifyRequest } from 'fastify';
import { UserType } from 'generated/prisma/enums';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { AuthB2BGuard } from 'src/auth/guards/auth-b2b.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { ConflictResponseDto } from 'src/shared/dto/errors/conflict-response.dto';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { ForbiddenResponseDto } from 'src/shared/dto/errors/forbidden-response.dto';
import { UploadedFilesCustom } from 'src/shared/decorators/uploaded-files.decorator';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { FastifyFilesInterceptor } from 'src/shared/interceptors/fastify-file.interceptor';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { FieldsService } from './services/fields.service';
import { FieldFilterDto } from './dto/input/field-filter.dto';
import { UpdateFieldDto } from './dto/input/update-field.dto';
import { FieldSlotsService } from './services/field-slots.service';
import { CreateFieldSlotDto } from './dto/input/create-field-slot.dto';
import { CreatePublicFieldDto } from './dto/input/create-public-field.dto';
import { PublicFieldFilterDto } from './dto/input/public-field-filter.dto';
import { CreatePrivateFieldDto } from './dto/input/create-private-field.dto';
import {
  FieldResponseDto,
  FindOneFieldResponseData,
  FindOneFieldResponseDto,
  PaginatedFieldResponse,
  PaginatedPublicFieldResponse,
  PublicFieldResponseData,
} from './dto/output/field-response.dto';

// ? Guards at endpoint level for the whole controller because some routes will be accessible by both B2C and B2B users.
@Controller('fields')
export class FieldsController {
  constructor(
    private readonly fieldsService: FieldsService,
    private readonly fieldSlotsService: FieldSlotsService,
  ) {}

  @Post('field-slots')
  @UseGuards(AuthB2BGuard)
  @Protected()
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiConflictResponse({ type: ConflictResponseDto })
  @ApiOperation({ summary: 'Create a field slot' })
  @HttpCode(HttpStatus.CREATED)
  async createFieldSlot(@Body() dto: CreateFieldSlotDto, @Req() request: FastifyRequest) {
    const partnerUid = request['user'].organisationUid;
    return this.fieldSlotsService.create(dto, partnerUid);
  }

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
      ? images.map((image, index) => ({
          file: image.buffer,
          name: image.originalname,
          order: index,
        }))
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

  @Get('list-by-partner/collection')
  @UseGuards(AuthB2BGuard)
  @Protected()
  @ApiOkResponse({ type: PaginatedFieldResponse })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all fields by partner uid' })
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
  @Protected()
  @ApiOkResponse({ type: FindOneFieldResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a verified field by uid' })
  async findOne(@Param('uid') uid: string): Promise<ResponseTypeDto<FindOneFieldResponseData>> {
    const field = await this.fieldsService.findOne(uid);

    if (!field) {
      throw new NotFoundException(`Field with uid ${uid} not found`);
    }

    return {
      data: field,
      message: 'Field fetched successfully',
    };
  }

  @Get('admin/:uid')
  @UseGuards(AuthB2CGuard)
  @Protected()
  @ApiOkResponse({ type: FindOneFieldResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiForbiddenResponse({ type: ForbiddenResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a field by uid without verification status filter, used for admin purposes',
  })
  async findOneForAdmin(
    @Param('uid') uid: string,
    @Req() request: FastifyRequest,
  ): Promise<ResponseTypeDto<FindOneFieldResponseData>> {
    const userType = request['user'].userType;

    if (userType !== UserType.ADMIN) {
      throw new ForbiddenException('You are not authorized to access this resource');
    }
    const field = await this.fieldsService.findOneForAdmin(uid);

    if (!field) {
      throw new NotFoundException(`Field with uid ${uid} not found`);
    }

    return {
      data: field,
      message: 'Field fetched successfully',
    };
  }

  @Get('list-public/collection')
  @ApiOkResponse({ type: PaginatedPublicFieldResponse })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all public fields' })
  async findAllPublicFields(
    @Query() filters: PublicFieldFilterDto,
  ): Promise<PaginationResponseTypeDto<PublicFieldResponseData>> {
    const data = await this.fieldsService.findAllPublicFields(filters);
    return {
      data,
      message: 'Public fields fetched successfully',
    };
  }
  @Patch('update-public/:uid')
  @UseGuards(AuthB2CGuard)
  @Protected()
  @ApiNoContentResponse({ description: 'Field updated successfully' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @ApiOperation({ summary: 'Update a public field' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(new FastifyFilesInterceptor('files'))
  async updatePublicField(
    @Param('uid') uid: string,
    @Body() updateFieldDto: UpdateFieldDto,
    @UploadedFilesCustom() files: { buffer: Buffer; originalname: string }[],
  ) {
    return this.fieldsService.updatePublicField(uid, updateFieldDto, files);
  }

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
