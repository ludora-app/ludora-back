import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/browser';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { AdminFieldFiltersDto } from '../dto/input/admin-field-filters.dto';
import { AdminFieldCollectionResponseData } from '../dto/output/admin-field-collection-response.dto';
import { AdminFindOneFieldResponseData } from '../dto/output/admin-find-one-field-response.dto';
import { FieldMapper } from '../mappers/field.mapper';

@Injectable()
export class FieldsAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly geolocalisationService: GeolocalisationService,
  ) {}

  /**
   * @description Get a field by uid without verification status filter
   * @param uid
   * @returns
   */
  async findOneForAdmin(uid: string): Promise<AdminFindOneFieldResponseData | null> {
    const field = await this.prisma.fields.findUnique({
      include: {
        fieldImages: {
          select: {
            order: true,
            status: true,
            uid: true,
            url: true,
          },
        },
        fieldSports: {
          select: {
            sport: true,
          },
        },
        partner: {
          select: {
            rank: true,
            uid: true,
          },
        },
        creator: {
          select: {
            firstname: true,
            uid: true,
            lastname: true,
            isEmailVerified: true,
            imageUrl: true,
          },
        },
      },
      where: { uid },
    });

    if (!field) return null;
    return FieldMapper.toFindOneForAdminDto(field);
  }

  async findAllFieldsAdmin(
    filters: AdminFieldFiltersDto,
  ): Promise<PaginatedDataDto<AdminFieldCollectionResponseData>> {
    const { cursor, limit = 10, search, sports, status } = filters;

    const query: {
      take: number;
      skip?: number;
      cursor?: {
        uid: string;
      };
      where: Prisma.FieldsWhereInput;
    } = {
      take: limit + 1,
      where: {},
    };

    if (cursor) {
      query.cursor = { uid: cursor };
      query.skip = 1;
    }
    if (search) {
      query.where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (sports?.length) {
      query.where.fieldSports = { some: { sport: { in: sports } } };
    }

    if (status) {
      query.where.status = status;
    }

    const fields = await this.prisma.fields.findMany({
      ...query,
      include: {
        fieldImages: { orderBy: { order: 'asc' }, select: { order: true, url: true }, take: 1 },
        fieldSports: { select: { sport: true } },
      },
    });

    const actualLimit = limit || 10;
    let nextCursor: string | null = null;
    if (fields.length > actualLimit) {
      const nextItem = fields.pop();
      nextCursor = nextItem?.uid;
    }
    const items = fields.map((field) => FieldMapper.toAdminFieldDto(field));

    return { items, nextCursor, totalCount: fields.length };
  }

  /**
   * @description Method used to update all the field informations
   */
  async update() {}
}
