import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthB2CGuard } from 'src/auth-b2c/guards/auth-b2c.guard';
import { AuthB2BGuard } from 'src/auth-b2b/guards/auth-b2b.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
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
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { FieldsService } from './fields.service';
import { FieldFilterDto } from './dto/input/field-filter.dto';
import { UpdateFieldDto } from './dto/input/update-field.dto';
import { CreatePublicFieldDto } from './dto/input/create-public-field.dto';
import { UpdatePrivateFieldDto } from './dto/input/update-private-field.dto';
import { FieldResponseDto, PaginatedFieldResponse } from './dto/output/field-response';

// ? Guards at endpoint level for the whole controller because some routes will be accessible by both B2C and B2B users.
@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Post()
  @UseGuards(AuthB2CGuard)
  @Protected()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ type: ResponseTypeDto<FieldResponseDto> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiConflictResponse({ type: ConflictResponseDto })
  @ApiOperation({ summary: 'Create a public field' })
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
    const data = await this.fieldsService.findAllVerified(filter);

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

  @Patch('update-public/:uid')
  @UseGuards(AuthB2CGuard)
  @Protected()
  @ApiNoContentResponse({ description: 'Field updated successfully' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @ApiOperation({ summary: 'Update a public field' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePublicField(@Param('uid') uid: string, @Body() updateFieldDto: UpdateFieldDto) {
    return this.fieldsService.updatePublicField(uid, updateFieldDto);
  }

  @Patch('update-private/:uid')
  @UseGuards(AuthB2BGuard)
  @Protected()
  @ApiNoContentResponse({ description: 'Field updated successfully' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @ApiOperation({ summary: 'Update a partner field' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePartnerField(
    @Req() request: Request,
    @Param('uid') uid: string,
    @Body() updatePrivateFieldDto: UpdatePrivateFieldDto,
  ) {
    const partnerUid = request['user'].organisationUid;
    return this.fieldsService.updatePartnerField(uid, partnerUid, updatePrivateFieldDto);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.fieldsService.remove(+id);
  // }
}
