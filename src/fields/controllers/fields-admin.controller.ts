import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { ForbiddenResponseDto } from 'src/shared/dto/errors/forbidden-response.dto';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import { SWAGGER_TAG_FIELDS_ADMIN } from 'src/swagger.config';
import { AdminFieldFiltersDto } from '../dto/input/admin-field-filters.dto';
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

  @Get(':uid')
  @UseGuards(AdminGuard)
  @Protected()
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
  @UseGuards(AdminGuard)
  @Protected()
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
}
