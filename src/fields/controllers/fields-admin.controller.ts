import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { VerificationStatus } from 'generated/prisma/enums';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { UploadedFilesCustom } from 'src/shared/decorators/uploaded-files.decorator';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { ForbiddenResponseDto } from 'src/shared/dto/errors/forbidden-response.dto';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import { FastifyFilesInterceptor } from 'src/shared/interceptors/fastify-file.interceptor';
import { SWAGGER_TAG_FIELDS_ADMIN } from 'src/swagger.config';
import { AdminFieldFiltersDto } from '../dto/input/admin-field-filters.dto';
import {
  CreatePublicFieldDto,
  CreatePublicFieldFormDto,
} from '../dto/input/create-public-field.dto';
import { UpdateFieldAdminDto, UpdateFieldAdminFormDto } from '../dto/input/update-field-admin.dto';
import {
  AdminFieldCollectionResponseData,
  PaginatedAdminFieldResponse,
} from '../dto/output/admin-field-collection-response.dto';
import { AdminFindOneFieldResponseDto } from '../dto/output/admin-find-one-field-response.dto';
import { FieldsAdminService } from './../services/fields-admin.service';

@ApiTags(SWAGGER_TAG_FIELDS_ADMIN)
@Controller('fields/admin')
@UseGuards(AdminGuard)
@Protected()
export class FieldsAdminController {
  constructor(private readonly fieldsAdminService: FieldsAdminService) {}

  @Post()
  @UseInterceptors(new FastifyFilesInterceptor('images'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new field, automatically approved' })
  @ApiBody({ type: CreatePublicFieldFormDto })
  @ApiCreatedResponse({
    description: 'Field created successfully',
    type: AdminFindOneFieldResponseDto,
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiForbiddenResponse({ type: ForbiddenResponseDto })
  @HttpCode(HttpStatus.CREATED)
  async createField(
    @Body() dto: CreatePublicFieldDto,
    @UploadedFilesCustom() images: { buffer: Buffer; originalname: string }[],
  ): Promise<AdminFindOneFieldResponseDto> {
    const imagesDto = (Array.isArray(images) ? images : []).map((image, index) => ({
      file: image.buffer,
      name: image.originalname,
      order: index,
    }));
    const uid = await this.fieldsAdminService.create({ ...dto, images: imagesDto });
    const field = await this.fieldsAdminService.findOneForAdmin(uid);
    return {
      data: field,
      message: 'Field created successfully',
    };
  }

  @Get(':uid')
  @ApiOkResponse({ type: AdminFindOneFieldResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiForbiddenResponse({ type: ForbiddenResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a field by uid without verification status filter, used for admin purposes',
  })
  async findOneForAdmin(@Param('uid') uid: string): Promise<AdminFindOneFieldResponseDto> {
    const field = await this.fieldsAdminService.findOneForAdmin(uid);

    if (!field) {
      throw new NotFoundException(`Field with uid ${uid} not found`);
    }

    return {
      data: field,
      message: 'Field fetched successfully',
    };
  }

  @Get('list/collection')
  @ApiOkResponse({ type: PaginatedAdminFieldResponse })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all pending fields' })
  async findAllFieldsAdmin(
    @Query() filters: AdminFieldFiltersDto,
  ): Promise<PaginationResponseTypeDto<AdminFieldCollectionResponseData>> {
    const data = await this.fieldsAdminService.findAllFieldsAdmin(filters);
    return {
      data,
      message: 'Fields fetched successfully',
    };
  }

  @Put(':uid')
  @UseInterceptors(new FastifyFilesInterceptor('images'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateFieldAdminFormDto })
  @ApiOperation({
    summary: 'Update a field by uid, used for admin purposes',
  })
  @ApiOkResponse({ type: AdminFindOneFieldResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiForbiddenResponse({ type: ForbiddenResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('uid') uid: string,
    @Body() dto: UpdateFieldAdminDto,
    @UploadedFilesCustom() uploadedFiles: {
      buffer: Buffer;
      originalname: string;
    }[],
  ): Promise<AdminFindOneFieldResponseDto> {
    // Parse metadata — the Fastify interceptor may auto-parse JSON arrays,
    // so imagesMetadata can arrive as a string OR as an already-parsed array.
    let metadataList: {
      uid?: string;
      name?: string;
      order?: number;
      status?: VerificationStatus;
    }[] = [];
    if (dto.imagesMetadata) {
      if (Array.isArray(dto.imagesMetadata)) {
        metadataList = dto.imagesMetadata;
      } else {
        try {
          metadataList = JSON.parse(dto.imagesMetadata);
        } catch {
          metadataList = [];
        }
      }
    }

    const files = Array.isArray(uploadedFiles) ? uploadedFiles : [];

    // Build the final imagesDto by merging metadata with uploaded file buffers
    // New images have no uid → match by position among new files
    let newFileIndex = 0;
    const imagesDto = metadataList.map((meta) => {
      if (meta.uid) {
        // Existing image: no file upload needed, just metadata update
        return {
          uid: meta.uid,
          name: meta.name ?? 'image.jpg',
          order: meta.order ?? 0,
          status: meta.status,
          file: undefined as unknown as Buffer,
        };
      } else {
        // New image: assign the next uploaded file
        const uploadedFile = files[newFileIndex++];
        return {
          uid: undefined,
          name: uploadedFile?.originalname ?? meta.name ?? 'image.jpg',
          order: meta.order ?? newFileIndex - 1,
          status: meta.status ?? VerificationStatus.PENDING,
          file: uploadedFile?.buffer,
        };
      }
    });

    const field = await this.fieldsAdminService.update(uid, { ...dto, images: imagesDto });
    return {
      data: field,
      message: 'Field updated successfully',
    };
  }
}
