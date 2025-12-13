import { PinoLogger } from 'nestjs-pino';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PartnersService } from 'src/partners/partners.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { Sport, StorageFolderName } from 'src/shared/constants/constants';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { FieldMapper } from './mapper/field.mapper';
import { FieldFilterDto } from './dto/input/field-filter.dto';
import { UpdateFieldDto } from './dto/input/update-field.dto';
import { FieldResponseDto } from './dto/output/field-response';
import { CreatePublicFieldDto } from './dto/input/create-public-field.dto';
import { UpdatePrivateFieldDto } from './dto/input/update-private-field.dto';

@Injectable()
export class FieldsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly geolocalisationService: GeolocalisationService,
    private readonly partnersService: PartnersService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FieldsService.name);
  }

  /**
   * @description Default value for the isVerified field of a public field because it must be verified by the admin
   * @type {boolean}
   */
  private readonly DEFAULT_PUBLIC_FIELD_IS_VERIFIED_VALUE = false;

  /**
   * @description Default value for the isVerified field of a partner field because it is verified by the partner
   * @type {boolean}
   */
  private readonly DEFAULT_PARTNER_FIELD_IS_VERIFIED_VALUE = true;

  async create(createPublicFieldDto: CreatePublicFieldDto): Promise<FieldResponseDto> {
    const { address, images, sport } = createPublicFieldDto;

    const coordinates =
      await this.geolocalisationService.getCoordinatesAndShortAddressFromAddress(address);

    await this.verifyFieldLocation(coordinates.lat, coordinates.lng, address, sport);

    const result = await this.prisma.$transaction(async (tx) => {
      const newField = await tx.fields.create({
        data: {
          address,
          isVerified: this.DEFAULT_PUBLIC_FIELD_IS_VERIFIED_VALUE,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          shortAddress: coordinates.shortAddress,
          sport,
        },
      });

      const fieldImages = await Promise.all(
        images.map(async (image, index) => {
          const uploadResult = await this.storageService.upload(
            StorageFolderName.FIELDS,
            image.name,
            image.file,
          );
          const url = uploadResult.data;
          const fieldImage = await tx.fieldImages.create({
            data: {
              fieldUid: newField.uid,
              order: index,
              url,
            },
          });
          return { order: index, uid: fieldImage.uid, url: fieldImage.url };
        }),
      );

      return { fieldImages, newField };
    });

    const { fieldImages, newField } = result;
    return { ...newField, fieldImages };
  }

  /**
   * The function `findAllVerified` retrieves VERIFIED fields based on specified filters and pagination
   * parameters.
   * @param {FieldFilterDto} filter - The `findAllVerified` function takes a `filter` parameter of type
   * `FieldFilterDto`.
   * @returns The `findAllVerified` function returns an object with three properties:
   * 1. `items`: An array of field objects that match the specified criteria.
   * 2. `nextCursor`: A string representing the cursor for the next set of results. It is set to the
   * `uid` of the last item in the `items` array if there are more results available.
   * 3. `totalCount`: The total number
   */
  async findAllVerified(filter: FieldFilterDto): Promise<PaginatedDataDto<FieldResponseDto>> {
    const {
      address,
      cursor,
      gameModes,
      latitude,
      limit = 10,
      longitude,
      maxDistance,
      name,
      sports,
    } = filter;

    const query: {
      take: number;
      skip?: number;
      cursor?: {
        uid: string;
      };
      where: Prisma.FieldsWhereInput;
    } = {
      take: limit + 1,
      where: { isVerified: true },
    };

    if (cursor) {
      query.cursor = {
        uid: cursor,
      };
      query.skip = 1;
    }

    if (name) {
      query.where.name = { contains: name, mode: 'insensitive' };
    }

    if (address) {
      query.where.address = { contains: address, mode: 'insensitive' };
    }

    if (sports?.length) {
      query.where.sport = { in: sports };
    }

    if (gameModes?.length) {
      query.where.gameMode = { in: gameModes };
    }

    if (latitude && longitude && maxDistance) {
      // Basic bounding box filter (approximate, for precise distance use PostGIS)
      const latDelta = maxDistance / 111; // Rough conversion: 1 degree latitude ≈ 111 km
      const lonDelta = maxDistance / (111 * Math.cos((latitude * Math.PI) / 180));

      query.where.AND = [
        { latitude: { gte: latitude - latDelta, lte: latitude + latDelta } },
        { longitude: { gte: longitude - lonDelta, lte: longitude + lonDelta } },
      ];
    }

    const fields = await this.prisma.fields.findMany({
      ...query,
      select: {
        address: true,
        fieldImages: {
          select: {
            order: true,
            url: true,
          },
          take: 1,
        },
        gameMode: true,
        latitude: true,
        longitude: true,
        name: true,
        partner: {
          select: {
            partnerOpeningHours: {
              select: {
                closeTime: true,
                dayOfWeek: true,
                openTime: true,
              },
            },
            uid: true,
          },
        },
        shortAddress: true,
        sport: true,
        uid: true,
      },
    });

    let nextCursor: string | null = null;
    if (fields.length > limit) {
      const nextItem = fields.pop();
      nextCursor = nextItem!.uid;
    }
    const fieldsWithImageUrl = await Promise.all(
      fields.map(async (field) => {
        const imageUrl =
          field.fieldImages.length > 0
            ? await this.storageService.getSignedUrl(
                StorageFolderName.FIELDS,
                field.fieldImages[0].url,
              )
            : '';
        return {
          ...field,
          fieldImages: field.fieldImages.map((image) => ({ ...image, url: imageUrl })),
        };
      }),
    );

    return {
      items: FieldMapper.toCollectionDto(fieldsWithImageUrl),
      nextCursor,
      totalCount: fields.length,
    };
  }

  async findAllByPartnerUid(
    partnerUid: string,
    filter: FieldFilterDto,
  ): Promise<PaginatedDataDto<FieldResponseDto>> {
    const {
      address,
      cursor,
      gameModes,
      latitude,
      limit = 10,
      longitude,
      maxDistance,
      name,
      sports,
    } = filter;

    const partner = await this.partnersService.findOne(partnerUid);

    if (!partner) {
      throw new NotFoundException(`Partner with uid ${partnerUid} not found`);
    }

    const query: {
      take: number;
      skip?: number;
      cursor?: {
        uid: string;
      };
      where: Prisma.FieldsWhereInput;
    } = {
      take: limit + 1,
      where: { partnerUid },
    };

    if (cursor) {
      query.cursor = {
        uid: cursor,
      };
      query.skip = 1;
    }

    if (name) {
      query.where.name = { contains: name, mode: 'insensitive' };
    }

    if (address) {
      query.where.address = { contains: address, mode: 'insensitive' };
    }

    if (sports?.length) {
      query.where.sport = { in: sports };
    }

    if (gameModes?.length) {
      query.where.gameMode = { in: gameModes };
    }

    if (latitude && longitude && maxDistance) {
      // Basic bounding box filter (approximate, for precise distance use PostGIS)
      const latDelta = maxDistance / 111; // Rough conversion: 1 degree latitude ≈ 111 km
      const lonDelta = maxDistance / (111 * Math.cos((latitude * Math.PI) / 180));

      query.where.AND = [
        { latitude: { gte: latitude - latDelta, lte: latitude + latDelta } },
        { longitude: { gte: longitude - lonDelta, lte: longitude + lonDelta } },
      ];
    }

    const fields = await this.prisma.fields.findMany({
      ...query,
      select: {
        address: true,
        entryFee: true,
        fieldImages: {
          select: {
            order: true,
            uid: true,
            url: true,
          },
          take: 1,
        },
        gameMode: true,
        latitude: true,
        longitude: true,
        name: true,
        shortAddress: true,
        sport: true,
        uid: true,
      },
    });

    let nextCursor: string | null = null;
    if (fields.length > limit) {
      const nextItem = fields.pop();
      nextCursor = nextItem!.uid;
    }

    const fieldsWithImageUrl = await Promise.all(
      fields.map(async (field) => {
        const imageUrl =
          field.fieldImages.length > 0
            ? await this.storageService.getSignedUrl(
                StorageFolderName.FIELDS,
                field.fieldImages[0].url,
              )
            : '';
        return {
          ...field,
          fieldImages: field.fieldImages.map((image) => ({ ...image, url: imageUrl })),
        };
      }),
    );

    return {
      items: FieldMapper.toCollectionDto(fieldsWithImageUrl),
      nextCursor,
      totalCount: fields.length,
    };
  }

  async findOne(uid: string): Promise<FieldResponseDto> {
    const field = await this.prisma.fields.findUnique({
      include: {
        fieldImages: {
          select: {
            order: true,
            uid: true,
            url: true,
          },
        },
        partner: {
          select: {
            partnerOpeningHours: {
              select: {
                closeTime: true,
                dayOfWeek: true,
                openTime: true,
              },
            },
            uid: true,
          },
        },
      },
      where: { uid },
    });

    if (!field) return null;

    const imageUrl =
      field.fieldImages.length > 0
        ? await this.storageService.getSignedUrl(StorageFolderName.FIELDS, field.fieldImages[0].url)
        : '';
    return {
      ...FieldMapper.toDto(field),
      fieldImages: field.fieldImages.map((image) => ({ ...image, url: imageUrl })),
    };
  }

  /**
   * The function `verifyFieldLocation` checks if a field location already exists for a specific sport.
   * If it does, it throws a ConflictException.
   * If a field exists with the same location but different sport, nothing happens.
   * Only public fields are verified.
   */
  async verifyFieldLocation(
    latitude: number,
    longitude: number,
    address: string,
    sport: Sport,
  ): Promise<void> {
    const field = await this.prisma.fields.findFirst({
      where: {
        address,
        latitude,
        longitude,
        partnerUid: null,
        sport,
      },
    });

    if (field) {
      this.logger.error(`Field location ${address} already exists for sport ${sport}`);
      throw new ConflictException(`Field location ${address} already exists for sport ${sport}`);
    }
    this.logger.debug(`Field location ${address} does not exist for sport ${sport}`);
  }

  async updatePublicField(uid: string, updateFieldDto: UpdateFieldDto): Promise<void> {
    const { address, isVerified, name } = updateFieldDto;

    const existingField = await this.findOne(uid);

    if (!existingField) {
      throw new NotFoundException(`Field with uid ${uid} not found`);
    }

    let coordinates;
    if (address) {
      coordinates = await this.geolocalisationService.getLatitudeAndLongitude(address);
      await this.verifyFieldLocation(
        coordinates.lat,
        coordinates.lng,
        address,
        existingField.sport as Sport,
      );
    }

    if (existingField.isVerified && !isVerified) {
      this.logger.error(`You cannot unverify a field that is already verified`);
      throw new BadRequestException('You cannot unverify a field that is already verified');
    }

    await this.prisma.fields.update({
      data: {
        address,
        isVerified,
        latitude: coordinates?.lat ?? existingField.latitude,
        longitude: coordinates?.lng ?? existingField.longitude,
        name,
      },
      where: { uid },
    });

    this.logger.debug(`Field ${uid} updated successfully`);
  }

  async updatePartnerField(
    uid: string,
    partnerUid: string,
    updatePrivateFieldDto: UpdatePrivateFieldDto,
  ): Promise<void> {
    const { address, entryFee, gameMode, isVerified, name } = updatePrivateFieldDto;

    const existingField = await this.findOne(uid);

    if (!existingField) {
      throw new NotFoundException(`Field with uid ${uid} not found`);
    }
    const existingPartner = await this.partnersService.findOne(partnerUid);

    if (!existingPartner) {
      throw new NotFoundException(`Partner with uid ${partnerUid} not found`);
    }
    if (existingField.partnerUid !== partnerUid) {
      throw new BadRequestException(
        `Field with uid ${uid} is not associated with partner with uid ${partnerUid}`,
      );
    }

    let coordinates;
    if (address) {
      coordinates = await this.geolocalisationService.getLatitudeAndLongitude(address);
      await this.verifyFieldLocation(
        coordinates.lat,
        coordinates.lng,
        address,
        existingField.sport as Sport,
      );
    }

    if (existingField.isVerified && !isVerified) {
      this.logger.error(`You cannot unverify a field that is already verified`);
      throw new BadRequestException('You cannot unverify a field that is already verified');
    }

    await this.prisma.fields.update({
      data: {
        address,
        entryFee,
        gameMode,
        isVerified,
        latitude: coordinates?.lat ?? existingField.latitude,
        longitude: coordinates?.lng ?? existingField.longitude,
        name,
      },
      where: { uid },
    });

    this.logger.debug(`Field ${uid} updated successfully`);
  }
}
